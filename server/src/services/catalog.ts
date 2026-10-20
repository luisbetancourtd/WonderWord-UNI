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
  excerpt?: string;
  genre?: string;
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
    genre: 'Roman psychologique & moderniste',
    coverColor: 'prune',
    coverUrl: 'https://www.gutenberg.org/cache/epub/2650/pg2650.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/5711/pg5711.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/17989/pg17989.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/5799/pg5799.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/24373/pg24373.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/2407/pg2407.cover.medium.jpg',
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
    coverUrl: 'https://www.gutenberg.org/cache/epub/6782/pg6782.cover.medium.jpg',
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
    cefrLevel: 'A2',
    year: 1812,
    genre: 'Volksmärchen',
    coverColor: 'sauge',
    coverUrl: 'https://www.gutenberg.org/cache/epub/5314/pg5314.cover.medium.jpg',
    downloadUrl: 'https://www.gutenberg.org/cache/epub/5314/pg5314.txt.utf-8',
    description: 'Klassische deutsche Kinder- und Hausmärchen. Sprachlich klar, rhythmisch und didaktisch ideal für den Wortschatzerwerb frankophoner Germanistik-Studierender.',
    excerpt: "Vor einem großen Walde wohnte ein armer Holzhacker mit seiner Frau und seinen zwei Kindern; das Bübchen hieß Hänsel und das Mädchen Gretel. Er hatte wenig zu beißen und zu brechen...",
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
          const genre = corpus === 'fre' ? 'Théâtre classique français' : 'Deutsches klassisches Theater';
          const subtitleDesc = drama.subtitle ? `${drama.subtitle}. ` : '';
          results.push({
            id: `dracor:${corpus}:${drama.name}`,
            source: 'DraCor',
            title: drama.title,
            author: authorName,
            language: dramaLang,
            cefrLevel: dramaLang === 'fr' ? 'B2' : 'C1',
            year: drama.writtenYear || drama.yearPremiered || drama.yearPrinted || 1700,
            genre,
            coverColor: corpus === 'fre' ? 'sauge' : 'prune',
            description: `${subtitleDesc}Corpus théâtral universitaire DraCor (${corpus.toUpperCase()}). Distribution de ${drama.networkSize || 0} personnages.`,
            excerpt: `« Pièce dramatique numérisée selon les standards académiques TEI-XML. ${drama.networkSize || 'Plusieurs'} personnages en interaction scénique. »`,
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
        const subjects = gb.subjects && gb.subjects.length > 0 ? gb.subjects.slice(0, 3).join(' · ') : 'Littérature générale & patrimoine';
        const genre = gb.subjects?.[0] ? gb.subjects[0].split('--')[0].trim() : 'Classique du domaine public';

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
            genre,
            coverUrl,
            coverColor: gbLang === 'fr' ? 'soleil' : 'bleuet',
            description: `Édition patrimoniale issue du Projet Gutenberg mondial. Thématiques : ${subjects}.`,
            excerpt: `« Ouvrage numérisé et conservé en libre accès pour la recherche et l'étude critique. Consulté plus de ${(gb.download_count || 0).toLocaleString('fr-FR')} fois à l'international. »`,
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
  } else if (item.id.startsWith('gutenberg:') || item.downloadUrl) {
    // Importation depuis Gutenberg ou URL directe du patrimoine
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
    // Exemple patrimonial pré-rempli si aucune URL externe
    rawText = `
      Chapitre I. L'ouverture littéraire.
      C'est ainsi que commence ce chef-d'œuvre du patrimoine universel. Les mots résonnent avec la voix des siècles passés et nous invitent à une écoute attentive des nuances de la langue.
      
      Chapitre II. La traversée des formes.
      Chaque phrase révèle une architecture syntaxique singulière où le rythme et l'harmonie des sons construisent le sens profond du texte littéraire.
    `;
  }

  // Découper le texte en chapitres ou en sections équilibrées de 1 200 à 1 800 mots
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

    // Quand on atteint environ 1 400 mots, on forme un chapitre (jusqu'à 6 chapitres équilibrés)
    if (currentWordCount >= 1400 && chapters.length < 5) {
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
