import React, { useState, useEffect } from 'react';
import { Volume2, Bookmark, Highlighter, Sparkles, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { ViewType } from '../../types';

interface SelectedWord {
  word: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
}

interface ChapterData {
  book: {
    id: string;
    title: string;
    author: string;
    cefrLevel: string;
    totalChapters: number;
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

interface ReaderViewProps {
  bookId?: string;
  chapterNumber?: number;
  onNavigate?: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  bookId = 'le-petit-prince',
  chapterNumber = 2,
  onNavigate,
  onSelectBook,
}) => {
  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChapterNum, setCurrentChapterNum] = useState(chapterNumber);

  useEffect(() => {
    setCurrentChapterNum(chapterNumber);
  }, [chapterNumber]);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<ChapterData>(`/books/${bookId}/chapters/${currentChapterNum}`);
        setChapterData(data);

        // Mettre à jour la progression de lecture dans la base de données
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

    fetchChapter();
  }, [bookId, currentChapterNum]);

  const handleWordClick = (word: string, ipa: string, translation: string, definition: string, grammatical: string) => {
    setSelectedWord({ word, ipa, translation, definition, grammatical });
  };

  const handlePrevChapter = () => {
    if (currentChapterNum > 1) {
      setCurrentChapterNum(currentChapterNum - 1);
      if (onSelectBook) onSelectBook(bookId, currentChapterNum - 1);
    }
  };

  const handleNextChapter = () => {
    if (chapterData && currentChapterNum < chapterData.book.totalChapters) {
      setCurrentChapterNum(currentChapterNum + 1);
      if (onSelectBook) onSelectBook(bookId, currentChapterNum + 1);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto w-full px-10 py-10 space-y-8 relative">
      {/* Barre d'outils du Lecteur */}
      <div className="bg-paper border border-rule rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm flex-wrap">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="p-1.5 rounded-full hover:bg-paper-warm text-ink-3 hover:text-ink transition-colors mr-1"
              title="Retour à la bibliothèque"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-sauge bg-sauge-wash px-2.5 py-1 rounded-full">
            Édition Critique · Français {chapterData?.book.cefrLevel || 'B1'}
          </span>
          <span className="text-xs text-ink-2 font-medium">
            {chapterData?.book.author || 'Antoine de Saint-Exupéry'}
          </span>
        </div>

        {/* Contrôles de lecture */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-semibold text-ink-2 transition-colors"
          >
            <Bookmark size={13} />
            <span>Signet</span>
          </button>

          <button 
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule-soft hover:bg-paper-warm text-xs font-semibold text-ink-2 transition-colors"
          >
            <Highlighter size={13} />
            <span>Surligner</span>
          </button>

          <span className="w-px h-4 bg-rule" />

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

      {/* Papel de Lectura Principal */}
      <div className="bg-paper border border-rule rounded-3xl p-12 md:p-16 shadow-lg min-h-[600px] relative">
        {loading ? (
          <div className="py-28 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-prune border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-2 font-medium">Chargement du texte critique...</p>
          </div>
        ) : (
          <>
            {/* Titre du Chapitre */}
            <div className="text-center mb-12 border-b border-rule/60 pb-8">
              <p className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-ink-3 mb-2">
                Chapitre {chapterData?.chapter.number || currentChapterNum} sur {chapterData?.book.totalChapters || 3}
              </p>
              <h1 className="font-serif text-[42px] font-normal text-ink m-0">
                {chapterData?.book.title || 'Le Petit Prince'}
              </h1>
              <p className="text-xs text-ink-2 mt-2 font-medium italic">
                {chapterData?.chapter.title}
              </p>
            </div>

            {/* Prosa con Lettrine y Ruby IPA interactivo */}
            {bookId === 'le-petit-prince' && currentChapterNum === 2 ? (
              <div className="font-serif text-[22px] md:text-[24px] leading-[2.2] text-ink text-justify space-y-8 select-text">
                <p>
                  <span className="drop-cap">J</span>
                  'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert de{' '}
                  <ruby 
                    className="target-word cursor-pointer text-prune hover:underline" 
                    onClick={() => handleWordClick('Sahara', '/sa.a.ʁa/', 'Sáhara', 'Grand désert situé dans la partie nord du continent africain.', 'Nom propre géographique')}
                  >
                    Sahara<rt className="text-sauge font-sans text-[11px]">/sa.a.ʁa/</rt>
                  </ruby>
                  , il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je me préparais à essayer de réussir, tout seul, une{' '}
                  <ruby 
                    className="target-word cursor-pointer text-prune hover:underline"
                    onClick={() => handleWordClick('réparation', '/ʁe.pa.ʁa.sjɔ̃/', 'remise en état', 'Action de remettre en bon état un mécanisme endommagé.', 'Nom féminin · Registre soigné')}
                  >
                    réparation<rt className="text-sauge font-sans text-[11px]">/ʁe.pa.ʁa.sjɔ̃/</rt>
                  </ruby>{' '}
                  difficile. C'était pour moi une question de vie ou de mort. J'avais de l'eau à boire à peine pour huit jours.
                </p>

                <p>
                  Le premier soir je me suis donc endormi sur le sable à{' '}
                  <ruby 
                    className="target-word cursor-pointer text-prune hover:underline"
                    onClick={() => handleWordClick('mille', '/mil/', 'mille (invariable)', 'Nombre désignant dix fois cent. Note phonétique : le digraphe "ll" se prononce /l/ et non /j/.', 'Adjectif numéral invariable')}
                  >
                    mille<rt className="text-sauge font-sans text-[11px]">/mil/</rt>
                  </ruby>{' '}
                  milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait :
                </p>

                <blockquote className="pl-6 border-l-2 border-soleil my-6 italic text-ink-2 space-y-2">
                  <p>
                    — S'il vous plaît…{' '}
                    <ruby 
                      className="target-word cursor-pointer text-prune hover:underline"
                      onClick={() => handleWordClick('dessine-moi', '/de.sin.mwa/', 'dessine-moi', 'Forme impérative du verbe dessiner avec pronom personnel réfléchi enclitique.', 'Verbe transitif')}
                    >
                      dessine-moi<rt className="text-sauge font-sans text-[11px]">/de.sin.mwa/</rt>
                    </ruby>{' '}
                    un mouton !
                  </p>
                  <p>— Hein !</p>
                  <p>— Dessine-moi un mouton…</p>
                </blockquote>

                <p>
                  Je sautai sur mes pieds comme si j'avais été frappé par la foudre. Je me frottai bien les yeux. Je regardai bien. Et je vis un petit bonhomme tout à fait extraordinaire qui me considérait gravement.
                </p>
              </div>
            ) : (
              <div 
                className="font-serif text-[22px] md:text-[24px] leading-[2.2] text-ink text-justify space-y-8 select-text"
                dangerouslySetInnerHTML={{ __html: chapterData?.chapter.contentHtml || '' }}
              />
            )}

            {/* Navigation entre chapitres */}
            <div className="flex items-center justify-between pt-12 mt-12 border-t border-rule/60">
              <button
                type="button"
                disabled={currentChapterNum <= 1}
                onClick={handlePrevChapter}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-rule hover:bg-paper-warm text-xs font-semibold text-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Chapitre précédent</span>
              </button>

              <span className="text-xs text-ink-3 font-mono">
                {chapterData?.chapter.wordCount} mots analysés
              </span>

              <button
                type="button"
                disabled={Boolean(chapterData && currentChapterNum >= chapterData.book.totalChapters)}
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

      {/* 4. CARTE LATÉRALE : ANALYSE DU MOT SÉLECTIONNÉ */}
      {selectedWord && (
        <div className="fixed bottom-8 right-8 w-96 bg-paper border border-rule rounded-2xl shadow-xl p-6 z-40 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold text-ink">{selectedWord.word}</h3>
                <span className="text-xs font-mono text-sauge bg-sauge-wash px-2 py-0.5 rounded">
                  {selectedWord.ipa}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold mt-1">
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

          <div className="space-y-2 pt-2 border-t border-rule-soft">
            <p className="text-xs text-ink-2">
              <strong className="text-ink">Traduction :</strong> {selectedWord.translation}
            </p>
            <p className="text-xs text-ink-2 leading-relaxed">
              <strong className="text-ink">Définition critique :</strong> {selectedWord.definition}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              className="text-[11px] font-bold text-sauge hover:text-sauge-2 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Ajouter aux cartes FSRS</span>
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
