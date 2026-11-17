export type SupportedLanguage = 'fr' | 'de' | 'en' | 'es' | 'ru';

export interface WordAnalysisResult {
  word: string;
  lemma: string;
  ipa: string;
  synonyms: string[];
  translation: string;
  definition: string;
  grammatical: string;
  language: SupportedLanguage;
}

interface LexiconEntry {
  lemma?: string;
  ipa: string;
  synonyms: string[];
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
    synonyms: ['désert', 'étendue de sable'],
    translation: 'El Sáhara (desierto)',
    definition: 'Vaste désert aride situé dans le nord de l’Afrique, cadre initiatique du récit de Saint-Exupéry.',
    grammatical: 'Nom propre géographique · Masculin',
  },
  réparation: {
    lemma: 'la réparation',
    ipa: '/ʁe.pa.ʁa.sjɔ̃/',
    synonyms: ['remise en état', 'dépannage'],
    translation: 'la reparación / arreglo',
    definition: 'Action de remettre en bon état de fonctionnement un mécanisme ou un moteur abîmé.',
    grammatical: 'Nom féminin · Dérivé de réparer',
  },
  mille: {
    lemma: 'mille',
    ipa: '/mil/',
    synonyms: ['dix cents', 'millier'],
    translation: 'mil / milla náutica',
    definition: 'Nombre cardinal invariable égal à dix fois cent, ou ancienne unité de distance en mer.',
    grammatical: 'Adjectif numéral invariable',
  },
  'dessine-moi': {
    lemma: 'dessiner',
    ipa: '/de.sin.mwa/',
    synonyms: ['trace', 'représente', 'croque'],
    translation: 'dibújame',
    definition: 'Forme impérative du verbe « dessiner » : tracer une figure ou une image à la main.',
    grammatical: 'Locution verbale · Impératif présent',
  },
  mouton: {
    lemma: 'le mouton',
    ipa: '/mu.tɔ̃/',
    synonyms: ['agneau', 'brebis', 'bête'],
    translation: 'el cordero / oveja',
    definition: 'Animal domestique à laine frisée, symbole d’innocence dans Le Petit Prince.',
    grammatical: 'Nom masculin singulier',
  },
  désert: {
    lemma: 'le désert',
    ipa: '/de.zɛʁ/',
    synonyms: ['étendue aride', 'solitude', 'terre vide'],
    translation: 'el desierto',
    definition: 'Région sèche et inhabitée où il ne pleut presque jamais.',
    grammatical: 'Nom masculin · Consonne finale muette',
  },
  panne: {
    lemma: 'la panne',
    ipa: '/pan/',
    synonyms: ['arrêt', 'défaut', 'problème'],
    translation: 'la avería / fallo mecánico',
    definition: 'Arrêt brutal et imprévu du fonctionnement d’une machine ou d’un moteur.',
    grammatical: 'Nom féminin singulier',
  },
  moteur: {
    lemma: 'le moteur',
    ipa: '/mɔ.tœʁ/',
    synonyms: ['machine', 'mécanisme', 'propulseur'],
    translation: 'el motor',
    definition: 'Appareil qui produit de l’énergie mécanique pour faire avancer un véhicule ou un avion.',
    grammatical: 'Nom masculin · Voyelle ouverte /œ/',
  },
  mécanicien: {
    lemma: 'le mécanicien',
    ipa: '/me.ka.ni.sjɛ̃/',
    synonyms: ['réparateur', 'technicien'],
    translation: 'el mecánico',
    definition: 'Personne dont le métier est d’entretenir et de réparer les machines ou moteurs.',
    grammatical: 'Nom masculin · Finale nasale /jɛ̃/',
  },
  naufragé: {
    lemma: 'le naufragé',
    ipa: '/no.fʁa.ʒe/',
    synonyms: ['rescapé', 'survivant'],
    translation: 'el náufrago',
    definition: 'Personne qui a survécu au naufrage d’un bateau ou d’un avion isolé.',
    grammatical: 'Nom / Participe passé substantivé',
  },
  radeau: {
    lemma: 'le radeau',
    ipa: '/ʁa.do/',
    synonyms: ['embarcation', 'barque de fortune'],
    translation: 'la balsa',
    definition: 'Plate-forme flottante simple fabriquée avec des pièces de bois attachées ensemble.',
    grammatical: 'Nom masculin · Trigramme « eau » /o/',
  },
  foudre: {
    lemma: 'la foudre',
    ipa: '/fudʁ/',
    synonyms: ['éclair', 'tonnerre'],
    translation: 'el rayo / relámpago',
    definition: 'Décharge électrique lumineuse qui tombe du ciel pendant un orage ; au figuré, choc brusque.',
    grammatical: 'Nom féminin singulier',
  },
  bonhomme: {
    lemma: 'le bonhomme',
    ipa: '/bɔ.nɔm/',
    synonyms: ['petit homme', 'garçon', 'personnage'],
    translation: 'el hombrecito / mujercita',
    definition: 'Mot familier et affectueux pour désigner un petit personnage ou un enfant.',
    grammatical: 'Nom masculin · Dénasalisation de « bon »',
  },
  extraordinaire: {
    lemma: 'extraordinaire',
    ipa: '/ɛk.stʁa.ɔʁ.di.nɛʁ/',
    synonyms: ['étonnant', 'incroyable', 'rare'],
    translation: 'extraordinario',
    definition: 'Qui sort de l’ordinaire, surprend par sa rareté ou son caractère exceptionnel.',
    grammatical: 'Adjectif qualificatif épicène',
  },
  gravement: {
    lemma: 'gravement',
    ipa: '/ɡʁav.mɑ̃/',
    synonyms: ['sérieusement', 'profondément'],
    translation: 'seriamente / con gravedad',
    definition: 'D’une manière sérieuse, calme et pleine d’attention.',
    grammatical: 'Adverbe de manière · Finale /ɑ̃/',
  },
  planète: {
    lemma: 'la planète',
    ipa: '/pla.nɛt/',
    synonyms: ['astre', 'monde'],
    translation: 'el planeta',
    definition: 'Grand corps rond dans l’espace qui tourne autour d’une étoile sans produire sa propre lumière.',
    grammatical: 'Nom féminin singulier',
  },
  astéroïde: {
    lemma: 'l’astéroïde',
    ipa: '/as.te.ʁɔ.id/',
    synonyms: ['petit astre', 'roche spatiale'],
    translation: 'el asteroide',
    definition: 'Petit bloc rocheux qui tourne autour du Soleil dans l’espace.',
    grammatical: 'Nom masculin · Tréma de diérèse',
  },
  apprivoiser: {
    lemma: 'apprivoiser',
    ipa: '/a.pʁi.vwa.ze/',
    synonyms: ['rendre familier', 'créer des liens', 'adoucir'],
    translation: 'domesticar / crear lazos',
    definition: 'Rendre un animal moins sauvage ; chez Saint-Exupéry, créer des liens uniques d’attachement.',
    grammatical: 'Verbe transitif du 1er groupe',
  },
  renard: {
    lemma: 'le renard',
    ipa: '/ʁə.naʁ/',
    synonyms: ['animal rusé', 'goupil'],
    translation: 'el zorro',
    definition: 'Petit animal sauvage au museau pointu et à la queue touffue, symbole de ruse et d’amitié.',
    grammatical: 'Nom masculin · « d » final muet',
  },
  château: {
    lemma: 'le château',
    ipa: '/ʃɑ.to/',
    synonyms: ['palais', 'manoir', 'demeure'],
    translation: 'el castillo / palacio',
    definition: 'Grande maison ancienne et fortifiée où vivaient les rois ou les seigneurs.',
    grammatical: 'Nom masculin · Accent circonflexe historique',
  },
  métaphysique: {
    lemma: 'la métaphysique',
    ipa: '/me.ta.fi.zik/',
    synonyms: ['philosophie première', 'pensée abstraite'],
    translation: 'la metafísica',
    definition: 'Partie de la philosophie qui cherche à comprendre le sens profond de l’être et du monde.',
    grammatical: 'Nom féminin / Adjectif',
  },
  optimisme: {
    lemma: 'l’optimisme',
    ipa: '/ɔp.ti.mism/',
    synonyms: ['confiance', 'espoir', 'positivité'],
    translation: 'el optimismo',
    definition: 'Façon de voir les choses du bon côté et de croire que tout finira bien.',
    grammatical: 'Nom masculin philosophique',
  },
};

const CURATED_LEXICON_DE: Record<string, LexiconEntry> = {
  verwandlung: {
    lemma: 'die Verwandlung, -en',
    ipa: '/fɛɐ̯ˈvandlʊŋ/',
    synonyms: ['Veränderung', 'Umgestaltung', 'Wandel'],
    translation: 'la metamorfosis / transformación',
    definition: 'Starke Veränderung der äußeren Form oder des eigenen Wesens.',
    grammatical: 'Substantiv · Femininum (-ung)',
  },
  ungeziefer: {
    lemma: 'das Ungeziefer',
    ipa: '/ˈʊnɡəˌt͡siːfɐ/',
    synonyms: ['Insekt', 'Schädling', 'Käfer'],
    translation: 'el bicho / insecto monstruoso',
    definition: 'Kleine, oft als störend empfundene Tiere wie Insekten oder Käfer.',
    grammatical: 'Substantiv · Neutrum (Kollektivum)',
  },
  träumen: {
    lemma: 'träumen (aus unruhigen Träumen)',
    ipa: '/ˈtʁɔʏ̯mən/',
    synonyms: ['schlafen', 'fantasieren', 'hoffen'],
    translation: 'soñar / los sueños',
    definition: 'Im Schlaf innere Bilder, Geschichten oder Gedanken erleben.',
    grammatical: 'Verb / Substantiv (der Traum, die Träume)',
  },
  unruhigen: {
    lemma: 'unruhig',
    ipa: '/ˈʊnˌʁuːɪɡn̩/',
    synonyms: ['nervös', 'aufgeregt', 'rastlos'],
    translation: 'inquietos / agitados',
    definition: 'Ohne Ruhe oder inneren Frieden, von Sorge oder Angst bewegt.',
    grammatical: 'Adjektiv · Deklinierte Form (Dativ Plural)',
  },
  erwachte: {
    lemma: 'erwachen (erwachte)',
    ipa: '/ɛɐ̯ˈvaxtə/',
    synonyms: ['aufwachen', 'wach werden'],
    translation: 'despertó (se despertó)',
    definition: 'Aus dem Schlaf zurückkommen und wieder wach sein.',
    grammatical: 'Verb · Präteritum (3. Person Singular)',
  },
  bett: {
    lemma: 'das Bett, die Betten',
    ipa: '/bɛt/',
    synonyms: ['Lager', 'Schlafplatz'],
    translation: 'la cama / el lecho',
    definition: 'Möbelstück mit Matratze zum Schlafen und Ausruhen.',
    grammatical: 'Substantiv · Neutrum',
  },
  ungeheuren: {
    lemma: 'ungeheuer',
    ipa: '/ˈʊnɡəˌhɔʏ̯ʁən/',
    synonyms: ['riesig', 'gewaltig', 'enorm'],
    translation: 'monstruoso / descomunal',
    definition: 'So groß, stark oder seltsam, dass es über jedes normale Maß hinausgeht.',
    grammatical: 'Adjektiv · Dativ Singular',
  },
  verwandelt: {
    lemma: 'verwandeln (verwandelt)',
    ipa: '/fɛɐ̯ˈvandl̩t/',
    synonyms: ['verändert', 'umgewandelt'],
    translation: 'transformado / convertido',
    definition: 'In eine völlig andere Gestalt oder Form gebracht.',
    grammatical: 'Partizip Perfekt (Partizip II)',
  },
  panzerartig: {
    lemma: 'panzerartig',
    ipa: '/ˈpant͡sɐˌʔaːɐ̯tɪç/',
    synonyms: ['hart', 'geschützt', 'schalenfest'],
    translation: 'acorazado / como un caparazón',
    definition: 'Hart und fest außen wie der Panzer eines Käfers oder einer Rüstung.',
    grammatical: 'Adjektiv · Kompositum',
  },
  rücken: {
    lemma: 'der Rücken, -',
    ipa: '/ˈʁʏkn̩/',
    synonyms: ['Hinterseite', 'Wirbelsäule'],
    translation: 'la espalda / el dorso',
    definition: 'Hintere Seite des Körpers von den Schultern bis zur Hüfte.',
    grammatical: 'Substantiv · Maskulinum',
  },
  rotkäppchen: {
    lemma: 'das Rotkäppchen',
    ipa: '/ˈʁoːtˌkɛpçən/',
    synonyms: ['Mädchen mit roter Kappe', 'Märchenfigur'],
    translation: 'Caperucita Roja',
    definition: 'Bekanntes Mädchen aus dem Märchen der Brüder Grimm mit einer kleinen roten Mütze.',
    grammatical: 'Substantiv · Neutrum (Diminutiv auf -chen)',
  },
  großmutter: {
    lemma: 'die Großmutter, Großmütter',
    ipa: '/ˈɡʁoːsˌmʊtɐ/',
    synonyms: ['Oma', 'Ahnin'],
    translation: 'la abuela',
    definition: 'Die Mutter des Vaters oder der Mutter.',
    grammatical: 'Substantiv · Femininum',
  },
  wald: {
    lemma: 'der Wald, die Wälder',
    ipa: '/valt/',
    synonyms: ['Forst', 'Gehölz', 'Baumbestand'],
    translation: 'el bosque',
    definition: 'Großes Gebiet mit vielen dicht zusammenstehenden Bäumen.',
    grammatical: 'Substantiv · Maskulinum',
  },
  wolf: {
    lemma: 'der Wolf, die Wölfe',
    ipa: '/vɔlf/',
    synonyms: ['Raubtier', 'Wildhund'],
    translation: 'el lobo',
    definition: 'Großes wildes Tier aus der Familie der Hunde, das im Wald lebt.',
    grammatical: 'Substantiv · Maskulinum',
  },
  philosophie: {
    lemma: 'die Philosophie',
    ipa: '/filozoˈfiː/',
    synonyms: ['Weltweisheit', 'Denkweise', 'Lehre'],
    translation: 'la filosofía',
    definition: 'Nachdenken über den Sinn des Lebens, das Wissen und die Welt.',
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

  // Suffixes fréquents (marqueur interne temporaire pour éviter la re-nasalisation de mɑ̃)
  p = p.replace(/tion(s?)$/, 'sjɔ̃');
  p = p.replace(/sion(s?)$/, 'zjɔ̃');
  p = p.replace(/ement$/, 'ə@M_AN@');
  p = p.replace(/ment$/, '@M_AN@');
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

  // Digrammes et trigrammes vocaliques / consonantiques (ill mouillé préservé via @YOD@ avant j -> ʒ)
  p = p.replace(/eill(e?s?)$/g, 'ɛ@YOD@$1');
  p = p.replace(/aill(e?s?)$/g, 'a@YOD@$1');
  p = p.replace(/(?:eu|œu)ill(e?s?)$/g, 'œ@YOD@$1');
  p = p.replace(/ouill(e?s?)$/g, 'u@YOD@$1');
  p = p.replace(/eil(s?)$/g, 'ɛ@YOD@$1');
  p = p.replace(/ail(s?)$/g, 'a@YOD@$1');
  p = p.replace(/(?:eu|œu)il(s?)$/g, 'œ@YOD@$1');
  p = p.replace(/ouil(s?)$/g, 'u@YOD@$1');
  if (!/^(?:ville|mille|tranquille|distill|oscill|bacill|pupill|capill)/i.test(w)) {
    p = p.replace(/(?<=[aeioyuéèê])ill/g, '@YOD@');
    p = p.replace(/ill/g, 'i@YOD@');
  }
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

  // Voyelles nasales (exclure également les symboles IPA déjà transcrits)
  p = p.replace(/(?:an|am|en|em)(?![aeiouyéèêëîïôùûümnɑɔɛøœə@])/g, 'ɑ̃');
  p = p.replace(/(?:on|om)(?![aeiouyéèêëîïôùûümnɑɔɛøœə@])/g, 'ɔ̃');
  p = p.replace(/(?:in|im|ain|aim|ein|yn|ym)(?![aeiouyéèêëîïôùûümnɑɔɛøœə@])/g, 'ɛ̃');

  // Consonnes contextuelles
  p = p.replace(/^ex(?=[aeiouyéèêh])/g, 'ɛɡz');
  p = p.replace(/x(?!$)/g, 'ks');
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
  p = p.replace(/@YOD@/g, 'j');
  p = p.replace(/h/g, '');

  // Voyelles accentuées et u français
  p = p.replace(/[é]/g, 'e');
  p = p.replace(/[èêë]/g, 'ɛ');
  p = p.replace(/[àâ]/g, 'a');
  p = p.replace(/[îïy]/g, 'i');
  p = p.replace(/[ô]/g, 'o');
  p = p.replace(/[ùû]/g, 'u');
  p = p.replace(/u/g, 'y');

  // Consonnes finales muettes, e caduc final et restauration du suffixe -ment
  p = p.replace(/[dsxtzp]$/, '');
  p = p.replace(/e$/, '');
  p = p.replace(/@M_AN@/g, 'mɑ̃');

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
 * Transcription G2P pour l'Anglais, l'Espagnol et le Russe
 */
export function generateOtherLangIpa(word: string, lang: 'en' | 'es' | 'ru'): string {
  const w = word.toLowerCase().trim();
  if (!w) return '//';

  if (lang === 'es') {
    let p = w
      .replace(/ch/g, 't͡ʃ')
      .replace(/ll/g, 'ʎ')
      .replace(/ñ/g, 'ɲ')
      .replace(/rr/g, 'r')
      .replace(/qu(?=[eiéí])/g, 'k')
      .replace(/gu(?=[eiéí])/g, 'ɡ')
      .replace(/c(?=[eiéí])/g, 's')
      .replace(/c/g, 'k')
      .replace(/g(?=[eiéí])/g, 'x')
      .replace(/j/g, 'x')
      .replace(/z/g, 's')
      .replace(/v/g, 'b')
      .replace(/h/g, '')
      .replace(/y$/g, 'i')
      .replace(/y/g, 'ʝ')
      .replace(/á/g, 'ˈa')
      .replace(/é/g, 'ˈe')
      .replace(/í/g, 'ˈi')
      .replace(/ó/g, 'ˈo')
      .replace(/ú/g, 'ˈu');
    return `/${p}/`;
  }

  if (lang === 'ru') {
    const map: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'ɡ', д: 'd', е: 'je', ё: 'jo', ж: 'ʐ', з: 'z',
      и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 't͡s', ч: 't͡ɕ', ш: 'ʂ', щ: 'ɕː',
      ъ: '', ы: 'ɨ', ь: 'ʲ', э: 'ɛ', ю: 'ju', я: 'ja',
    };
    const p = Array.from(w).map((ch) => map[ch] ?? ch).join('');
    return `/${p || w}/`;
  }

  // English G2P approximation
  let p = w
    .replace(/tion$/g, 'ʃən')
    .replace(/sion$/g, 'ʒən')
    .replace(/igh/g, 'aɪ')
    .replace(/ough/g, 'ɔː')
    .replace(/sh/g, 'ʃ')
    .replace(/ch/g, 't͡ʃ')
    .replace(/th/g, 'θ')
    .replace(/ph/g, 'f')
    .replace(/ng$/g, 'ŋ')
    .replace(/ee|ea/g, 'iː')
    .replace(/oo/g, 'uː')
    .replace(/ou|ow/g, 'aʊ')
    .replace(/ai|ay/g, 'eɪ')
    .replace(/oi|oy/g, 'ɔɪ')
    .replace(/ar/g, 'ɑːɹ')
    .replace(/er|ir|ur/g, 'ɜːɹ')
    .replace(/or/g, 'ɔːɹ')
    .replace(/r/g, 'ɹ')
    .replace(/j/g, 'd͡ʒ')
    .replace(/y$/g, 'i');
  return `/${p || w}/`;
}

/**
 * Infère la catégorie grammaticale d'un mot
 */
export function inferGrammaticalCategory(rawWord: string, language: SupportedLanguage): string {
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

  if (language === 'en') {
    if (lower.endsWith('tion') || lower.endsWith('ness') || lower.endsWith('ment') || lower.endsWith('ity')) return 'Noun · English';
    if (lower.endsWith('ly')) return 'Adverb · English';
    if (lower.endsWith('ing') || lower.endsWith('ed')) return 'Verb form / Participle · English';
    if (lower.endsWith('ful') || lower.endsWith('less') || lower.endsWith('ous') || lower.endsWith('ive')) return 'Adjective · English';
    return 'Lexical term · English';
  }

  if (language === 'es') {
    if (lower.endsWith('ción') || lower.endsWith('sión') || lower.endsWith('dad') || lower.endsWith('tud')) return 'Sustantivo femenino · Español';
    if (lower.endsWith('mente')) return 'Adverbio de modo · Español';
    if (lower.endsWith('ar') || lower.endsWith('er') || lower.endsWith('ir')) return 'Verbo en infinitivo · Español';
    return 'Término léxico · Español';
  }

  if (language === 'ru') {
    if (lower.endsWith('ть') || lower.endsWith('ти')) return 'Глагол (Инфинитив) · Русский';
    if (lower.endsWith('ый') || lower.endsWith('ий') || lower.endsWith('ая') || lower.endsWith('ое')) return 'Прилагательное · Русский';
    return 'Лексическая единица · Русский';
  }

  // Français
  const isProperInitial =
    clean.length > 1 &&
    clean[0] === clean[0].toUpperCase() &&
    clean[0] !== clean[0].toLowerCase() &&
    clean.slice(1) === clean.slice(1).toLowerCase();

  if (lower.endsWith('tion') || lower.endsWith('sion') || lower.endsWith('ence') || lower.endsWith('ance') || lower.endsWith('té') || lower.endsWith('tude')) {
    return 'Nom féminin · Français littéraire';
  }
  if (lower.endsWith('ment') && lower.length > 5) {
    return 'Adverbe de manière / Nom masculin';
  }
  if (lower.endsWith('isme') || lower.endsWith('age') || lower.endsWith('eur')) {
    return 'Nom masculin · Français littéraire';
  }
  if (isProperInitial && !lower.endsWith('er') && !lower.endsWith('ir')) {
    return 'Nom propre / Terme initial';
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

const WIKTIONARY_USER_AGENT =
  'WonderWord-UNI/1.0 (https://wonderword.luisbetancourt.fr; luis@luisbetancourt.fr)';

const POS_LABELS_FR: Record<string, string> = {
  nom: 'Nom',
  'nom propre': 'Nom propre',
  verbe: 'Verbe',
  adjectif: 'Adjectif',
  adverbe: 'Adverbe',
  pronom: 'Pronom',
  préposition: 'Préposition',
  conjonction: 'Conjonction',
  interjection: 'Interjection',
};

function cleanWikitext(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{(?:source|réf|refnec|exemple|citation)[^}]*\}\}/gi, '')
    .replace(/\{\{(?:lexique|figuré|en particulier|par extension|familier|littéraire|vieilli)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '($1)')
    .replace(/\{\{(?:lien|l)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '$1')
    .replace(/\{\{w\|([^|}]+)\|([^}]+)\}\}/gi, '$2')
    .replace(/\{\{w\|([^}]+)\}\}/gi, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*[,;:.()–—-]+\s*/, '')
    .trim();
}

function rankSimplerSynonyms(candidates: string[], excludedWord: string, maxCount = 4): string[] {
  const excludedLower = excludedWord.toLowerCase().trim();
  const seen = new Set<string>();
  const valid: string[] = [];

  for (const item of candidates) {
    const cleaned = item
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[«»"'’*]/g, '')
      .trim();
    const low = cleaned.toLowerCase();
    if (
      !cleaned ||
      cleaned.length < 2 ||
      cleaned.length > 26 ||
      low === excludedLower ||
      seen.has(low) ||
      /[:\/=]/.test(cleaned)
    ) {
      continue;
    }
    seen.add(low);
    valid.push(cleaned);
  }

  // Privilégier les synonymes courts et directs (plus accessibles en lecture B1–C1)
  valid.sort((a, b) => a.length - b.length);
  return valid.slice(0, maxCount);
}

async function fetchWiktionaryWikitext(host: string, title: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2400);
  try {
    const resp = await fetch(
      `https://${host}/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles=${encodeURIComponent(title)}`,
      {
        signal: controller.signal,
        headers: { 'User-Agent': WIKTIONARY_USER_AGENT },
      }
    );
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const json = (await resp.json()) as any;
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const first = pages[0] as any;
    return first?.revisions?.[0]?.slots?.main?.['*'] || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function extractFrenchSection(wikitext: string): string {
  const startMatch = wikitext.match(/==\s*\{\{langue\|fr\}\}\s*==/i);
  if (!startMatch || startMatch.index === undefined) return '';
  const tail = wikitext.slice(startMatch.index + startMatch[0].length);
  const nextLang = tail.search(/\n==\s*\{\{langue\|/i);
  return nextLang >= 0 ? tail.slice(0, nextLang) : tail;
}

function extractGermanSection(wikitext: string): string {
  const startMatch = wikitext.match(/==\s*[^=\n]*\(\{\{Sprache\|Deutsch\}\}\)\s*==/i);
  if (!startMatch || startMatch.index === undefined) return '';
  const tail = wikitext.slice(startMatch.index + startMatch[0].length);
  const nextLang = tail.search(/\n==\s*[^=\n]*\(\{\{Sprache\|/i);
  return nextLang >= 0 ? tail.slice(0, nextLang) : tail;
}

interface MonolingualWikiParsed {
  lemma?: string;
  ipa?: string;
  grammatical?: string;
  definition?: string;
  synonyms: string[];
  redirectLemma?: string;
}

function parseFrenchWiktionary(wikitext: string, originalLower: string): MonolingualWikiParsed {
  const sec = extractFrenchSection(wikitext);
  if (!sec) return { synonyms: [] };

  const pronMatch = sec.match(/\{\{pron\|([^|}]+)\|fr/i);
  const ipa = pronMatch?.[1] ? `/${pronMatch[1].trim()}/` : undefined;

  const posMatch = sec.match(/===\s*\{\{S\|(nom propre|nom|verbe|adjectif|adverbe|pronom|préposition|conjonction|interjection)\|fr([^}]*)\}\}\s*===/i);
  const posKey = posMatch?.[1]?.toLowerCase() || '';
  const isFlexion = Boolean(posMatch?.[2] && /flexion/i.test(posMatch[2]));
  const grammatical = posKey ? `${POS_LABELS_FR[posKey] || posKey} · FR` : undefined;

  // Vérifier s'il s'agit d'une forme fléchie (pluriel, féminin, conjugaison)
  const formLinkMatch = sec.match(
    /^#\s*''(?:Pluriel|Féminin|Masculin|Forme|Participe)[^'\n]*''\s*(?:de\s*)?\[\[([^\]|#]+)/im
  );
  if ((isFlexion || formLinkMatch) && formLinkMatch?.[1]) {
    const baseLemma = formLinkMatch[1].trim();
    if (baseLemma.toLowerCase() !== originalLower) {
      return {
        lemma: baseLemma,
        ipa,
        grammatical: grammatical ? `${grammatical} (flexion)` : undefined,
        synonyms: [],
        redirectLemma: baseLemma,
      };
    }
  }

  // Extraire la première définition nette (lignes commençant par "# ", hors "#*")
  const defLine = sec
    .split(/\r?\n/)
    .find((line) => /^#\s+[^*#:]/.test(line) && !/''(?:Pluriel|Féminin|Variante)/i.test(line));
  let definition = defLine ? cleanWikitext(defLine.slice(1)) : undefined;
  if (definition && definition.length > 185) {
    definition = definition.slice(0, 182) + '…';
  }

  // Extraire synonymes & quasi-synonymes
  const rawSynonyms: string[] = [];
  const synBlockRegex = /\{\{S\|(?:synonymes|quasi-synonymes)\}\}\s*===+\s*([\s\S]*?)(?:\n===|\n==|$)/gi;
  let synMatch: RegExpExecArray | null;
  while ((synMatch = synBlockRegex.exec(sec)) !== null) {
    const block = synMatch[1];
    // Exclure les lignes marquées argot/familier/vieilli si des termes neutres existent
    const lines = block.split(/\r?\n/);
    for (const line of lines) {
      if (/\{\{(?:argot|vulgaire|vieilli|désuet|régional)/i.test(line)) continue;
      const linkRegex = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;
      let lm: RegExpExecArray | null;
      while ((lm = linkRegex.exec(line)) !== null) {
        rawSynonyms.push((lm[2] || lm[1]).trim());
      }
    }
  }

  // Fallback supplémentaire : si aucun bloc synonyme explicite, extraire un terme lié court dans {{syn|fr|...}}
  const inlineSynMatch = sec.match(/\{\{syn\|fr\|([^}]+)\}\}/i);
  if (inlineSynMatch?.[1]) {
    rawSynonyms.push(...inlineSynMatch[1].split('|').map((s) => s.trim()));
  }

  return {
    ipa,
    grammatical,
    definition: definition && definition.length > 8 ? definition : undefined,
    synonyms: rankSimplerSynonyms(rawSynonyms, originalLower),
  };
}

function parseGermanWiktionary(wikitext: string, originalLower: string): MonolingualWikiParsed {
  const sec = extractGermanSection(wikitext);
  if (!sec) return { synonyms: [] };

  const ipaMatch = sec.match(/\{\{Lautschrift\|([^|}]+)/i);
  const ipa = ipaMatch?.[1] ? `/${ipaMatch[1].trim()}/` : undefined;

  const posMatch = sec.match(/\{\{Wortart\|([^|}]+)\|Deutsch\}\}/i);
  const grammatical = posMatch?.[1] ? `${posMatch[1].trim()} · DE` : undefined;

  const redirectMatch =
    sec.match(/\{\{Grundformverweis[^|}]*\|([^|}]+)/i) ||
    sec.match(/des (?:Verbs|Substantivs|Adjektivs)\s+'''\[\[([^\]|#]+)/i);
  if (redirectMatch?.[1] && redirectMatch[1].toLowerCase() !== originalLower) {
    return {
      lemma: redirectMatch[1].trim(),
      ipa,
      grammatical,
      synonyms: [],
      redirectLemma: redirectMatch[1].trim(),
    };
  }

  let definition: string | undefined;
  const bedMatch = sec.match(/\{\{Bedeutungen\}\}\s*([\s\S]*?)(?:\n\{\{|\n==|$)/i);
  if (bedMatch?.[1]) {
    const firstLine = bedMatch[1]
      .split(/\r?\n/)
      .find((l) => /^:\[\d+\]/.test(l.trim()));
    if (firstLine) {
      const cleaned = cleanWikitext(firstLine.replace(/^:\[\d+\]\s*/, ''));
      if (cleaned.length > 8) {
        definition = cleaned.length > 185 ? cleaned.slice(0, 182) + '…' : cleaned;
      }
    }
  }

  const rawSynonyms: string[] = [];
  const synMatch = sec.match(/\{\{Synonyme\}\}\s*([\s\S]*?)(?:\n\{\{|\n==|$)/i);
  if (synMatch?.[1]) {
    const linkRegex = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;
    let lm: RegExpExecArray | null;
    while ((lm = linkRegex.exec(synMatch[1])) !== null) {
      rawSynonyms.push((lm[2] || lm[1]).trim());
    }
  }

  return {
    ipa,
    grammatical,
    definition,
    synonyms: rankSimplerSynonyms(rawSynonyms, originalLower),
  };
}

async function fetchOpenThesaurusDe(word: string): Promise<{ synonyms: string[]; lemma?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const resp = await fetch(
      `https://www.openthesaurus.de/synonyme/search?q=${encodeURIComponent(word)}&format=application/json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) return { synonyms: [] };
    const data = (await resp.json()) as any;
    const rawTerms: string[] = [];
    for (const synset of (data?.synsets || []).slice(0, 3)) {
      for (const t of synset?.terms || []) {
        if (t?.term) rawTerms.push(String(t.term));
      }
    }
    const baseform = Array.isArray(data?.baseforms) && data.baseforms[0] ? String(data.baseforms[0]) : undefined;
    return {
      synonyms: rankSimplerSynonyms(rawTerms, word),
      lemma: baseform,
    };
  } catch {
    clearTimeout(timeout);
    return { synonyms: [] };
  }
}

async function fetchEnglishDictionary(word: string): Promise<Partial<MonolingualWikiParsed>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return {};
    const arr = (await resp.json()) as any[];
    const first = arr?.[0];
    const meaning = first?.meanings?.[0];
    const def = meaning?.definitions?.[0]?.definition;
    const syns: string[] = [
      ...(meaning?.synonyms || []),
      ...(meaning?.definitions?.[0]?.synonyms || []),
    ];
    return {
      ipa: first?.phonetics?.find((ph: any) => ph?.text)?.text,
      grammatical: meaning?.partOfSpeech ? `${meaning.partOfSpeech} · EN` : undefined,
      definition: def ? (def.length > 185 ? def.slice(0, 182) + '…' : def) : undefined,
      synonyms: rankSimplerSynonyms(syns, word),
    };
  } catch {
    clearTimeout(timeout);
    return {};
  }
}

async function fetchRescueTranslation(
  cleaned: string,
  language: SupportedLanguage,
  isProperNoun: boolean
): Promise<string> {
  if (isProperNoun) return '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);
  try {
    const targetLang = language === 'es' ? 'fr' : 'es';
    const resp = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleaned.toLowerCase())}&langpair=${language}|${targetLang}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) return '';
    const json = (await resp.json()) as any;
    const translatedText = json?.responseData?.translatedText;
    const matchScore = Number(json?.responseData?.match ?? 1);
    if (translatedText && translatedText.toLowerCase() !== cleaned.toLowerCase() && matchScore >= 0.45) {
      return translatedText;
    }
    return '';
  } catch {
    clearTimeout(timeout);
    return '';
  }
}

/**
 * Analyse lexicale monolingue orientée immersion (synonymes simples + définition en langue cible + IPA + secours optionnel)
 */
export async function analyzeLiteraryWord(
  rawWord: string,
  language: SupportedLanguage = 'fr',
  contextSentence?: string
): Promise<WordAnalysisResult> {
  const cleaned = cleanWordToken(rawWord);
  const lower = cleaned.toLowerCase();
  const cacheKey = `${language}:${lower}`;

  if (wordCache.has(cacheKey)) {
    return wordCache.get(cacheKey)!;
  }

  // 1. Lexique critique de référence (avec synonymes simples en langue cible)
  const lexicon = language === 'de' ? CURATED_LEXICON_DE : language === 'fr' ? CURATED_LEXICON_FR : null;
  if (lexicon && lexicon[lower]) {
    const entry = lexicon[lower];
    const result: WordAnalysisResult = {
      word: cleaned,
      lemma: entry.lemma || cleaned,
      ipa: entry.ipa,
      synonyms: entry.synonyms,
      translation: entry.translation,
      definition: entry.definition,
      grammatical: entry.grammatical,
      language,
    };
    wordCache.set(cacheKey, result);
    return result;
  }

  // 2. Fallback G2P et catégorie grammaticale
  let ipa =
    language === 'de'
      ? generateGermanIpa(cleaned)
      : language === 'fr'
      ? generateFrenchIpa(cleaned)
      : generateOtherLangIpa(cleaned, language);
  let grammatical = inferGrammaticalCategory(cleaned, language);
  let lemma = cleaned;
  let definition = '';
  let synonyms: string[] = [];
  let translation = '';

  const isProperInitial = grammatical.startsWith('Nom propre');

  // 3. Requêtes parallèles monolingues selon la langue + traduction de secours discrète
  if (language === 'fr') {
    const [wikitextRaw, rescueTrans] = await Promise.all([
      fetchWiktionaryWikitext('fr.wiktionary.org', lower).then(
        (txt) => txt || (cleaned !== lower ? fetchWiktionaryWikitext('fr.wiktionary.org', cleaned) : null)
      ),
      fetchRescueTranslation(cleaned, language, isProperInitial),
    ]);

    if (wikitextRaw) {
      let parsed = parseFrenchWiktionary(wikitextRaw, lower);
      if (parsed.redirectLemma) {
        lemma = parsed.redirectLemma;
        const baseRaw = await fetchWiktionaryWikitext('fr.wiktionary.org', parsed.redirectLemma);
        if (baseRaw) {
          const baseParsed = parseFrenchWiktionary(baseRaw, parsed.redirectLemma.toLowerCase());
          parsed = {
            ...baseParsed,
            lemma: parsed.redirectLemma,
            ipa: parsed.ipa || baseParsed.ipa,
          };
        }
      }
      if (parsed.ipa) ipa = parsed.ipa;
      if (parsed.grammatical) grammatical = parsed.grammatical;
      if (parsed.definition) definition = parsed.definition;
      synonyms = parsed.synonyms;
    }

    translation = rescueTrans;
  } else if (language === 'de') {
    const wikiTitle = cleaned;
    const [wikitextRaw, openThes, rescueTrans] = await Promise.all([
      fetchWiktionaryWikitext('de.wiktionary.org', wikiTitle).then(
        (txt) => txt || (wikiTitle !== lower ? fetchWiktionaryWikitext('de.wiktionary.org', lower) : null)
      ),
      fetchOpenThesaurusDe(cleaned),
      fetchRescueTranslation(cleaned, language, false),
    ]);

    if (openThes.lemma) lemma = openThes.lemma;
    const combinedSyns = [...openThes.synonyms];

    if (wikitextRaw) {
      let parsed = parseGermanWiktionary(wikitextRaw, lower);
      if (parsed.redirectLemma) {
        lemma = parsed.redirectLemma;
        const baseRaw = await fetchWiktionaryWikitext('de.wiktionary.org', parsed.redirectLemma);
        if (baseRaw) {
          const baseParsed = parseGermanWiktionary(baseRaw, parsed.redirectLemma.toLowerCase());
          parsed = {
            ...baseParsed,
            lemma: parsed.redirectLemma,
            ipa: parsed.ipa || baseParsed.ipa,
          };
        }
      }
      if (parsed.ipa) ipa = parsed.ipa;
      if (parsed.grammatical) grammatical = parsed.grammatical;
      if (parsed.definition) definition = parsed.definition;
      combinedSyns.push(...parsed.synonyms);
    }

    synonyms = rankSimplerSynonyms(combinedSyns, cleaned);
    translation = rescueTrans;
  } else if (language === 'en') {
    const [dictEn, rescueTrans] = await Promise.all([
      fetchEnglishDictionary(cleaned),
      fetchRescueTranslation(cleaned, language, false),
    ]);
    if (dictEn.ipa) ipa = dictEn.ipa;
    if (dictEn.grammatical) grammatical = dictEn.grammatical;
    if (dictEn.definition) definition = dictEn.definition;
    synonyms = dictEn.synonyms || [];
    translation = rescueTrans;
  } else {
    translation = await fetchRescueTranslation(cleaned, language, false);
  }

  if (!definition) {
    if (language === 'de') {
      definition = contextSentence
        ? `Begriff aus diesem Textausschnitt: „${contextSentence.slice(0, 140)}${contextSentence.length > 140 ? '…' : ''}“`
        : `Literarischer Ausdruck (${grammatical}) in der Originalsprache.`;
    } else if (language === 'en') {
      definition = contextSentence
        ? `Term used in this passage: “${contextSentence.slice(0, 140)}${contextSentence.length > 140 ? '…' : ''}”`
        : `Literary term (${grammatical}) in target language.`;
    } else {
      definition = contextSentence
        ? `Terme employé dans ce passage : « ${contextSentence.slice(0, 140)}${contextSentence.length > 140 ? '…' : ''} »`
        : `Terme littéraire (${grammatical}) en langue originale.`;
    }
  }

  const finalResult: WordAnalysisResult = {
    word: cleaned,
    lemma,
    ipa,
    synonyms,
    translation: translation || '',
    definition,
    grammatical,
    language,
  };

  wordCache.set(cacheKey, finalResult);
  return finalResult;
}
