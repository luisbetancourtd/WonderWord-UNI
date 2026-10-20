import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Bookmark,
  Highlighter,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  List,
  Headphones,
  Play,
  Pause,
  Square,
  SlidersHorizontal,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { ViewType } from '../../types';

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

interface ReaderViewProps {
  bookId?: string;
  chapterNumber?: number;
  onNavigate?: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
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

function cleanToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[«»"“”„'’‘()[\]{},.;:!?—–\-…]+/, '')
    .replace(/[«»"“”„'’‘()[\]{},.;:!?—–\-…]+$/, '')
    .replace(/^(l'|d'|qu'|n'|s'|j'|m'|t'|c'|L'|D'|Qu'|N'|S'|J'|M'|T'|C'|l’|d’|qu’|n’|s’|j’|m’|t’|c’|L’|D’|Qu’|N’|S’|J’|M’|T’|C’)/, '')
    .trim();
}

function quickClientIpa(rawWord: string, lang: 'fr' | 'de'): string {
  const clean = cleanToken(rawWord).toLowerCase();
  if (!clean) return '';
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

  p = p
    .replace(/tion(s?)$/, 'sjɔ̃')
    .replace(/ment$/, 'mɑ̃')
    .replace(/eau(x?)$/, 'o')
    .replace(/ou/g, 'u')
    .replace(/oi/g, 'wa')
    .replace(/au/g, 'o')
    .replace(/ai|ei/g, 'ɛ')
    .replace(/eu|œu/g, 'ø')
    .replace(/ch/g, 'ʃ')
    .replace(/gn/g, 'ɲ')
    .replace(/qu/g, 'k')
    .replace(/(?:an|am|en|em)(?![aeiouyéèê])/g, 'ɑ̃')
    .replace(/(?:on|om)(?![aeiouyéèê])/g, 'ɔ̃')
    .replace(/(?:in|im|ain|ein)(?![aeiouyéèê])/g, 'ɛ̃')
    .replace(/r/g, 'ʁ')
    .replace(/[é]/g, 'e')
    .replace(/[èêë]/g, 'ɛ')
    .replace(/u/g, 'y')
    .replace(/[dsxtzp]$/, '')
    .replace(/e$/, '');
  return `/${p || clean}/`;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookId = 'le-petit-prince',
  chapterNumber = 1,
  onNavigate,
  onSelectBook,
}) => {
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChapterNum, setCurrentChapterNum] = useState(chapterNumber);

  // Inspection de mot
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [savedToFsrs, setSavedToFsrs] = useState(false);
  const [savingFsrs, setSavingFsrs] = useState(false);

  // Contrôles de la barre d'outils (Typographie, Gloses IPA, Audio TTS, Tiroirs)
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('wonderword_reader_fontsize');
    return saved ? Number(saved) : 22;
  });
  const [ipaMode, setIpaMode] = useState<'keywords' | 'all' | 'off'>('keywords');
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

  const bookLang: 'fr' | 'de' = chapterData?.book.language === 'de' ? 'de' : 'fr';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    setCurrentChapterNum(chapterNumber);
  }, [chapterNumber]);

  // Arrêter la synthèse vocale au changement de chapitre ou démontage
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [bookId, currentChapterNum]);

  // Charger le chapitre et les annotations du livre
  useEffect(() => {
    const fetchChapterAndAnnotations = async () => {
      try {
        setLoading(true);
        setSelectedWord(null);
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

  // Ajuster la taille de police
  const handleAdjustFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(17, Math.min(30, prev + delta));
      localStorage.setItem('wonderword_reader_fontsize', String(next));
      return next;
    });
  };

  // Alterner le mode d'affichage des gloses API (IPA)
  const handleCycleIpaMode = () => {
    setIpaMode((prev) => {
      if (prev === 'keywords') return 'all';
      if (prev === 'all') return 'off';
      return 'keywords';
    });
  };

  // Prononcer un texte en français ou allemand via Web Speech API
  const speakText = (text: string, customRate?: number) => {
    if (!('speechSynthesis' in window)) {
      showToast('La synthèse vocale n’est pas supportée par ce navigateur.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = bookLang === 'de' ? 'de-DE' : 'fr-FR';
    utterance.lang = targetLocale;
    utterance.rate = customRate || ttsRate;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith(bookLang) && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(bookLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Contrôler la lecture vocale intégrale du chapitre (Barre Audio TTS V.O.)
  const handleToggleChapterTts = () => {
    if (!('speechSynthesis' in window) || !chapterData) return;

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    const plainText = chapterData.chapter.contentHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = bookLang === 'de' ? 'de-DE' : 'fr-FR';
    utterance.rate = ttsRate;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(bookLang));
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

  // Clic sur n'importe quel mot de n'importe quel livre
  const handleInteractiveWordClick = async (rawToken: string, paragraphText: string) => {
    const cleaned = cleanToken(rawToken);
    if (!cleaned || cleaned.length < 2) return;

    // Extraire la phrase contenant le mot pour le contexte
    const sentences = paragraphText.split(/(?<=[.!?…])\s+/);
    const matchingSentence =
      sentences.find((s) => s.toLowerCase().includes(cleaned.toLowerCase())) ||
      paragraphText.slice(0, 180);

    setSavedToFsrs(false);
    setWordLoading(true);

    // Affichage immédiat avec IPA G2P local pendant l'enrichissement serveur
    const immediateIpa = quickClientIpa(cleaned, bookLang);
    setSelectedWord({
      word: cleaned,
      lemma: cleaned,
      ipa: immediateIpa,
      translation: 'Analyse lexicale en cours…',
      definition: `Extraction du contexte dans « ${chapterData?.book.title || 'l’ouvrage'} »…`,
      grammatical: bookLang === 'de' ? 'Wortanalyse · Deutsch' : 'Analyse lexicale · Français',
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
          language: bookLang,
          sentence: matchingSentence,
        }),
      });

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
        translation: bookLang === 'de' ? `Terme allemand « ${cleaned} »` : `Terme français « ${cleaned} »`,
        definition: `Employé dans le passage : « ${matchingSentence.slice(0, 140)} »`,
        grammatical: bookLang === 'de' ? 'Literarisches Deutsch' : 'Français littéraire',
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
          bookId: chapterData?.book.id,
          word: selectedWord.lemma || selectedWord.word,
          ipa: selectedWord.ipa,
          translation: selectedWord.translation,
          definition: selectedWord.definition,
          grammatical: selectedWord.grammatical,
          contextSentence: selectedWord.sentence,
          language: bookLang,
        }),
      });
      setSavedToFsrs(true);
      showToast(`« ${selectedWord.word} » ajouté à vos cartes de révision FSRS !`);
    } catch (err) {
      console.error('Erreur sauvegarde FSRS:', err);
      showToast('Erreur lors de la sauvegarde dans les cartes FSRS.');
    } finally {
      setSavingFsrs(false);
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
      if (isHighlightMode) {
        handleCreateAnnotation('highlight', text, undefined, highlightColor);
        selection?.removeAllRanges();
      }
    }
  };

  // Navigation entre chapitres
  const handleSelectChapterNumber = (targetNum: number) => {
    setCurrentChapterNum(targetNum);
    setActiveDrawer('none');
    if (onSelectBook) onSelectBook(bookId, targetNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevChapter = () => {
    if (currentChapterNum > 1) {
      handleSelectChapterNumber(currentChapterNum - 1);
    }
  };

  const handleNextChapter = () => {
    if (chapterData && currentChapterNum < chapterData.book.totalChapters) {
      handleSelectChapterNumber(currentChapterNum + 1);
    }
  };

  // Découper le HTML du chapitre en paragraphes propres pour le rendu interactif mot à mot
  const parsedParagraphs = useMemo(() => {
    const rawHtml = chapterData?.chapter.contentHtml || '';
    if (!rawHtml) return [];

    const matches = Array.from(
      rawHtml.matchAll(/<(p|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)
    );

    if (matches.length > 0) {
      return matches
        .map((m) => ({
          tag: m[1].toLowerCase() as 'p' | 'blockquote',
          text: m[2]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim(),
        }))
        .filter((p) => p.text.length > 0);
    }

    // Fallback si le texte ne contient pas de balises <p>
    return rawHtml
      .replace(/<[^>]*>/g, '\n')
      .split(/\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ tag: 'p' as const, text }));
  }, [chapterData?.chapter.contentHtml]);

  // Surlignages actifs sur ce chapitre
  const chapterHighlights = useMemo(
    () =>
      annotations.filter(
        (a) => a.type === 'highlight' && a.chapterNumber === currentChapterNum
      ),
    [annotations, currentChapterNum]
  );

  // Déterminer si un mot reçoit une glose <ruby> automatique
  const shouldDisplayRuby = (token: string, index: number): boolean => {
    if (ipaMode === 'off') return false;
    const clean = cleanToken(token).toLowerCase();
    if (clean.length < 4) return false;
    if (QUICK_IPA_FR[clean] || QUICK_IPA_DE[clean]) return true;
    if (ipaMode === 'all') return clean.length >= 5;
    // Mode 'keywords' : mots littéraires longs ou complexes (1 sur ~4 parmi les mots >= 7 lettres)
    return clean.length >= 8 && index % 3 === 0;
  };

  const getHighlightBadgeClass = (color: string) => {
    switch (color) {
      case 'sauge':
        return 'bg-sauge-wash text-sauge border-b-2 border-sauge/50';
      case 'prune':
        return 'bg-prune-wash text-prune border-b-2 border-prune/50';
      case 'terre':
        return 'bg-terre-wash text-terre-ink border-b-2 border-terre/50';
      default:
        return 'bg-soleil-wash text-ink border-b-2 border-soleil';
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto w-full px-8 md:px-10 py-10 space-y-6 relative">
      {/* Notification Toast discrète */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-rail text-rail-ink px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check size={14} className="text-soleil" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BARRE D'OUTILS PREMIUM DU LECTEUR */}
      <div className="bg-paper border border-rule rounded-2xl p-3.5 px-5 flex items-center justify-between gap-4 shadow-sm flex-wrap">
        {/* Gauche : Retour + Langue CECRL + Auteur */}
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink transition-colors"
              title="Retour à la bibliothèque"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span
            className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
              bookLang === 'de'
                ? 'text-prune bg-prune-wash'
                : 'text-sauge bg-sauge-wash'
            }`}
          >
            {bookLang === 'de' ? '🇩🇪 Deutsch' : '🇫🇷 Français'}{' '}
            {chapterData?.book.cefrLevel || 'B1'}
          </span>
          <span className="text-xs text-ink-2 font-medium hidden sm:inline">
            {chapterData?.book.author || 'Édition Critique'}
          </span>
        </div>

        {/* Centre & Droite : Outils d'Édition Critique */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Sommaire (TOC) */}
          <button
            type="button"
            onClick={() =>
              setActiveDrawer(activeDrawer === 'toc' ? 'none' : 'toc')
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
              activeDrawer === 'toc'
                ? 'bg-ink text-paper border-ink'
                : 'border-rule-soft hover:bg-paper-warm text-ink-2'
            }`}
            title="Table des matières / Chapitres"
          >
            <List size={13} />
            <span>Sommaire ({chapterData?.book.totalChapters || 1})</span>
          </button>

          {/* Bouton Signets & Notes */}
          <button
            type="button"
            onClick={() =>
              setActiveDrawer(
                activeDrawer === 'bookmarks' ? 'none' : 'bookmarks'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
              activeDrawer === 'bookmarks'
                ? 'bg-ink text-paper border-ink'
                : 'border-rule-soft hover:bg-paper-warm text-ink-2'
            }`}
            title="Signets et passages surlignés"
          >
            <Bookmark size={13} />
            <span>Signets ({annotations.length})</span>
          </button>

          {/* Bouton Mode Surligneur */}
          <button
            type="button"
            onClick={() => {
              const next = !isHighlightMode;
              setIsHighlightMode(next);
              if (next) {
                showToast(
                  'Mode Surligneur actif : sélectionnez un passage à la souris pour le surligner.'
                );
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
              isHighlightMode
                ? 'bg-soleil text-soleil-ink border-soleil font-bold shadow-sm'
                : 'border-rule-soft hover:bg-paper-warm text-ink-2'
            }`}
            title="Activer le mode surlignage au curseur"
          >
            <Highlighter size={13} />
            <span>Surligner</span>
          </button>

          {/* Sélecteur de couleur de surlignage si le mode surligneur est actif */}
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
                  title={`Pigment ${c.id}`}
                />
              ))}
            </div>
          )}

          {/* Filtre Gloses API (<ruby><rt>) */}
          <button
            type="button"
            onClick={handleCycleIpaMode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-warm border border-rule text-xs font-semibold text-ink-2 hover:text-ink transition-colors"
            title="Alterner l'affichage des gloses phonétiques API"
          >
            <SlidersHorizontal size={12} className="text-sauge" />
            <span>
              IPA :{' '}
              <strong className="text-sauge">
                {ipaMode === 'keywords'
                  ? 'Mots-clés'
                  : ipaMode === 'all'
                  ? 'Intégral'
                  : 'Masqué'}
              </strong>
            </span>
          </button>

          {/* Bouton Audio V.O. (TTS) */}
          <button
            type="button"
            onClick={() => setShowTtsBar(!showTtsBar)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
              showTtsBar || isTtsPlaying
                ? 'bg-sauge text-white border-sauge'
                : 'border-rule-soft hover:bg-paper-warm text-ink-2'
            }`}
            title="Lecteur Audio V.O. (Synthèse Vocale Naturelle)"
          >
            <Headphones size={13} />
            <span>Audio V.O.</span>
          </button>

          {/* Taille de police A- / A+ */}
          <div className="inline-flex items-center rounded-full border border-rule-soft bg-paper-warm overflow-hidden">
            <button
              type="button"
              onClick={() => handleAdjustFontSize(-1)}
              className="px-2.5 py-1 text-xs font-bold text-ink-2 hover:text-ink hover:bg-black/5 transition-colors"
              title="Réduire la taille du texte"
            >
              A-
            </button>
            <span className="w-px h-3.5 bg-rule" />
            <button
              type="button"
              onClick={() => handleAdjustFontSize(1)}
              className="px-2.5 py-1 text-xs font-bold text-ink-2 hover:text-ink hover:bg-black/5 transition-colors"
              title="Agrandir la taille du texte"
            >
              A+
            </button>
          </div>

          <span className="w-px h-4 bg-rule hidden md:inline" />

          {/* Accès rapide au Studio Phonétique */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('shadowing')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sauge-wash text-sauge font-bold text-xs hover:bg-sauge/20 transition-colors"
          >
            <Volume2 size={14} />
            <span>Studio Phonétique</span>
          </button>
        </div>
      </div>

      {/* 2. BARRE FLOTTANTE DE LECTURE AUDIO TTS V.O. */}
      {showTtsBar && (
        <div className="bg-paper border border-rule rounded-2xl p-4 px-6 shadow-md flex items-center justify-between gap-6 flex-wrap animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleToggleChapterTts}
              className="w-10 h-10 rounded-full bg-sauge hover:bg-sauge-2 text-white flex items-center justify-center shadow transition-transform active:scale-95"
              title={isTtsPlaying ? 'Mettre en pause' : 'Écouter le chapitre'}
            >
              {isTtsPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            {isTtsPlaying && (
              <button
                type="button"
                onClick={handleStopChapterTts}
                className="w-8 h-8 rounded-full bg-paper-warm hover:bg-paper-2 border border-rule text-ink-2 flex items-center justify-center"
                title="Arrêter la lecture"
              >
                <Square size={13} />
              </button>
            )}
            <div>
              <p className="text-xs font-bold text-ink m-0">
                Lecture Vocale V.O. ·{' '}
                {bookLang === 'de' ? 'Voix Allemande (de-DE)' : 'Voix Française (fr-FR)'}
              </p>
              <p className="text-[11px] text-ink-3 m-0">
                {chapterData?.chapter.title} ·{' '}
                {isTtsPlaying ? `Lecture en cours (${ttsProgress}%)` : 'Prêt à écouter'}
              </p>
            </div>
          </div>

          {/* Barre de progression audio */}
          <div className="flex-1 min-w-[160px] max-w-xs h-1.5 bg-paper-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-sauge transition-all duration-300 rounded-full"
              style={{ width: `${ttsProgress}%` }}
            />
          </div>

          {/* Sélecteur de cadence (0.8x, 1.0x, 1.2x) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-ink-3 font-bold mr-1">
              Cadence
            </span>
            {([0.8, 1.0, 1.2] as const).map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleChangeTtsRate(rate)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                  ttsRate === rate
                    ? 'bg-sauge text-white'
                    : 'bg-paper-warm text-ink-2 hover:text-ink border border-rule-soft'
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
            <strong className="text-ink">Sélection :</strong> «{' '}
            {selectedPassage.slice(0, 90)}
            {selectedPassage.length > 90 ? '…' : ''} »
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => speakText(selectedPassage)}
              className="px-3 py-1 rounded-full bg-paper border border-rule text-ink font-semibold hover:bg-sauge-wash hover:text-sauge transition-colors inline-flex items-center gap-1"
            >
              <Volume2 size={12} />
              <span>Écouter</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleCreateAnnotation('highlight', selectedPassage, undefined, highlightColor)
              }
              className="px-3 py-1 rounded-full bg-soleil text-soleil-ink font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-1"
            >
              <Highlighter size={12} />
              <span>Surligner</span>
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

      {/* 3. FEUILLE DE LECTURE PRINCIPALE */}
      <div className="bg-paper border border-rule rounded-3xl p-10 md:p-16 shadow-lg min-h-[600px] relative">
        {loading ? (
          <div className="py-28 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-prune border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-2 font-medium">
              Chargement de l’édition critique…
            </p>
          </div>
        ) : (
          <>
            {/* En-tête du Chapitre */}
            <div className="text-center mb-12 border-b border-rule/60 pb-8 relative">
              <p className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-ink-3 mb-2">
                Chapitre {chapterData?.chapter.number || currentChapterNum} sur{' '}
                {chapterData?.book.totalChapters || 1}
              </p>
              <h1 className="font-serif text-[38px] md:text-[44px] font-normal text-ink m-0 leading-tight">
                {chapterData?.book.title || 'Ouvrage Littéraire'}
              </h1>
              <p className="text-xs text-ink-2 mt-2 font-medium italic">
                {chapterData?.chapter.title}
              </p>
              <p className="text-[11px] text-sauge mt-3 font-medium">
                Cliquez sur n’importe quel mot du texte pour inspecter sa phonétique IPA, l’écouter ou l’ajouter à vos cartes FSRS
              </p>
            </div>

            {/* Prose Interactive Mot à Mot (Tous les livres & chapitres) */}
            <div
              onMouseUp={handleProseMouseUp}
              style={{ fontSize: `${fontSize}px` }}
              className="font-serif leading-[2.2] text-ink text-justify space-y-8 select-text transition-all"
            >
              {parsedParagraphs.map((para, pIdx) => {
                const tokens = para.text.split(/(\s+)/);
                let firstWordRendered = false;

                // Vérifier si ce paragraphe contient un passage surligné par l'utilisateur
                const matchingHighlight = chapterHighlights.find(
                  (h) =>
                    h.selectedText &&
                    para.text.toLowerCase().includes(h.selectedText.toLowerCase())
                );

                const content = tokens.map((token, tIdx) => {
                  if (/^\s+$/.test(token)) {
                    return <React.Fragment key={tIdx}>{token}</React.Fragment>;
                  }

                  const clean = cleanToken(token);
                  const isFirstWordOfChapter = pIdx === 0 && !firstWordRendered && clean.length > 0;
                  if (isFirstWordOfChapter) {
                    firstWordRendered = true;
                  }

                  const isSelected =
                    selectedWord &&
                    clean.toLowerCase() === selectedWord.word.toLowerCase();

                  const showRuby = shouldDisplayRuby(token, tIdx);
                  const rubyIpa = showRuby ? quickClientIpa(clean, bookLang) : '';

                  // Si c'est le tout premier mot du chapitre, afficher la lettrine (Drop-cap)
                  if (isFirstWordOfChapter && token.length >= 1) {
                    const firstChar = token.charAt(0);
                    const restToken = token.slice(1);
                    return (
                      <span
                        key={tIdx}
                        onClick={() => handleInteractiveWordClick(token, para.text)}
                        className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-sauge-wash hover:text-sauge ${
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
                        onClick={() => handleInteractiveWordClick(token, para.text)}
                        className={`target-word cursor-pointer rounded px-0.5 transition-colors hover:bg-sauge-wash ${
                          isSelected
                            ? 'bg-prune-wash text-prune font-semibold underline'
                            : 'text-prune hover:underline'
                        }`}
                      >
                        {token}
                        <rt className="text-sauge font-sans text-[11px] font-normal select-none">
                          {rubyIpa}
                        </rt>
                      </ruby>
                    );
                  }

                  return (
                    <span
                      key={tIdx}
                      onClick={() => handleInteractiveWordClick(token, para.text)}
                      className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-sauge-wash hover:text-sauge ${
                        isSelected
                          ? 'bg-prune-wash text-prune font-semibold underline'
                          : ''
                      }`}
                    >
                      {token}
                    </span>
                  );
                });

                if (para.tag === 'blockquote') {
                  return (
                    <blockquote
                      key={pIdx}
                      className={`pl-6 border-l-2 border-soleil my-6 italic text-ink-2 ${
                        matchingHighlight
                          ? getHighlightBadgeClass(matchingHighlight.color) + ' p-3 rounded-r-xl'
                          : ''
                      }`}
                    >
                      <p>{content}</p>
                    </blockquote>
                  );
                }

                return (
                  <p
                    key={pIdx}
                    className={
                      matchingHighlight
                        ? `${getHighlightBadgeClass(matchingHighlight.color)} px-3 py-1 rounded-lg`
                        : ''
                    }
                  >
                    {content}
                  </p>
                );
              })}
            </div>

            {/* Pied de page & Navigation entre chapitres */}
            <div className="flex items-center justify-between pt-12 mt-12 border-t border-rule/60 flex-wrap gap-4">
              <button
                type="button"
                disabled={currentChapterNum <= 1}
                onClick={handlePrevChapter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-rule hover:bg-paper-warm text-xs font-semibold text-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Chapitre précédent</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-ink-3 font-mono">
                <span>{chapterData?.chapter.wordCount || 0} mots</span>
                <span>·</span>
                <span>
                  ~{Math.max(1, Math.round((chapterData?.chapter.wordCount || 250) / 180))} min
                  de lecture
                </span>
              </div>

              <button
                type="button"
                disabled={Boolean(
                  chapterData && currentChapterNum >= chapterData.book.totalChapters
                )}
                onClick={handleNextChapter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-prune hover:bg-prune-2 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <span>Chapitre suivant</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 4. TIROIR LATÉRAL : SOMMAIRE DES CHAPITRES (TOC DRAWER) */}
      {activeDrawer === 'toc' && (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-paper border-l border-rule shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-4 border-b border-rule">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-sauge">
                Table des Matières
              </p>
              <h3 className="font-serif text-xl text-ink m-0">
                {chapterData?.book.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {(chapterData?.book.chapters || []).map((ch) => {
              const isCurrent = ch.number === currentChapterNum;
              return (
                <button
                  key={ch.id || ch.number}
                  type="button"
                  onClick={() => handleSelectChapterNumber(ch.number)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-sauge-wash border-sauge/40 text-sauge font-bold'
                      : 'bg-paper-warm/60 border-rule-soft text-ink hover:bg-paper-warm'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider opacity-75 m-0">
                      Chapitre {ch.number} {isCurrent ? '· En lecture' : ''}
                    </p>
                    <p className="font-serif text-sm truncate m-0 mt-0.5">
                      {ch.title}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono opacity-75 flex-shrink-0">
                    {ch.wordCount} mots
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TIROIR LATÉRAL : SIGNETS & SURLIGNAGES (BOOKMARKS DRAWER) */}
      {activeDrawer === 'bookmarks' && (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-paper border-l border-rule shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-4 border-b border-rule">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-prune">
                Marginalia & Références
              </p>
              <h3 className="font-serif text-xl text-ink m-0">
                Signets & Surlignages ({annotations.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ajout rapide d'un signet sur le chapitre actuel */}
          <div className="py-4 border-b border-rule-soft space-y-2.5">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-ink-3">
              Nouveau signet · Chapitre {currentChapterNum}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                placeholder="Note personnelle ou réflexion critique…"
                className="flex-1 bg-paper-warm border border-rule rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-prune"
              />
              <button
                type="button"
                onClick={() =>
                  handleCreateAnnotation(
                    'bookmark',
                    chapterData?.chapter.title || `Chapitre ${currentChapterNum}`,
                    newBookmarkNote || 'Repère de lecture'
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-prune hover:bg-prune-2 text-white text-xs font-bold flex items-center gap-1 flex-shrink-0"
              >
                <Plus size={14} />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Liste des signets et surlignages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {annotations.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-ink-3">
                <Bookmark size={28} className="mx-auto opacity-50" />
                <p className="text-xs">
                  Aucun signet ni passage surligné pour cet ouvrage.
                </p>
                <p className="text-[11px]">
                  Sélectionnez du texte dans le lecteur ou ajoutez un signet ci-dessus.
                </p>
              </div>
            ) : (
              annotations.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-rule bg-paper-warm/70 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChapterNumber(item.chapterNumber)}
                      className="text-[10px] font-extrabold uppercase tracking-wider text-sauge hover:underline"
                    >
                      {item.type === 'highlight' ? '✦ Surlignage' : '🔖 Signet'} · Chapitre{' '}
                      {item.chapterNumber}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(item.id)}
                      className="text-ink-3 hover:text-terre p-1 opacity-70 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="font-serif text-xs text-ink italic m-0 line-clamp-3">
                    « {item.selectedText} »
                  </p>
                  {item.note && (
                    <p className="text-[11px] text-ink-2 m-0 pt-1 border-t border-rule-soft">
                      Note : {item.note}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. CARTE FLOTTANTE : ANALYSE PHONÉTIQUE & LEXICALE DU MOT SÉLECTIONNÉ */}
      {selectedWord && (
        <div className="fixed bottom-8 right-8 w-[380px] max-w-[calc(100vw-2rem)] bg-paper border border-rule rounded-2xl shadow-2xl p-6 z-40 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-2xl font-bold text-ink m-0">
                  {selectedWord.lemma || selectedWord.word}
                </h3>
                <span className="text-xs font-mono text-sauge bg-sauge-wash px-2.5 py-0.5 rounded-full font-semibold">
                  {selectedWord.ipa}
                </span>
                <button
                  type="button"
                  onClick={() => speakText(selectedWord.word, 0.9)}
                  className="w-7 h-7 rounded-full bg-soleil-wash hover:bg-soleil text-soleil-ink flex items-center justify-center transition-colors"
                  title="Écouter la prononciation native"
                >
                  <Volume2 size={14} />
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 font-bold mt-1 m-0">
                {selectedWord.grammatical}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              className="text-ink-3 hover:text-ink p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-rule-soft">
            {wordLoading ? (
              <p className="text-xs text-ink-3 italic animate-pulse">
                Consultation du lexique critique et morphologique…
              </p>
            ) : (
              <>
                <p className="text-xs text-ink-2 m-0">
                  <strong className="text-ink">Traduction / Sens :</strong>{' '}
                  {selectedWord.translation}
                </p>
                <p className="text-xs text-ink-2 leading-relaxed m-0">
                  <strong className="text-ink">Analyse & Définition :</strong>{' '}
                  {selectedWord.definition}
                </p>
              </>
            )}

            {selectedWord.sentence && (
              <div className="bg-paper-warm p-2.5 rounded-xl border border-rule-soft text-[11px] text-ink-2 italic flex items-start justify-between gap-2">
                <span className="line-clamp-2">« {selectedWord.sentence} »</span>
                <button
                  type="button"
                  onClick={() => speakText(selectedWord.sentence!, 0.95)}
                  className="text-sauge hover:text-sauge-2 flex-shrink-0 p-1"
                  title="Écouter la phrase complète en contexte"
                >
                  <Volume2 size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-rule-soft">
            <button
              type="button"
              disabled={savingFsrs || savedToFsrs}
              onClick={handleAddWordToFsrs}
              className={`text-[11px] font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-colors ${
                savedToFsrs
                  ? 'bg-sauge-wash text-sauge cursor-default'
                  : 'bg-sauge hover:bg-sauge-2 text-white shadow-sm'
              }`}
            >
              {savedToFsrs ? <Check size={13} /> : <Sparkles size={13} />}
              <span>
                {savedToFsrs
                  ? 'Ajouté aux cartes FSRS'
                  : savingFsrs
                  ? 'Enregistrement…'
                  : 'Ajouter aux cartes FSRS'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('shadowing')}
              className="text-[11px] font-bold text-prune hover:underline"
            >
              Prononcer en studio →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
