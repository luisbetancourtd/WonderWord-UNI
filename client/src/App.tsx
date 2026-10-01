import { useState, useEffect } from 'react';
import type { ViewType, ThemeType, User } from './types';
import { apiFetch } from './lib/api';
import { PaperBackground } from './components/common/PaperBackground';
import { RailSidebar } from './components/layout/RailSidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReaderView } from './components/reader/ReaderView';
import { ShadowingView } from './components/shadowing/ShadowingView';
import { AuthView } from './components/auth/AuthView';

export function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('papel');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Vérifier le token JWT au chargement
  useEffect(() => {
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
  };

  const getBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Tableau de bord / Le Petit Prince (Chapitre IV)';
      case 'reader':
        return 'Lector & Estudio / Le Petit Prince (Chapitre II)';
      case 'shadowing':
        return 'Laboratoire Phonétique / Studio de Shadowing';
      case 'library':
        return 'Bibliothèque Littéraire / Catalogue Gutenberg & Gallica';
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
      <RailSidebar currentView={currentView} onNavigate={setCurrentView} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col ml-[252px] min-w-0 relative z-10">
        <TopBar 
          currentTheme={currentTheme} 
          onThemeChange={setCurrentTheme} 
          breadcrumb={getBreadcrumb()} 
        />

        <main className="flex-1">
          {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}
          {currentView === 'reader' && <ReaderView />}
          {currentView === 'shadowing' && <ShadowingView />}
          {currentView === 'library' && (
            <div className="max-w-[1080px] mx-auto px-10 py-16 text-center space-y-4">
              <h2 className="font-serif text-3xl font-normal text-ink">Bibliothèque Littéraire</h2>
              <p className="text-ink-2 max-w-lg mx-auto">
                La passerelle vers les 70 000 ouvrages de Gutenberg et de la BNF sera connectée dans le prochain module.
              </p>
              <button 
                type="button" 
                onClick={() => setCurrentView('dashboard')}
                className="bg-prune text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full"
              >
                Retour au Tableau de Bord
              </button>
            </div>
          )}
          {currentView === 'vocabulary' && (
            <div className="max-w-[1080px] mx-auto px-10 py-16 text-center space-y-4">
              <h2 className="font-serif text-3xl font-normal text-ink">Vocabulaire & Mémorisation FSRS</h2>
              <p className="text-ink-2 max-w-lg mx-auto">
                Vos 12 cartes de révision du jour et l'algorithme de répétition espacée sont prêts.
              </p>
              <button 
                type="button" 
                onClick={() => setCurrentView('dashboard')}
                className="bg-sauge text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full"
              >
                Retour au Tableau de Bord
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
