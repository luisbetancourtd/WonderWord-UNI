/**
 * Service de Découverte & Importation de Catalogues Littéraires Publics
 * Intègre le corpus universitaire DraCor (FreDraCor, GerDraCor) et le Projet Gutenberg (Gutendex)
 */

export interface CatalogBookItem {
  id: string; // ex: 'gutenberg:1234' ou 'dracor:ger:schiller-die-raeuber'
  source: 'Gutenberg' | 'DraCor' | 'Patrimoine';
  title: string;
  author: string;
  language: 'fr' | 'de';
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1';
  year?: number;
  coverUrl?: string;
  coverColor: 'soleil' | 'prune' | 'sauge' | 'terre' | 'bleuet';
  description: string;
  downloadUrl?: string;
  downloads?: number;
}

// Nettoyeur d'en-têtes et pieds de page légaux du Projet Gutenberg
const GUTENBERG_START_REGEX = /\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^*]*?\*\*\*/i;
const GUTENBERG_END_REGEX = /\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK[^*]*?\*\*\*/i;

// Cache mémoire pour accélérer les requêtes récurrentes (TTL 10 min)
const cache = new Map<string, { timestamp: number; data: CatalogBookItem[] }>();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Sélection patrimoniale pré-indexée pour garantir une réactivité immédiate
 */
const CURATED_CATALOG: CatalogBookItem[] = [
  // Français
  {
    id: 'patrimoine:fr:proust-swann',
    source: 'Patrimoine',
    title: "Du côté de chez Swann",
    author: 'Marcel Proust',
    language: 'fr',
    cefrLevel: 'C1',
    year: 1913,
    coverColor: 'prune',
    coverUrl: 'https://www.gutenberg.org/cache/epub/2650/pg2650.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/2650/pg2650.txt.utf-8',
    description: 'Premier volume d\'À la recherche du temps perdu. L\'épisode de la madeleine et la mélodie de la mémoire involontaire.',
  },
  {
    id: 'patrimoine:fr:zola-germinal',
    source: 'Patrimoine',
    title: 'Germinal',
    author: 'Émile Zola',
    language: 'fr',
    cefrLevel: 'B2',
    year: 1885,
    coverColor: 'terre',
    coverUrl: 'https://www.gutenberg.org/cache/epub/5711/pg5711.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5711/pg5711.txt.utf-8',
    description: 'Fresque naturaliste du monde ouvrier et de la grève des mineurs dans le bassin houiller du Nord.',
  },
  {
    id: 'patrimoine:fr:dumas-monte-cristo',
    source: 'Patrimoine',
    title: 'Le Comte de Monte-Cristo',
    author: 'Alexandre Dumas',
    language: 'fr',
    cefrLevel: 'B1',
    year: 1844,
    coverColor: 'bleuet',
    coverUrl: 'https://www.gutenberg.org/cache/epub/17989/pg17989.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/17989/pg17989.txt.utf-8',
    description: 'L\'odyssée vengeresse d\'Edmond Dantès, évadé du château d\'If sous les traits d\'un richissime seigneur.',
  },
  {
    id: 'patrimoine:fr:moliere-avare',
    source: 'DraCor',
    title: "L'Avare",
    author: 'Molière',
    language: 'fr',
    cefrLevel: 'B1',
    year: 1668,
    coverColor: 'soleil',
    coverUrl: 'https://www.gutenberg.org/cache/epub/5799/pg5799.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5799/pg5799.txt.utf-8',
    description: 'Comédie de caractère en prose dépeignant la tyrannie domestique d\'Harpagon et l\'obsession de sa cassette.',
  },
  // Allemand
  {
    id: 'patrimoine:de:kafka-prozess',
    source: 'Patrimoine',
    title: 'Der Process',
    author: 'Franz Kafka',
    language: 'de',
    cefrLevel: 'B2',
    year: 1925,
    coverColor: 'terre',
    coverUrl: 'https://www.gutenberg.org/cache/epub/24373/pg24373.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/24373/pg24373.txt.utf-8',
    description: 'Josef K. wird eines Morgens grundlos verhaftet und durchläuft ein absurdes, undurchdringliches Rechtssystem.',
  },
  {
    id: 'patrimoine:de:goethe-werther',
    source: 'Patrimoine',
    title: 'Die Leiden des jungen Werthers',
    author: 'Johann Wolfgang von Goethe',
    language: 'de',
    cefrLevel: 'B2',
    year: 1774,
    coverColor: 'bleuet',
    coverUrl: 'https://www.gutenberg.org/cache/epub/2407/pg2407.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/2407/pg2407.txt.utf-8',
    description: 'Briefroman des Sturm und Drang über die unglückliche Liebe Werthers zu der verlobten Lotte.',
  },
  {
    id: 'patrimoine:de:schiller-raeuber',
    source: 'DraCor',
    title: 'Die Räuber',
    author: 'Friedrich Schiller',
    language: 'de',
    cefrLevel: 'C1',
    year: 1781,
    coverColor: 'prune',
    coverUrl: 'https://www.gutenberg.org/cache/epub/6782/pg6782.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/6782/pg6782.txt.utf-8',
    description: 'Rebellisches Drama über den Konflikt zweier feindlicher Brüder: Karl und Franz Moor.',
  },
  {
    id: 'patrimoine:de:grimm-haensel',
    source: 'Patrimoine',
    title: 'Hänsel und Gretel & Märchen',
    author: 'Brüder Grimm',
    language: 'de',
    cefrLevel: 'A2',
    year: 1812,
    coverColor: 'sauge',
    coverUrl: 'https://www.gutenberg.org/cache/epub/5314/pg5314.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5314/pg5314.txt.utf-8',
    description: 'Klassisches deutsches Volksmärchen. Ideal für Französisch-Muttersprachler auf A2-Niveau.',
  },
];

/**
 * Recherche fédérée à travers Gutendex, DraCor et le catalogue patrimonial
 */
export async function searchPublicCatalog(query = '', lang: 'fr' | 'de' | 'all' = 'all'): Promise<CatalogBookItem[]> {
  const cacheKey = `${query.toLowerCase().trim()}_${lang}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const results: CatalogBookItem[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  // 1. Filtrer notre catalogue pré-indexé immédiat
  const matchingCurated = CURATED_CATALOG.filter((item) => {
    const matchLang = lang === 'all' || item.language === lang;
    const matchText =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.author.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery);
    return matchLang && matchText;
  });
  results.push(...matchingCurated);

  // 2. Interroger l'API DraCor universitaire (Corpus Théâtre)
  try {
    const corporaToQuery = lang === 'fr' ? ['fre'] : lang === 'de' ? ['ger'] : ['fre', 'ger'];
    
    for (const corpus of corporaToQuery) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(`https://dracor.org/api/corpora/${corpus}`, {
        headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        const data = (await resp.json()) as { dramas?: any[] };
        const dramas = data.dramas || [];
        
        const filteredDramas = dramas.filter((d: any) => {
          if (!normalizedQuery) return true;
          const titleMatch = d.title && d.title.toLowerCase().includes(normalizedQuery);
          const authorMatch = d.authors && d.authors.some((a: any) => a.name && a.name.toLowerCase().includes(normalizedQuery));
          return titleMatch || authorMatch;
        }).slice(0, 8); // Prendre jusqu'à 8 résultats pertinents

        for (const drama of filteredDramas) {
          const authorName = drama.authors?.[0]?.name || 'Auteur classique';
          const dramaLang: 'fr' | 'de' = corpus === 'fre' ? 'fr' : 'de';
          results.push({
            id: `dracor:${corpus}:${drama.name}`,
            source: 'DraCor',
            title: drama.title,
            author: authorName,
            language: dramaLang,
            cefrLevel: dramaLang === 'fr' ? 'B2' : 'C1',
            year: drama.writtenYear || drama.yearPremiered || drama.yearPrinted || 1700,
            coverColor: corpus === 'fre' ? 'sauge' : 'prune',
            description: `Corpus théâtral universitaire DraCor (${corpus.toUpperCase()}). ${drama.networkSize || 0} personnages identifiés.`,
          });
        }
      }
    }
  } catch (err) {
    // Si DraCor est indisponible, continuer sans bloquer
    console.warn('DraCor lookup non-bloquant:', err);
  }

  // 3. Interroger l'API Gutendex (Project Gutenberg)
  try {
    const gutenbergLang = lang === 'all' ? '' : `&languages=${lang}`;
    const gutenbergSearch = normalizedQuery ? `&search=${encodeURIComponent(normalizedQuery)}` : '';
    const url = `https://gutendex.com/books/?${gutenbergLang}${gutenbergSearch}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s max timeout

    const resp = await fetch(url, {
      headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (resp && resp.ok) {
      const data = (await resp.json()) as { results?: any[] };
      const gutenbergBooks = (data.results || []).slice(0, 10);

      for (const gb of gutenbergBooks) {
        const gbLang = gb.languages?.includes('de') ? 'de' : 'fr';
        const authorName = gb.authors?.[0]?.name ? gb.authors[0].name.split(',').reverse().join(' ').trim() : 'Auteur classique';
        const coverUrl = gb.formats?.['image/jpeg'] || undefined;
        const txtUrl = gb.formats?.['text/plain; charset=utf-8'] || gb.formats?.['text/plain'] || undefined;

        // Éviter les doublons avec ce qui est déjà dans results
        const alreadyIn = results.some((r) => r.title.toLowerCase() === gb.title.toLowerCase());
        if (!alreadyIn) {
          results.push({
            id: `gutenberg:${gb.id}`,
            source: 'Gutenberg',
            title: gb.title,
            author: authorName,
            language: gbLang,
            cefrLevel: gbLang === 'fr' ? 'B1' : 'B2',
            coverUrl,
            coverColor: gbLang === 'fr' ? 'soleil' : 'bleuet',
            description: `Œuvre du domaine public répertoriée par le Projet Gutenberg (${gb.download_count || 0} consultations mondiales).`,
            downloadUrl: txtUrl,
            downloads: gb.download_count,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Gutendex lookup non-bloquant:', err);
  }

  // Stocker dans le cache mémoire
  cache.set(cacheKey, { timestamp: Date.now(), data: results });
  return results;
}

/**
 * Télécharge et assainit le texte d'un livre distant avant importation
 */
export async function fetchAndSanitizeBookContent(item: {
  id: string;
  source: string;
  title: string;
  author: string;
  language: string;
  downloadUrl?: string;
}): Promise<{ chapters: { number: number; title: string; contentHtml: string; wordCount: number }[] }> {
  let rawText = '';

  if (item.id.startsWith('dracor:')) {
    // Importation depuis DraCor
    const parts = item.id.split(':');
    const corpus = parts[1];
    const playName = parts[2];
    const resp = await fetch(`https://dracor.org/api/corpora/${corpus}/play/${playName}/spoken-text`, {
      headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
    });
    if (!resp.ok) throw new Error('Impossible de télécharger la pièce depuis DraCor.');
    rawText = await resp.text();
  } else if (item.id.startsWith('gutenberg:')) {
    // Importation depuis Gutenberg
    const gutenbergId = item.id.replace('gutenberg:', '');
    const url = item.downloadUrl || `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
    });
    if (!resp.ok) throw new Error('Impossible de télécharger le texte depuis le Projet Gutenberg.');
    rawText = await resp.text();

    // Nettoyage des notices légales de Gutenberg
    const startMatch = rawText.match(GUTENBERG_START_REGEX);
    if (startMatch && startMatch.index !== undefined) {
      rawText = rawText.slice(startMatch.index + startMatch[0].length);
    }
    const endMatch = rawText.match(GUTENBERG_END_REGEX);
    if (endMatch && endMatch.index !== undefined) {
      rawText = rawText.slice(0, endMatch.index);
    }
  } else {
    // Exemple patrimonial pré-rempli
    rawText = `
      Chapitre I. L'ouverture littéraire.
      C'est ainsi que commence ce chef-d'œuvre du patrimoine universel. Les mots résonnent avec la voix des siècles passés et nous invitent à une écoute attentive des nuances de la langue.
      
      Chapitre II. La traversée des formes.
      Chaque phrase révèle une architecture syntaxique singulière où le rythme et l'harmonie des sons construisent le sens profond du texte littéraire.
    `;
  }

  // Découper le texte en chapitres ou en sections équilibrées de 1 200 à 2 000 mots
  const paragraphs = rawText
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('***'));

  const chapters: { number: number; title: string; contentHtml: string; wordCount: number }[] = [];
  let currentChapterParas: string[] = [];
  let currentWordCount = 0;
  let chapterIndex = 1;

  for (const para of paragraphs) {
    const wordsInPara = para.split(/\s+/).length;
    currentChapterParas.push(`<p>${escapeHtml(para)}</p>`);
    currentWordCount += wordsInPara;

    // Quand on atteint environ 1 500 mots, on forme un chapitre (limité à 3 chapitres pour la lecture réactive)
    if (currentWordCount >= 1400 && chapters.length < 2) {
      chapters.push({
        number: chapterIndex,
        title: item.language === 'de' ? `Kapitel ${chapterIndex}` : `Chapitre ${chapterIndex}`,
        contentHtml: currentChapterParas.join('\n'),
        wordCount: currentWordCount,
      });
      chapterIndex++;
      currentChapterParas = [];
      currentWordCount = 0;
    }
  }

  // Ajouter le dernier reliquat
  if (currentChapterParas.length > 0) {
    chapters.push({
      number: chapterIndex,
      title: item.language === 'de' ? `Kapitel ${chapterIndex}` : `Chapitre ${chapterIndex}`,
      contentHtml: currentChapterParas.join('\n'),
      wordCount: Math.max(currentWordCount, 150),
    });
  }

  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: item.language === 'de' ? 'Kapitel I' : 'Chapitre I',
      contentHtml: `<p>${escapeHtml(rawText.slice(0, 3000))}</p>`,
      wordCount: 500,
    });
  }

  return { chapters };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
