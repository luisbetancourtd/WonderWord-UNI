export interface WordAnalysisResult {
  word: string;
  lemma: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
  language: 'fr' | 'de';
}

interface LexiconEntry {
  lemma?: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
}

// Cache en mémoire pour éviter de réinterroger les APIs publiques sur un même mot
const wordCache = new Map<string, WordAnalysisResult>();

// Dictionnaire critique de référence (Français & Allemand littéraire)
const CURATED_LEXICON_FR: Record<string, LexiconEntry> = {
  sahara: {
    lemma: 'le Sahara',
    ipa: '/sa.a.ʁa/',
    translation: 'El Sáhara (desierto)',
    definition: 'Vaste désert aride situé dans la partie septentrionale du continent africain, cadre initiatique du récit de Saint-Exupéry.',
    grammatical: 'Nom propre géographique · Masculin',
  },
  réparation: {
    lemma: 'la réparation',
    ipa: '/ʁe.pa.ʁa.sjɔ̃/',
    translation: 'la reparación / arreglo',
    definition: 'Action de remettre en bon état de fonctionnement un mécanisme ou un moteur endommagé.',
    grammatical: 'Nom féminin · Dérivé de réparer',
  },
  mille: {
    lemma: 'mille',
    ipa: '/mil/',
    translation: 'mil / milla náutica',
    definition: 'Adjectif numéral cardinal invariable désignant dix fois cent (ou mesure de distance marine). Le digraphe « ll » se prononce /l/.',
    grammatical: 'Adjectif numéral invariable',
  },
  'dessine-moi': {
    lemma: 'dessiner',
    ipa: '/de.sin.mwa/',
    translation: 'dibújame',
    definition: 'Forme impérative présente du verbe transitif « dessiner » suivie du pronom tonique enclitique « moi ».',
    grammatical: 'Locution verbale · Impératif présent',
  },
  mouton: {
    lemma: 'le mouton',
    ipa: '/mu.tɔ̃/',
    translation: 'el cordero / oveja',
    definition: 'Mammifère ruminant domestique à laine frisée, symbole d’innocence et d’imagination enfantine dans Le Petit Prince.',
    grammatical: 'Nom masculin singulier',
  },
  désert: {
    lemma: 'le désert',
    ipa: '/de.zɛʁ/',
    translation: 'el desierto',
    definition: 'Région inhabitée et aride où la raréfaction de la vie favorise l’introspection philosophique.',
    grammatical: 'Nom masculin · Consonne finale muette',
  },
  panne: {
    lemma: 'la panne',
    ipa: '/pan/',
    translation: 'la avería / fallo mecánico',
    definition: 'Arrêt accidentel du fonctionnement d’une machine ou d’un moteur d’avion.',
    grammatical: 'Nom féminin singulier',
  },
  moteur: {
    lemma: 'le moteur',
    ipa: '/mɔ.tœʁ/',
    translation: 'el motor',
    definition: 'Appareil transformant une énergie thermique en énergie mécanique pour propulser un aéronef.',
    grammatical: 'Nom masculin · Voyelle ouverte /œ/',
  },
  mécanicien: {
    lemma: 'le mécanicien',
    ipa: '/me.ka.ni.sjɛ̃/',
    translation: 'el mecánico',
    definition: 'Spécialiste chargé de l’entretien, du diagnostic et de la réparation des machines et moteurs.',
    grammatical: 'Nom masculin · Finale nasale /jɛ̃/',
  },
  naufragé: {
    lemma: 'le naufragé',
    ipa: '/no.fʁa.ʒe/',
    translation: 'el náufrago',
    definition: 'Personne survivant à la perte de son navire en mer, isolée loin de toute terre habitée.',
    grammatical: 'Nom / Participe passé substantivé',
  },
  radeau: {
    lemma: 'le radeau',
    ipa: '/ʁa.do/',
    translation: 'la balsa',
    definition: 'Embarcation de fortune plate et flottante construite par assemblage de pièces de bois.',
    grammatical: 'Nom masculin · Trigramme « eau » /o/',
  },
  foudre: {
    lemma: 'la foudre',
    ipa: '/fudʁ/',
    translation: 'el rayo / relámpago',
    definition: 'Décharge électrique aérienne lumineuse et sonore accompagnant l’orage ; au figuré, stupeur soudaine.',
    grammatical: 'Nom féminin singulier',
  },
  bonhomme: {
    lemma: 'le bonhomme',
    ipa: '/bɔ.nɔm/',
    translation: 'el hombrecito / mujercita',
    definition: 'Terme affectueux désignant un petit personnage singulier ou un enfant.',
    grammatical: 'Nom masculin · Dénasalisation de « bon »',
  },
  extraordinaire: {
    lemma: 'extraordinaire',
    ipa: '/ɛk.stʁa.ɔʁ.di.nɛʁ/',
    translation: 'extraordinario',
    definition: 'Qui sort de l’ordre commun, étonne par sa rareté ou son caractère merveilleux.',
    grammatical: 'Adjectif qualificatif épicène',
  },
  gravement: {
    lemma: 'gravement',
    ipa: '/ɡʁav.mɑ̃/',
    translation: 'seriamente / con gravedad',
    definition: 'D’une manière sérieuse, solennelle et attentive.',
    grammatical: 'Adverbe de manière · Finale /ɑ̃/',
  },
  planète: {
    lemma: 'la planète',
    ipa: '/pla.nɛt/',
    translation: 'el planeta',
    definition: 'Corps céleste non lumineux par lui-même qui gravite autour d’une étoile.',
    grammatical: 'Nom féminin singulier',
  },
  astéroïde: {
    lemma: 'l’astéroïde',
    ipa: '/as.te.ʁɔ.id/',
    translation: 'el asteroide',
    definition: 'Petit corps céleste rocheux orbitant dans l’espace interplanétaire.',
    grammatical: 'Nom masculin · Tréma de diérèse',
  },
  apprivoiser: {
    lemma: 'apprivoiser',
    ipa: '/a.pʁi.vwa.ze/',
    translation: 'domesticar / crear lazos',
    definition: 'Dans la poétique de Saint-Exupéry, « créer des liens » uniques de responsabilité mutuelle entre deux êtres.',
    grammatical: 'Verbe transitif du 1er groupe',
  },
  renard: {
    lemma: 'le renard',
    ipa: '/ʁə.naʁ/',
    translation: 'el zorro',
    definition: 'Mammifère carnivore au museau pointu, figure initiatrice de l’amitié dans Le Petit Prince.',
    grammatical: 'Nom masculin · « d » final muet',
  },
  château: {
    lemma: 'le château',
    ipa: '/ʃɑ.to/',
    translation: 'el castillo / palacio',
    definition: 'Vaste demeure seigneuriale ou féodale fortifiée.',
    grammatical: 'Nom masculin · Accent circonflexe historique',
  },
  métaphysique: {
    lemma: 'la métaphysique',
    ipa: '/me.ta.fi.zik/',
    translation: 'la metafísica',
    definition: 'Branche de la philosophie étudiant les causes premières et les principes fondamentaux de l’être.',
    grammatical: 'Nom féminin / Adjectif',
  },
  optimisme: {
    lemma: 'l’optimisme',
    ipa: '/ɔp.ti.mism/',
    translation: 'el optimismo',
    definition: 'Doctrine philosophique (notamment chez Leibniz, satirée par Voltaire) selon laquelle tout est pour le mieux dans le meilleur des mondes possibles.',
    grammatical: 'Nom masculin philosophique',
  },
};

const CURATED_LEXICON_DE: Record<string, LexiconEntry> = {
  verwandlung: {
    lemma: 'die Verwandlung, -en',
    ipa: '/fɛɐ̯ˈvandlʊŋ/',
    translation: 'la metamorfosis / transformación',
    definition: 'Tiefgreifende Umgestaltung der äußeren Form oder des Wesens (Titelbegriff bei Franz Kafka).',
    grammatical: 'Substantiv · Femininum (-ung)',
  },
  ungeziefer: {
    lemma: 'das Ungeziefer',
    ipa: '/ˈʊnɡəˌt͡siːfɐ/',
    translation: 'el bicho / insecto monstruoso',
    definition: 'Kafkas berühmter Begriff für das unbestimmte, gesellschaftlich ausgegrenzte Insektenwesen, in das Gregor Samsa verwandelt wird.',
    grammatical: 'Substantiv · Neutrum (Kollektivum)',
  },
  träumen: {
    lemma: 'träumen (aus unruhigen Träumen)',
    ipa: '/ˈtʁɔʏ̯mən/',
    translation: 'soñar / los sueños',
    definition: 'Während des Schlafes Bilder, Gedanken und Empfindungen erleben (Dativ Plural: Träumen).',
    grammatical: 'Verb / Substantiv (der Traum, die Träume)',
  },
  unruhigen: {
    lemma: 'unruhig',
    ipa: '/ˈʊnˌʁuːɪɡn̩/',
    translation: 'inquietos / agitados',
    definition: 'Ohne innere Ruhe, von Sorge, Rastlosigkeit oder Angst bewegt.',
    grammatical: 'Adjektiv · Deklinierte Form (Dativ Plural)',
  },
  erwachte: {
    lemma: 'erwachen (erwachte)',
    ipa: '/ɛɐ̯ˈvaxtə/',
    translation: 'despertó (se despertó)',
    definition: 'Aus dem Schlaf aufwachen oder sich einer neuen Wirklichkeit bewusst werden.',
    grammatical: 'Verb · Präteritum (3. Person Singular)',
  },
  bett: {
    lemma: 'das Bett, die Betten',
    ipa: '/bɛt/',
    translation: 'la cama / el lecho',
    definition: 'Möbelstück zum Schlafen und Ruhen.',
    grammatical: 'Substantiv · Neutrum',
  },
  ungeheuren: {
    lemma: 'ungeheuer',
    ipa: '/ˈʊnɡəˌhɔʏ̯ʁən/',
    translation: 'monstruoso / descomunal',
    definition: 'Über das gewohnte Maß weit hinausgehend, gewaltig und furchteinflößend.',
    grammatical: 'Adjektiv · Dativ Singular',
  },
  verwandelt: {
    lemma: 'verwandeln (verwandelt)',
    ipa: '/fɛɐ̯ˈvandl̩t/',
    translation: 'transformado / convertido',
    definition: 'Partizip II von verwandeln: in eine völlig andere Gestalt überführen.',
    grammatical: 'Partizip Perfekt (Partizip II)',
  },
  panzerartig: {
    lemma: 'panzerartig',
    ipa: '/ˈpant͡sɐˌʔaːɐ̯tɪç/',
    translation: 'acorazado / como un caparazón',
    definition: 'Hart und schützend wie ein Chitinpanzer oder eine Rüstung.',
    grammatical: 'Adjektiv · Kompositum',
  },
  rücken: {
    lemma: 'der Rücken, -',
    ipa: '/ˈʁʏkn̩/',
    translation: 'la espalda / el dorso',
    definition: 'Hintere Seite des Rumpfes beim Menschen oder bei Tieren.',
    grammatical: 'Substantiv · Maskulinum',
  },
  rotkäppchen: {
    lemma: 'das Rotkäppchen',
    ipa: '/ˈʁoːtˌkɛpçən/',
    translation: 'Caperucita Roja',
    definition: 'Märchenfigur der Brüder Grimm, benannt nach ihrem kleinen Käppchen aus rotem Samt.',
    grammatical: 'Substantiv · Neutrum (Diminutiv auf -chen)',
  },
  großmutter: {
    lemma: 'die Großmutter, Großmütter',
    ipa: '/ˈɡʁoːsˌmʊtɐ/',
    translation: 'la abuela',
    definition: 'Mutter des Vaters oder der Mutter.',
    grammatical: 'Substantiv · Femininum',
  },
  wald: {
    lemma: 'der Wald, die Wälder',
    ipa: '/valt/',
    translation: 'el bosque',
    definition: 'Größere, dicht mit Bäumen bewachsene Fläche; zentraler Symbolraum der deutschen Romantik und Märchen.',
    grammatical: 'Substantiv · Maskulinum',
  },
  wolf: {
    lemma: 'der Wolf, die Wölfe',
    ipa: '/vɔlf/',
    translation: 'el lobo',
    definition: 'Großes wildes Raubtier, im Märchen Verkörperung der List und Gefahr.',
    grammatical: 'Substantiv · Maskulinum',
  },
  philosophie: {
    lemma: 'die Philosophie',
    ipa: '/filozoˈfiː/',
    translation: 'la filosofía',
    definition: 'Streben nach Erkenntnis über den Sinn des Lebens, die Natur und die Welt (Eingangsmonolog in Goethes Faust).',
    grammatical: 'Substantiv · Femininum',
  },
};

/**
 * Nettoie un mot de toute ponctuation typographique environnante
 */
export function cleanWordToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[«»"“”„'’‘()[\]{},.;:!?—–\-…]+/, '')
    .replace(/[«»"“”„'’‘()[\]{},.;:!?—–\-…]+$/, '')
    .replace(/^(l'|d'|qu'|n'|s'|j'|m'|t'|c'|L'|D'|Qu'|N'|S'|J'|M'|T'|C'|l’|d’|qu’|n’|s’|j’|m’|t’|c’|L’|D’|Qu’|N’|S’|J’|M’|T’|C’)/, '')
    .trim();
}

/**
 * Transcription Graphème-Phonème (G2P) algorithmique pour le Français (API / IPA)
 */
export function generateFrenchIpa(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w) return '//';

  const lookup = CURATED_LEXICON_FR[w];
  if (lookup) return lookup.ipa;

  let p = w;

  // Suffixes fréquents
  p = p.replace(/tion(s?)$/, 'sjɔ̃');
  p = p.replace(/sion(s?)$/, 'zjɔ̃');
  p = p.replace(/ment$/, 'mɑ̃');
  p = p.replace(/eaux?$/, 'o');
  p = p.replace(/eux$/, 'ø');
  p = p.replace(/euse(s?)$/, 'øz');
  p = p.replace(/able(s?)$/, 'abl');
  p = p.replace(/ique(s?)$/, 'ik');
  p = p.replace(/age(s?)$/, 'aʒ');
  p = p.replace(/oir$/, 'waʁ');
  p = p.replace(/oire(s?)$/, 'waʁ');
  p = p.replace(/eur(s?)$/, 'œʁ');
  p = p.replace(/er$/, 'e');
  p = p.replace(/ez$/, 'e');
  p = p.replace(/ais$/, 'ɛ');
  p = p.replace(/ait$/, 'ɛ');
  p = p.replace(/aient$/, 'ɛ');

  // Digrammes et trigrammes vocaliques / consonantiques
  p = p.replace(/ou/g, 'u');
  p = p.replace(/oi/g, 'wa');
  p = p.replace(/eau/g, 'o');
  p = p.replace(/au/g, 'o');
  p = p.replace(/ai/g, 'ɛ');
  p = p.replace(/ei/g, 'ɛ');
  p = p.replace(/eu/g, 'ø');
  p = p.replace(/œu/g, 'œ');
  p = p.replace(/gn/g, 'ɲ');
  p = p.replace(/ph/g, 'f');
  p = p.replace(/ch/g, 'ʃ');
  p = p.replace(/qu/g, 'k');
  p = p.replace(/gu(?=[eiyéèê])/g, 'ɡ');
  p = p.replace(/ill/g, 'j');

  // Voyelles nasales
  p = p.replace(/(?:an|am|en|em)(?![aeiouyéèêëîïôùûümn])/g, 'ɑ̃');
  p = p.replace(/(?:on|om)(?![aeiouyéèêëîïôùûümn])/g, 'ɔ̃');
  p = p.replace(/(?:in|im|ain|aim|ein|yn|ym)(?![aeiouyéèêëîïôùûümn])/g, 'ɛ̃');

  // Consonnes contextuelles
  p = p.replace(/c(?=[eiyéèêëîï])/g, 's');
  p = p.replace(/ç/g, 's');
  p = p.replace(/c/g, 'k');
  p = p.replace(/g(?=[eiyéèêëîï])/g, 'ʒ');
  p = p.replace(/g/g, 'ɡ');
  p = p.replace(/(?<=[aeiouyéèêëîïôùûü])s(?=[aeiouyéèêëîïôùûü])/g, 'z');
  p = p.replace(/ss/g, 's');
  p = p.replace(/mm/g, 'm');
  p = p.replace(/nn/g, 'n');
  p = p.replace(/ll/g, 'l');
  p = p.replace(/tt/g, 't');
  p = p.replace(/pp/g, 'p');
  p = p.replace(/rr/g, 'ʁ');
  p = p.replace(/r/g, 'ʁ');
  p = p.replace(/j/g, 'ʒ');
  p = p.replace(/h/g, '');

  // Voyelles accentuées et u français
  p = p.replace(/[é]/g, 'e');
  p = p.replace(/[èêë]/g, 'ɛ');
  p = p.replace(/[àâ]/g, 'a');
  p = p.replace(/[îïy]/g, 'i');
  p = p.replace(/[ô]/g, 'o');
  p = p.replace(/[ùû]/g, 'u');
  p = p.replace(/u/g, 'y');

  // Consonnes finales muettes et e caduc final
  p = p.replace(/[dsxtzp]$/, '');
  p = p.replace(/e$/, '');

  return `/${p || w}/`;
}

/**
 * Transcription Graphème-Phonème (G2P) algorithmique pour l'Allemand (API / IPA)
 */
export function generateGermanIpa(word: string): string {
  const w = word.toLowerCase().trim();
  if (!w) return '//';

  const lookup = CURATED_LEXICON_DE[w];
  if (lookup) return lookup.ipa;

  let p = w;

  p = p.replace(/sch/g, 'ʃ');
  p = p.replace(/tsch/g, 't͡ʃ');
  p = p.replace(/^sp/g, 'ʃp');
  p = p.replace(/^st/g, 'ʃt');
  p = p.replace(/ch(?=[aou])/g, 'x');
  p = p.replace(/ch/g, 'ç');
  p = p.replace(/ck/g, 'k');
  p = p.replace(/tz/g, 't͡s');
  p = p.replace(/z/g, 't͡s');
  p = p.replace(/pf/g, 'p͡f');
  p = p.replace(/qu/g, 'kv');
  p = p.replace(/ng/g, 'ŋ');
  p = p.replace(/ph/g, 'f');
  p = p.replace(/ß/g, 's');

  // Diphtongues allemandes
  p = p.replace(/ei|ai/g, 'aɪ̯');
  p = p.replace(/eu|äu/g, 'ɔʏ̯');
  p = p.replace(/au/g, 'aʊ̯');
  p = p.replace(/ie/g, 'iː');

  // Voyelles avec h d'allongement
  p = p.replace(/ah/g, 'aː');
  p = p.replace(/eh/g, 'eː');
  p = p.replace(/ih/g, 'iː');
  p = p.replace(/oh/g, 'oː');
  p = p.replace(/uh/g, 'uː');
  p = p.replace(/üh/g, 'yː');
  p = p.replace(/öh/g, 'øː');
  p = p.replace(/äh/g, 'ɛː');

  // Umlaute
  p = p.replace(/ä/g, 'ɛ');
  p = p.replace(/ö/g, 'œ');
  p = p.replace(/ü/g, 'ʏ');

  // Terminaisons
  p = p.replace(/er$/g, 'ɐ');
  p = p.replace(/en$/g, 'ən');
  p = p.replace(/ig$/g, 'ɪç');
  p = p.replace(/ung$/g, 'ʊŋ');

  // Consonnes spécifiques
  p = p.replace(/w/g, 'v');
  p = p.replace(/^v/g, 'f');
  p = p.replace(/j/g, 'j');
  p = p.replace(/r/g, 'ʁ');
  p = p.replace(/s(?=[aeiouɛœʏ])/g, 'z');

  return `/${p || w}/`;
}

/**
 * Infère la catégorie grammaticale d'un mot français ou allemand
 */
export function inferGrammaticalCategory(rawWord: string, language: 'fr' | 'de'): string {
  const clean = cleanWordToken(rawWord);
  const lower = clean.toLowerCase();

  if (language === 'de') {
    const isCapitalized = clean.length > 0 && clean[0] === clean[0].toUpperCase() && clean[0] !== clean[0].toLowerCase();
    if (lower.endsWith('ung') || lower.endsWith('heit') || lower.endsWith('keit') || lower.endsWith('schaft') || lower.endsWith('ion')) {
      return 'Substantiv · Femininum (die)';
    }
    if (lower.endsWith('chen') || lower.endsWith('lein')) {
      return 'Substantiv · Neutrum Diminutiv (das)';
    }
    if (isCapitalized) {
      return 'Substantiv (Nomen) · Deutsch';
    }
    if (lower.endsWith('en') || lower.endsWith('eln') || lower.endsWith('ern')) {
      return 'Verb (Infinitiv / Konjugierte Form)';
    }
    if (lower.endsWith('te') || lower.endsWith('ten')) {
      return 'Verb · Präteritum / Konjugierte Form';
    }
    if (lower.endsWith('ig') || lower.endsWith('lich') || lower.endsWith('isch') || lower.endsWith('bar') || lower.endsWith('sam') || lower.endsWith('los')) {
      return 'Adjektiv / Adverb';
    }
    return 'Wortform · Literarisches Deutsch';
  }

  // Français
  if (lower.endsWith('tion') || lower.endsWith('sion') || lower.endsWith('ence') || lower.endsWith('ance') || lower.endsWith('té') || lower.endsWith('tude')) {
    return 'Nom féminin · Français littéraire';
  }
  if (lower.endsWith('ment') && lower.length > 5) {
    return 'Adverbe de manière / Nom masculin';
  }
  if (lower.endsWith('isme') || lower.endsWith('age') || lower.endsWith('eur')) {
    return 'Nom masculin · Français littéraire';
  }
  if (lower.endsWith('er') || lower.endsWith('ir') || lower.endsWith('re') || lower.endsWith('oir')) {
    return 'Verbe à l’infinitif';
  }
  if (lower.endsWith('ait') || lower.endsWith('ais') || lower.endsWith('aient') || lower.endsWith('èrent') || lower.endsWith('a')) {
    return 'Forme verbale conjuguée (Imparfait / Passé simple)';
  }
  if (lower.endsWith('eux') || lower.endsWith('euse') || lower.endsWith('if') || lower.endsWith('ive') || lower.endsWith('ique') || lower.endsWith('able') || lower.endsWith('ible')) {
    return 'Adjectif qualificatif';
  }
  if (clean.length > 0 && clean[0] === clean[0].toUpperCase() && clean[0] !== clean[0].toLowerCase()) {
    return 'Nom propre / Terme initial';
  }
  return 'Terme lexical · Français littéraire';
}

/**
 * Analyse complète d'un mot en contexte (Lexique interne + Wiktionary/MyMemory + G2P)
 */
export async function analyzeLiteraryWord(
  rawWord: string,
  language: 'fr' | 'de' = 'fr',
  contextSentence?: string
): Promise<WordAnalysisResult> {
  const cleaned = cleanWordToken(rawWord);
  const lower = cleaned.toLowerCase();
  const cacheKey = `${language}:${lower}`;

  if (wordCache.has(cacheKey)) {
    return wordCache.get(cacheKey)!;
  }

  // 1. Vérifier dans le lexique critique de référence
  const lexicon = language === 'de' ? CURATED_LEXICON_DE : CURATED_LEXICON_FR;
  if (lexicon[lower]) {
    const entry = lexicon[lower];
    const result: WordAnalysisResult = {
      word: cleaned,
      lemma: entry.lemma || cleaned,
      ipa: entry.ipa,
      translation: entry.translation,
      definition: entry.definition,
      grammatical: entry.grammatical,
      language,
    };
    wordCache.set(cacheKey, result);
    return result;
  }

  // 2. Calculer la transcription API (IPA) et la catégorie grammaticale
  const ipa = language === 'de' ? generateGermanIpa(cleaned) : generateFrenchIpa(cleaned);
  let grammatical = inferGrammaticalCategory(cleaned, language);
  let translation = '';
  let definition = '';

  // 3. Interroger les APIs lexicales ouvertes (MyMemory & Wiktionary) avec timeout court
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);

    // Paire de traduction : de -> fr (pour les textes allemands) ou fr -> es / fr (pour les textes français)
    const langPair = language === 'de' ? 'de|fr' : 'fr|es';
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned)}&langpair=${langPair}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (transRes.ok) {
      const transJson = (await transRes.json()) as any;
      const translatedText = transJson?.responseData?.translatedText;
      if (translatedText && translatedText.toLowerCase() !== lower) {
        translation =
          language === 'de'
            ? `${translatedText} (FR)`
            : `${translatedText}`;
      }
    }
  } catch {
    // Fallback silencieux si hors-ligne ou timeout
  }

  // 4. Interroger Wiktionary REST API pour obtenir une définition authentique
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const wikiHost = language === 'de' ? 'fr.wiktionary.org' : 'fr.wiktionary.org';
    const wikiRes = await fetch(
      `https://${wikiHost}/api/rest_v1/page/definition/${encodeURIComponent(lower)}`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'WonderWord-UNI/1.0 (Master HN Paris 8)' },
      }
    );
    clearTimeout(timeout);

    if (wikiRes.ok) {
      const wikiData = (await wikiRes.json()) as any;
      const sections = wikiData[language] || wikiData['fr'] || Object.values(wikiData)[0];
      if (Array.isArray(sections) && sections.length > 0) {
        const firstSection = sections[0];
        if (firstSection.partOfSpeech) {
          grammatical = `${firstSection.partOfSpeech} · ${language === 'de' ? 'Deutsch' : 'Français'}`;
        }
        const firstDefHtml = firstSection.definitions?.[0]?.definition;
        if (firstDefHtml) {
          const cleanDef = firstDefHtml
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleanDef.length > 8) {
            definition = cleanDef.length > 220 ? cleanDef.slice(0, 217) + '…' : cleanDef;
          }
        }
      }
    }
  } catch {
    // Fallback silencieux
  }

  if (!translation) {
    translation =
      language === 'de'
        ? `Terme allemand « ${cleaned} » en contexte littéraire`
        : `Terme français « ${cleaned} »`;
  }

  if (!definition) {
    definition = contextSentence
      ? `Employé dans l'extrait : « ${contextSentence.slice(0, 140)}${contextSentence.length > 140 ? '…' : ''} »`
      : language === 'de'
      ? `Vocabulaire littéraire allemand (${grammatical}) analysé phonétiquement selon la norme standard.`
      : `Vocabulaire littéraire français (${grammatical}) transcrit en Alphabet Phonétique International.`;
  }

  const finalResult: WordAnalysisResult = {
    word: cleaned,
    lemma: cleaned,
    ipa,
    translation,
    definition,
    grammatical,
    language,
  };

  wordCache.set(cacheKey, finalResult);
  return finalResult;
}
