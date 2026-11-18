import { useState, useEffect } from 'react';
import type { ViewType, ThemeType, User, AuthResponse, BookSummary } from './types';
import { apiFetch } from './lib/api';
import { PaperBackground } from './components/common/PaperBackground';
import { RailSidebar } from './components/layout/RailSidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReaderView } from './components/reader/ReaderView';
import { ShadowingView } from './components/shadowing/ShadowingView';
import { LibraryView } from './components/library/LibraryView';
import { AuthView } from './components/auth/AuthView';
import { Volume2, LogOut, Check, User as UserIcon, Trash2, Mic, BookOpen } from 'lucide-react';

interface VocabCardItem {
  id: string;
  word: string;
  ipa: string;
  translation: string;
  definition: string;
  grammatical: string;
  contextSentence?: string;
  language: string;
  status: string;
  createdAt: string;
}

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('papel');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Livre et chapitre actuellement en lecture
  const [activeBookId, setActiveBookId] = useState<string>('le-petit-prince');
  const [activeChapterNumber, setActiveChapterNumber] = useState<number>(1);
  const [readerInitialMode, setReaderInitialMode] = useState<'study' | 'book'>('study');

  // Statistiques globales synchronisées pour la barre latérale
  const [sidebarStats, setSidebarStats] = useState<{ booksCount: number; vocabCount: number }>({
    booksCount: 0,
    vocabCount: 0,
  });

  // État pour l'édition du profil (Paramètres)
  const [profileName, setProfileName] = useState('');
  const [profileNativeLang, setProfileNativeLang] = useState('fr');
  const [profileTargetLang, setProfileTargetLang] = useState('de');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // État pour la vue Vocabulaire FSRS
  const [vocabList, setVocabList] = useState<VocabCardItem[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabFilter, setVocabFilter] = useState<'all' | 'learning' | 'mastered'>('all');

  const handleToggleCardStatus = async (card: VocabCardItem) => {
    const nextStatus = card.status === 'mastered' ? 'learning' : 'mastered';
    try {
      const res = await apiFetch<{ success: boolean; card: VocabCardItem }>(
        `/books/vocabulary/${card.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (res?.card) {
        setVocabList((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, status: res.card.status } : c))
        );
      }
    } catch (err) {
      console.error('Erreur mise à jour statut carte FSRS:', err);
    }
  };

  const handleDeleteVocabCard = async (cardId: string) => {
    try {
      await apiFetch(`/books/vocabulary/${cardId}`, { method: 'DELETE' });
      setVocabList((prev) => {
        const next = prev.filter((c) => c.id !== cardId);
        setSidebarStats((s) => ({ ...s, vocabCount: next.length }));
        return next;
      });
    } catch (err) {
      console.error('Erreur suppression carte FSRS:', err);
    }
  };

  // Vérifier le token JWT ou le token de validation d'email dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify_token');
    const resetToken = urlParams.get('reset_token');

    if (resetToken) {
      setAuthLoading(false);
      return;
    }

    if (verifyToken) {
      apiFetch<AuthResponse>(`/auth/verify-email?token=${verifyToken}`)
        .then((res) => {
          localStorage.setItem('wonderword_token', res.token);
          setUser(res.user);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          console.error('Erreur validation token email:', err);
        })
        .finally(() => {
          setAuthLoading(false);
        });
      return;
    }

    const token = localStorage.getItem('wonderword_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    apiFetch<User>('/auth/me')
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('wonderword_token');
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Synchroniser les champs du formulaire Profil lorsque l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfileNativeLang(user.nativeLang || 'fr');
      setProfileTargetLang(user.targetLang || 'de');

      // Charger les compteurs initiaux
      Promise.all([
        apiFetch<BookSummary[]>('/books/my-library').catch(() => [] as BookSummary[]),
        apiFetch<VocabCardItem[]>('/books/vocabulary').catch(() => [] as VocabCardItem[]),
      ]).then(([books, cards]) => {
        setSidebarStats({
          booksCount: (books || []).length,
          vocabCount: (cards || []).length,
        });
      });
    }
  }, [user]);

  // Charger les cartes FSRS à l'ouverture de la vue Vocabulaire
  useEffect(() => {
    if (currentView === 'vocabulary' && user) {
      setVocabLoading(true);
      apiFetch<VocabCardItem[]>('/books/vocabulary')
        .then((cards) => {
          setVocabList(cards || []);
          setSidebarStats((prev) => ({ ...prev, vocabCount: (cards || []).length }));
        })
        .catch(() => {})
        .finally(() => setVocabLoading(false));
    }
  }, [currentView, user]);

  // Appliquer l'attribut data-theme au document racine
  useEffect(() => {
    if (currentTheme === 'papel') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme]);

  const handleAuthSuccess = (token: string, userData: User) => {
    localStorage.setItem('wonderword_token', token);
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('wonderword_token');
    setUser(null);
    setSidebarStats({ booksCount: 0, vocabCount: 0 });
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleSelectBook = (bookId: string, chapterNumber = 1) => {
    setActiveBookId(bookId);
    setActiveChapterNumber(chapterNumber);
    setReaderInitialMode('book');
    setCurrentView('reader');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    try {
      setProfileSaving(true);
      setProfileSavedMsg(null);
      const updated = await apiFetch<User>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: profileName.trim(),
          nativeLang: profileNativeLang,
          targetLang: profileTargetLang,
        }),
      });
      setUser(updated);
      setProfileSavedMsg('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const getBreadcrumb = () => {
    const uName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Session';
    switch (currentView) {
      case 'dashboard':
        return `Tableau de bord / ${uName}`;
      case 'reader':
        return `Atelier de Lecture / Chapitre ${activeChapterNumber}`;
      case 'shadowing':
        return 'Laboratoire Phonétique / Studio de Shadowing & Formants';
      case 'library':
        return 'Bibliothèque Littéraire / Catalogue Critique Paris 8';
      case 'vocabulary':
        return `Vocabulaire & Mémorisation FSRS / ${sidebarStats.vocabCount} cartes`;
      case 'settings':
        return `Profil & Paramètres / ${uName}`;
      default:
        return 'WonderWord-UNI';
    }
  };

  // Écran de chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-4xl text-ink">WonderWord</h1>
          <p className="text-ink-2 animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran d'authentification
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex text-ink bg-canvas transition-colors duration-300 relative">
      {/* Texture de papier pressé et cadre d'aquarelle */}
      <PaperBackground />

      {/* Barre latérale permanente (Rail) */}
      <RailSidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        vocabCount={sidebarStats.vocabCount}
        booksCount={sidebarStats.booksCount}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col ml-[252px] min-w-0 relative z-10">
        <TopBar
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          breadcrumb={getBreadcrumb()}
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">
          {currentView === 'dashboard' && (
            <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onStatsLoaded={setSidebarStats}
            />
          )}
          {currentView === 'library' && (
            <LibraryView onNavigate={handleNavigate} onSelectBook={handleSelectBook} />
          )}
          {currentView === 'reader' && (
            <ReaderView
              bookId={activeBookId}
              chapterNumber={activeChapterNumber}
              initialMode={readerInitialMode}
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onPracticeShadowing={() => setCurrentView('shadowing')}
            />
          )}
          {currentView === 'shadowing' && <ShadowingView />}

          {/* VUE VOCABULAIRE & FSRS CONNECTÉE AUX CARTES RÉELLES */}
          {currentView === 'vocabulary' && (
            <div className="max-w-[1140px] mx-auto px-10 py-12 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-rule">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-sauge mb-1.5">
                    Mémorisation Espacée · Contexte Littéraire 1:1
                  </p>
                  <h1 className="font-serif text-[38px] font-normal text-ink m-0 leading-tight">
                    Paquet FSRS de {user.displayName}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('reader')}
                  className="bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <BookOpen size={14} />
                  <span>Aller à l’Atelier de Lecture</span>
                </button>
              </div>

              {vocabList.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-warm border border-rule rounded-2xl px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { id: 'all', label: `Toutes (${vocabList.length})` },
                        {
                          id: 'learning',
                          label: `En cours (${vocabList.filter((c) => c.status !== 'mastered').length})`,
                        },
                        {
                          id: 'mastered',
                          label: `Apprises · Masquées dans les livres (${vocabList.filter((c) => c.status === 'mastered').length})`,
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setVocabFilter(tab.id)}
                        className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                          vocabFilter === tab.id
                            ? 'bg-sauge text-white'
                            : 'bg-paper border border-rule-soft text-ink-2 hover:text-ink'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-3 m-0">
                    Les cartes marquées « Maîtrisée » cessent d’être cliquables dans vos prochains chapitres et livres.
                  </p>
                </div>
              )}

              {vocabLoading ? (
                <div className="p-12 text-center bg-paper border border-rule rounded-2xl">
                  <p className="text-xs text-ink-2">Chargement de vos cartes FSRS…</p>
                </div>
              ) : vocabList.length === 0 ? (
                <div className="bg-paper border border-rule rounded-2xl p-12 text-center space-y-4">
                  <h3 className="font-serif text-2xl text-ink">
                    Votre paquet FSRS est vide pour le moment
                  </h3>
                  <p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
                    Ouvrez l’<strong>Atelier de Lecture</strong>, cliquez sur un mot cible du corpus{' '}
                    <strong>B1–C2</strong> pour explorer ses synonymes en immersion et cliquez sur{' '}
                    <strong>« Guardar en Mazo FSRS (1:1) »</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentView('reader')}
                    className="bg-sauge hover:bg-sauge-2 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full cursor-pointer"
                  >
                    Ouvrir l’Atelier de Lecture
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {vocabList
                    .filter((card) =>
                      vocabFilter === 'all'
                        ? true
                        : vocabFilter === 'mastered'
                        ? card.status === 'mastered'
                        : card.status !== 'mastered'
                    )
                    .map((card) => {
                      const isMastered = card.status === 'mastered';
                      return (
                        <div
                          key={card.id}
                          className={`bg-paper border rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4 transition-opacity ${
                            isMastered ? 'border-sauge/40 opacity-85' : 'border-rule'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-sauge bg-sauge-wash px-2.5 py-0.5 rounded-full">
                                {card.language.toUpperCase()} · {card.grammatical}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if ('speechSynthesis' in window) {
                                      window.speechSynthesis.cancel();
                                      const u = new SpeechSynthesisUtterance(card.word);
                                      u.lang = card.language === 'de' ? 'de-DE' : 'fr-FR';
                                      window.speechSynthesis.speak(u);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-full bg-soleil-wash text-soleil-ink flex items-center justify-center hover:bg-soleil transition-colors cursor-pointer"
                                  title="Écouter la prononciation"
                                >
                                  <Volume2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVocabCard(card.id)}
                                  className="w-7 h-7 rounded-full bg-paper-warm text-ink-3 flex items-center justify-center hover:text-terre hover:bg-terre-wash transition-colors cursor-pointer"
                                  title="Supprimer du paquet"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-baseline gap-3 mb-1">
                              <h3 className="font-serif text-2xl text-ink m-0">{card.word}</h3>
                              <span className="font-ipa text-sauge font-bold text-base">
                                {card.ipa}
                              </span>
                            </div>

                            <p className="text-xs text-ink-2 leading-relaxed m-0">
                              {card.definition}
                            </p>
                            {card.translation && (
                              <p className="text-[11px] font-semibold text-prune/80 mt-1.5 mb-0">
                                Secours : {card.translation}
                              </p>
                            )}

                            {card.contextSentence && (
                              <blockquote className="mt-3 pl-3 border-l-2 border-soleil text-xs italic text-ink-2">
                                « {card.contextSentence} »
                              </blockquote>
                            )}
                          </div>

                          <div className="pt-3 border-t border-rule-soft flex items-center justify-between gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleCardStatus(card)}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition-colors cursor-pointer ${
                                isMastered
                                  ? 'bg-sauge text-white hover:bg-sauge-2'
                                  : 'bg-sauge-wash text-sauge border border-sauge/30 hover:bg-sauge hover:text-white'
                              }`}
                              title={
                                isMastered
                                  ? 'Réactiver ce mot pour le rendre de nouveau cliquable dans les livres'
                                  : 'Marquer comme appris : ne sera plus cliquable dans vos prochains livres'
                              }
                            >
                              <Check size={12} />
                              <span>
                                {isMastered ? 'Maîtrisée ✓ (Réactiver)' : 'Marquer apprise ✓'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.setItem(
                                  'wonderword_shadowing_target',
                                  JSON.stringify({
                                    word: card.word,
                                    ipa: card.ipa,
                                    sentence: card.contextSentence || card.word,
                                    language: card.language,
                                    bookTitle: 'Paquet FSRS',
                                  })
                                );
                                setCurrentView('shadowing');
                              }}
                              className="text-[11px] font-bold text-prune hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Mic size={12} />
                              <span>Pratiquer en Shadowing</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* VUE PROFIL & PARAMÈTRES UTILISATEUR */}
          {currentView === 'settings' && (
            <div className="max-w-[780px] mx-auto px-10 py-12 space-y-8">
              <div className="pb-5 border-b border-rule">
                <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-terre-ink mb-1.5">
                  Compte Universitaire &amp; Préférences
                </p>
                <h1 className="font-serif text-[36px] font-normal text-ink m-0">
                  Profil de {user.displayName}
                </h1>
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="bg-paper border border-rule rounded-2xl p-8 shadow-sm space-y-6"
              >
                <div className="flex items-center gap-4 pb-5 border-b border-rule-soft">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-soleil"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-sauge text-white font-serif text-2xl flex items-center justify-center">
                      {user.displayName?.charAt(0).toUpperCase() || <UserIcon size={24} />}
                    </div>
                  )}
                  <div>
                    <h3 className="font-serif text-xl text-ink m-0">{user.displayName}</h3>
                    <p className="text-xs text-ink-2 m-0">{user.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-sauge-wash text-sauge">
                      {user.isVerified ? 'Compte vérifié' : 'Session active'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
                      Nom affiché dans l’application (Tableau de bord, TopBar, Barre latérale)
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-paper-warm border border-rule rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-prune"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
                        Langue de référence
                      </label>
                      <select
                        value={profileNativeLang}
                        onChange={(e) => setProfileNativeLang(e.target.value)}
                        className="w-full bg-paper-warm border border-rule rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-prune"
                      >
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
                        Langue cible principale
                      </label>
                      <select
                        value={profileTargetLang}
                        onChange={(e) => setProfileTargetLang(e.target.value)}
                        className="w-full bg-paper-warm border border-rule rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-prune"
                      >
                        <option value="fr">Français</option>
                        <option value="de">Deutsch (Allemand)</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="ru">Русский</option>
                      </select>
                    </div>
                  </div>
                </div>

                {profileSavedMsg && (
                  <p className="text-xs font-bold text-sauge flex items-center gap-1.5">
                    <Check size={14} />
                    <span>{profileSavedMsg}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-rule-soft flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition-colors cursor-pointer"
                  >
                    {profileSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch('/auth/reset-users', { method: 'POST' }).catch(() => {});
                        handleLogout();
                      }}
                      className="text-xs font-semibold text-terre hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Vider tous les comptes de test</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-paper-warm hover:bg-paper-2 border border-rule text-ink text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
