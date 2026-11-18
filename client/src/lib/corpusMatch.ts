export type CorpusCefrLevel = 'B1' | 'B2' | 'C1' | 'C2';

export interface CorpusEntryItem {
  lemma: string;
  cefrLevel: CorpusCefrLevel;
  partOfSpeech?: string | null;
}

const FR_IRREGULARS: Record<string, string> = {
  aperçut: 'apercevoir',
  aperçurent: 'apercevoir',
  aperçu: 'apercevoir',
  connut: 'connaître',
  connurent: 'connaître',
  connu: 'connaître',
  crut: 'croire',
  crurent: 'croire',
  cru: 'croire',
  dut: 'devoir',
  durent: 'devoir',
  dû: 'devoir',
  disparut: 'disparaître',
  disparurent: 'disparaître',
  écrivit: 'écrire',
  écrivirent: 'écrire',
  écrit: 'écrire',
  fit: 'faire',
  firent: 'faire',
  fait: 'faire',
  fut: 'être',
  furent: 'être',
  put: 'pouvoir',
  purent: 'pouvoir',
  sut: 'savoir',
  surent: 'savoir',
  prit: 'prendre',
  prirent: 'prendre',
  comprit: 'comprendre',
  apprit: 'apprendre',
  souffrit: 'souffrir',
  offrit: 'offrir',
  ouvrit: 'ouvrir',
  découvrit: 'découvrir',
  parut: 'paraître',
  parurent: 'paraître',
  revint: 'revenir',
  devint: 'devenir',
  tint: 'tenir',
  maintint: 'maintenir',
  vint: 'venir',
  vinrent: 'venir',
  vit: 'voir',
  virent: 'voir',
  vécut: 'vivre',
  vécurent: 'vivre',
  mourut: 'mourir',
  naquit: 'naître',
  fallut: 'falloir',
  valut: 'valoir',
  voulut: 'vouloir',
  mieux: 'bon',
  oeil: 'œil',
  yeux: 'œil',
  cieux: 'ciel',
  heureuse: 'heureux',
  douce: 'doux',
  fausse: 'faux',
  folle: 'fou',
  nouvelle: 'nouveau',
  vieille: 'vieux',
};

const DE_IRREGULARS: Record<string, string> = {
  fand: 'finden',
  fanden: 'finden',
  gefunden: 'finden',
  schlief: 'schlafen',
  geschlafen: 'schlafen',
  ging: 'gehen',
  gegangen: 'gehen',
  stand: 'stehen',
  gestanden: 'stehen',
  lag: 'liegen',
  gelegen: 'liegen',
  sah: 'sehen',
  sahen: 'sehen',
  gesehen: 'sehen',
  sprach: 'sprechen',
  sprachen: 'sprechen',
  gesprochen: 'sprechen',
  schwieg: 'schweigen',
  geschwiegen: 'schweigen',
  trug: 'tragen',
  getragen: 'tragen',
  litt: 'leiden',
  gelitten: 'leiden',
  floh: 'fliehen',
  geflohen: 'fliehen',
  verlor: 'verlieren',
  verloren: 'verlieren',
  verschwand: 'verschwinden',
  verschwunden: 'verschwinden',
  verstand: 'verstehen',
  verstanden: 'verstehen',
  beschloss: 'beschließen',
  beschlossen: 'beschließen',
  gewann: 'gewinnen',
  gewonnen: 'gewinnen',
  erkannte: 'erkennen',
  erkannt: 'erkennen',
  nannte: 'nennen',
  genannt: 'nennen',
  wusste: 'wissen',
  gewusst: 'wissen',
  dachte: 'denken',
  gedacht: 'denken',
  brachte: 'bringen',
  gebracht: 'bringen',
  träume: 'traum',
  träumen: 'träumen',
  worte: 'wort',
  wälder: 'wald',
  mütter: 'mutter',
  wölfe: 'wolf',
  kräfte: 'kraft',
  ängste: 'angst',
  ängsten: 'angst',
};

/**
 * Normalise un lemme provenant d'une fiche FSRS (ex: "le désert", "die Verwandlung, -en")
 */
export function normalizeVocabularyLemma(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .split(',')[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/^(?:le|la|les|un|une|des|der|die|das|ein|eine)\s+/i, '')
    .replace(/^(?:l'|l’|d'|d’)/i, '')
    .trim();
}

/**
 * Génère les formes candidates (mot exact + désinences probables + irréguliers) pour croiser un mot du livre
 */
export function buildLemmaCandidates(rawToken: string, lang: string): string[] {
  const low = rawToken
    .toLowerCase()
    .trim()
    .replace(/^(?:l'|l’|d'|d’|s'|s’|n'|n’|j'|j’|m'|m’|t'|t’|c'|c’|qu'|qu’)/, '');
  if (!low || low.length < 3) return [];

  const set = new Set<string>([low]);

  if (lang === 'fr') {
    if (FR_IRREGULARS[low]) set.add(FR_IRREGULARS[low]);
    if (low.endsWith('s') && low.length > 4) set.add(low.slice(0, -1));
    if (low.endsWith('es') && low.length > 5) set.add(low.slice(0, -2));
    if (low.endsWith('x') && low.length > 4) set.add(low.slice(0, -1));
    if (low.endsWith('aux') && low.length > 5) set.add(low.slice(0, -3) + 'al');
    if (low.endsWith('euse') && low.length > 5) set.add(low.slice(0, -4) + 'eux');
    if (low.endsWith('euses') && low.length > 6) set.add(low.slice(0, -5) + 'eux');
    if (low.endsWith('e') && low.length > 4) set.add(low.slice(0, -1));

    // Formes verbales fréquentes -> infinitifs -er / -ir / -re
    for (const end of ['aient', 'ions', 'iez', 'èrent', 'erai', 'eras', 'era', 'ais', 'ait', 'ant', 'ons', 'ez', 'ent', 'és', 'ées', 'ée', 'é']) {
      if (low.endsWith(end) && low.length > end.length + 2) {
        const stem = low.slice(0, -end.length);
        set.add(stem + 'er');
        if (end !== 'é' && end !== 'ée' && end !== 'és' && end !== 'ées' && end !== 'èrent') {
          set.add(stem + 'ir');
          set.add(stem + 're');
        }
      }
    }
    if (low.endsWith('issait') || low.endsWith('issaient') || low.endsWith('issant')) {
      const stem = low.replace(/iss(?:aient|ait|ant)$/, '');
      if (stem.length >= 2) set.add(stem + 'ir');
    }
  } else if (lang === 'de') {
    if (DE_IRREGULARS[low]) set.add(DE_IRREGULARS[low]);
    for (const end of ['ungen', 'heit', 'keit']) {
      if (low.endsWith(end)) break;
    }
    for (const suf of ['sten', 'ten', 'tet', 'en', 'er', 'es', 'em', 'te', 'st', 'e', 'n', 's', 't']) {
      if (low.endsWith(suf) && low.length > suf.length + 2) {
        const stem = low.slice(0, -suf.length);
        set.add(stem);
        set.add(stem + 'en');
        set.add(stem + 'n');
      }
    }
    // Participe passé ge-...-t / ge-...-en
    if (low.startsWith('ge') && low.length > 6) {
      const stripped = low.slice(2);
      if (stripped.endsWith('t')) set.add(stripped.slice(0, -1) + 'en');
      if (stripped.endsWith('en')) set.add(stripped);
    }
    // Réversion d'Umlaut pluriel
    if (/[äöü]/.test(low)) {
      const noUmlaut = low.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
      set.add(noUmlaut);
      for (const suf of ['er', 'en', 'e']) {
        if (noUmlaut.endsWith(suf) && noUmlaut.length > suf.length + 2) {
          set.add(noUmlaut.slice(0, -suf.length));
        }
      }
    }
  }

  return Array.from(set);
}

export interface CorpusResolution {
  inCorpus: boolean;
  cefrLevel?: CorpusCefrLevel;
  lemma?: string;
  isMastered: boolean;
}

export function resolveCorpusWordState(
  token: string,
  lang: string,
  corpusMap: Map<string, CorpusEntryItem>,
  masteredSet: Set<string>
): CorpusResolution {
  const candidates = buildLemmaCandidates(token, lang);
  let matched: CorpusEntryItem | undefined;

  for (const c of candidates) {
    const hit = corpusMap.get(c);
    if (hit) {
      matched = hit;
      break;
    }
  }

  const isMastered =
    candidates.some((c) => masteredSet.has(c)) ||
    (matched ? masteredSet.has(matched.lemma.toLowerCase()) : false);

  return {
    inCorpus: Boolean(matched),
    cefrLevel: matched?.cefrLevel,
    lemma: matched?.lemma,
    isMastered,
  };
}
