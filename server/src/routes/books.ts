import { FastifyInstance } from 'fastify';
import { searchPublicCatalog, fetchAndSanitizeBookContent } from '../services/catalog.js';

export default async function bookRoutes(server: FastifyInstance) {
  // 1. Lister tous les livres du catalogue avec filtres de recherche et niveau CECR
  server.get('/', async (request) => {
    const { search, level, lang } = request.query as { search?: string; level?: string; lang?: string };

    // Tenter de décoder le token JWT si l'utilisateur est connecté pour indiquer ses favoris
    let userId: string | null = null;
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const decoded = server.jwt.verify<{ id: string }>(authHeader.substring(7));
        userId = decoded.id;
      }
    } catch {
      // Utilisateur anonyme, pas d'erreur
    }

    const whereClause: any = {};
    if (level && level !== 'ALL') {
      whereClause.cefrLevel = level.toUpperCase();
    }
    if (lang && lang !== 'ALL') {
      whereClause.language = lang.toLowerCase();
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { genre: { contains: search, mode: 'insensitive' } },
      ];
    }

    const books = await server.prisma.book.findMany({
      where: whereClause,
      include: {
        chapters: {
          select: {
            id: true,
            number: true,
            title: true,
            wordCount: true,
          },
          orderBy: {
            number: 'asc',
          },
        },
        ...(userId && {
          userBooks: {
            where: { userId },
          },
        }),
      },
      orderBy: {
        title: 'asc',
      },
    });

    return books.map((book: any) => {
      const userBook = book.userBooks && book.userBooks.length > 0 ? book.userBooks[0] : null;
      return {
        id: book.id,
        slug: book.slug,
        title: book.title,
        author: book.author,
        description: book.description,
        coverColor: book.coverColor,
        publisher: book.publisher,
        language: book.language,
        cefrLevel: book.cefrLevel,
        year: book.year,
        genre: book.genre,
        totalChapters: book.totalChapters,
        totalWords: book.totalWords,
        chapters: book.chapters,
        isAdded: Boolean(userBook),
        currentChapter: userBook?.currentChapter || 1,
        progressPercent: userBook?.progressPercent || 0,
        status: userBook?.status || 'not_started',
      };
    });
  });

  // 1b. Découverte d'ouvrages dans le catalogue public (Gutendex & DraCor)
  server.get('/discover', async (request) => {
    const { query, lang } = request.query as { query?: string; lang?: string };
    const language = (lang === 'fr' || lang === 'de') ? lang : 'all';

    const externalBooks = await searchPublicCatalog(query || '', language);

    // Vérifier les livres déjà importés en base
    const existingBooks = await server.prisma.book.findMany({
      select: { title: true, id: true },
    });
    const existingTitles = new Set(existingBooks.map((b) => b.title.toLowerCase().trim()));

    return externalBooks.map((book) => ({
      ...book,
      isImported: existingTitles.has(book.title.toLowerCase().trim()),
    }));
  });

  // 1c. Importer un livre depuis le catalogue public dans sa bibliothèque
  server.post('/import', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string };
    const { id, title, author, language, source, downloadUrl } = request.body as {
      id: string;
      title: string;
      author: string;
      language: string;
      source: string;
      downloadUrl?: string;
    };

    if (!title || !author) {
      return reply.status(400).send({ message: "Titre et auteur requis pour l'importation" });
    }

    // Vérifier si le livre existe déjà
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let book = await server.prisma.book.findFirst({
      where: {
        OR: [{ slug: baseSlug }, { title: { equals: title, mode: 'insensitive' } }],
      },
    });

    if (!book) {
      // Télécharger et découper le contenu
      const content = await fetchAndSanitizeBookContent({
        id,
        source: source || 'Catalogue Public',
        title,
        author,
        language: language === 'de' ? 'de' : 'fr',
        downloadUrl,
      });

      const totalWords = content.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

      // Créer le livre et ses chapitres
      book = await server.prisma.book.create({
        data: {
          slug: `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`,
          title,
          author,
          language: language === 'de' ? 'de' : 'fr',
          cefrLevel: language === 'de' ? 'B1' : 'B2',
          publisher: `${source || 'Domaine Public'} (Édition Numérique Libre)`,
          description: `Ouvrage importé depuis le catalogue public ${source || 'Gutenberg/DraCor'}.`,
          coverColor: language === 'de' ? 'prune' : 'sauge',
          year: 1850,
          genre: 'Patrimoine classique',
          totalChapters: content.chapters.length,
          totalWords,
          chapters: {
            create: content.chapters.map((ch) => ({
              number: ch.number,
              title: ch.title,
              contentHtml: ch.contentHtml,
              wordCount: ch.wordCount,
            })),
          },
        },
      });
    }

    // L'ajouter à la bibliothèque de l'utilisateur
    await server.prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: decoded.id,
          bookId: book.id,
        },
      },
      update: {
        status: 'reading',
      },
      create: {
        userId: decoded.id,
        bookId: book.id,
        currentChapter: 1,
        progressPercent: 0,
        status: 'reading',
      },
    });

    return {
      success: true,
      message: `« ${book.title} » a été importé avec succès dans votre bibliothèque !`,
      book,
    };
  });

  // 2. Bibliothèque personnelle de l'utilisateur connecté
  server.get('/my-library', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string };
    const userBooks = await server.prisma.userBook.findMany({
      where: { userId: decoded.id },
      include: {
        book: {
          include: {
            chapters: {
              select: {
                id: true,
                number: true,
                title: true,
                wordCount: true,
              },
              orderBy: {
                number: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        lastReadAt: 'desc',
      },
    });

    return userBooks.map((ub) => ({
      id: ub.book.id,
      slug: ub.book.slug,
      title: ub.book.title,
      author: ub.book.author,
      description: ub.book.description,
      coverColor: ub.book.coverColor,
      publisher: ub.book.publisher,
      language: ub.book.language,
      cefrLevel: ub.book.cefrLevel,
      year: ub.book.year,
      genre: ub.book.genre,
      totalChapters: ub.book.totalChapters,
      totalWords: ub.book.totalWords,
      currentChapter: ub.currentChapter,
      progressPercent: ub.progressPercent,
      status: ub.status,
      lastReadAt: ub.lastReadAt,
      chapters: ub.book.chapters,
    }));
  });

  // 3. Obtenir un livre spécifique avec tous ses chapitres
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const book = await server.prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        chapters: {
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    if (!book) {
      return reply.status(404).send({ message: 'Livre introuvable' });
    }

    return book;
  });

  // 4. Obtenir le contenu textuel d'un chapitre spécifique
  server.get('/:id/chapters/:number', async (request, reply) => {
    const { id, number } = request.params as { id: string; number: string };
    const chapterNumber = parseInt(number, 10);

    const book = await server.prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!book) {
      return reply.status(404).send({ message: 'Livre introuvable' });
    }

    const chapter = await server.prisma.chapter.findUnique({
      where: {
        bookId_number: {
          bookId: book.id,
          number: chapterNumber,
        },
      },
    });

    if (!chapter) {
      return reply.status(404).send({ message: 'Chapitre introuvable' });
    }

    return {
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        cefrLevel: book.cefrLevel,
        totalChapters: book.totalChapters,
      },
      chapter: {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        contentHtml: chapter.contentHtml,
        wordCount: chapter.wordCount,
        audioUrl: chapter.audioUrl,
      },
    };
  });

  // 5. Ajouter un livre à sa bibliothèque personnelle
  server.post('/:id/add-to-library', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    const book = await server.prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!book) {
      return reply.status(404).send({ message: 'Livre introuvable' });
    }

    const userBook = await server.prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: decoded.id,
          bookId: book.id,
        },
      },
      update: {
        status: 'reading',
      },
      create: {
        userId: decoded.id,
        bookId: book.id,
        currentChapter: 1,
        progressPercent: 0,
        status: 'reading',
      },
    });

    return {
      success: true,
      message: `« ${book.title} » ajouté à votre bibliothèque personnelle !`,
      userBook,
    };
  });

  // 6. Retirer un livre de sa bibliothèque personnelle
  server.delete('/:id/remove-from-library', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };

    const book = await server.prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!book) {
      return reply.status(404).send({ message: 'Livre introuvable' });
    }

    await server.prisma.userBook.deleteMany({
      where: {
        userId: decoded.id,
        bookId: book.id,
      },
    });

    return {
      success: true,
      message: `Livre retiré de votre bibliothèque.`,
    };
  });

  // 7. Mettre à jour la progression de lecture d'un livre
  server.put('/:id/progress', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Non autorisé' });
    }

    const decoded = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { currentChapter, progressPercent } = request.body as {
      currentChapter?: number;
      progressPercent?: number;
    };

    const book = await server.prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!book) {
      return reply.status(404).send({ message: 'Livre introuvable' });
    }

    const updated = await server.prisma.userBook.update({
      where: {
        userId_bookId: {
          userId: decoded.id,
          bookId: book.id,
        },
      },
      data: {
        ...(currentChapter !== undefined && { currentChapter }),
        ...(progressPercent !== undefined && { progressPercent }),
        lastReadAt: new Date(),
        status: (progressPercent || 0) >= 100 ? 'completed' : 'reading',
      },
    });

    return {
      success: true,
      userBook: updated,
    };
  });
}
