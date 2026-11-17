/**
 * Service de Découverte & Importation de Catalogues Littéraires Publics
 * Intègre le corpus universitaire DraCor (FreDraCor, GerDraCor) et le Projet Gutenberg (Gutendex)
 */

export type CefrLevel = 'B1' | 'B2' | 'C1';

export interface CatalogBookItem {
  id: string; // ex: 'gutenberg:1234' ou 'dracor:ger:schiller-die-raeuber'
  source: 'Gutenberg' | 'DraCor' | 'Patrimoine';
  title: string;
  author: string;
  language: 'fr' | 'de';
  cefrLevel: CefrLevel;
  year?: number;
  coverUrl?: string;
  coverColor: 'soleil' | 'prune' | 'sauge' | 'terre' | 'bleuet';
  description: string;
  excerpt?: string;
  genre?: string;
  downloadUrl?: string;
  downloads?: number;
}

/**
 * Classificateur stylométrique multi-facteurs (LIX + TTR + marqueurs archaïques + genre/époque).
 * Empêche de classer à tort la littérature classique ou le théâtre en vers sous B1.
 */
export function classifyTextReadability(
  rawText: string,
  meta: { language?: string; genre?: string; year?: number; source?: string } = {}
): CefrLevel {
  const clean = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sample = clean.length > 20000 ? clean.slice(1500, 16500) : clean;

  const sentences = sample.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 5);
  const sentenceCount = Math.max(1, sentences.length);
  const words = sample.match(/\p{L}+/gu) || [];
  const wordCount = words.length;

  if (wordCount < 40) {
    return classifyMetadataCefr(meta);
  }

  const longWords = words.filter((w) => w.length > 6).length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;

  const avgSentLen = wordCount / sentenceCount;
  const pctLong = (longWords * 100) / wordCount;
  const lix = avgSentLen + pctLong;
  const ttr = (uniqueWords * 100) / wordCount;

  const genreLower = (meta.genre || '').toLowerCase();
  const isDramaOrVerse =
    meta.source === 'DraCor' ||
    /théâtre|theater|drama|tragédie|tragödie|poésie|lyrik|verse|philosoph/i.test(genreLower);
  const isHistorical = typeof meta.year === 'number' && meta.year > 0 && meta.year < 1830;

  let score = lix;
  if (ttr >= 46) score += 6;
  if (isDramaOrVerse) score += 12; // Compense la brièveté des répliques théâtrales
  if (isHistorical) score += 8;

  if (score >= 54 || (isDramaOrVerse && isHistorical && score >= 45)) {
    return 'C1';
  }
  if (score >= 42 || isHistorical) {
    return 'B2';
  }
  return 'B1';
}

/**
 * Estimation heuristique basée sur les métadonnées (sujets, genre, époque) avant téléchargement complet
 */
export function classifyMetadataCefr(meta: {
  language?: string;
  genre?: string;
  subjects?: string[];
  year?: number;
  source?: string;
}): CefrLevel {
  const combined = `${meta.genre || ''} ${(meta.subjects || []).join(' ')}`.toLowerCase();

  if (/philosoph|metaphys|tragéd|tragödie|poésie|poetry|lyrik|classical/.test(combined)) {
    return 'C1';
  }
  if (typeof meta.year === 'number' && meta.year > 0 && meta.year < 1800) {
    return meta.source === 'DraCor' ? 'C1' : 'B2';
  }
  if (/fairy tales|märchen|contes|children|juvenile|aventure|adventure|comédie|komödie/.test(combined)) {
    return 'B1';
  }
  if (meta.source === 'DraCor') {
    return 'B2';
  }
  return meta.language === 'de' ? 'B2' : 'B1';
}

// Nettoyeur d'en-têtes et pieds de page légaux du Projet Gutenberg
const GUTENBERG_START_REGEX = /\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^*]*?\*\*\*/i;
const GUTENBERG_END_REGEX = /\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK[^*]*?\*\*\*/i;

// Cache mémoire pour accélérer les requêtes récurrentes (TTL 10 min)
export interface PaginatedCatalogResult {
  items: CatalogBookItem[];
  totalExternalCount: number;
  hasMore: boolean;
}

const cache = new Map<string, { timestamp: number; data: PaginatedCatalogResult }>();
const dracorCorpusCache = new Map<string, { timestamp: number; dramas: any[] }>();
const CACHE_TTL = 10 * 60 * 1000;
const DRACOR_CACHE_TTL = 30 * 60 * 1000;

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
    genre: 'Roman psychologique & moderniste',
    coverColor: 'prune',
    coverUrl: 'https://covers.openlibrary.org/b/id/11967344-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/2650/pg2650.txt.utf-8',
    description: 'Premier volume monumental d\'À la recherche du temps perdu. Proust y explore les méandres de la mémoire involontaire, l\'enfance à Combray, l\'amour jaloux de Swann pour Odette et la quête de la vocation esthétique.',
    excerpt: "Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n'avais pas le temps de me dire : « Je m'endors. » Et, une demi-heure après, la pensée qu'il était temps de chercher le sommeil m'éveillait...",
  },
  {
    id: 'patrimoine:fr:zola-germinal',
    source: 'Patrimoine',
    title: 'Germinal',
    author: 'Émile Zola',
    language: 'fr',
    cefrLevel: 'B2',
    year: 1885,
    genre: 'Fresque naturaliste & sociale',
    coverColor: 'terre',
    coverUrl: 'https://covers.openlibrary.org/b/id/8236935-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5711/pg5711.txt.utf-8',
    description: 'Chef-d\'œuvre du naturalisme français. Treizième roman des Rougon-Macquart, Zola plonge dans l\'enfer des fosses houillères du Nord, décrivant la misère ouvrière et l\'explosion d\'une grève héroïque.',
    excerpt: "Une seule idée occupait sa tête d'ouvrier sans travail et sans gîte, l'espoir que le froid serait moins vif après le lever du jour. Depuis une heure, il avançait ainsi, lorsque sur la gauche, à deux kilomètres de Montsou, il aperçut des feux rouges, trois brasiers brûlant en plein air...",
  },
  {
    id: 'patrimoine:fr:dumas-monte-cristo',
    source: 'Patrimoine',
    title: 'Le Comte de Monte-Cristo',
    author: 'Alexandre Dumas',
    language: 'fr',
    cefrLevel: 'B1',
    year: 1844,
    genre: 'Roman d\'aventures & drame',
    coverColor: 'bleuet',
    coverUrl: 'https://covers.openlibrary.org/b/id/14566393-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/17989/pg17989.txt.utf-8',
    description: 'L\'odyssée vengeresse d\'Edmond Dantès, trahi le jour de ses fiançailles et enfermé quatorze ans au château d\'If avant de ressurgir sous les traits d\'un richissime seigneur omnipotent.',
    excerpt: "Le 24 février 1815, la vigie de Notre-Dame de la Garde signala le trois-mâts le Pharaon, venant de Smyrne, Trieste et Naples, sous le commandement du jeune Edmond Dantès, second du navire...",
  },
  {
    id: 'patrimoine:fr:moliere-avare',
    source: 'DraCor',
    title: "L'Avare",
    author: 'Molière',
    language: 'fr',
    cefrLevel: 'B1',
    year: 1668,
    genre: 'Comédie classique en prose',
    coverColor: 'soleil',
    coverUrl: 'https://covers.openlibrary.org/b/id/7199852-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5799/pg5799.txt.utf-8',
    description: 'Comédie de caractère en prose dépeignant la tyrannie domestique d\'Harpagon et l\'obsession dévorante de sa cassette d\'or face aux désirs d\'amour de ses enfants.',
    excerpt: "Valère : Hé quoi ! charmante Élise, vous devenez mélancolique, après les obligeantes assurances que vous avez eu la bonté de me donner de votre foi ? Je vous vois soupirer, hélas ! au milieu de ma joie !",
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
    genre: 'Roman allégorique & existentiel',
    coverColor: 'terre',
    coverUrl: 'https://covers.openlibrary.org/b/id/997423-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/24373/pg24373.txt.utf-8',
    description: 'Josef K. wird eines Morgens grundlos verhaftet und durchläuft ein absurdes, unerbittliches und undurchdringliches Rechtssystem, das seine Existenz schrittweise erstickt.',
    excerpt: "Jemand mußte Josef K. verleumdet haben, denn ohne daß er etwas Böses getan hätte, wurde er eines Morgens verhaftet. Die Köchin der Frau Grubach, die ihm jeden Tag gegen acht Uhr früh das Frühstück brachte, kam diesmal nicht...",
  },
  {
    id: 'patrimoine:de:goethe-werther',
    source: 'Patrimoine',
    title: 'Die Leiden des jungen Werthers',
    author: 'Johann Wolfgang von Goethe',
    language: 'de',
    cefrLevel: 'B2',
    year: 1774,
    genre: 'Briefroman (Sturm und Drang)',
    coverColor: 'bleuet',
    coverUrl: 'https://covers.openlibrary.org/b/id/7187281-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/2407/pg2407.txt.utf-8',
    description: 'Briefroman des Sturm und Drang über die unglückliche, leidenschaftliche Liebe Werthers zu der verlobten Lotte, ein literarisches Monument der romantischen Seelenqual.',
    excerpt: "Wie froh bin ich, daß ich weg bin! Bester Freund, was ist das Herz des Menschen! Dich zu verlassen, den ich so liebe, von dem ich unzertrennlich war, und froh zu sein! Ich weiß, du verzeihst mir's...",
  },
  {
    id: 'patrimoine:de:schiller-raeuber',
    source: 'DraCor',
    title: 'Die Räuber',
    author: 'Friedrich Schiller',
    language: 'de',
    cefrLevel: 'C1',
    year: 1781,
    genre: 'Drame tragique (Sturm und Drang)',
    coverColor: 'prune',
    coverUrl: 'https://covers.openlibrary.org/b/id/6093905-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/6782/pg6782.txt.utf-8',
    description: 'Rebellisches Drama über den bitteren Konflikt zweier ungleicher Brüder: Karl Moor, der edle Räuberhauptmann in den Wäldern, und sein heimtückischer Bruder Franz.',
    excerpt: "Franz : Aber ist dir auch wohl, Vater? Du siehst so blaß. / Der alte Moor : Ganz wohl, mein Sohn – was hattest du mir zu sagen? / Franz : Die Post ist angekommen – ein Brief von unserm Korrespondenten in Leipzig...",
  },
  {
    id: 'patrimoine:de:grimm-haensel',
    source: 'Patrimoine',
    title: 'Hänsel und Gretel & Märchen',
    author: 'Brüder Grimm',
    language: 'de',
    cefrLevel: 'B1',
    year: 1812,
    genre: 'Volksmärchen',
    coverColor: 'sauge',
    coverUrl: 'https://covers.openlibrary.org/b/id/8236293-M.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5314/pg5314.txt.utf-8',
    description: 'Klassische deutsche Kinder- und Hausmärchen. Sprachlich klar, rhythmisch und didaktisch ideal für den Wortschatzerwerb frankophoner Germanistik-Studierender.',
    excerpt: "Vor einem großen Walde wohnte ein armer Holzhacker mit seiner Frau und seinen zwei Kindern; das Bübchen hieß Hänsel und das Mädchen Gretel. Er hatte wenig zu beißen und zu brechen...",
  },
];

async function getDracorCorpusDramas(corpus: string): Promise<any[]> {
  const cached = dracorCorpusCache.get(corpus);
  if (cached && Date.now() - cached.timestamp < DRACOR_CACHE_TTL) {
    return cached.dramas;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`https://dracor.org/api/corpora/${corpus}`, {
      headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (resp && resp.ok) {
      const data = (await resp.json()) as { dramas?: any[] };
      const dramas = data.dramas || [];
      dracorCorpusCache.set(corpus, { timestamp: Date.now(), dramas });
      return dramas;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`DraCor lookup non-bloquant (${corpus}):`, err);
  }
  return [];
}

/**
 * Recherche fédérée et paginée à travers Gutendex, DraCor et le catalogue patrimonial
 */
export async function searchPublicCatalog(
  query = '',
  lang: 'fr' | 'de' | 'all' = 'all',
  page = 1
): Promise<PaginatedCatalogResult> {
  const safePage = Math.max(1, page);
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `${normalizedQuery}_${lang}_p${safePage}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const results: CatalogBookItem[] = [];

  // 1. Catalogue pré-indexé (uniquement sur la page 1)
  if (safePage === 1) {
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
  }

  // 2. Interroger en parallèle DraCor (paginé sur tout FreDraCor/GerDraCor) et Gutendex (?page=N, 32 livres/page)
  const corporaToQuery = lang === 'fr' ? ['fre'] : lang === 'de' ? ['ger'] : ['fre', 'ger'];
  const dracorPerCorpus = corporaToQuery.length === 2 ? 6 : 12;

  let dracorTotalCount = 0;
  let dracorHasMore = false;
  let gutendexTotalCount = 0;
  let gutendexHasMore = false;

  const dracorPromise = Promise.all(
    corporaToQuery.map(async (corpus) => {
      const dramas = await getDracorCorpusDramas(corpus);
      const filtered = dramas.filter((d: any) => {
        if (!normalizedQuery) return true;
        const titleMatch = d.title && d.title.toLowerCase().includes(normalizedQuery);
        const authorMatch =
          d.authors &&
          d.authors.some((a: any) => a.name && a.name.toLowerCase().includes(normalizedQuery));
        return titleMatch || authorMatch;
      });

      dracorTotalCount += filtered.length;
      const start = (safePage - 1) * dracorPerCorpus;
      const end = start + dracorPerCorpus;
      if (end < filtered.length) {
        dracorHasMore = true;
      }

      const pageSlice = filtered.slice(start, end);
      return pageSlice.map((drama: any): CatalogBookItem => {
        const authorName = drama.authors?.[0]?.name || 'Auteur classique';
        const dramaLang: 'fr' | 'de' = corpus === 'fre' ? 'fr' : 'de';
        const genre =
          corpus === 'fre' ? 'Théâtre classique français' : 'Deutsches klassisches Theater';
        const subtitleDesc = drama.subtitle ? `${drama.subtitle}. ` : '';
        const dramaYear = drama.writtenYear || drama.yearPremiered || drama.yearPrinted || 1700;

        return {
          id: `dracor:${corpus}:${drama.name}`,
          source: 'DraCor',
          title: drama.title,
          author: authorName,
          language: dramaLang,
          cefrLevel: classifyMetadataCefr({
            language: dramaLang,
            genre,
            year: dramaYear,
            source: 'DraCor',
          }),
          year: dramaYear,
          genre,
          coverColor: corpus === 'fre' ? 'sauge' : 'prune',
          description: `${subtitleDesc}Corpus théâtral universitaire DraCor (${corpus.toUpperCase()}). Distribution de ${
            drama.networkSize || 0
          } personnages.`,
          excerpt: `« Pièce dramatique numérisée selon les standards académiques TEI-XML. ${
            drama.networkSize || 'Plusieurs'
          } personnages en interaction scénique. »`,
        };
      });
    })
  );

  const gutenbergLang = lang === 'all' ? 'fr,de' : lang;
  const gutenbergSearch = normalizedQuery ? `&search=${encodeURIComponent(normalizedQuery)}` : '';
  const gutenbergUrl = `https://gutendex.com/books/?languages=${gutenbergLang}${gutenbergSearch}&page=${safePage}`;

  const gutendexPromise = (async (): Promise<CatalogBookItem[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);
    try {
      const resp = await fetch(gutenbergUrl, {
        headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (resp && resp.ok) {
        const data = (await resp.json()) as {
          count?: number;
          next?: string | null;
          results?: any[];
        };
        gutendexTotalCount = typeof data.count === 'number' ? data.count : 0;
        gutendexHasMore = Boolean(data.next);

        const gutenbergBooks = data.results || [];
        return gutenbergBooks.map((gb): CatalogBookItem => {
          const gbLang: 'fr' | 'de' = gb.languages?.includes('de') ? 'de' : 'fr';
          const authorName = gb.authors?.[0]?.name
            ? gb.authors[0].name.split(',').reverse().join(' ').trim()
            : 'Auteur classique';
          const coverUrl = gb.formats?.['image/jpeg'] || undefined;
          const txtUrl =
            gb.formats?.['text/plain; charset=utf-8'] || gb.formats?.['text/plain'] || undefined;
          const subjects =
            gb.subjects && gb.subjects.length > 0
              ? gb.subjects.slice(0, 3).join(' · ')
              : 'Littérature générale & patrimoine';
          const genre = gb.subjects?.[0]
            ? gb.subjects[0].split('--')[0].trim()
            : 'Classique du domaine public';

          return {
            id: `gutenberg:${gb.id}`,
            source: 'Gutenberg',
            title: gb.title,
            author: authorName,
            language: gbLang,
            cefrLevel: classifyMetadataCefr({
              language: gbLang,
              genre,
              subjects: gb.subjects || [],
              source: 'Gutenberg',
            }),
            genre,
            coverUrl,
            coverColor: gbLang === 'fr' ? 'soleil' : 'bleuet',
            description: `Édition patrimoniale issue du Projet Gutenberg mondial. Thématiques : ${subjects}.`,
            excerpt: `« Ouvrage numérisé et conservé en libre accès pour la recherche et l'étude critique. Consulté plus de ${(
              gb.download_count || 0
            ).toLocaleString('fr-FR')} fois à l'international. »`,
            downloadUrl: txtUrl,
            downloads: gb.download_count,
          };
        });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Gutendex lookup non-bloquant:', err);
    }
    return [];
  })();

  const [dracorGroups, gutendexItems] = await Promise.all([dracorPromise, gutendexPromise]);

  const seenTitles = new Set(results.map((r) => r.title.toLowerCase().trim()));
  for (const group of dracorGroups) {
    for (const item of group) {
      const key = item.title.toLowerCase().trim();
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        results.push(item);
      }
    }
  }
  for (const item of gutendexItems) {
    const key = item.title.toLowerCase().trim();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      results.push(item);
    }
  }

  const payload: PaginatedCatalogResult = {
    items: results,
    totalExternalCount: dracorTotalCount + gutendexTotalCount,
    hasMore: dracorHasMore || gutendexHasMore,
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: payload });
  return payload;
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
  genre?: string;
  year?: number;
  downloadUrl?: string;
}): Promise<{
  chapters: { number: number; title: string; contentHtml: string; wordCount: number }[];
  computedCefrLevel: CefrLevel;
}> {
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
  } else if (item.id.startsWith('gutenberg:') || item.downloadUrl) {
    // Extraire l'identifiant numérique Gutenberg (fonctionne pour gutenberg:ID et patrimoine:* avec downloadUrl)
    const idMatch =
      item.id.match(/gutenberg:(\d+)/i) ||
      (item.downloadUrl || '').match(/(?:epub|ebooks)\/(\d+)/i);
    const gutenbergId = idMatch ? idMatch[1] : '';

    const candidateUrls = [
      ...(gutenbergId
        ? [
            `https://gutenberg.pglaf.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
            `https://gutenberg.pglaf.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt.utf-8`,
          ]
        : []),
      item.downloadUrl ? item.downloadUrl.replace('https://www.gutenberg.org/', 'https://gutenberg.pglaf.org/') : undefined,
      item.downloadUrl,
      ...(gutenbergId
        ? [
            `https://www.gutenberg.org/ebooks/${gutenbergId}.txt.utf-8`,
            `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt.utf-8`,
            `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`,
          ]
        : []),
    ].filter((u, idx, arr): u is string => Boolean(u) && !u.includes('undefined') && arr.indexOf(u) === idx);

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'WonderWord-UNI-Paris8/1.0' },
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (resp.ok) {
          const text = await resp.text();
          if (text && text.length > 500) {
            rawText = text;
            break;
          }
        }
      } catch {
        // Essayer l'URL suivante
      }
    }

    if (!rawText) {
      throw new Error('Impossible de télécharger le texte intégral depuis le Projet Gutenberg.');
    }

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
    throw new Error("Source textuelle introuvable pour l'importation.");
  }

  const computedCefrLevel = classifyTextReadability(rawText, {
    language: item.language,
    genre: item.genre,
    year: item.year,
    source: item.source,
  });

  return {
    chapters: splitTextIntoChapters(rawText, item.language),
    computedCefrLevel,
  };
}

/**
 * Segmente un texte brut en paragraphes lisibles (~60 à 120 mots max), y compris pour
 * les pièces DraCor qui utilisent des retours ligne simples sans double saut de ligne.
 */
function normalizeTextIntoParagraphs(rawText: string): string[] {
  const doubleSplit = rawText
    .split(/\r?\n\s*\r?\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('***'));

  const normalized: string[] = [];

  for (const block of doubleSplit) {
    const cleanSingleLineBlock = block.replace(/\s+/g, ' ').trim();
    const blockWords = cleanSingleLineBlock.split(/\s+/).filter(Boolean).length;

    if (blockWords <= 140) {
      normalized.push(cleanSingleLineBlock);
      continue;
    }

    // Si le bloc est très long et contient des retours à la ligne simples (ex: DraCor /spoken-text)
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 4) {
      let buf: string[] = [];
      let bufWords = 0;

      for (const line of lines) {
        const lw = line.split(/\s+/).filter(Boolean).length;
        buf.push(line);
        bufWords += lw;

        const endsSentence = /[.!?…»"]$/.test(line);
        if ((bufWords >= 55 && endsSentence) || bufWords >= 95) {
          normalized.push(buf.join(' '));
          buf = [];
          bufWords = 0;
        }
      }
      if (buf.length > 0) {
        normalized.push(buf.join(' '));
      }
      continue;
    }

    // Dernier recours : bloc continu très long sans sauts de ligne -> découper par phrases
    const sentences = cleanSingleLineBlock.split(/(?<=[.!?…])\s+/).filter(Boolean);
    let buf: string[] = [];
    let bufWords = 0;
    for (const s of sentences) {
      const sw = s.split(/\s+/).filter(Boolean).length;
      buf.push(s);
      bufWords += sw;
      if (bufWords >= 80) {
        normalized.push(buf.join(' '));
        buf = [];
        bufWords = 0;
      }
    }
    if (buf.length > 0) {
      normalized.push(buf.join(' '));
    }
  }

  return normalized;
}

/**
 * Découpe un texte brut en chapitres équilibrés (~1 200 mots par chapitre, jusqu'à 30 chapitres)
 */
export function splitTextIntoChapters(
  rawText: string,
  language = 'fr'
): { number: number; title: string; contentHtml: string; wordCount: number }[] {
  const paragraphs = normalizeTextIntoParagraphs(rawText);

  const chapterLabel =
    language === 'de'
      ? 'Kapitel'
      : language === 'en'
      ? 'Chapter'
      : language === 'es'
      ? 'Capítulo'
      : language === 'ru'
      ? 'Глава'
      : 'Chapitre';

  const chapters: { number: number; title: string; contentHtml: string; wordCount: number }[] = [];
  let currentChapterParas: string[] = [];
  let currentWordCount = 0;
  let chapterIndex = 1;

  const chapterWordsTarget = totalInputWords(paragraphs) > 40000 ? 1500 : 1200;

  for (const para of paragraphs) {
    const wordsInPara = para.split(/\s+/).filter(Boolean).length;
    currentChapterParas.push(`<p>${escapeHtml(para)}</p>`);
    currentWordCount += wordsInPara;

    // Découpage équilibré (~1 200 à 1 500 mots par chapitre, jusqu'à 250 chapitres)
    if (currentWordCount >= chapterWordsTarget && chapters.length < 249) {
      chapters.push({
        number: chapterIndex,
        title: `${chapterLabel} ${chapterIndex}`,
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
      title: `${chapterLabel} ${chapterIndex}`,
      contentHtml: currentChapterParas.join('\n'),
      wordCount: Math.max(currentWordCount, 1),
    });
  }

  if (chapters.length === 0) {
    const fallbackWords = rawText.trim().split(/\s+/).filter(Boolean).length;
    chapters.push({
      number: 1,
      title: `${chapterLabel} 1`,
      contentHtml: `<p>${escapeHtml(rawText.slice(0, 3000) || 'Texte vide')}</p>`,
      wordCount: Math.max(fallbackWords, 1),
    });
  }

  return chapters;
}

function totalInputWords(paragraphs: string[]): number {
  let count = 0;
  for (const p of paragraphs) {
    count += p.split(/\s+/).filter(Boolean).length;
  }
  return count;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
