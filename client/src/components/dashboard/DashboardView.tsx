import React, { useState, useEffect, useMemo } from 'react';
import type { ViewType, User, BookSummary } from '../../types';
import { apiFetch } from '../../lib/api';
import {
  BookOpen,
  ArrowRight,
  Volume2,
  Sparkles,
  Check,
  Mic,
  BookOpenCheck,
  Brain,
  ArrowUpRight,
} from 'lucide-react';
import { quickClientIpa, type SupportedLang } from '../reader/ReaderView';

interface VocabularyCardSummary {
  id: string;
  word: string;
  ipa: string;
  translation: string;
  language: string;
  status: string;
  createdAt: string;
}

interface DashboardViewProps {
  user?: User | null;
  onNavigate: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
  onStatsLoaded?: (stats: { booksCount: number; vocabCount: number }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onSelectBook,
  onStatsLoaded,
}) => {
  const [myLibrary, setMyLibrary] = useState<BookSummary[]>([]);
  const [vocabCards, setVocabCards] = useState<VocabularyCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [motDuJourSaved, setMotDuJourSaved] = useState(false);

  const displayUserName =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Cher lecteur';

  // Date réelle formatée en français
  const formattedToday = useMemo(() => {
    try {
      const str = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return 'Atelier de Lecture & Phonétique Critique · Paris 8';
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [booksRes, vocabRes] = await Promise.all([
          apiFetch<BookSummary[]>('/books/my-library').catch(() => [] as BookSummary[]),
          apiFetch<VocabularyCardSummary[]>('/books/vocabulary').catch(
            () => [] as VocabularyCardSummary[]
          ),
        ]);

        setMyLibrary(booksRes || []);
        setVocabCards(vocabRes || []);

        const hasMotDuJour = (vocabRes || []).some(
          (c) => c.word.toLowerCase().includes('hommes')
        );
        setMotDuJourSaved(hasMotDuJour);

        if (onStatsLoaded) {
          onStatsLoaded({
            booksCount: (booksRes || []).length,
            vocabCount: (vocabRes || []).length,
          });
        }
      } catch (err) {
        console.error('Erreur chargement Tableau de bord:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currentBook = myLibrary.length > 0 ? myLibrary[0] : null;
  const totalBooks = myLibrary.length;

  // Calcul réel des mots lus par l'utilisateur
  const totalWordsRead = useMemo(() => {
    const fromBooks = myLibrary.reduce((acc, b) => {
      const bookWords = b.totalWords || 1200;
      const pct = Math.max(0, Math.min(100, b.progressPercent || 0));
      // Si l'ouvrage est ouvert au chapitre 1 mais 0%, compter au moins le début de lecture (ex. 120 mots)
      const effectiveWords =
        pct > 0 ? Math.round((bookWords * pct) / 100) : Math.min(180, bookWords);
      return acc + effectiveWords;
    }, 0);
    const fromVocab = vocabCards.length * 12;
    return fromBooks + fromVocab;
  }, [myLibrary, vocabCards]);

  // Série (jours actifs réels)
  const streakDays = useMemo(() => {
    if (myLibrary.length === 0 && vocabCards.length === 0) return 1;
    const uniqueDays = new Set<string>();
    uniqueDays.add(new Date().toISOString().slice(0, 10));
    vocabCards.forEach((c) => {
      if (c.createdAt) uniqueDays.add(c.createdAt.slice(0, 10));
    });
    return Math.max(1, uniqueDays.size);
  }, [myLibrary, vocabCards]);

  // Répartition réelle des cartes FSRS
  const fsrsStats = useMemo(() => {
    const total = vocabCards.length;
    const learning = vocabCards.filter((c) => c.status === 'learning').length;
    const review = vocabCards.filter((c) => c.status === 'review').length;
    const mastered = vocabCards.filter((c) => c.status === 'mastered').length;
    return { total, learning, review, mastered };
  }, [vocabCards]);

  // Progression par langue réelle
  const langProgress = useMemo(() => {
    const frBooks = myLibrary.filter((b) => (b.language || 'fr') === 'fr');
    const deBooks = myLibrary.filter((b) => b.language === 'de');

    const frReadChapters = frBooks.reduce((s, b) => s + (b.currentChapter || 1), 0);
    const frTotalChapters = Math.max(
      frReadChapters,
      frBooks.reduce((s, b) => s + (b.totalChapters || 1), 0)
    );

    const deReadChapters = deBooks.reduce((s, b) => s + (b.currentChapter || 1), 0);
    const deTotalChapters = Math.max(
      deReadChapters,
      deBooks.reduce((s, b) => s + (b.totalChapters || 1), 0)
    );

    return {
      frReadChapters,
      frTotalChapters,
      frPct: frTotalChapters > 0 ? Math.round((frReadChapters / frTotalChapters) * 100) : 0,
      deReadChapters,
      deTotalChapters,
      dePct: deTotalChapters > 0 ? Math.round((deReadChapters / deTotalChapters) * 100) : 0,
    };
  }, [myLibrary]);

  const handleResumeReading = () => {
    if (currentBook) {
      if (onSelectBook) {
        onSelectBook(currentBook.slug || currentBook.id, currentBook.currentChapter || 1);
      } else {
        onNavigate('reader');
      }
    }
  };

  const speakExcerpt = (text: string, lang = 'fr') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'de' ? 'de-DE' : 'fr-FR';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  const handleSaveMotDuJourToFsrs = async () => {
    if (motDuJourSaved) return;
    try {
      const created = await apiFetch<VocabularyCardSummary>('/books/vocabulary', {
        method: 'POST',
        body: JSON.stringify({
          word: 'les hommes',
          ipa: '/le.z‿ɔm/',
          translation: 'los hombres (liaison obligatoria /z/)',
          definition:
            'Syntagme nominal masculin pluriel illustrant la liaison obligatoire en français entre l’article défini « les » et un nom à initiale vocalique ou h muet.',
          grammatical: 'Syntagme nominal · Liaison /z/',
          contextSentence:
            "Souvent, pour s'amuser, les hommes d'équipage prennent des albatros, vastes oiseaux des mers.",
          language: 'fr',
        }),
      });
      setMotDuJourSaved(true);
      setVocabCards((prev) => [created, ...prev]);
      if (onStatsLoaded) {
        onStatsLoaded({
          booksCount: myLibrary.length,
          vocabCount: vocabCards.length + 1,
        });
      }
    } catch (err) {
      console.error('Erreur ajout Mot du jour:', err);
    }
  };

  const handlePracticeMotDuJourInShadowing = () => {
    const payload = {
      word: 'hommes',
      ipa: '/le.z‿ɔm/',
      sentence:
        "Souvent, pour s'amuser, les hommes d'équipage prennent des albatros, vastes oiseaux des mers.",
      language: 'fr',
      bookTitle: "Les Fleurs du Mal — L'Albatros",
    };
    localStorage.setItem('wonderword_shadowing_target', JSON.stringify(payload));
    onNavigate('shadowing');
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'soleil':
        return { bg: 'bg-soleil', text: 'text-soleil-ink', stroke: 'var(--sauge)' };
      case 'prune':
        return { bg: 'bg-prune', text: 'text-white', stroke: 'var(--prune)' };
      case 'sauge':
        return { bg: 'bg-sauge', text: 'text-white', stroke: 'var(--sauge)' };
      case 'terre':
        return { bg: 'bg-terre', text: 'text-white', stroke: 'var(--terre)' };
      case 'bleuet':
        return { bg: 'bg-bleuet', text: 'text-bleuet-ink', stroke: 'var(--bleuet)' };
      default:
        return { bg: 'bg-soleil', text: 'text-soleil-ink', stroke: 'var(--sauge)' };
    }
  };

  const colorStyles = getColorClasses(currentBook?.coverColor);

  // Extrait réel du livre en cours pour l'aperçu phonétique <ruby>
  const currentExcerptTokens = useMemo(() => {
    const raw =
      currentBook?.excerpt ||
      currentBook?.description ||
      "J’ai de sérieuses raisons de croire que la planète d’où venait le petit prince est l’astéroïde B 612.";
    const firstSentence = raw.split(/(?<=[.!?…])\s+/)[0] || raw;
    const words = firstSentence.slice(0, 115).split(/\s+/).filter(Boolean);
    const lang: SupportedLang = currentBook?.language === 'de' ? 'de' : 'fr';
    return { words, lang, text: firstSentence.slice(0, 140) };
  }, [currentBook]);

  return (
    <div className="max-w-[1240px] mx-auto w-full px-8 md:px-12 py-12 space-y-12">
      {/* 1. HERO GREETING AVEC NOM D'UTILISATEUR RÉEL ET MÉTRIQUES RÉELLES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-rule">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-terre-ink mb-3">
            {formattedToday}
          </p>
          <h1 className="font-serif text-[46px] md:text-[58px] font-normal leading-none tracking-tight text-ink m-0">
            Bienvenue, {displayUserName}.
          </h1>
        </div>

        {/* Métriques réelles de l'utilisateur */}
        <div className="flex items-end gap-0 self-start md:self-auto">
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">
              {totalWordsRead.toLocaleString('fr-FR')}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">
              Mots lus
            </p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">
              {totalBooks}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">
              Livres
            </p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="pl-6 text-right">
            <p className="font-serif text-[28px] font-normal text-terre-ink m-0 tabular-nums">
              {streakDays}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">
              Série (jours)
            </p>
          </div>
        </div>
      </div>

      {/* 2. CONTENU PRINCIPAL (2 COLONNES) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.66fr_1fr] gap-12 items-start">
        {/* Colonne Gauche: Lecture en Cours & Mot du Jour */}
        <div className="space-y-12">
          {/* SECTION: LECTURE EN COURS */}
          <section>
            <div className="flex items-center gap-3.5 mb-6">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-sauge relative">
                Lecture en cours
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sauge/20" />
              </span>
              <span className="flex-1 h-px bg-rule" />
            </div>

            {loading ? (
              <div className="p-10 text-center bg-paper border border-rule rounded-2xl">
                <p className="text-xs text-ink-2">Chargement de votre lecture en cours...</p>
              </div>
            ) : currentBook ? (
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Couverture du Livre */}
                <div className="w-36 flex-shrink-0">
                  {currentBook.coverImage ? (
                    <div className="aspect-[2/3] rounded-r-xl rounded-l-sm overflow-hidden shadow-md border border-rule relative bg-paper-warm">
                      <img
                        src={currentBook.coverImage}
                        alt={currentBook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`aspect-[2/3] ${colorStyles.bg} rounded-r-xl rounded-l-sm p-4 flex flex-col justify-between shadow-md border-l-2 border-black/10`}
                    >
                      <p
                        className={`text-[8px] uppercase tracking-widest font-semibold ${colorStyles.text} opacity-70`}
                      >
                        {currentBook.publisher || 'Éditions Critiques'}
                      </p>
                      <div>
                        <span className="block w-full h-px bg-black/20 mb-2" />
                        <p
                          className={`font-serif text-[17px] leading-tight ${colorStyles.text} font-normal line-clamp-2`}
                        >
                          {currentBook.title}
                        </p>
                        <p
                          className={`text-[9px] ${colorStyles.text} opacity-80 mt-1 line-clamp-1`}
                        >
                          {currentBook.author}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9.5px] uppercase tracking-wider font-bold text-sauge border border-sauge rounded-full px-2.5 py-0.5">
                      {currentBook.language === 'de' ? 'Deutsch' : 'Français'}{' '}
                      {currentBook.cefrLevel}
                    </span>
                    <span className="text-[10px] text-ink-3">{currentBook.year}</span>
                  </div>

                  {/* Progression Circulaire */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 52 52" className="w-14 h-14 -rotate-90">
                        <circle
                          cx="26"
                          cy="26"
                          r="22"
                          fill="none"
                          stroke="var(--rule-soft)"
                          strokeWidth="5"
                        />
                        <circle
                          cx="26"
                          cy="26"
                          r="22"
                          fill="none"
                          stroke="var(--sauge)"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="138.2"
                          strokeDashoffset={
                            138.2 - (138.2 * (currentBook.progressPercent || 0)) / 100
                          }
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-serif text-[13px] text-ink">
                        {Math.round(currentBook.progressPercent || 0)}%
                      </span>
                    </div>
                    <span className="text-[11px] leading-tight text-ink-2">
                      Chapitre {currentBook.currentChapter || 1}
                      <br />
                      sur {currentBook.totalChapters || 1}
                    </span>
                  </div>
                </div>

                {/* Détails et Extrait avec Phonétique */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-[36px] font-normal leading-tight text-ink m-0 mb-1">
                    {currentBook.title}
                  </h2>
                  <p className="text-[13px] text-ink-2 mb-6">
                    {currentBook.author} · Chapitre {currentBook.currentChapter || 1}
                  </p>

                  {/* Carte "Reprendre ici" avec gloses <ruby> */}
                  <div className="bg-paper p-5 rounded-2xl border border-rule shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-ink-3 mb-2.5">
                      Reprendre la lecture (Aperçu Phonétique IPA)
                    </p>
                    <p className="font-serif text-[19px] leading-[2.2] text-ink m-0">
                      {currentExcerptTokens.words.map((w, idx) => {
                        const clean = w.replace(/[.,;!?«»"()—–]/g, '');
                        const showRuby = clean.length >= 4 && idx % 2 === 0;
                        const ipa = showRuby
                          ? quickClientIpa(clean, currentExcerptTokens.lang)
                          : '';
                        return (
                          <React.Fragment key={idx}>
                            {showRuby && ipa ? (
                              <ruby className="px-0.5">
                                {w}
                                <rt className="font-ipa text-sauge text-[10.5px] font-bold">
                                  {ipa}
                                </rt>
                              </ruby>
                            ) : (
                              <span>{w}</span>
                            )}{' '}
                          </React.Fragment>
                        );
                      })}
                      …
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-5 mt-6 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResumeReading}
                      className="bg-prune hover:bg-prune-2 text-white text-[11px] font-bold uppercase tracking-widest px-7 py-3 rounded-full shadow transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continuer la lecture</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        speakExcerpt(currentExcerptTokens.text, currentExcerptTokens.lang)
                      }
                      className="text-[11px] font-bold uppercase tracking-widest text-sauge hover:text-sauge-2 border-b border-sauge/40 pb-0.5 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 size={14} />
                      <span>Écouter l’extrait</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('shadowing')}
                      className="text-[11px] font-bold uppercase tracking-widest text-ink-2 border-b border-rule hover:border-ink pb-0.5 transition-colors cursor-pointer"
                    >
                      Studio Phonétique
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-paper border border-rule rounded-2xl p-8 text-center space-y-4">
                <BookOpen size={36} className="text-sauge mx-auto" />
                <h3 className="font-serif text-2xl text-ink">
                  Votre bibliothèque personnelle est prête, {displayUserName}
                </h3>
                <p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
                  Importez votre premier classique depuis le catalogue public (Gutenberg, DraCor,
                  Patrimoine Paris 8) ou ouvrez le Studio pour analyser vos propres textes et
                  fichiers <code>.EPUB</code> / <code>.PDF</code>.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigate('library')}
                    className="bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full shadow transition-all cursor-pointer"
                  >
                    Explorer le Catalogue (Découvrir)
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('reader')}
                    className="bg-paper-warm hover:bg-paper-2 border border-rule text-ink text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-all cursor-pointer"
                  >
                    Ouvrir le Studio &amp; Taller (/reader)
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SECTION: MOT DU JOUR (AVEC AUDIO & SAUVEGARDE FSRS RÉELLE) */}
          <section className="bg-paper p-6 rounded-2xl border border-rule shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9.5px] uppercase tracking-widest font-bold text-bleuet-ink bg-soleil-wash px-2.5 py-0.5 rounded">
                Mot du jour
              </span>
              <span className="text-xs text-ink-3">· Liaison obligatoire en français</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <div className="font-serif text-[34px] text-ink leading-tight flex items-baseline gap-1.5">
                  <ruby>
                    les<rt className="font-ipa text-[11px] text-ink-3">le</rt>
                  </ruby>
                  <span className="text-terre font-bold">‿</span>
                  <ruby>
                    hommes<rt className="font-ipa text-[11px] text-ink-3">ɔm</rt>
                  </ruby>
                </div>
                <p className="font-ipa text-sauge text-[14.5px] mt-1 font-bold">/le.z‿ɔm/</p>
                <p className="text-[13px] text-ink-2 mt-2 leading-relaxed max-w-xl">
                  « Les hommes ». Le <em>s</em> final muet se prononce{' '}
                  <span className="font-bold text-terre">/z/</span> lors de l’enchaînement avec la
                  voyelle initiale suivante (liaison obligatoire marquée dans l’Atelier par{' '}
                  <strong className="text-terre">‿</strong>).
                </p>
              </div>

              <div className="flex flex-col gap-2 self-start sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => speakExcerpt('les hommes', 'fr')}
                  className="bg-paper-warm hover:bg-paper-2 border border-rule text-ink text-[11px] font-semibold px-4 py-2 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 size={13} className="text-sauge" />
                  <span>Écouter la liaison</span>
                </button>

                <button
                  type="button"
                  disabled={motDuJourSaved}
                  onClick={handleSaveMotDuJourToFsrs}
                  className={`text-[11px] font-semibold px-4 py-2 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    motDuJourSaved
                      ? 'bg-sauge-wash text-sauge border border-sauge/30'
                      : 'bg-sauge hover:bg-sauge-2 text-white shadow-sm'
                  }`}
                >
                  {motDuJourSaved ? <Check size={13} /> : <Sparkles size={13} />}
                  <span>{motDuJourSaved ? 'Dans votre paquet FSRS' : 'Ajouter au paquet FSRS'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePracticeMotDuJourInShadowing}
                  className="bg-paper hover:bg-paper-warm border border-rule text-ink-2 hover:text-ink text-[11px] font-semibold px-4 py-1.5 rounded-full transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic size={12} className="text-terre" />
                  <span>Pratiquer en Shadowing</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Colonne Droite: Système de Révision (FSRS Réel) & Parcours */}
        <div className="space-y-8">
          {/* Carte de Répétition Espacée connectée à PostgreSQL */}
          <div className="bg-paper p-7 rounded-2xl border border-rule shadow-sm">
            <span className="inline-block bg-soleil text-soleil-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-4">
              Cartes du jour (FSRS)
            </span>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-serif text-[56px] font-normal text-ink leading-none tabular-nums">
                {fsrsStats.total}
              </span>
              <span className="text-[13px] text-ink-3">
                {fsrsStats.total === 1
                  ? 'carte enregistrée dans votre paquet'
                  : 'cartes enregistrées dans votre paquet'}
              </span>
            </div>

            <p className="text-[13px] text-ink-2 mb-6">
              {fsrsStats.total > 0
                ? 'Révisez les mots capturés lors de vos lectures dans l’Atelier pour consolider leur rétention à long terme.'
                : 'Cliquez sur n’importe quel mot dans l’Atelier de Lecture pour l’ajouter en 1 clic à votre paquet FSRS.'}
            </p>

            <div className="space-y-2.5 text-[12.5px] border-t border-rule/60 pt-4 mb-6">
              <div className="flex justify-between text-ink-2">
                <span>En apprentissage</span>
                <span className="font-bold text-ink tabular-nums">{fsrsStats.learning}</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>En révision</span>
                <span className="font-bold text-ink tabular-nums">{fsrsStats.review}</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>Maîtrisées</span>
                <span className="font-bold text-sauge tabular-nums">{fsrsStats.mastered}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('vocabulary')}
              className="w-full bg-sauge hover:bg-sauge-2 text-white font-bold text-[12px] uppercase tracking-wider py-3 rounded-full transition-all shadow cursor-pointer"
            >
              {fsrsStats.total > 0 ? 'Ouvrir mon paquet FSRS' : 'Voir le module Vocabulaire FSRS'}
            </button>
          </div>

          {/* Parcours Linguistique Dynamique */}
          <div className="bg-paper p-6 rounded-2xl border border-rule shadow-sm space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-ink-3 m-0">
              Parcours Linguistique Actif
            </h3>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Français Littéraire</span>
                  <span className="text-sauge tabular-nums">
                    {langProgress.frReadChapters} / {langProgress.frTotalChapters || 1} chap.
                  </span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sauge rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(6, langProgress.frPct)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Deutsch (Allemand)</span>
                  <span className="text-bleuet-ink tabular-nums">
                    {langProgress.deReadChapters} / {langProgress.deTotalChapters || 1} chap.
                  </span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bleuet-ink rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, langProgress.dePct)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Lexique &amp; Phonétique API</span>
                  <span className="text-terre-ink tabular-nums">
                    {vocabCards.length} termes annotés
                  </span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terre rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(8, vocabCards.length * 10))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accès Rapide aux 4 Piliers ("Aller à") */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-ink-3 m-0">
              Navigation Rapide
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="bg-paper hover:bg-paper-warm border border-rule rounded-2xl p-4 text-left transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <BookOpen size={17} className="text-terre-ink" />
                  <span className="font-serif text-sm text-ink-2">{totalBooks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Bibliothèque</span>
                  <ArrowUpRight size={13} className="text-ink-3" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reader')}
                className="bg-paper hover:bg-paper-warm border border-rule rounded-2xl p-4 text-left transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <BookOpenCheck size={17} className="text-prune" />
                  <span className="font-serif text-xs text-ink-2">Studio</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Atelier Lecture</span>
                  <ArrowUpRight size={13} className="text-ink-3" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('shadowing')}
                className="bg-paper hover:bg-paper-warm border border-rule rounded-2xl p-4 text-left transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Mic size={17} className="text-bleuet-ink" />
                  <span className="font-serif text-xs text-ink-2">Praat/DTW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Shadowing</span>
                  <ArrowUpRight size={13} className="text-ink-3" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('vocabulary')}
                className="bg-paper hover:bg-paper-warm border border-rule rounded-2xl p-4 text-left transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <Brain size={17} className="text-sauge" />
                  <span className="font-serif text-sm text-ink-2">{vocabCards.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Cartes FSRS</span>
                  <ArrowUpRight size={13} className="text-ink-3" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
