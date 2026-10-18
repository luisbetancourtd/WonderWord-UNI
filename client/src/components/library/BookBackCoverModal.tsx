import React, { useEffect } from 'react';
import { X, BookOpen, Download, Quote, Globe, Calendar, Layers, Bookmark } from 'lucide-react';
import type { BookSummary, CatalogBookItem } from '../../types';

interface BookBackCoverModalProps {
  book: (BookSummary | CatalogBookItem) | null;
  isOpen: boolean;
  onClose: () => void;
  onStartReading?: (bookId: string, chapterNumber?: number) => void;
  onImportBook?: (item: CatalogBookItem) => Promise<void>;
  isImporting?: boolean;
}

export const BookBackCoverModal: React.FC<BookBackCoverModalProps> = ({
  book,
  isOpen,
  onClose,
  onStartReading,
  onImportBook,
  isImporting = false,
}) => {
  // Fermer la modale avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !book) return null;

  const isBookSummary = 'totalChapters' in book;
  const isImported = isBookSummary ? true : Boolean(book.isImported);
  const coverUrl = ('coverImage' in book ? book.coverImage : null) || book.coverUrl;
  const language = book.language === 'de' ? 'de' : 'fr';
  const cefrLevel = book.cefrLevel || 'B1';
  const genre = ('genre' in book && book.genre) ? book.genre : 'Patrimoine littéraire classique';
  const source = 'source' in book ? book.source : 'Patrimoine';
  const excerpt = book.excerpt || book.description;
  const year = book.year || 1900;
  const publisher = 'publisher' in book ? book.publisher : `${source} (Édition Numérique Libre)`;

  const getCefrBadgeColor = (lvl: string) => {
    switch (lvl) {
      case 'A2':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'B1':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'B2':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'C1':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const getColorTheme = (color: string) => {
    switch (color) {
      case 'prune':
        return { bg: 'bg-prune', border: 'border-purple-900', text: 'text-prune' };
      case 'sauge':
        return { bg: 'bg-sauge', border: 'border-teal-800', text: 'text-sauge' };
      case 'terre':
        return { bg: 'bg-terre', border: 'border-orange-800', text: 'text-terre' };
      case 'bleuet':
        return { bg: 'bg-bleuet', border: 'border-blue-300', text: 'text-bleuet' };
      default:
        return { bg: 'bg-soleil', border: 'border-amber-300', text: 'text-soleil-ink' };
    }
  };

  const themeColors = getColorTheme(book.coverColor || 'soleil');

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-rule shadow-2xl rounded-3xl max-w-4xl w-full overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bandeau supérieur de style reliure */}
        <div className="bg-paper-warm border-b border-rule px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sauge animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink-3">
              Fiche de l'Ouvrage · Quatrième de Couverture
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-rule hover:bg-paper text-ink-3 hover:text-ink flex items-center justify-center transition-all"
            title="Fermer (Échap)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps principal : deux volets (Couverture / Dos du livre) */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 max-h-[80vh] overflow-y-auto">
          {/* VOLET GAUCHE : COUVERTURE & RELIURE (md:col-span-4) */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
            {/* Portada con efecto de libro físico */}
            <div className="relative group w-full max-w-[210px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-black/10 bg-black/5 flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Couverture typographique de substitution si aucune image */
                <div className={`w-full h-full ${themeColors.bg} p-5 flex flex-col justify-between text-white shadow-inner`}>
                  <div className="text-[10px] uppercase tracking-widest opacity-80">
                    {publisher}
                  </div>
                  <div className="space-y-1 my-auto">
                    <h4 className="font-serif text-lg font-normal leading-tight">
                      {book.title}
                    </h4>
                    <p className="text-xs opacity-90 italic">
                      {book.author}
                    </p>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">
                    {year} · {language === 'de' ? 'Deutsch' : 'Français'}
                  </div>
                </div>
              )}

              {/* Effet d'arête de reliure (tranche et courbure du livre) */}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none" />
            </div>

            {/* Badges et métadonnées rapides */}
            <div className="w-full space-y-2 pt-2">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCefrBadgeColor(cefrLevel)}`}>
                  Niveau {cefrLevel}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-paper-warm border border-rule text-ink-2">
                  {language === 'de' ? '🇩🇪 Allemand' : '🇫🇷 Français'}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-paper-warm border border-rule text-ink-2 flex items-center gap-1">
                  <Globe size={11} className="text-sauge" />
                  {source}
                </span>
              </div>

              <div className="text-[11px] text-ink-3 flex items-center justify-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {year}
                </span>
                {isBookSummary && book.totalWords > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers size={12} /> ~{book.totalWords.toLocaleString('fr-FR')} mots
                  </span>
                )}
                {isBookSummary && book.totalChapters > 0 && (
                  <span>· {book.totalChapters} chapitres</span>
                )}
              </div>
            </div>
          </div>

          {/* VOLET DROIT : QUATRIÈME DE COUVERTURE & EXTRAIT (md:col-span-8) */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-6 min-w-0">
            <div className="space-y-5">
              {/* Titre et Auteur */}
              <div className="border-b border-rule pb-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-sauge block mb-1">
                  {genre}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl font-normal text-ink leading-snug">
                  {book.title}
                </h2>
                <p className="font-serif text-base text-prune italic mt-1">
                  {book.author}
                </p>
                <p className="text-xs text-ink-3 mt-1">
                  Édition de référence : {publisher}
                </p>
              </div>

              {/* Présentation / Synopsis */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-widest font-bold text-ink-3 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-prune" />
                  Présentation de l'Œuvre
                </h3>
                <p className="text-sm text-ink leading-relaxed">
                  {book.description || "Ouvrage classique du patrimoine littéraire libre de droits."}
                </p>
              </div>

              {/* Extrait / Incipit du livre */}
              {excerpt && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-ink-3 flex items-center gap-1.5">
                    <Quote size={13} className="text-sauge" />
                    Extrait & Incipit du Texte
                  </h3>
                  <div className="bg-paper-warm/80 border-l-4 border-prune/70 p-4 rounded-r-2xl space-y-1 shadow-sm">
                    <p className="font-serif italic text-sm text-ink/90 leading-relaxed">
                      « {excerpt} »
                    </p>
                    <span className="text-[10px] text-ink-3 uppercase tracking-wider block text-right font-sans">
                      — Premières lignes de l'édition originale
                    </span>
                  </div>
                </div>
              )}

              {/* Si l'ouvrage est déjà dans sa bibliothèque : liste des chapitres */}
              {isBookSummary && book.chapters && book.chapters.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-ink-3 flex items-center gap-1.5">
                    <Bookmark size={13} className="text-sauge" />
                    Sommaire des Chapitres ({book.chapters.length})
                  </h3>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                    {book.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          if (onStartReading) {
                            onStartReading(book.slug || book.id, ch.number);
                            onClose();
                          }
                        }}
                        className="flex items-center justify-between p-2 rounded-lg border border-rule/70 hover:border-prune/50 hover:bg-paper-warm cursor-pointer transition-all text-xs"
                      >
                        <span className="font-medium text-ink truncate mr-2">
                          {ch.title}
                        </span>
                        <span className="text-[11px] text-prune font-semibold flex-shrink-0">
                          Lire →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action en bas de modale */}
            <div className="pt-4 border-t border-rule flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-rule text-xs font-semibold text-ink-2 hover:bg-paper-warm transition-all"
              >
                Fermer
              </button>

              {isImported ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onStartReading) {
                      const bookIdentifier = 'slug' in book ? book.slug : book.id;
                      const chapterNum = ('currentChapter' in book && book.currentChapter) ? book.currentChapter : 1;
                      onStartReading(bookIdentifier, chapterNum);
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider px-7 py-2.5 rounded-full shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen size={14} />
                  <span>
                    {'currentChapter' in book && (book.currentChapter || 1) > 1
                      ? `Continuer la lecture (Chapitre ${book.currentChapter})`
                      : 'Ouvrir dans l\'Atelier de Lecture'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={async () => {
                    if (onImportBook && !isBookSummary) {
                      await onImportBook(book as CatalogBookItem);
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto bg-sauge hover:bg-sauge-2 text-white text-xs font-bold uppercase tracking-wider px-7 py-2.5 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Téléchargement & Importation...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Ajouter à ma bibliothèque & Lire</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
