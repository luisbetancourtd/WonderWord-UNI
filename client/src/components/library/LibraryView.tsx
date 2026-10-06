import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Check, Plus, Filter, BookMarked, Globe, Sparkles, Download } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { BookSummary, CatalogBookItem, ViewType } from '../../types';

interface LibraryViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onNavigate, onSelectBook }) => {
  // Navigation entre onglets : 'my_books' (Mes Livres) vs 'discover' (Découvrir)
  const [activeTab, setActiveTab] = useState<'my_books' | 'discover'>('my_books');

  // État de la bibliothèque personnelle
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // État du catalogue public découvert
  const [discoverBooks, setDiscoverBooks] = useState<CatalogBookItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'fr' | 'de'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  // 1. Charger les livres de sa bibliothèque
  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      if (selectedLanguage !== 'ALL') params.append('lang', selectedLanguage);

      const data = await apiFetch<BookSummary[]>(`/books?${params.toString()}`);
      setBooks(data);
    } catch (err) {
      console.error('Erreur chargement bibliothèque personnelle:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Charger ou rechercher dans le catalogue public ouvert (Gutendex & DraCor)
  const fetchDiscoverCatalog = async () => {
    try {
      setDiscoverLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedLanguage !== 'ALL') params.append('lang', selectedLanguage);

      const data = await apiFetch<CatalogBookItem[]>(`/books/discover?${params.toString()}`);
      setDiscoverBooks(data);
    } catch (err) {
      console.error('Erreur découverte catalogue externe:', err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_books') {
      fetchMyBooks();
    } else {
      fetchDiscoverCatalog();
    }
  }, [activeTab, selectedLevel, selectedLanguage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'my_books') {
      fetchMyBooks();
    } else {
      fetchDiscoverCatalog();
    }
  };

  // Ajouter / retirer un livre déjà répertorié dans sa bibliothèque
  const handleToggleLibrary = async (book: BookSummary) => {
    try {
      setActionLoading(book.id);
      if (book.isAdded) {
        await apiFetch(`/books/${book.id}/remove-from-library`, { method: 'DELETE' });
      } else {
        await apiFetch(`/books/${book.id}/add-to-library`, { method: 'POST' });
      }
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

  // Importer un nouveau livre externe depuis Gutenberg ou DraCor
  const handleImportBook = async (item: CatalogBookItem) => {
    try {
      setImportingId(item.id);
      const response = await apiFetch<{ success: boolean; message: string; book: BookSummary }>(
        '/books/import',
        {
          method: 'POST',
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            author: item.author,
            language: item.language,
            source: item.source,
            downloadUrl: item.downloadUrl,
          }),
        }
      );

      // Mettre à jour l'état visuel du catalogue
      setDiscoverBooks((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, isImported: true } : b))
      );

      // Ouvrir directement dans le lecteur ou rafraîchir
      if (response.book && onSelectBook) {
        onSelectBook(response.book.slug || response.book.id, 1);
        onNavigate('reader');
      }
    } catch (err) {
      console.error("Erreur lors de l'importation de l'ouvrage:", err);
    } finally {
      setImportingId(null);
    }
  };

  const handleStartReading = (book: BookSummary, chapterNumber = 1) => {
    if (onSelectBook) {
      onSelectBook(book.slug || book.id, chapterNumber);
    }
    onNavigate('reader');
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'soleil':
        return { bg: 'bg-soleil', ink: 'text-soleil-ink', border: 'border-amber-300' };
      case 'prune':
        return { bg: 'bg-prune', ink: 'text-white', border: 'border-purple-900' };
      case 'sauge':
        return { bg: 'bg-sauge', ink: 'text-white', border: 'border-teal-800' };
      case 'terre':
        return { bg: 'bg-terre', ink: 'text-white', border: 'border-orange-800' };
      case 'bleuet':
        return { bg: 'bg-bleuet', ink: 'text-bleuet-ink', border: 'border-blue-300' };
      default:
        return { bg: 'bg-paper-2', ink: 'text-ink', border: 'border-rule' };
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto w-full px-12 py-12 space-y-10">
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-rule">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-sauge bg-sauge-wash px-3 py-1 rounded-full">
              Patrimoine Bilingue · Université Paris 8
            </span>
          </div>
          <h1 className="font-serif text-[42px] md:text-[50px] font-normal leading-none text-ink m-0">
            Bibliothèque Littéraire
          </h1>
          <p className="text-sm text-ink-2 mt-2 max-w-xl">
            Corpus d'œuvres patrimoniales francophones et germanophones annotées pour la lecture critique, l'enrichissement lexical et l'analyse acoustique.
          </p>
        </div>

        {/* Barre de recherche unifiée */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-terre/50" />
          <input
            type="text"
            placeholder={
              activeTab === 'my_books'
                ? 'Rechercher dans mes livres...'
                : 'Explorer Gutenberg, DraCor (ex: Zola, Kafka)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-paper border border-rule rounded-full py-2.5 pl-10 pr-4 text-xs text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 shadow-sm"
          />
        </form>
      </div>

      {/* 2. COMMUTATEUR D'ONGLETS : MES LIVRES vs DÉCOUVRIR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Onglets */}
        <div className="inline-flex p-1 bg-paper border border-rule rounded-full shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('my_books')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'my_books'
                ? 'bg-prune text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <BookMarked size={14} />
            <span>Mes Livres ({books.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-sauge text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Globe size={14} />
            <span>Découvrir (+70 000 Ouvrages)</span>
          </button>
        </div>

        {/* FILTRES PAR IDIOMA */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-3 font-semibold mr-1">Langue :</span>
          {[
            { label: 'Toutes', value: 'ALL' },
            { label: '🇫🇷 Français', value: 'fr' },
            { label: '🇩🇪 Deutsch', value: 'de' },
          ].map((langItem) => (
            <button
              key={langItem.value}
              type="button"
              onClick={() => setSelectedLanguage(langItem.value as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedLanguage === langItem.value
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-paper border border-rule hover:bg-paper-warm text-ink-2'
              }`}
            >
              {langItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. FILTRES DE NIVEAU CECR (pour Mes Livres) */}
      {activeTab === 'my_books' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
      )}

      {/* 4. CONTENU ONGLET 1 : MES LIVRES */}
      {activeTab === 'my_books' && (
        <div>
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-prune border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-ink-2 font-medium">Chargement de votre bibliothèque...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-paper border border-rule rounded-2xl p-8">
              <BookOpen size={36} className="text-terre/40 mx-auto" />
              <h3 className="font-serif text-xl text-ink">Aucun livre ne correspond à vos filtres</h3>
              <p className="text-xs text-ink-2 max-w-md mx-auto">
                Explorez le catalogue public dans l'onglet « Découvrir » pour importer des œuvres classiques en un clic.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="bg-sauge hover:bg-sauge-2 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full shadow-sm"
              >
                Explorer le Catalogue Public
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
                    {/* Haut de la carte : Couverture */}
                    <div className={`p-6 ${colors.bg} relative flex flex-col justify-between min-h-[160px] border-b ${colors.border}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/15 text-white backdrop-blur-sm">
                          {book.language === 'de' ? '🇩🇪 Allemand' : '🇫🇷 Français'} · {book.cefrLevel}
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

                    {/* Corps de la carte */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                        {book.description || 'Texte classique annoté pour l\'apprentissage immersif.'}
                      </p>

                      <div className="space-y-3 pt-2 border-t border-rule-soft">
                        <div className="flex items-center justify-between text-[11px] text-ink-3">
                          <span>{book.genre}</span>
                          <span>{book.totalChapters} chapitres</span>
                        </div>

                        {/* Progression */}
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
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleStartReading(book, book.currentChapter || 1)}
                            className="flex-1 bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-full shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <BookOpen size={13} />
                            <span>Lire</span>
                          </button>

                          {book.chapters && book.chapters.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedBook(book)}
                              className="px-3 py-2 rounded-full border border-rule hover:bg-paper-warm text-ink text-xs font-semibold"
                              title="Voir les chapitres"
                            >
                              Chapitres
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionLoading === book.id}
                            onClick={() => handleToggleLibrary(book)}
                            className={`p-2.5 rounded-full border transition-all ${
                              book.isAdded
                                ? 'border-sauge/40 bg-sauge-wash text-sauge hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                                : 'border-rule hover:bg-paper-warm text-ink-3 hover:text-ink'
                            }`}
                            title={book.isAdded ? 'Retirer de ma bibliothèque' : 'Ajouter à ma bibliothèque'}
                          >
                            {actionLoading === book.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : book.isAdded ? (
                              <Check size={14} />
                            ) : (
                              <Plus size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENU ONGLET 2 : DÉCOUVRIR (GUTENDEX & DRACOR) */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Bannière explicative académique */}
          <div className="bg-paper-warm border border-rule rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sauge">
                <Sparkles size={14} />
                <span>Interconnexion Fédérée des Bibliothèques Numériques Ouvertes</span>
              </div>
              <p className="text-xs text-ink-2 max-w-2xl">
                Accès direct au <strong>Projet Gutenberg (+70 000 ouvrages)</strong> et au corpus théâtral universitaire <strong>DraCor (FreDraCor & GerDraCor)</strong>. Cliquez sur « Ajouter » pour importer et assainir automatiquement l'œuvre dans votre lecteur.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-ink-3">
              <span className="px-2 py-1 bg-paper border border-rule rounded">API Gutendex</span>
              <span className="px-2 py-1 bg-paper border border-rule rounded">API DraCor</span>
            </div>
          </div>

          {discoverLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-sauge border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-ink-2 font-medium">Interrogation des catalogues de Gutenberg et DraCor...</p>
            </div>
          ) : discoverBooks.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-paper border border-rule rounded-2xl p-8">
              <Globe size={36} className="text-sauge/40 mx-auto" />
              <h3 className="font-serif text-lg text-ink">Aucun livre trouvé dans le catalogue public</h3>
              <p className="text-xs text-ink-2">Essayez une autre recherche (ex : « Molière », « Voltaire », « Kafka », « Goethe »).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {discoverBooks.map((item) => {
                const colors = getColorClasses(item.coverColor || 'soleil');
                const isImporting = importingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-paper border border-rule rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* En-tête de carte avec source */}
                      <div className={`p-5 ${colors.bg} relative flex flex-col justify-between min-h-[140px] border-b ${colors.border}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/15 text-white backdrop-blur-sm">
                            {item.language === 'de' ? '🇩🇪 Deutsch' : '🇫🇷 Français'} · {item.cefrLevel}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                            {item.source}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif text-xl font-normal leading-tight text-white mb-0.5">
                            {item.title}
                          </h3>
                          <p className="text-xs font-sans text-white/90">
                            {item.author}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                        {item.downloads && (
                          <p className="text-[11px] text-ink-3 font-mono">
                            {item.downloads} consultations sur Gutenberg
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action d'importation */}
                    <div className="p-5 pt-0">
                      {item.isImported ? (
                        <div className="w-full py-2.5 px-4 rounded-full bg-sauge-wash border border-sauge/30 text-sauge text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check size={14} />
                          <span>Présent dans votre bibliothèque</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(importingId)}
                          onClick={() => handleImportBook(item)}
                          className="w-full bg-sauge hover:bg-sauge-2 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-full shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isImporting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Téléchargement & Nettoyage...</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Ajouter à ma bibliothèque</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL DES CHAPITRES (si ouvert) */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper border border-rule rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-rule pb-4">
              <div>
                <h3 className="font-serif text-2xl text-ink">{selectedBook.title}</h3>
                <p className="text-xs text-ink-2 mt-0.5">{selectedBook.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="text-ink-3 hover:text-ink text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedBook.chapters?.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    handleStartReading(selectedBook, ch.number);
                    setSelectedBook(null);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-rule hover:border-prune/50 hover:bg-paper-warm cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink">
                      {ch.title}
                    </p>
                    <p className="text-[11px] text-ink-3 font-mono">
                      {ch.wordCount} mots analysés
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-prune">Lire →</span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="px-5 py-2 rounded-full border border-rule text-xs font-semibold text-ink-2 hover:bg-paper-warm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
