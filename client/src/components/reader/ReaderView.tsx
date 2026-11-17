import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Bookmark,
  BookmarkPlus,
  Highlighter,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Headphones,
  Play,
  Pause,
  Square,
  SlidersHorizontal,
  Trash2,
  Plus,
  Check,
  Edit3,
  BookOpen,
  Globe,
  Upload,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { ViewType, BookSummary } from '../../types';

export type SupportedLang = 'fr' | 'de' | 'en' | 'es' | 'ru';

export interface ShadowingPracticePayload {
  word: string;
  ipa: string;
  sentence: string;
  translation?: string;
  language: SupportedLang;
  bookTitle?: string;
}

interface SelectedWord {
  word: string;
  lemma?: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
  sentence?: string;
}

interface ChapterSummaryItem {
  id: string;
  number: number;
  title: string;
  wordCount: number;
}

interface ChapterData {
  book: {
    id: string;
    slug?: string;
    title: string;
    author: string;
    language?: string;
    cefrLevel: string;
    totalChapters: number;
    chapters?: ChapterSummaryItem[];
  };
  chapter: {
    id: string;
    number: number;
    title: string;
    contentHtml: string;
    wordCount: number;
    audioUrl?: string;
  };
}

interface ReaderAnnotationItem {
  id: string;
  bookId: string;
  chapterNumber: number;
  type: 'bookmark' | 'highlight';
  selectedText: string;
  note?: string | null;
  color: string;
  createdAt: string;
}

interface VocabularyCardItem {
  id: string;
  word: string;
  ipa: string;
  language: string;
  status: string;
}

interface ReaderViewProps {
  bookId?: string;
  chapterNumber?: number;
  initialMode?: 'study' | 'book';
  onNavigate?: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
  onPracticeShadowing?: (payload: ShadowingPracticePayload) => void;
}

// Dictionnaire rapide côté client pour les gloses <ruby><rt> instantanées
const QUICK_IPA_FR: Record<string, string> = {
  sahara: '/sa.a.ʁa/',
  réparation: '/ʁe.pa.ʁa.sjɔ̃/',
  mille: '/mil/',
  'dessine-moi': '/de.sin.mwa/',
  mouton: '/mu.tɔ̃/',
  désert: '/de.zɛʁ/',
  moteur: '/mɔ.tœʁ/',
  mécanicien: '/me.ka.ni.sjɛ̃/',
  passagers: '/pa.sa.ʒe/',
  difficile: '/di.fi.sil/',
  question: '/kɛs.tjɔ̃/',
  naufragé: '/no.fʁa.ʒe/',
  radeau: '/ʁa.do/',
  surprise: '/syʁ.pʁiz/',
  foudre: '/fudʁ/',
  bonhomme: '/bɔ.nɔm/',
  extraordinaire: '/ɛk.stʁa.ɔʁ.di.nɛʁ/',
  gravement: '/ɡʁav.mɑ̃/',
  véritablement: '/ve.ʁi.ta.blə.mɑ̃/',
  planète: '/pla.nɛt/',
  astéroïde: '/as.te.ʁɔ.id/',
  château: '/ʃɑ.to/',
  métaphysique: '/me.ta.fi.zik/',
  optimisme: '/ɔp.ti.mism/',
  albatros: '/al.ba.tʁos/',
  équipage: '/e.ki.paʒ/',
  compagnons: '/kɔ̃.pa.ɲɔ̃/',
  gouffres: '/ɡufʁ/',
};

const QUICK_IPA_DE: Record<string, string> = {
  verwandlung: '/fɛɐ̯ˈvandlʊŋ/',
  ungeziefer: '/ˈʊnɡəˌt͡siːfɐ/',
  träumen: '/ˈtʁɔʏ̯mən/',
  unruhigen: '/ˈʊnˌʁuːɪɡn̩/',
  erwachte: '/ɛɐ̯ˈvaxtə/',
  ungeheuren: '/ˈʊnɡəˌhɔʏ̯ʁən/',
  verwandelt: '/fɛɐ̯ˈvandl̩t/',
  panzerartig: '/ˈpant͡sɐˌʔaːɐ̯tɪç/',
  rücken: '/ˈʁʏkn̩/',
  rotkäppchen: '/ˈʁoːtˌkɛpçən/',
  großmutter: '/ˈɡʁoːsˌmʊtɐ/',
  philosophie: '/filozoˈfiː/',
};

const STUDY_PRESETS: {
  label: string;
  title: string;
  author: string;
  lang: SupportedLang;
  text: string;
}[] = [
  {
    label: '🇫🇷 Saint-Exupéry',
    title: 'Le Petit Prince (Extrait)',
    author: 'Antoine de Saint-Exupéry',
    lang: 'fr',
    text: "J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert de Sahara, il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je me préparais à essayer de réussir, tout seul, une réparation difficile.\n\nLe premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait :\n\n— S'il vous plaît... dessine-moi un mouton !",
  },
  {
    label: '🇫🇷 Baudelaire (Poésie)',
    title: "L'Albatros — Les Fleurs du Mal",
    author: 'Charles Baudelaire',
    lang: 'fr',
    text: "Souvent, pour s'amuser, les hommes d'équipage prennent des albatros, vastes oiseaux des mers, qui suivent, indolents compagnons de voyage, le navire glissant sur les gouffres amers.\n\nLe Poète est semblable au prince des nuées qui hante la tempête et se rit de l'archer ; exilé sur le sol au milieu des huées, ses ailes de géant l'empêchent de marcher.",
  },
  {
    label: '🇩🇪 Franz Kafka',
    title: 'Die Verwandlung (Incipit)',
    author: 'Franz Kafka',
    lang: 'de',
    text: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch.',
  },
  {
    label: '🇩🇪 Goethe (Faust)',
    title: 'Faust — Nacht (Monolog)',
    author: 'Johann Wolfgang von Goethe',
    lang: 'de',
    text: 'Habe nun, ach! Philosophie, Juristerei und Medizin, und leider auch Theologie durchaus studiert, mit heißem Bemühn. Da steh ich nun, ich armer Tor! Und bin so klug als wie zuvor.',
  },
];

// Mots déclencheurs de liaison obligatoire en français devant voyelle ou h muet
const FRENCH_LIAISON_TRIGGERS = new Set([
  'les',
  'des',
  'ces',
  'mes',
  'tes',
  'ses',
  'nos',
  'vos',
  'leurs',
  'aux',
  'un',
  'en',
  'on',
  'mon',
  'ton',
  'son',
  'bon',
  'bien',
  'rien',
  'tout',
  'très',
  'plus',
  'moins',
  'dans',
  'sans',
  'sous',
  'chez',
  'est',
  'sont',
  'ont',
  'petit',
  'grand',
  'petits',
  'grands',
  'autres',
  'quels',
  'quelles',
  'deux',
  'trois',
  'six',
  'huit',
  'dix',
]);

function isFrenchVowelStart(word: string): boolean {
  const cleaned = cleanToken(word).toLowerCase();
  if (!cleaned) return false;
  return /^[aeiouyéèêëàâîïôùûüœæ]/.test(cleaned);
}

function shouldShowLiaison(currentToken: string, nextToken?: string): boolean {
  if (!nextToken) return false;
  // Pas de liaison à travers une ponctuation forte
  if (/[,.;:!?»"—–\-()]/.test(currentToken)) return false;
  const cleanCurr = cleanToken(currentToken).toLowerCase();
  if (!FRENCH_LIAISON_TRIGGERS.has(cleanCurr)) return false;
  return isFrenchVowelStart(nextToken);
}

function cleanToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[«»"“”„'’‘()[\]{},.;:!?—–\-…]+/, '')
    .replace(/[«»"“”„'’‘()[\]{},.;:!?—–\-…]+$/, '')
    .replace(
      /^(l'|d'|qu'|n'|s'|j'|m'|t'|c'|L'|D'|Qu'|N'|S'|J'|M'|T'|C'|l’|d’|qu’|n’|s’|j’|m’|t’|c’|L’|D’|Qu’|N’|S’|J’|M’|T’|C’)/,
      ''
    )
    .trim();
}

function detectLanguageFromText(text: string): SupportedLang {
  const sample = text.slice(0, 800);
  if (/[а-яА-ЯёЁ]/.test(sample)) return 'ru';
  if (/[äöüßÄÖÜ]|\b(und|der|die|das|nicht|sich|einem|einer)\b/i.test(sample)) return 'de';
  if (/[ñ¿¡]|\b(el|la|los|las|una|para|como|pero)\b/i.test(sample)) return 'es';
  if (/\b(the|and|with|that|from|this|have|which)\b/i.test(sample)) return 'en';
  return 'fr';
}

export function quickClientIpa(
  rawWord: string,
  lang: SupportedLang,
  customMap?: Record<string, string>
): string {
  const clean = cleanToken(rawWord).toLowerCase();
  if (!clean) return '';
  if (customMap && customMap[clean]) return customMap[clean];
  if (lang === 'de' && QUICK_IPA_DE[clean]) return QUICK_IPA_DE[clean];
  if (lang === 'fr' && QUICK_IPA_FR[clean]) return QUICK_IPA_FR[clean];

  let p = clean;
  if (lang === 'de') {
    p = p
      .replace(/sch/g, 'ʃ')
      .replace(/^sp/g, 'ʃp')
      .replace(/^st/g, 'ʃt')
      .replace(/ch/g, 'ç')
      .replace(/ei|ai/g, 'aɪ̯')
      .replace(/eu|äu/g, 'ɔʏ̯')
      .replace(/au/g, 'aʊ̯')
      .replace(/ie/g, 'iː')
      .replace(/ä/g, 'ɛ')
      .replace(/ö/g, 'œ')
      .replace(/ü/g, 'ʏ')
      .replace(/ß/g, 's')
      .replace(/ung$/g, 'ʊŋ')
      .replace(/er$/g, 'ɐ')
      .replace(/w/g, 'v')
      .replace(/z/g, 't͡s')
      .replace(/r/g, 'ʁ');
    return `/${p}/`;
  }

  if (lang === 'es') {
    p = p
      .replace(/ch/g, 't͡ʃ')
      .replace(/ll/g, 'ʎ')
      .replace(/ñ/g, 'ɲ')
      .replace(/rr/g, 'r')
      .replace(/qu(?=[eiéí])/g, 'k')
      .replace(/c(?=[eiéí])/g, 's')
      .replace(/c/g, 'k')
      .replace(/j/g, 'x')
      .replace(/z/g, 's')
      .replace(/h/g, '');
    return `/${p}/`;
  }

  if (lang === 'en') {
    p = p
      .replace(/tion$/g, 'ʃən')
      .replace(/sh/g, 'ʃ')
      .replace(/ch/g, 't͡ʃ')
      .replace(/th/g, 'θ')
      .replace(/ee|ea/g, 'iː')
      .replace(/oo/g, 'uː')
      .replace(/ou|ow/g, 'aʊ')
      .replace(/ing$/g, 'ɪŋ')
      .replace(/r/g, 'ɹ');
    return `/${p}/`;
  }

  if (lang === 'ru') {
    const ruMap: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'ɡ', д: 'd', е: 'je', ё: 'jo', ж: 'ʐ', з: 'z',
      и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
      с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 't͡s', ч: 't͡ɕ', ш: 'ʂ', щ: 'ɕː',
      ъ: '', ы: 'ɨ', ь: 'ʲ', э: 'ɛ', ю: 'ju', я: 'ja',
    };
    p = Array.from(p)
      .map((ch) => ruMap[ch] ?? ch)
      .join('');
    return `/${p}/`;
  }

  // Français par défaut
  p = p
    .replace(/tion(s?)$/, 'sjɔ̃')
    .replace(/ement$/, 'ə@M_AN@')
    .replace(/ment$/, '@M_AN@')
    .replace(/eill(e?s?)$/g, 'ɛ@YOD@$1')
    .replace(/aill(e?s?)$/g, 'a@YOD@$1')
    .replace(/(?:eu|œu)ill(e?s?)$/g, 'œ@YOD@$1')
    .replace(/ouill(e?s?)$/g, 'u@YOD@$1')
    .replace(/eau(x?)$/, 'o')
    .replace(/ou/g, 'u')
    .replace(/oi/g, 'wa')
    .replace(/au/g, 'o')
    .replace(/ai|ei/g, 'ɛ')
    .replace(/eu|œu/g, 'ø')
    .replace(/ch/g, 'ʃ')
    .replace(/gn/g, 'ɲ')
    .replace(/qu/g, 'k')
    .replace(/(?:an|am|en|em)(?![aeiouyéèêɑɔɛøœə@])/g, 'ɑ̃')
    .replace(/(?:on|om)(?![aeiouyéèêɑɔɛøœə@])/g, 'ɔ̃')
    .replace(/(?:in|im|ain|ein)(?![aeiouyéèêɑɔɛøœə@])/g, 'ɛ̃')
    .replace(/^ex(?=[aeiouyéèêh])/g, 'ɛɡz')
    .replace(/x(?!$)/g, 'ks')
    .replace(/r/g, 'ʁ')
    .replace(/@YOD@/g, 'j')
    .replace(/[é]/g, 'e')
    .replace(/[èêë]/g, 'ɛ')
    .replace(/u/g, 'y')
    .replace(/[dsxtzp]$/, '')
    .replace(/e$/, '')
    .replace(/@M_AN@/g, 'mɑ̃');
  return `/${p || clean}/`;
}

/**
 * Extraction légère du texte d'un fichier EPUB (archive ZIP contenant des fichiers XHTML/HTML)
 * ou d'un fichier texte/HTML dans le navigateur
 */
async function extractTextFromUploadedFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt' || ext === 'md') {
    return await file.text();
  }

  if (ext === 'html' || ext === 'htm' || ext === 'xhtml') {
    const rawHtml = await file.text();
    const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    return doc.body?.innerText?.trim() || rawHtml.replace(/<[^>]*>/g, ' ').trim();
  }

  if (ext === 'epub') {
    // Lecture binaire des entrées ZIP non-compressées ou décompressées via DecompressionStream
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const extractedParts: string[] = [];

    let offset = 0;
    while (offset + 30 < bytes.length) {
      // Signature Local File Header ZIP : 0x04034b50
      if (view.getUint32(offset, true) !== 0x04034b50) {
        offset++;
        continue;
      }
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const fileNameLength = view.getUint16(offset + 26, true);
      const extraFieldLength = view.getUint16(offset + 28, true);

      const nameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
      const entryName = new TextDecoder().decode(nameBytes);
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;
      const dataEnd = dataStart + compressedSize;

      if (
        /\.(xhtml|html|htm|xml)$/i.test(entryName) &&
        !entryName.includes('META-INF') &&
        !entryName.includes('toc') &&
        compressedSize > 0 &&
        dataEnd <= bytes.length
      ) {
        try {
          const compressedData = bytes.slice(dataStart, dataEnd);
          let htmlContent = '';
          if (compressionMethod === 0) {
            htmlContent = new TextDecoder('utf-8').decode(compressedData);
          } else if (compressionMethod === 8 && 'DecompressionStream' in window) {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(compressedData);
            writer.close();
            const decompressedBuf = await new Response(ds.readable).arrayBuffer();
            htmlContent = new TextDecoder('utf-8').decode(decompressedBuf);
          }
          if (htmlContent) {
            const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
            const paragraphs = Array.from(doc.querySelectorAll('p, h1, h2, h3, blockquote'))
              .map((el) => el.textContent?.trim() || '')
              .filter((t) => t.length > 15);
            if (paragraphs.length > 0) {
              extractedParts.push(paragraphs.join('\n\n'));
            }
          }
        } catch {
          // Ignorer les entrées non décodables
        }
      }

      offset = dataEnd > offset ? dataEnd : offset + 30;
    }

    if (extractedParts.length > 0) {
      return extractedParts.join('\n\n').slice(0, 60000);
    }
  }

  // Fallback générique (texte brut ou chaînes lisibles dans PDF)
  const raw = await file.text();
  const clean = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}\p{P}\s\n]/gu, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return clean.slice(0, 40000);
}

const FSRS_THRESHOLDS = [80, 90, 95, 98, 0] as const; // 0 = Masqué

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookId = 'le-petit-prince',
  chapterNumber = 1,
  initialMode = 'study',
  onNavigate,
  onSelectBook,
  onPracticeShadowing,
}) => {
  // ── Mode Principal : 'study' (1. Estudio & Taller /reader) vs 'book' (2. Visor de Libro /reader/1) ──
  const [readerMode, setReaderMode] = useState<'study' | 'book'>(initialMode);

  // Synchroniser si l'utilisateur ouvre un livre depuis la bibliothèque
  useEffect(() => {
    setReaderMode(initialMode);
  }, [initialMode, bookId, chapterNumber]);

  // ── ÉTATS DU MODE 1 : ESTUDIO & TALLER (/reader) ──
  const [studyText, setStudyText] = useState<string>(STUDY_PRESETS[0].text);
  const [studyTitle, setStudyTitle] = useState<string>(STUDY_PRESETS[0].title);
  const [studyAuthor, setStudyAuthor] = useState<string>(STUDY_PRESETS[0].author);
  const [studyLang, setStudyLang] = useState<SupportedLang>('fr');
  const [showStudyIpa, setShowStudyIpa] = useState<boolean>(true);
  const [showStudyLiaisons, setShowStudyLiaisons] = useState<boolean>(true);
  const [isSavingStudyBook, setIsSavingStudyBook] = useState<boolean>(false);
  const [isPrevisualizingIpa, setIsPrevisualizingIpa] = useState<boolean>(false);
  const [enrichedIpaMap, setEnrichedIpaMap] = useState<Record<string, string>>({});
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── ÉTATS DU MODE 2 : VISOR DE LIBRO COMPLETO (/reader/1) ──
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChapterNum, setCurrentChapterNum] = useState(chapterNumber);
  const [currentSubPage, setCurrentSubPage] = useState(1);

  // Inspection de mot (WordPanel Flotante partagé entre Mode 1 et Mode 2)
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [savedToFsrs, setSavedToFsrs] = useState(false);
  const [savingFsrs, setSavingFsrs] = useState(false);
  const [userVocabWords, setUserVocabWords] = useState<Set<string>>(new Set());

  // Contrôles de la barre d'outils du livre (Typographie, Seuil FSRS, Audio TTS, Tiroirs)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('wonderword_reader_fontsize');
    return saved ? Number(saved) : 21.5;
  });
  const [fsrsThreshold, setFsrsThreshold] = useState<(typeof FSRS_THRESHOLDS)[number]>(90);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'toc' | 'bookmarks'>('none');

  // Signets & Surlignages (Annotations)
  const [annotations, setAnnotations] = useState<ReaderAnnotationItem[]>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState<'soleil' | 'sauge' | 'prune' | 'terre'>('soleil');
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [selectedPassage, setSelectedPassage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lecteur Audio TTS V.O. (Web Speech API)
  const [showTtsBar, setShowTtsBar] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [ttsRate, setTtsRate] = useState<0.8 | 1.0 | 1.2>(1.0);
  const [ttsProgress, setTtsProgress] = useState(0);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bookLang: SupportedLang = useMemo(() => {
    const raw = (chapterData?.book.language || 'fr').toLowerCase();
    if (raw === 'de' || raw === 'en' || raw === 'es' || raw === 'ru') return raw;
    return 'fr';
  }, [chapterData?.book.language]);

  const activeLang: SupportedLang = readerMode === 'study' ? studyLang : bookLang;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  useEffect(() => {
    setCurrentChapterNum(chapterNumber);
    setCurrentSubPage(1);
  }, [chapterNumber, bookId]);

  // Charger les cartes de vocabulaire de l'utilisateur pour le filtre de rétention FSRS
  useEffect(() => {
    apiFetch<VocabularyCardItem[]>('/books/vocabulary')
      .then((cards) => {
        const wordSet = new Set(cards.map((c) => c.word.toLowerCase().trim()));
        setUserVocabWords(wordSet);
      })
      .catch(() => {});
  }, []);

  // Arrêter la synthèse vocale au changement de chapitre, mode ou démontage
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [bookId, currentChapterNum, readerMode]);

  // Charger le chapitre et les annotations du livre pour le Mode 2
  useEffect(() => {
    const fetchChapterAndAnnotations = async () => {
      try {
        setLoading(true);
        setCurrentSubPage(1);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          setIsTtsPlaying(false);
          setTtsProgress(0);
        }

        const data = await apiFetch<ChapterData>(`/books/${bookId}/chapters/${currentChapterNum}`);
        setChapterData(data);

        // Charger les signets et surlignages de l'utilisateur
        apiFetch<ReaderAnnotationItem[]>(`/books/${data.book.id}/annotations`)
          .then((list) => setAnnotations(list))
          .catch(() => {});

        // Mettre à jour la progression de lecture dans PostgreSQL
        const progress = Math.round((currentChapterNum / (data.book.totalChapters || 1)) * 100);
        apiFetch(`/books/${data.book.id}/progress`, {
          method: 'PUT',
          body: JSON.stringify({ currentChapter: currentChapterNum, progressPercent: progress }),
        }).catch(() => {});
      } catch (err) {
        console.error('Erreur chargement chapitre:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterAndAnnotations();
  }, [bookId, currentChapterNum]);

  // ── GESTION DU MODE 1 : ESTUDIO & TALLER (/reader) ──
  const studyWordCount = useMemo(() => {
    return studyText.trim() ? studyText.trim().split(/\s+/).length : 0;
  }, [studyText]);

  const studyParagraphs = useMemo(() => {
    return studyText
      .split(/\r?\n\r?\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [studyText]);

  // Enrichir la phonétique des mots clés du texte d'étude via le serveur ("Previsualizar")
  const handleDeepPhoneticPreview = async () => {
    if (!studyText.trim()) {
      showToast('Veuillez saisir ou coller un texte à analyser.');
      return;
    }
    setIsPrevisualizingIpa(true);
    setShowStudyIpa(true);

    try {
      // Extraire jusqu'à 12 mots littéraires longs du texte pour les enrichir via le backend
      const tokens = Array.from(
        new Set(
          studyText
            .split(/\s+/)
            .map((t) => cleanToken(t))
            .filter((w) => w.length >= 5)
        )
      ).slice(0, 12);

      const newEntries: Record<string, string> = {};
      await Promise.all(
        tokens.map(async (w) => {
          try {
            const res = await apiFetch<{ ipa: string }>('/books/analyze-word', {
              method: 'POST',
              body: JSON.stringify({ word: w, language: studyLang }),
            });
            if (res.ipa) {
              newEntries[w.toLowerCase()] = res.ipa;
            }
          } catch {
            // Ignorer
          }
        })
      );

      setEnrichedIpaMap((prev) => ({ ...prev, ...newEntries }));
      showToast(`Transcription phonétique IPA enrichie (${studyLang.toUpperCase()}) mise à jour !`);
    } finally {
      setIsPrevisualizingIpa(false);
    }
  };

  // Sauvegarder le texte du Studio dans "Mes Livres" (PostgreSQL) et optionnellement l'ouvrir dans le Visor Completo
  const handleSaveStudyToLibrary = async (openInBookViewer = false) => {
    if (!studyText.trim()) {
      showToast('Le texte est vide. Ajoutez du contenu avant de sauvegarder.');
      return;
    }

    try {
      setIsSavingStudyBook(true);
      const response = await apiFetch<{ success: boolean; message: string; book: BookSummary }>(
        '/books/custom',
        {
          method: 'POST',
          body: JSON.stringify({
            title: studyTitle.trim() || 'Texte d’étude sans titre',
            author: studyAuthor.trim() || 'Atelier WonderWord',
            language: studyLang,
            contentText: studyText,
            cefrLevel: 'B1',
          }),
        }
      );

      showToast(response.message || `« ${studyTitle} » enregistré dans votre Bibliothèque !`);

      if (openInBookViewer && response.book) {
        const targetSlug = response.book.slug || response.book.id;
        if (onSelectBook) {
          onSelectBook(targetSlug, 1);
        }
        setReaderMode('book');
      }
    } catch (err) {
      console.error('Erreur sauvegarde texte étude:', err);
      showToast('Erreur lors de la sauvegarde dans la bibliothèque.');
    } finally {
      setIsSavingStudyBook(false);
    }
  };

  // Importation de fichier (.TXT, .MD, .HTML, .EPUB, .PDF)
  const handleFileImport = async (file: File) => {
    try {
      showToast(`Analyse et extraction de « ${file.name} »…`);
      const extractedText = await extractTextFromUploadedFile(file);
      if (!extractedText || extractedText.length < 5) {
        showToast('Impossible d’extraire du texte lisible depuis ce fichier.');
        return;
      }

      const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      const detectedLang = detectLanguageFromText(extractedText);

      setStudyTitle(cleanFileName.charAt(0).toUpperCase() + cleanFileName.slice(1));
      setStudyAuthor('Document Importé');
      setStudyLang(detectedLang);
      setStudyText(extractedText);
      showToast(
        `Document « ${cleanFileName} » importé (${extractedText.split(/\s+/).length} mots · ${detectedLang.toUpperCase()}) !`
      );
    } catch (err) {
      console.error('Erreur import fichier:', err);
      showToast('Erreur lors de la lecture du fichier.');
    }
  };

  // Ajuster la taille de police
  const handleAdjustFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(16, Math.min(30, prev + delta));
      localStorage.setItem('wonderword_reader_fontsize', String(next));
      return next;
    });
  };

  // Alterner le seuil de rétention FSRS (< 80%, < 90%, < 95%, < 98%, Masqué)
  const handleCycleFsrsThreshold = () => {
    setFsrsThreshold((prev) => {
      const idx = FSRS_THRESHOLDS.indexOf(prev);
      return FSRS_THRESHOLDS[(idx + 1) % FSRS_THRESHOLDS.length];
    });
  };

  // Prononcer un texte via Web Speech API
  const speakText = (text: string, lang: SupportedLang = activeLang, customRate?: number) => {
    if (!('speechSynthesis' in window)) {
      showToast('La synthèse vocale n’est pas supportée par ce navigateur.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const localeMap: Record<SupportedLang, string> = {
      fr: 'fr-FR',
      de: 'de-DE',
      en: 'en-US',
      es: 'es-ES',
      ru: 'ru-RU',
    };
    utterance.lang = localeMap[lang] || 'fr-FR';
    utterance.rate = customRate || ttsRate;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith(lang) && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsTtsPlaying(true);
    utterance.onend = () => {
      setIsTtsPlaying(false);
      setTtsProgress(100);
    };
    utterance.onerror = () => setIsTtsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  // Contrôler la lecture vocale intégrale du chapitre ou du texte d'étude
  const handleToggleChapterTts = () => {
    if (!('speechSynthesis' in window)) return;

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    const plainText =
      readerMode === 'study'
        ? studyText.trim()
        : (chapterData?.chapter.contentHtml || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    if (!plainText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    const localeMap: Record<SupportedLang, string> = {
      fr: 'fr-FR',
      de: 'de-DE',
      en: 'en-US',
      es: 'es-ES',
      ru: 'ru-RU',
    };
    utterance.lang = localeMap[activeLang] || 'fr-FR';
    utterance.rate = ttsRate;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(activeLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onboundary = (event) => {
      if (plainText.length > 0 && typeof event.charIndex === 'number') {
        setTtsProgress(Math.min(100, Math.round((event.charIndex / plainText.length) * 100)));
      }
    };

    utterance.onend = () => {
      setIsTtsPlaying(false);
      setTtsProgress(100);
    };

    utterance.onerror = () => {
      setIsTtsPlaying(false);
    };

    ttsUtteranceRef.current = utterance;
    setIsTtsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopChapterTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTtsPlaying(false);
    setTtsProgress(0);
  };

  const handleChangeTtsRate = (newRate: 0.8 | 1.0 | 1.2) => {
    setTtsRate(newRate);
    if (isTtsPlaying) {
      handleStopChapterTts();
    }
  };

  // Clic sur n'importe quel mot (dans Estudio & Taller ou dans Visor de Libro)
  const handleInteractiveWordClick = async (
    rawToken: string,
    paragraphText: string,
    lang: SupportedLang = activeLang
  ) => {
    const cleaned = cleanToken(rawToken);
    if (!cleaned || cleaned.length < 2) return;

    const sentences = paragraphText.split(/(?<=[.!?…])\s+/);
    const matchingSentence =
      sentences.find((s) => s.toLowerCase().includes(cleaned.toLowerCase())) ||
      paragraphText.slice(0, 180);

    const alreadyInFsrs = userVocabWords.has(cleaned.toLowerCase());
    setSavedToFsrs(alreadyInFsrs);
    setWordLoading(true);

    const immediateIpa = quickClientIpa(cleaned, lang, enrichedIpaMap);
    setSelectedWord({
      word: cleaned,
      lemma: cleaned,
      ipa: immediateIpa,
      translation: 'Analyse lexicale en cours…',
      definition: `Extraction du contexte dans « ${
        readerMode === 'study' ? studyTitle : chapterData?.book.title || 'l’ouvrage'
      } »…`,
      grammatical: `Analyse lexicale · ${lang.toUpperCase()}`,
      sentence: matchingSentence,
    });

    try {
      const analysis = await apiFetch<{
        word: string;
        lemma: string;
        ipa: string;
        translation: string;
        definition: string;
        grammatical: string;
      }>('/books/analyze-word', {
        method: 'POST',
        body: JSON.stringify({
          word: cleaned,
          language: lang,
          sentence: matchingSentence,
        }),
      });

      if (analysis.ipa) {
        setEnrichedIpaMap((prev) => ({ ...prev, [cleaned.toLowerCase()]: analysis.ipa }));
      }

      setSelectedWord({
        word: analysis.word || cleaned,
        lemma: analysis.lemma || cleaned,
        ipa: analysis.ipa || immediateIpa,
        translation: analysis.translation,
        definition: analysis.definition,
        grammatical: analysis.grammatical,
        sentence: matchingSentence,
      });
    } catch {
      setSelectedWord({
        word: cleaned,
        lemma: cleaned,
        ipa: immediateIpa,
        translation: `Terme « ${cleaned} » (${lang.toUpperCase()})`,
        definition: `Employé dans le passage : « ${matchingSentence.slice(0, 140)} »`,
        grammatical: `Vocabulaire littéraire · ${lang.toUpperCase()}`,
        sentence: matchingSentence,
      });
    } finally {
      setWordLoading(false);
    }
  };

  // Sauvegarder le mot inspecté dans les cartes FSRS (PostgreSQL)
  const handleAddWordToFsrs = async () => {
    if (!selectedWord || savingFsrs || savedToFsrs) return;
    try {
      setSavingFsrs(true);
      await apiFetch('/books/vocabulary', {
        method: 'POST',
        body: JSON.stringify({
          bookId: readerMode === 'book' ? chapterData?.book.id : undefined,
          word: selectedWord.lemma || selectedWord.word,
          ipa: selectedWord.ipa,
          translation: selectedWord.translation,
          definition: selectedWord.definition,
          grammatical: selectedWord.grammatical,
          contextSentence: selectedWord.sentence,
          language: activeLang,
        }),
      });
      setSavedToFsrs(true);
      setUserVocabWords((prev) => new Set(prev).add(selectedWord.word.toLowerCase()));
      showToast(`« ${selectedWord.word} » ajouté à votre paquet FSRS (1:1) !`);
    } catch (err) {
      console.error('Erreur sauvegarde FSRS:', err);
      showToast('Erreur lors de la sauvegarde dans les cartes FSRS.');
    } finally {
      setSavingFsrs(false);
    }
  };

  // Envoyer le mot et la phrase vers le Studio de Shadowing
  const handleSendToShadowing = () => {
    if (!selectedWord) return;
    const payload: ShadowingPracticePayload = {
      word: selectedWord.word,
      ipa: selectedWord.ipa,
      sentence:
        selectedWord.sentence ||
        `J’ai de sérieuses raisons de croire que la planète d’où venait le petit prince est l’astéroïde B 612.`,
      translation: selectedWord.translation,
      language: activeLang,
      bookTitle:
        readerMode === 'study'
          ? studyTitle
          : `${chapterData?.book.title || 'Le Petit Prince'} · Cap. ${currentChapterNum}`,
    };
    localStorage.setItem('wonderword_shadowing_target', JSON.stringify(payload));
    if (onPracticeShadowing) {
      onPracticeShadowing(payload);
    } else if (onNavigate) {
      onNavigate('shadowing');
    }
  };

  // Créer un signet (bookmark) ou un surlignage (highlight)
  const handleCreateAnnotation = async (
    type: 'bookmark' | 'highlight',
    text: string,
    noteText?: string,
    color = highlightColor
  ) => {
    if (!chapterData) return;
    try {
      const created = await apiFetch<ReaderAnnotationItem>(
        `/books/${chapterData.book.id}/annotations`,
        {
          method: 'POST',
          body: JSON.stringify({
            chapterNumber: currentChapterNum,
            type,
            selectedText: text.trim(),
            note: noteText?.trim() || undefined,
            color,
          }),
        }
      );
      setAnnotations((prev) => [created, ...prev]);
      setNewBookmarkNote('');
      setSelectedPassage('');
      showToast(
        type === 'bookmark'
          ? `Signet enregistré au Chapitre ${currentChapterNum}`
          : 'Passage surligné enregistré dans vos notes'
      );
    } catch (err) {
      console.error('Erreur création annotation:', err);
      showToast('Impossible d’enregistrer l’annotation.');
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!chapterData) return;
    try {
      await apiFetch(`/books/${chapterData.book.id}/annotations/${annotationId}`, {
        method: 'DELETE',
      });
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    } catch (err) {
      console.error('Erreur suppression annotation:', err);
    }
  };

  // Détecter la sélection de texte à la souris pour le surlignage rapide
  const handleProseMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    if (text.length >= 3 && text.length <= 400) {
      setSelectedPassage(text);
      if (isHighlightMode && readerMode === 'book') {
        handleCreateAnnotation('highlight', text, undefined, highlightColor);
        selection?.removeAllRanges();
      }
    }
  };

  // Navigation entre chapitres
  const handleSelectChapterNumber = (targetNum: number) => {
    setCurrentChapterNum(targetNum);
    setCurrentSubPage(1);
    setActiveDrawer('none');
    if (onSelectBook) onSelectBook(bookId, targetNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Découper le HTML du chapitre en paragraphes propres en décodant les entités HTML
  const parsedParagraphs = useMemo(() => {
    const rawHtml = chapterData?.chapter.contentHtml || '';
    if (!rawHtml) return [];

    const decodeEntities = (str: string) =>
      str
        .replace(/&#0*39;|&#x0*27;|&apos;/gi, '’')
        .replace(/&quot;|&#0*34;/gi, '"')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&');

    const matches = Array.from(
      rawHtml.matchAll(/<(p|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)
    );

    if (matches.length > 0) {
      return matches
        .map((m) => ({
          tag: m[1].toLowerCase() as 'p' | 'blockquote',
          text: decodeEntities(
            m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          ),
        }))
        .filter((p) => p.text.length > 0);
    }

    return decodeEntities(rawHtml.replace(/<[^>]*>/g, '\n'))
      .split(/\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ tag: 'p' as const, text }));
  }, [chapterData?.chapter.contentHtml]);

  // Pagination en sous-pages confortables (4 paragraphes par sous-page) comme dans prototype/lector.html
  const PARAGRAPHS_PER_SUBPAGE = 4;
  const totalSubPages = Math.max(1, Math.ceil(parsedParagraphs.length / PARAGRAPHS_PER_SUBPAGE));
  const visibleParagraphs = useMemo(() => {
    const start = (currentSubPage - 1) * PARAGRAPHS_PER_SUBPAGE;
    return parsedParagraphs.slice(start, start + PARAGRAPHS_PER_SUBPAGE);
  }, [parsedParagraphs, currentSubPage]);

  const handlePrevPageOrChapter = () => {
    if (currentSubPage > 1) {
      setCurrentSubPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentChapterNum > 1) {
      handleSelectChapterNumber(currentChapterNum - 1);
    }
  };

  const handleNextPageOrChapter = () => {
    if (currentSubPage < totalSubPages) {
      setCurrentSubPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (chapterData && currentChapterNum < chapterData.book.totalChapters) {
      handleSelectChapterNumber(currentChapterNum + 1);
    }
  };

  // Surlignages actifs sur ce chapitre
  const chapterHighlights = useMemo(
    () =>
      annotations.filter(
        (a) => a.type === 'highlight' && a.chapterNumber === currentChapterNum
      ),
    [annotations, currentChapterNum]
  );

  // Déterminer si un mot reçoit une glose <ruby> selon le Seuil FSRS (< 80%, < 90%, < 95%, < 98%, Masqué)
  const shouldDisplayRuby = (token: string, index: number, isStudyMode: boolean): boolean => {
    if (isStudyMode && !showStudyIpa) return false;
    if (!isStudyMode && fsrsThreshold === 0) return false;

    const clean = cleanToken(token).toLowerCase();
    if (clean.length < 4) return false;

    // Toujours annoter les mots cibles du dictionnaire critique ou du mazo FSRS de l'utilisateur
    if (
      QUICK_IPA_FR[clean] ||
      QUICK_IPA_DE[clean] ||
      enrichedIpaMap[clean] ||
      userVocabWords.has(clean)
    ) {
      return true;
    }

    if (isStudyMode) {
      return clean.length >= 6 && index % 2 === 0;
    }

    // Densité adaptative selon le filtre de rétention FSRS (80%, 90%, 95%, 98%)
    if (fsrsThreshold === 98) return clean.length >= 5;
    if (fsrsThreshold === 95) return clean.length >= 6 && index % 2 === 0;
    if (fsrsThreshold === 90) return clean.length >= 7 && index % 3 === 0;
    return clean.length >= 9 && index % 4 === 0; // < 80%
  };

  // Calcul du pourcentage de vocabulaire maîtrisé affiché dans le pied de page
  const masteredVocabPercent = useMemo(() => {
    const words = parsedParagraphs
      .flatMap((p) => p.text.split(/\s+/))
      .map((w) => cleanToken(w).toLowerCase())
      .filter((w) => w.length >= 4);
    if (words.length === 0) return 95;
    const complexWords = words.filter((w) => w.length >= 8);
    const ratio = 100 - Math.min(12, Math.round((complexWords.length / words.length) * 28));
    return Math.max(84, Math.min(98, ratio));
  }, [parsedParagraphs]);

  const getHighlightBadgeClass = (color: string) => {
    switch (color) {
      case 'sauge':
        return 'bg-sauge-wash text-sauge border-b-2 border-sauge';
      case 'prune':
        return 'bg-prune-wash text-prune border-b-2 border-prune';
      case 'terre':
        return 'bg-terre-wash text-terre-ink border-b-2 border-terre';
      default:
        return 'bg-soleil-wash text-ink border-b-2 border-soleil';
    }
  };

  // Rendu interactif d'un ensemble de paragraphes (utilisé à la fois dans le Visor en Vivo du Studio et dans le Visor de Libro)
  const renderInteractiveProse = (
    paragraphs: { tag: 'p' | 'blockquote'; text: string }[],
    lang: SupportedLang,
    isStudyMode: boolean,
    enableDropCapOnFirstPara: boolean
  ) => {
    return paragraphs.map((para, pIdx) => {
      const tokens = para.text.split(/(\s+)/);
      let firstWordRendered = false;

      // Vérifier si un passage surligné correspond à une partie de ce paragraphe
      const paraHighlights = isStudyMode
        ? []
        : chapterHighlights.filter(
            (h) =>
              h.selectedText &&
              para.text.toLowerCase().includes(h.selectedText.toLowerCase())
          );

      const content = tokens.map((token, tIdx) => {
        if (/^\s+$/.test(token)) {
          // Vérifier s'il y a une liaison obligatoire en français entre le mot précédent et le mot suivant
          const prevWord = tIdx > 0 ? tokens[tIdx - 1] : undefined;
          const nextWord = tIdx + 1 < tokens.length ? tokens[tIdx + 1] : undefined;
          const showLiaison =
            lang === 'fr' &&
            (isStudyMode ? showStudyLiaisons : true) &&
            prevWord &&
            nextWord &&
            shouldShowLiaison(prevWord, nextWord);

          if (showLiaison) {
            return (
              <span key={tIdx} className="liaison-mark" title="Liaison obligatoire en français">
                ‿
              </span>
            );
          }
          return <React.Fragment key={tIdx}>{token}</React.Fragment>;
        }

        const clean = cleanToken(token);
        const isFirstWord =
          enableDropCapOnFirstPara && pIdx === 0 && !firstWordRendered && clean.length > 0;
        if (isFirstWord) {
          firstWordRendered = true;
        }

        const isSelected =
          selectedWord && clean.toLowerCase() === selectedWord.word.toLowerCase();

        // Vérifier si ce mot fait partie d'un surlignage utilisateur
        const matchingWordHighlight = paraHighlights.find((h) =>
          h.selectedText.toLowerCase().includes(clean.toLowerCase()) && clean.length >= 3
        );
        const highlightClass = matchingWordHighlight
          ? `${getHighlightBadgeClass(matchingWordHighlight.color)} px-1 rounded`
          : '';

        const showRuby = shouldDisplayRuby(token, tIdx, isStudyMode);
        const rubyIpa = showRuby ? quickClientIpa(clean, lang, enrichedIpaMap) : '';

        if (isFirstWord && token.length >= 1) {
          const firstChar = token.charAt(0);
          const restToken = token.slice(1);
          return (
            <span
              key={tIdx}
              onClick={() => handleInteractiveWordClick(token, para.text, lang)}
              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-soleil-wash ${highlightClass} ${
                isSelected ? 'bg-prune-wash text-prune font-semibold' : ''
              }`}
            >
              <span className="drop-cap">{firstChar}</span>
              {restToken}
            </span>
          );
        }

        if (showRuby && rubyIpa) {
          return (
            <ruby
              key={tIdx}
              onClick={() => handleInteractiveWordClick(token, para.text, lang)}
              className={`target-word cursor-pointer rounded px-0.5 transition-colors hover:bg-soleil-wash ${highlightClass} ${
                isSelected ? 'bg-prune-wash text-prune' : ''
              }`}
            >
              {token}
              <rt className="font-ipa text-sauge text-[11px] font-bold select-none">
                {rubyIpa}
              </rt>
            </ruby>
          );
        }

        return (
          <span
            key={tIdx}
            onClick={() => handleInteractiveWordClick(token, para.text, lang)}
            className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-soleil-wash ${highlightClass} ${
              isSelected ? 'bg-prune-wash text-prune font-semibold underline' : ''
            }`}
          >
            {token}
          </span>
        );
      });

      if (para.tag === 'blockquote' || para.text.startsWith('—') || para.text.startsWith('«')) {
        return (
          <p key={pIdx} className="italic pl-6 border-l-2 border-soleil/70 my-4 text-ink">
            {content}
          </p>
        );
      }

      return <p key={pIdx}>{content}</p>;
    });
  };

  const langLabelMap: Record<SupportedLang, string> = {
    fr: 'FRANÇAIS',
    de: 'DEUTSCH',
    en: 'ENGLISH',
    es: 'ESPAÑOL',
    ru: 'РУССКИЙ',
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-8 md:px-11 py-9 space-y-7 relative">
      {/* Notification Toast discrète */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-rail text-rail-ink px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check size={14} className="text-soleil" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================
          EN-TÊTE ET COMMUTATEUR DE VUES : 1. ESTUDIO & TALLER vs 2. VISOR DE LIBRO
         ====================================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-sauge" />
            <p className="text-[9.5px] uppercase tracking-[0.22em] font-bold text-sauge m-0">
              {readerMode === 'study'
                ? 'Taller de Texto & Fonética Viva · Paris 8'
                : `Biblioteca Oficial · ${langLabelMap[bookLang]} ${chapterData?.book.cefrLevel || 'B1'} · ${
                    chapterData?.book.author || ''
                  }`}
            </p>
          </div>
          <h1 className="font-serif text-[36px] md:text-[40px] font-normal text-ink m-0 leading-tight">
            {readerMode === 'study'
              ? 'Estudio de Lectura Rápida'
              : chapterData?.book.title || 'Le Petit Prince'}
          </h1>
        </div>

        {/* Sélecteur de Mode (/reader vs /reader/1) fidèle au prototype */}
        <div className="inline-flex items-center bg-black/[0.05] p-1 rounded-full border border-rule gap-1 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveDrawer('none');
              setReaderMode('study');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              readerMode === 'study'
                ? 'bg-paper text-prune shadow-md'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Edit3 size={14} />
            <span>1. Estudio & Taller (/reader)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveDrawer('none');
              setReaderMode('book');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              readerMode === 'book'
                ? 'bg-paper text-prune shadow-md'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <BookOpen size={14} />
            <span>2. Visor de Libro (/reader/1)</span>
          </button>
        </div>
      </div>

      {/* ======================================================================
          VISTA 1 : EL ESTUDIO & TALLER DE LECTURA RÁPIDA (/reader)
         ====================================================================== */}
      {readerMode === 'study' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── PANNEAU GAUCHE : ENTRÉE, MÉTADONNÉES ET IMPORTATION ── */}
          <div className="flex flex-col gap-5">
            {/* Pastilles d'exemples rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-ink-3 mr-1">
                Exemples rapides :
              </span>
              {STUDY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setStudyTitle(preset.title);
                    setStudyAuthor(preset.author);
                    setStudyLang(preset.lang);
                    setStudyText(preset.text);
                  }}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full bg-paper border border-rule hover:border-sauge hover:text-sauge text-ink-2 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Boîte de Texte de l'Étude */}
            <div className="bg-paper rounded-[20px] border border-rule shadow-sm flex flex-col overflow-hidden focus-within:border-sauge transition-colors">
              <textarea
                value={studyText}
                onChange={(e) => setStudyText(e.target.value)}
                placeholder="Pega aquí un poema, fragmento de novela o artículo periodístico..."
                className="w-full min-h-[260px] p-6 border-none outline-none resize-y bg-transparent text-ink font-serif text-[17.5px] leading-[1.8]"
              />

              {/* Barre d'outils inférieure de l'éditeur */}
              <div className="bg-paper-warm px-5 py-3 border-t border-rule-soft flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5 flex-wrap">
                  {/* Sélecteur de Langue */}
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-sauge" />
                    <select
                      value={studyLang}
                      onChange={(e) => setStudyLang(e.target.value as SupportedLang)}
                      className="bg-transparent border border-rule rounded-lg px-2 py-1 text-[11.5px] font-bold text-ink outline-none cursor-pointer"
                    >
                      <option value="fr">Français (Auto-Detect)</option>
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>

                  <span className="w-px h-3.5 bg-rule" />

                  <button
                    type="button"
                    onClick={() => setStudyText('')}
                    className="text-ink-3 hover:text-terre text-[11.5px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Limpiar</span>
                  </button>

                  <span className="text-[11px] text-ink-3 font-mono">
                    {studyText.length} caracteres · {studyWordCount} palabras
                  </span>
                </div>

                {/* Switch Mostrar IPA & Liaisons */}
                <div className="flex items-center gap-4">
                  {studyLang === 'fr' && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11.5px] font-bold text-ink-2">
                      <input
                        type="checkbox"
                        checked={showStudyLiaisons}
                        onChange={(e) => setShowStudyLiaisons(e.target.checked)}
                        className="accent-terre rounded cursor-pointer"
                      />
                      <span>Liaisons (‿)</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-[11.5px] font-bold text-ink">Mostrar IPA</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showStudyIpa}
                      onClick={() => setShowStudyIpa(!showStudyIpa)}
                      className={`relative inline-flex h-[22px] w-[38px] items-center rounded-full transition-colors ${
                        showStudyIpa ? 'bg-sauge' : 'bg-black/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          showStudyIpa ? 'translate-x-[19px]' : 'translate-x-[3px]'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>

            {/* Métadonnées Optionnelles (Titre & Auteur) */}
            <div className="bg-paper rounded-[18px] border border-rule p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9.5px] uppercase tracking-[0.12em] font-extrabold text-ink-3 block mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={studyTitle}
                  onChange={(e) => setStudyTitle(e.target.value)}
                  placeholder="Titre du texte ou de l'œuvre"
                  className="w-full bg-transparent border-0 border-b border-rule py-1 text-[13.5px] font-semibold text-ink outline-none focus:border-prune"
                />
              </div>
              <div>
                <label className="text-[9.5px] uppercase tracking-[0.12em] font-extrabold text-ink-3 block mb-1">
                  Autor
                </label>
                <input
                  type="text"
                  value={studyAuthor}
                  onChange={(e) => setStudyAuthor(e.target.value)}
                  placeholder="Nom de l'auteur"
                  className="w-full bg-transparent border-0 border-b border-rule py-1 text-[13.5px] font-semibold text-ink outline-none focus:border-prune"
                />
              </div>
            </div>

            {/* Zone d'Importation de Document (Dropzone .TXT, .PDF, .EPUB) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileImport(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-paper-warm border border-dashed rounded-[18px] p-5 flex items-center gap-4 cursor-pointer transition-all ${
                isDraggingFile
                  ? 'border-sauge bg-sauge-wash/30 scale-[1.01]'
                  : 'border-rule hover:border-sauge'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.html,.htm,.epub,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                  e.target.value = '';
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-sauge-wash text-sauge flex items-center justify-center flex-shrink-0">
                <Upload size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[13.5px] font-bold text-ink m-0 mb-0.5">
                  Importar Documento
                </h4>
                <p className="text-[11.5px] text-ink-3 m-0 truncate">
                  Arrastra o selecciona un archivo para procesar fonéticamente en vivo.
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {['TXT', 'PDF', 'EPUB'].map((ext) => (
                  <span
                    key={ext}
                    className="text-[9.5px] font-extrabold bg-black/[0.06] px-2 py-0.5 rounded text-ink-2"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Boutons d'Action (Previsualizar / Guardar en Biblioteca / Abrir en Visor Completo) */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                disabled={isPrevisualizingIpa}
                onClick={handleDeepPhoneticPreview}
                className="flex-1 bg-prune hover:bg-prune-2 text-white rounded-full py-3 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                <Eye size={15} />
                <span>{isPrevisualizingIpa ? 'Procesando IPA…' : 'Previsualizar'}</span>
              </button>

              <button
                type="button"
                disabled={isSavingStudyBook}
                onClick={() => handleSaveStudyToLibrary(false)}
                className="flex-1 bg-paper hover:bg-paper-warm border border-rule text-ink rounded-full py-3 px-5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                <BookmarkPlus size={15} className="text-sauge" />
                <span>{isSavingStudyBook ? 'Guardando…' : 'Guardar en Biblioteca'}</span>
              </button>

              <button
                type="button"
                disabled={isSavingStudyBook}
                onClick={() => handleSaveStudyToLibrary(true)}
                title="Abrir en Visor Completo de Lectura (/reader/1)"
                className="bg-paper-2 hover:bg-sauge hover:text-white border border-rule text-ink rounded-full py-3 px-4 flex items-center justify-center transition-colors shadow-sm"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>

          {/* ── PANNEAU DROIT : VISOR DE PAPEL EN TIEMPO REAL ── */}
          <div className="bg-paper rounded-[24px] border border-rule p-9 md:p-11 shadow-xl relative min-h-[540px] flex flex-col justify-between">
            <div>
              {/* En-tête du Visor de Papel */}
              <div className="border-b border-rule-soft pb-4 mb-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] uppercase tracking-[0.16em] font-extrabold text-sauge">
                    Previsualización en Papel de Acuarela
                  </span>
                  <span className="text-[9.5px] font-extrabold bg-sauge-wash text-sauge px-2.5 py-0.5 rounded-full">
                    {langLabelMap[studyLang]}
                  </span>
                </div>
                <h2 className="font-serif text-[26px] font-normal text-ink mt-1.5 mb-0.5 leading-snug">
                  {studyTitle || 'Texto sin título'}
                </h2>
                <p className="text-[12.5px] text-ink-3 m-0">
                  {studyAuthor ? `Por ${studyAuthor}` : 'Autor Desconocido'}
                </p>
              </div>

              {/* Contenu rendu en direct avec Phonétique Ruby & Liaisons */}
              {studyParagraphs.length === 0 ? (
                <p className="text-ink-3 italic text-center py-16 font-serif text-base">
                  El visor de papel está vacío. Pega o escribe texto a la izquierda para formatear fonéticamente en tiempo real.
                </p>
              ) : (
                <div
                  onMouseUp={handleProseMouseUp}
                  style={{ fontSize: `${fontSize}px` }}
                  className="font-serif leading-[2.15] text-ink text-justify space-y-5 select-text"
                >
                  {renderInteractiveProse(
                    studyParagraphs.map((text) => ({ tag: 'p' as const, text })),
                    studyLang,
                    true,
                    true
                  )}
                </div>
              )}
            </div>

            {/* Pied du Visor en Temps Réel */}
            <div className="mt-9 pt-4 border-t border-rule-soft flex items-center justify-between gap-4 text-[11.5px] text-ink-3 flex-wrap">
              <span>
                Haz clic en cualquier palabra para inspeccionar fonética y añadir a FSRS
              </span>
              <button
                type="button"
                onClick={handleToggleChapterTts}
                className="text-sauge hover:text-sauge-2 font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                {isTtsPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                <span>{isTtsPlaying ? 'Detener audio' : 'Escuchar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VISTA 2 : EL VISOR DE LIBRO COMPLETO (/reader/1)
         ====================================================================== */}
      {readerMode === 'book' && (
        <div className="max-w-[1060px] mx-auto w-full space-y-6">
          {/* 1. BARRE D'OUTILS PREMIUM DU LECTEUR (/reader/1) */}
          <div className="bg-paper border border-rule rounded-[20px] p-3 px-5 flex items-center justify-between gap-4 shadow-sm flex-wrap">
            {/* Gauche : Índice, Marcadores, Subrayar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  setActiveDrawer(activeDrawer === 'toc' ? 'none' : 'toc')
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  activeDrawer === 'toc'
                    ? 'bg-sauge-wash text-sauge border-sauge'
                    : 'border-rule-soft hover:bg-paper-warm text-ink-2 hover:text-ink'
                }`}
                title="Índice de Capítulos"
              >
                <List size={14} />
                <span>Índice ({chapterData?.book.totalChapters || 1})</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveDrawer(
                    activeDrawer === 'bookmarks' ? 'none' : 'bookmarks'
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  activeDrawer === 'bookmarks'
                    ? 'bg-sauge-wash text-sauge border-sauge'
                    : 'border-rule-soft hover:bg-paper-warm text-ink-2 hover:text-ink'
                }`}
                title="Marcadores y Notas"
              >
                <Bookmark size={14} />
                <span>Marcadores ({annotations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isHighlightMode;
                  setIsHighlightMode(next);
                  if (next) {
                    showToast(
                      'Modo Subrayado Activo: selecciona cualquier fragmento con el ratón para resaltarlo.'
                    );
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  isHighlightMode
                    ? 'bg-soleil text-soleil-ink border-soleil font-bold shadow-sm'
                    : 'border-rule-soft hover:bg-paper-warm text-ink-2 hover:text-ink'
                }`}
                title="Modo Resaltado"
              >
                <Highlighter size={14} />
                <span>Subrayar</span>
              </button>

              {isHighlightMode && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-paper-warm border border-rule-soft">
                  {(
                    [
                      { id: 'soleil', bg: 'bg-soleil' },
                      { id: 'sauge', bg: 'bg-sauge' },
                      { id: 'prune', bg: 'bg-prune' },
                      { id: 'terre', bg: 'bg-terre' },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setHighlightColor(c.id)}
                      className={`w-4 h-4 rounded-full ${c.bg} transition-transform ${
                        highlightColor === c.id
                          ? 'scale-125 ring-2 ring-ink'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`Pigmento ${c.id}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Centre : Selector de Umbral FSRS del Ruby Adaptativo */}
            <div className="flex items-center gap-2 bg-paper-warm px-3.5 py-1 rounded-full border border-rule">
              <SlidersHorizontal size={13} className="text-sauge" />
              <span className="text-[11px] font-bold text-ink-2">Filtro FSRS:</span>
              <button
                type="button"
                onClick={handleCycleFsrsThreshold}
                className="bg-sauge hover:bg-sauge-2 text-white rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold transition-colors"
                title="Alternar densidad de glosas fonéticas según retención FSRS"
              >
                {fsrsThreshold === 0 ? 'IPA Oculto' : `Retención < ${fsrsThreshold}%`}
              </button>
            </div>

            {/* Droite : Audio TTS & Typographie A+ / A- */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTtsBar(!showTtsBar)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  showTtsBar || isTtsPlaying
                    ? 'bg-sauge-wash text-sauge border-sauge'
                    : 'border-rule-soft hover:bg-paper-warm text-ink-2 hover:text-ink'
                }`}
                title="Reproductor de Audio TTS Natural"
              >
                <Headphones size={14} />
                <span>Audio V.O.</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustFontSize(1)}
                className="px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-bold text-ink-2 hover:text-ink transition-colors"
                title="Aumentar tamaño de letra"
              >
                A+
              </button>

              <button
                type="button"
                onClick={() => handleAdjustFontSize(-1)}
                className="px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-bold text-ink-2 hover:text-ink transition-colors"
                title="Disminuir tamaño de letra"
              >
                A-
              </button>
            </div>
          </div>

          {/* 2. BARRE FLOTTANTE D'AUDIO TTS */}
          {showTtsBar && (
            <div className="bg-paper-warm border border-rule rounded-[18px] p-3.5 px-5 shadow-sm flex items-center justify-between gap-4 flex-wrap animate-in fade-in">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleChapterTts}
                  className="w-9 h-9 rounded-full bg-sauge hover:bg-sauge-2 text-white flex items-center justify-center shadow transition-transform active:scale-95"
                  title={isTtsPlaying ? 'Pausar lectura' : 'Reproducir capítulo'}
                >
                  {isTtsPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
                {isTtsPlaying && (
                  <button
                    type="button"
                    onClick={handleStopChapterTts}
                    className="w-8 h-8 rounded-full bg-paper border border-rule text-ink-2 flex items-center justify-center hover:text-ink"
                    title="Detener"
                  >
                    <Square size={12} />
                  </button>
                )}
                <div>
                  <p className="text-[12.5px] font-bold text-ink m-0">
                    Lectura Natural · Voz {langLabelMap[bookLang]}
                  </p>
                  <p className="text-[11px] text-ink-3 m-0">
                    {chapterData?.chapter.title || `Chapitre ${currentChapterNum}`} · Sub-pág.{' '}
                    {currentSubPage}/{totalSubPages} · {ttsProgress}%
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-[280px] h-1.5 bg-rule-soft rounded-full overflow-hidden">
                <div
                  className="h-full bg-sauge transition-all duration-300 rounded-full"
                  style={{ width: `${ttsProgress}%` }}
                />
              </div>

              <div className="flex items-center gap-1.5">
                {([0.8, 1.0, 1.2] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChangeTtsRate(rate)}
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors ${
                      ttsRate === rate
                        ? 'bg-sauge-wash text-sauge border-sauge'
                        : 'border-rule-soft text-ink-2 hover:text-ink'
                    }`}
                  >
                    {rate.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barre d'action rapide lorsqu'un passage est sélectionné au curseur */}
          {selectedPassage && !isHighlightMode && (
            <div className="bg-paper-warm border border-rule rounded-xl p-3 px-4 flex items-center justify-between gap-4 text-xs animate-in fade-in">
              <div className="truncate text-ink-2">
                <strong className="text-ink">Selección :</strong> «{' '}
                {selectedPassage.slice(0, 90)}
                {selectedPassage.length > 90 ? '…' : ''} »
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => speakText(selectedPassage, bookLang)}
                  className="px-3 py-1 rounded-full bg-paper border border-rule text-ink font-semibold hover:bg-sauge-wash hover:text-sauge transition-colors inline-flex items-center gap-1"
                >
                  <Volume2 size={12} />
                  <span>Escuchar</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCreateAnnotation('highlight', selectedPassage, undefined, highlightColor)
                  }
                  className="px-3 py-1 rounded-full bg-soleil text-soleil-ink font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                >
                  <Highlighter size={12} />
                  <span>Subrayar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPassage('')}
                  className="text-ink-3 hover:text-ink p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* 3. LIENZO PRINCIPAL DEL LIBRO */}
          <article className="bg-paper border border-rule rounded-[24px] p-10 md:p-14 shadow-xl min-h-[540px] flex flex-col justify-between relative">
            {loading ? (
              <div className="py-28 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-prune border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-ink-2 font-medium">
                  Cargando edición crítica…
                </p>
              </div>
            ) : (
              <>
                <div>
                  {/* Titre discret du chapitre */}
                  <div className="mb-7 pb-4 border-b border-rule-soft flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs font-serif italic text-ink-2">
                      {chapterData?.chapter.title || `Chapitre ${currentChapterNum}`}
                    </span>
                    <span className="text-[11px] font-mono text-ink-3">
                      Cap. {currentChapterNum} de {chapterData?.book.totalChapters || 1}
                    </span>
                  </div>

                  {/* Prose interactive */}
                  <div
                    onMouseUp={handleProseMouseUp}
                    style={{ fontSize: `${fontSize}px` }}
                    className="font-serif leading-[2.15] text-ink text-justify space-y-6 select-text transition-all"
                  >
                    {renderInteractiveProse(
                      visibleParagraphs,
                      bookLang,
                      false,
                      currentSubPage === 1
                    )}
                  </div>
                </div>

                {/* PIE DE PÁGINA FIDÈLE AU PROTOTYPE */}
                <footer className="mt-12 pt-5 border-t border-rule-soft flex items-center justify-between gap-4 text-[12.5px] text-ink-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold bg-sauge-wash text-sauge px-2.5 py-1 rounded-full">
                      {masteredVocabPercent}% Vocabulario Dominado
                    </span>
                    <span>
                      Sub-página {currentSubPage} de {totalSubPages} · Cap. {currentChapterNum} de{' '}
                      {chapterData?.book.totalChapters || 1}
                    </span>
                    <span>·</span>
                    <span>
                      ~{Math.max(1, Math.round((chapterData?.chapter.wordCount || 250) / 190))} min
                      restantes
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentSubPage <= 1 && currentChapterNum <= 1}
                      onClick={handlePrevPageOrChapter}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm hover:border-rule text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                      <span>Anterior</span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(
                        currentSubPage >= totalSubPages &&
                          chapterData &&
                          currentChapterNum >= chapterData.book.totalChapters
                      )}
                      onClick={handleNextPageOrChapter}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm hover:border-rule text-xs font-semibold text-ink-2 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </article>
        </div>
      )}

      {/* ======================================================================
          DRAWER LATERAL : ÍNDICE DE CAPÍTULOS (TOC)
         ====================================================================== */}
      {activeDrawer === 'toc' && (
        <div className="fixed left-0 lg:left-[252px] top-14 bottom-0 w-80 bg-paper border-r border-rule shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-rule">
            <h3 className="font-serif text-xl text-ink m-0">Índice de Capítulos</h3>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {(chapterData?.book.chapters || []).map((ch) => {
              const isCurrent = ch.number === currentChapterNum;
              return (
                <button
                  key={ch.id || ch.number}
                  type="button"
                  onClick={() => handleSelectChapterNumber(ch.number)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-[13px] ${
                    isCurrent
                      ? 'bg-sauge-wash text-sauge font-bold'
                      : 'bg-paper-warm hover:bg-paper-2 text-ink font-semibold'
                  }`}
                >
                  <div className="truncate">
                    {ch.title} {isCurrent ? '· Actual' : ''}
                  </div>
                  <div className="text-[11px] opacity-75 font-mono mt-0.5">
                    {ch.wordCount} mots
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================================
          DRAWER LATERAL : MARCADORES Y ANOTACIONES
         ====================================================================== */}
      {activeDrawer === 'bookmarks' && (
        <div className="fixed left-0 lg:left-[252px] top-14 bottom-0 w-80 bg-paper border-r border-rule shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-rule">
            <h3 className="font-serif text-xl text-ink m-0">Marcadores & Notas</h3>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ajout rapide d'un signet */}
          <div className="pb-4 mb-4 border-b border-rule-soft space-y-2">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-ink-3">
              Nuevo marcador · Cap. {currentChapterNum} (Sub-pág. {currentSubPage})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                placeholder="Nota fonética o literaria…"
                className="flex-1 bg-paper-warm border border-rule rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-prune"
              />
              <button
                type="button"
                onClick={() =>
                  handleCreateAnnotation(
                    'bookmark',
                    chapterData?.chapter.title || `Chapitre ${currentChapterNum}`,
                    newBookmarkNote || `Sub-pág. ${currentSubPage}`
                  )
                }
                className="px-3 py-2 rounded-xl bg-prune hover:bg-prune-2 text-white text-xs font-bold flex items-center gap-1 flex-shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {annotations.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-ink-3">
                <Bookmark size={26} className="mx-auto opacity-50" />
                <p className="text-xs">Ningún marcador ni fragmento subrayado en este libro.</p>
              </div>
            ) : (
              annotations.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-rule bg-paper-warm space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChapterNumber(item.chapterNumber)}
                      className={`text-[10px] font-bold uppercase tracking-wider hover:underline ${
                        item.type === 'highlight' ? 'text-sauge' : 'text-terre'
                      }`}
                    >
                      Cap. {item.chapterNumber} ·{' '}
                      {item.type === 'highlight' ? 'Subrayado' : 'Nota Fonética'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(item.id)}
                      className="text-ink-3 hover:text-terre p-0.5 opacity-70 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-[12.5px] text-ink m-0 line-clamp-3">
                    « {item.selectedText} »
                  </p>
                  {item.note && (
                    <p className="text-[11px] text-ink-2 italic m-0 pt-1 border-t border-rule-soft">
                      {item.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          WORDPANEL FLOTANTE (FIDÈLE À PROTOTYPE/LECTOR.HTML)
         ====================================================================== */}
      {selectedWord && (
        <div className="fixed right-8 bottom-8 w-[360px] max-w-[calc(100vw-2rem)] bg-paper rounded-[24px] border border-rule shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="inline-block text-[9.5px] uppercase tracking-[0.12em] font-extrabold text-sauge bg-sauge-wash px-2.5 py-0.5 rounded-full">
                {selectedWord.grammatical}
              </span>
              <h3 className="font-serif text-[22px] font-normal text-ink mt-1 mb-0.5">
                {selectedWord.lemma || selectedWord.word}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              className="text-ink-3 hover:text-ink p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-ipa text-[16px] text-sauge font-bold">
              {selectedWord.ipa}
            </span>
            <button
              type="button"
              onClick={() => speakText(selectedWord.word, activeLang, 0.9)}
              className="w-7 h-7 rounded-full bg-soleil-wash hover:bg-soleil text-soleil-ink inline-flex items-center justify-center transition-colors"
              title="Escuchar pronunciación nativa"
            >
              <Volume2 size={13} />
            </button>
          </div>

          <div className="bg-paper-warm rounded-xl border border-rule-soft p-3 mb-4 space-y-1.5">
            {wordLoading ? (
              <p className="text-xs text-ink-3 italic animate-pulse m-0">
                Consultando léxico crítico y morfológico…
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-prune m-0">
                  {selectedWord.translation}
                </p>
                <p className="text-[12.5px] text-ink leading-[1.45] m-0">
                  {selectedWord.definition}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={savingFsrs || savedToFsrs}
              onClick={handleAddWordToFsrs}
              className={`w-full rounded-full py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                savedToFsrs
                  ? 'bg-sauge-wash text-sauge cursor-default'
                  : 'bg-sauge hover:bg-sauge-2 text-white shadow-sm'
              }`}
            >
              {savedToFsrs ? <Check size={13} /> : <Sparkles size={13} />}
              <span>
                {savedToFsrs
                  ? 'Guardado en Mazo FSRS (1:1)'
                  : savingFsrs
                  ? 'Guardando…'
                  : 'Guardar en Mazo FSRS (1:1)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSendToShadowing}
              className="w-full bg-paper-2 hover:bg-paper-warm border border-rule text-ink rounded-full py-2 px-4 text-[11px] font-semibold transition-colors"
            >
              Practicar en Shadowing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
