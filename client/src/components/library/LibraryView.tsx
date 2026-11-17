import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Check, Filter, BookMarked, Globe, Sparkles, Download, Eye, Trash2, X, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { BookSummary, CatalogBookItem, DiscoverCatalogResponse, ViewType } from '../../types';
import { BookBackCoverModal } from './BookBackCoverModal';

interface LibraryViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
}

const BookCoverMini: React.FC<{
  title: string;
  author: string;
  coverUrl?: string;
  sizeClass?: string;
}> = ({ title, author, coverUrl, sizeClass = 'w-[84px] h-[126px]' }) => {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      <div
        className={`${sizeClass} flex-shrink-0 rounded-r-lg rounded-l-sm shadow-md overflow-hidden bg-black/10 border border-white/25 self-center transition-transform duration-200 group-hover:scale-105 relative`}
      >
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/35 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Reliure typographique éditoriale (style Gallimard / Papier Crème)
  return (
    <div
      className={`${sizeClass} flex-shrink-0 rounded-r-lg rounded-l-sm shadow-md overflow-hidden bg-[#fbf7ee] border border-black/15 self-center transition-transform duration-200 group-hover:scale-105 p-2 flex flex-col justify-between text-ink relative`}
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      <span className="text-[6.5px] uppercase tracking-[0.16em] text-terre-ink font-bold truncate pl-1">
        WonderWord
      </span>
      <div className="border-t border-b border-ink/15 py-1.5 pl-1">
        <p className="font-serif text-[10px] leading-tight text-ink line-clamp-3 m-0 font-normal">
          {title}
        </p>
      </div>
      <p className="text-[7.5px] text-ink-3 italic truncate pl-1 m-0">
        {author}
      </p>
    </div>
  );
};

export const LibraryView: React.FC<LibraryViewProps> = ({ onNavigate, onSelectBook }) => {
  // Navigation entre onglets : 'my_books' (Mes Livres) vs 'discover' (Découvrir)
  const [activeTab, setActiveTab] = useState<'my_books' | 'discover'>('my_books');

  // État de la bibliothèque personnelle ("Mes Livres")
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // État de la modale de quatrième de couverture (Fiche Ouvrage)
  const [selectedBackCoverBook, setSelectedBackCoverBook] = useState<(BookSummary | CatalogBookItem) | null>(null);

  // État du catalogue public découvert (avec pagination)
  const [discoverBooks, setDiscoverBooks] = useState<CatalogBookItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverHasMore, setDiscoverHasMore] = useState(false);
  const [discoverTotalAvailable, setDiscoverTotalAvailable] = useState(0);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ALL' | 'fr' | 'de'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  // 1. Charger uniquement les livres personnels de l'utilisateur ("Mes Livres")
  const fetchMyBooks = async (customQuery?: string) => {
    try {
      setLoading(true);
      const q = customQuery !== undefined ? customQuery : searchQuery;
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      if (selectedLanguage !== 'ALL') params.append('lang', selectedLanguage);

      const data = await apiFetch<BookSummary[]>(`/books/my-library?${params.toString()}`);
      setBooks(data);
    } catch (err) {
      console.error('Erreur chargement bibliothèque personnelle:', err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Charger ou paginer le catalogue public ouvert (Patrimoine Paris 8 + Gutendex & DraCor)
  const fetchDiscoverCatalog = async (customQuery?: string, targetPage = 1, append = false) => {
    try {
      if (append) {
        setDiscoverLoadingMore(true);
      } else {
        setDiscoverLoading(true);
      }
      const q = customQuery !== undefined ? customQuery : searchQuery;
      const params = new URLSearchParams();
      params.append('paginated', '1');
      params.append('page', String(targetPage));
      if (q) params.append('query', q);
      if (selectedLanguage !== 'ALL') params.append('lang', selectedLanguage);
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);

      const data = await apiFetch<DiscoverCatalogResponse>(`/books/discover?${params.toString()}`);
      setDiscoverPage(data.page || targetPage);
      setDiscoverHasMore(Boolean(data.hasMore));
      if (typeof data.totalAvailable === 'number' && data.totalAvailable > 0) {
        setDiscoverTotalAvailable(data.totalAvailable);
      }

      if (append) {
        setDiscoverBooks((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          for (const item of data.items || []) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
          return merged;
        });
      } else {
        setDiscoverBooks(data.items || []);
      }
    } catch (err) {
      console.error('Erreur découverte catalogue externe:', err);
    } finally {
      setDiscoverLoading(false);
      setDiscoverLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_books') {
      fetchMyBooks();
    } else {
      fetchDiscoverCatalog(undefined, 1, false);
    }
  }, [activeTab, selectedLevel, selectedLanguage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'my_books') {
      fetchMyBooks();
    } else {
      fetchDiscoverCatalog(undefined, 1, false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (activeTab === 'my_books') {
      fetchMyBooks('');
    } else {
      fetchDiscoverCatalog('', 1, false);
    }
  };

  // Supprimer manuellement un livre de "Mes Livres"
  const handleRemoveBook = async (bookId: string) => {
    try {
      setActionLoading(bookId);
      const targetBook =
        books.find((b) => b.id === bookId || b.slug === bookId) ||
        (selectedBackCoverBook && (selectedBackCoverBook.id === bookId || selectedBackCoverBook.slug === bookId)
          ? selectedBackCoverBook
          : null);

      const query = targetBook?.title ? `?title=${encodeURIComponent(targetBook.title)}` : '';
      await apiFetch(`/books/${encodeURIComponent(bookId)}/remove-from-library${query}`, {
        method: 'DELETE',
      });

      setBooks((prev) =>
        prev.filter(
          (b) =>
            b.id !== bookId &&
            b.slug !== bookId &&
            (!targetBook?.title || b.title.toLowerCase().trim() !== targetBook.title.toLowerCase().trim())
        )
      );

      if (targetBook) {
        setDiscoverBooks((prev) =>
          prev.map((item) =>
            item.id === bookId ||
            item.slug === bookId ||
            item.title.toLowerCase().trim() === targetBook.title.toLowerCase().trim()
              ? { ...item, isImported: false }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Erreur suppression livre:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Vider entièrement "Mes Livres"
  const handleClearMyLibrary = async () => {
    try {
      setLoading(true);
      await apiFetch('/books/my-library/clear', { method: 'DELETE' });
      setBooks([]);
      setDiscoverBooks((prev) => prev.map((item) => ({ ...item, isImported: false })));
    } catch (err) {
      console.error('Erreur vidage bibliothèque:', err);
    } finally {
      setLoading(false);
    }
  };

  // Importer un nouveau livre depuis "Découvrir" dans "Mes Livres"
  const handleImportBook = async (item: CatalogBookItem, openReader = false) => {
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
            genre: item.genre,
            year: item.year,
            downloadUrl: item.downloadUrl,
            coverUrl: item.coverUrl,
          }),
        }
      );

      const importedSlug = response.book?.slug || item.slug || item.id;

      // Mettre à jour l'état visuel du catalogue et de Mes Livres
      setDiscoverBooks((prev) =>
        prev.map((b) =>
          b.id === item.id || b.title.toLowerCase().trim() === item.title.toLowerCase().trim()
            ? {
                ...b,
                isImported: true,
                slug: importedSlug,
                totalChapters: response.book?.totalChapters || b.totalChapters,
                totalWords: response.book?.totalWords || b.totalWords,
                chapters: response.book?.chapters || b.chapters,
              }
            : b
        )
      );
      await fetchMyBooks();

      // Ouvrir directement dans le lecteur si demandé
      if (openReader && response.book && onSelectBook) {
        onSelectBook(importedSlug, 1);
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
            className="w-full bg-paper border border-rule rounded-full py-2.5 pl-10 pr-9 text-xs text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
              title="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
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
            <span>
              {discoverTotalAvailable > 0
                ? `Découvrir (${discoverTotalAvailable.toLocaleString('fr-FR')} ouvrages)`
                : 'Découvrir (Gutenberg & DraCor)'}
            </span>
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

      {/* 3. FILTRES DE NIVEAU CECR & ACTION DE VIDAGE */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-ink-3 font-semibold mr-2 flex items-center gap-1.5 flex-shrink-0">
            <Filter size={13} /> Niveaux :
          </span>
          {[
            { label: 'Tous les niveaux', value: 'ALL' },
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

        {activeTab === 'my_books' && books.length > 0 && (
          <button
            type="button"
            onClick={handleClearMyLibrary}
            className="px-3.5 py-1.5 rounded-full border border-red-200 bg-red-50/70 hover:bg-red-600 text-red-700 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Retirer tous les livres de Mes Livres"
          >
            <Trash2 size={13} />
            <span>Vider ma bibliothèque</span>
          </button>
        )}
      </div>

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
              <h3 className="font-serif text-xl text-ink">
                Votre bibliothèque personnelle (« Mes Livres ») est vide
              </h3>
              <p className="text-xs text-ink-2 max-w-md mx-auto">
                Vous n’avez encore ajouté aucun livre à votre collection personnelle. Explorez le catalogue public dans l’onglet « Découvrir (+70 000 Ouvrages) » pour choisir et importer vos premiers livres.
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
                    onClick={() => setSelectedBackCoverBook(book)}
                    className="bg-paper border border-rule rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer hover:border-prune/40"
                  >
                    {/* Haut de la carte : Couverture */}
                    <div className={`p-5 ${colors.bg} relative flex gap-4 min-h-[175px] border-b ${colors.border}`}>
                      <BookCoverMini
                        title={book.title}
                        author={book.author}
                        coverUrl={book.coverImage || book.coverUrl}
                        sizeClass="w-[88px] h-[130px]"
                      />

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/20 text-white backdrop-blur-sm truncate">
                            {book.language === 'de' ? '🇩🇪 Allemand' : '🇫🇷 Français'} · {book.cefrLevel}
                          </span>
                          <span className="text-[11px] font-mono opacity-80 text-white flex-shrink-0">
                            {book.year}
                          </span>
                        </div>

                        <div className="my-auto py-1">
                          <h2 className="font-serif text-xl font-normal leading-tight text-white line-clamp-2 group-hover:underline">
                            {book.title}
                          </h2>
                          <p className="text-xs font-sans text-white/90 font-medium truncate mt-0.5">
                            {book.author}
                          </p>
                        </div>
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
                          <span className="text-prune font-semibold flex items-center gap-1 group-hover:underline">
                            <Eye size={12} /> Voir la fiche
                          </span>
                        </div>

                        {/* Progression */}
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

                        {/* Boutons d'action */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartReading(book, book.currentChapter || 1);
                            }}
                            className="flex-1 bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-full shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <BookOpen size={13} />
                            <span>Lire</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBackCoverBook(book);
                            }}
                            className="px-3 py-2 rounded-full border border-rule hover:bg-paper-warm text-ink text-xs font-semibold"
                            title="Voir la quatrième de couverture et les chapitres"
                          >
                            Fiche
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === book.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBook(book.id);
                            }}
                            className="p-2.5 rounded-full border border-red-200 bg-red-50/70 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                            title="Supprimer ce livre de Mes Livres"
                          >
                            {actionLoading === book.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} />
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
                Accès direct au corpus franco-germanophone de <strong>Project Gutenberg (Gutendex)</strong> et au corpus théâtral universitaire <strong>DraCor (FreDraCor &amp; GerDraCor)</strong>.
                {discoverTotalAvailable > 0 && (
                  <>
                    {' '}
                    Affichage de <strong>{discoverBooks.length}</strong> ouvrages sur{' '}
                    <strong>{discoverTotalAvailable.toLocaleString('fr-FR')}</strong> disponibles
                    (Page {discoverPage}).
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-ink-3 flex-shrink-0">
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
                    onClick={() => setSelectedBackCoverBook(item)}
                    className="bg-paper border border-rule rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer hover:border-sauge/50"
                  >
                    <div>
                      {/* En-tête de carte avec source */}
                      <div className={`p-5 ${colors.bg} relative flex gap-4 min-h-[165px] border-b ${colors.border}`}>
                        <BookCoverMini
                          title={item.title}
                          author={item.author}
                          coverUrl={item.coverUrl}
                          sizeClass="w-[82px] h-[122px]"
                        />

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/20 text-white backdrop-blur-sm truncate">
                              {item.language === 'de' ? '🇩🇪 Deutsch' : '🇫🇷 Français'} · {item.cefrLevel}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white flex-shrink-0">
                              {item.source}
                            </span>
                          </div>

                          <div className="my-auto py-1">
                            <h3 className="font-serif text-lg font-normal leading-tight text-white line-clamp-2 group-hover:underline">
                              {item.title}
                            </h3>
                            <p className="text-xs font-sans text-white/90 truncate mt-0.5">
                              {item.author}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Description & Découverte */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-ink-2 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-ink-3 pt-1 border-t border-rule-soft">
                          {item.downloads ? (
                            <span className="font-mono">
                              {item.downloads} consultations
                            </span>
                          ) : (
                            <span className="font-serif italic text-ink-3 truncate max-w-[150px]">
                              {item.genre || 'Patrimoine'}
                            </span>
                          )}
                          <span className="text-sauge font-semibold flex items-center gap-1 group-hover:underline">
                            <Eye size={12} /> Fiche & Extrait
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action d'importation */}
                    <div className="p-5 pt-0">
                      {item.isImported ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectBook) {
                                onSelectBook(item.slug || item.id, item.currentChapter || 1);
                              }
                              onNavigate('reader');
                            }}
                            className="flex-1 py-2.5 px-4 rounded-full bg-sauge-wash border border-sauge/30 text-sauge text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-sauge hover:text-white transition-all"
                          >
                            <Check size={14} />
                            <span>Dans Mes Livres · Lire</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBackCoverBook(item);
                            }}
                            className="px-3 py-2 rounded-full border border-rule hover:bg-paper-warm text-ink text-xs font-semibold"
                            title="Voir la quatrième de couverture"
                          >
                            Fiche
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === (item.slug || item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBook(item.slug || item.id);
                            }}
                            className="p-2.5 rounded-full border border-red-200 bg-red-50/70 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                            title="Retirer de Mes Livres"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(importingId)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportBook(item, false);
                          }}
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

          {/* Bouton de pagination : Charger plus d'ouvrages (Page 2, 3, 4...) */}
          {!discoverLoading && discoverHasMore && (
            <div className="pt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={discoverLoadingMore}
                onClick={() => fetchDiscoverCatalog(undefined, discoverPage + 1, true)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-paper border border-rule hover:border-sauge hover:bg-sauge hover:text-white text-xs font-bold uppercase tracking-wider text-ink shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                {discoverLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Chargement de la page {discoverPage + 1}…</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>
                      Charger plus d’ouvrages (Page {discoverPage + 1}) ·{' '}
                      {discoverBooks.length} affichés
                      {discoverTotalAvailable > 0
                        ? ` / ${discoverTotalAvailable.toLocaleString('fr-FR')}`
                        : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL QUATRIÈME DE COUVERTURE & FICHE OUVRAGE */}
      <BookBackCoverModal
        book={selectedBackCoverBook}
        isOpen={Boolean(selectedBackCoverBook)}
        onClose={() => setSelectedBackCoverBook(null)}
        onStartReading={(bookId, ch) => {
          if (onSelectBook) onSelectBook(bookId, ch);
          onNavigate('reader');
        }}
        onImportBook={handleImportBook}
        onRemoveBook={handleRemoveBook}
        isImporting={Boolean(importingId)}
      />
    </div>
  );
};
