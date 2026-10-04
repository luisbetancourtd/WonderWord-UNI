import { FastifyInstance } from 'fastify';

export default async function bookRoutes(server: FastifyInstance) {
  // 1. Lister tous les livres du catalogue avec filtres de recherche et niveau CECR
  server.get('/', async (request) => {
    const { search, level } = request.query as { search?: string; level?: string };

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
    if (level) {
      whereClause.cefrLevel = level.toUpperCase();
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
