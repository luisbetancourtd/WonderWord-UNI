import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Check, Plus, Filter, BookMarked } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { BookSummary, ViewType } from '../../types';

interface LibraryViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onNavigate, onSelectBook }) => {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      
      const data = await apiFetch<BookSummary[]>(`/books?${params.toString()}`);
      setBooks(data);
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleToggleLibrary = async (book: BookSummary) => {
    try {
      setActionLoading(book.id);
      if (book.isAdded) {
        await apiFetch(`/books/${book.id}/remove-from-library`, { method: 'DELETE' });
      } else {
        await apiFetch(`/books/${book.id}/add-to-library`, { method: 'POST' });
      }
      // Mise à jour optimiste dans la liste
      setBooks((prev) =>
        prev.map((b) => (b.id === book.id ? { ...b, isAdded: !b.isAdded } : b))
      );
      if (selectedBook?.id === book.id) {
        setSelectedBook((prev) => (prev ? { ...prev, isAdded: !prev.isAdded } : null));
      }
    } catch (err) {
      console.error('Erreur modification bibliothèque:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartReading = (book: BookSummary, chapterNumber = 1) => {
    if (onSelectBook) {
      onSelectBook(book.id, chapterNumber);
    }
    onNavigate('reader');
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'soleil':
        return {
          bg: 'bg-soleil',
          ink: 'text-soleil-ink',
          border: 'border-amber-300',
        };
      case 'prune':
        return {
          bg: 'bg-prune',
          ink: 'text-white',
          border: 'border-purple-900',
        };
      case 'sauge':
        return {
          bg: 'bg-sauge',
          ink: 'text-white',
          border: 'border-teal-800',
        };
      case 'terre':
        return {
          bg: 'bg-terre',
          ink: 'text-white',
          border: 'border-orange-800',
        };
      case 'bleuet':
        return {
          bg: 'bg-bleuet',
          ink: 'text-bleuet-ink',
          border: 'border-blue-300',
        };
      default:
        return {
          bg: 'bg-paper-2',
          ink: 'text-ink',
          border: 'border-rule',
        };
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-12 py-12 space-y-10">
      {/* 1. EN-TÊTE DE LA BIBLIOTHÈQUE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-rule">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-sauge bg-sauge-wash px-3 py-1 rounded-full">
              Catalogue Ouvert · Université Paris 8
            </span>
          </div>
          <h1 className="font-serif text-[42px] md:text-[50px] font-normal leading-none text-ink m-0">
            Bibliothèque Littéraire
          </h1>
          <p className="text-sm text-ink-2 mt-2 max-w-xl">
            Corpus d'œuvres patrimoniales annotées pour la lecture critique, la glosa lexicale et l'analyse phonétique interactive.
          </p>
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-terre/50" />
          <input
            type="text"
            placeholder="Rechercher par titre ou auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-paper border border-rule rounded-full py-2.5 pl-10 pr-4 text-xs text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 shadow-sm"
          />
        </form>
      </div>

      {/* 2. FILTRES DE NIVEAU CECR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-ink-3 font-semibold mr-2 flex items-center gap-1.5 flex-shrink-0">
          <Filter size={13} /> Niveaux :
        </span>
        {[
          { label: 'Tous les niveaux', value: 'ALL' },
          { label: 'A2 · Débutant', value: 'A2' },
          { label: 'B1 · Intermédiaire', value: 'B1' },
          { label: 'B2 · Avancé', value: 'B2' },
          { label: 'C1 · Autonome', value: 'C1' },
        ].map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => setSelectedLevel(lvl.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
              selectedLevel === lvl.value
                ? 'bg-prune text-white shadow-sm'
                : 'bg-paper border border-rule hover:bg-paper-warm text-ink-2'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* 3. GRILLE DE LIVRES */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-prune border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-2 font-medium">Chargement du corpus littéraire...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-paper border border-rule rounded-2xl p-8">
          <BookOpen size={36} className="text-terre/40 mx-auto" />
          <h3 className="font-serif text-lg text-ink">Aucun livre ne correspond à votre recherche</h3>
          <p className="text-xs text-ink-2">Essayez de réinitialiser vos filtres ou de chercher un autre mot-clé.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedLevel('ALL');
            }}
            className="text-xs text-prune font-semibold underline pt-2"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => {
            const colors = getColorClasses(book.coverColor);
            return (
              <div
                key={book.id}
                className="bg-paper border border-rule rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Haut de la carte : Couverture stylisée */}
                <div className={`p-6 ${colors.bg} relative flex flex-col justify-between min-h-[160px] border-b ${colors.border}`}>
                  {/* Badge niveau */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/15 text-white backdrop-blur-sm">
                      Niveau {book.cefrLevel}
                    </span>
                    <span className="text-[11px] font-mono opacity-80 text-white">
                      {book.year}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-serif text-2xl font-normal leading-tight text-white mb-1 group-hover:underline">
                      {book.title}
                    </h2>
                    <p className="text-xs font-sans text-white/90 font-medium">
                      {book.author}
                    </p>
                  </div>
                </div>

                {/* Corps de la carte : Description & Métadonnées */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                    {book.description || 'Texte classique annoté pour l\'apprentissage de la langue française.'}
                  </p>

                  <div className="space-y-3 pt-2 border-t border-rule-soft">
                    <div className="flex items-center justify-between text-[11px] text-ink-3">
                      <span>{book.genre}</span>
                      <span>{book.totalChapters} chapitres</span>
                    </div>

                    {/* Progression si déjà en lecture */}
                    {book.isAdded && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-sauge">
                          <span className="flex items-center gap-1">
                            <BookMarked size={12} /> En cours de lecture
                          </span>
                          <span>{Math.round(book.progressPercent || 0)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sauge rounded-full transition-all"
                            style={{ width: `${Math.min(100, book.progressPercent || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="flex items-center gap-2 pt-1">
                      {book.isAdded ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartReading(book, book.currentChapter || 1)}
                            className="flex-1 bg-prune hover:bg-prune-2 text-white py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <BookOpen size={13} />
                            <span>Lire</span>
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === book.id}
                            onClick={() => handleToggleLibrary(book)}
                            title="Retirer de la bibliothèque"
                            className="p-2 border border-rule rounded-full hover:bg-paper-warm text-ink-3 hover:text-terre transition-colors"
                          >
                            <Check size={14} className="text-sauge" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === book.id}
                            onClick={() => handleToggleLibrary(book)}
                            className="flex-1 bg-sauge hover:bg-sauge-2 text-white py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Plus size={13} />
                            <span>Ajouter</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBook(book)}
                            className="px-3 py-2 border border-rule hover:bg-paper-warm rounded-full text-xs font-medium text-ink-2 transition-colors"
                          >
                            Détails
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODALE DE DÉTAIL DU LIVRE */}
      {selectedBook && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-rule rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sauge bg-sauge-wash px-2.5 py-0.5 rounded-full">
                  Niveau {selectedBook.cefrLevel} · {selectedBook.year}
                </span>
                <h2 className="font-serif text-2xl text-ink mt-2 mb-1">{selectedBook.title}</h2>
                <p className="text-xs text-ink-2 font-medium">{selectedBook.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="text-ink-3 hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              {selectedBook.description}
            </p>

            {/* Table des matières */}
            <div className="space-y-2 pt-2 border-t border-rule-soft">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                Chapitres ({selectedBook.chapters?.length || selectedBook.totalChapters}) :
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedBook.chapters && selectedBook.chapters.length > 0 ? (
                  selectedBook.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleStartReading(selectedBook, ch.number)}
                      className="w-full text-left p-2.5 rounded-xl border border-rule-soft hover:bg-paper-warm transition-colors flex items-center justify-between text-xs group"
                    >
                      <span className="font-medium text-ink group-hover:text-prune">
                        {ch.title}
                      </span>
                      <span className="text-[10px] text-ink-3">{ch.wordCount} mots</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-ink-3 italic">Texte intégral disponible dans le lecteur.</p>
                )}
              </div>
            </div>

            {/* Actions modale */}
            <div className="flex items-center gap-3 pt-3 border-t border-rule-soft">
              <button
                type="button"
                onClick={() => handleStartReading(selectedBook, 1)}
                className="flex-1 bg-prune hover:bg-prune-2 text-white py-2.5 px-4 rounded-full text-xs font-semibold transition-colors"
              >
                Commencer la lecture
              </button>
              <button
                type="button"
                disabled={actionLoading === selectedBook.id}
                onClick={() => handleToggleLibrary(selectedBook)}
                className="px-4 py-2.5 border border-rule hover:bg-paper-warm rounded-full text-xs font-semibold text-ink-2 transition-colors flex items-center gap-1.5"
              >
                {selectedBook.isAdded ? <Check size={14} className="text-sauge" /> : <Plus size={14} />}
                <span>{selectedBook.isAdded ? 'Dans la bibliothèque' : 'Ajouter'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
