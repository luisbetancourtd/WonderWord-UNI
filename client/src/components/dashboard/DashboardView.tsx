import React, { useState, useEffect } from 'react';
import type { ViewType, User, BookSummary } from '../../types';
import { apiFetch } from '../../lib/api';
import { BookOpen, ArrowRight } from 'lucide-react';

interface DashboardViewProps {
  user?: User | null;
  onNavigate: (view: ViewType) => void;
  onSelectBook?: (bookId: string, chapterNumber?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate, onSelectBook }) => {
  const [currentBook, setCurrentBook] = useState<BookSummary | null>(null);
  const [totalBooks, setTotalBooks] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLibrary = async () => {
      try {
        setLoading(true);
        const myLibrary = await apiFetch<BookSummary[]>('/books/my-library');
        if (myLibrary && myLibrary.length > 0) {
          setCurrentBook(myLibrary[0]);
          setTotalBooks(myLibrary.length);
        }
      } catch (err) {
        console.error('Erreur chargement bibliothèque utilisateur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLibrary();
  }, []);

  const handleResumeReading = () => {
    if (currentBook) {
      if (onSelectBook) {
        onSelectBook(currentBook.slug || currentBook.id, currentBook.currentChapter || 1);
      }
      onNavigate('reader');
    }
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

  return (
    <div className="max-w-[1240px] mx-auto w-full px-12 py-14 space-y-12">
      {/* 1. HERO GREETING */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-rule">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-terre-ink mb-3">
            Atelier de Lecture & Phonétique Critique · Paris 8
          </p>
          <h1 className="font-serif text-[50px] md:text-[60px] font-normal leading-none tracking-tight text-ink m-0">
            Bienvenue, {user?.displayName || 'Cher lecteur'}.
          </h1>
        </div>

        {/* Métriques */}
        <div className="flex items-end gap-0 self-start md:self-auto">
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">1.284</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Mots lus</p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="px-6 text-right">
            <p className="font-serif text-[28px] font-normal text-ink m-0 tabular-nums">{totalBooks}</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Livres</p>
          </div>
          <span className="w-px h-10 bg-rule" />
          <div className="pl-6 text-right">
            <p className="font-serif text-[28px] font-normal text-terre-ink m-0 tabular-nums">14</p>
            <p className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold mt-1">Série (jours)</p>
          </div>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL (2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.66fr_1fr] gap-12 items-start">
        
        {/* Columna Izquierda: Lectura en Curso & Palabra del Día */}
        <div className="space-y-12">
          
          {/* SECCIÓN: LECTURA EN CURSO */}
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
                  <div className={`aspect-[2/3] ${colorStyles.bg} rounded-r-xl rounded-l-sm p-4 flex flex-col justify-between shadow-md border-l-2 border-black/10`}>
                    <p className={`text-[8px] uppercase tracking-widest font-semibold ${colorStyles.text} opacity-70`}>
                      {currentBook.publisher || 'Éditions Critiques'}
                    </p>
                    <div>
                      <span className="block w-full h-px bg-black/20 mb-2" />
                      <p className={`font-serif text-[17px] leading-tight ${colorStyles.text} font-normal line-clamp-2`}>
                        {currentBook.title}
                      </p>
                      <p className={`text-[9px] ${colorStyles.text} opacity-80 mt-1 line-clamp-1`}>
                        {currentBook.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9.5px] uppercase tracking-wider font-bold text-sauge border border-sauge rounded-full px-2.5 py-0.5">
                      Français {currentBook.cefrLevel}
                    </span>
                    <span className="text-[10px] text-ink-3">{currentBook.year}</span>
                  </div>

                  {/* Progression Circulaire */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg viewBox="0 0 52 52" className="w-14 h-14 -rotate-90">
                        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--rule-soft)" strokeWidth="5" />
                        <circle 
                          cx="26" cy="26" r="22" 
                          fill="none" 
                          stroke="var(--sauge)" 
                          strokeWidth="5" 
                          strokeLinecap="round" 
                          strokeDasharray="138.2" 
                          strokeDashoffset={138.2 - (138.2 * (currentBook.progressPercent || 0)) / 100} 
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center font-serif text-[13px] text-ink">
                        {Math.round(currentBook.progressPercent || 0)}%
                      </span>
                    </div>
                    <span className="text-[11px] leading-tight text-ink-2">
                      Chapitre {currentBook.currentChapter || 1}<br />sur {currentBook.totalChapters || 1}
                    </span>
                  </div>
                </div>

                {/* Détails et Extrait avec Phonétique */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-[38px] font-normal leading-tight text-ink m-0 mb-1">
                    {currentBook.title}
                  </h2>
                  <p className="text-[13px] text-ink-2 mb-6">
                    {currentBook.author} · Chapitre {currentBook.currentChapter || 1}
                  </p>

                  {/* Carte "Reprendre ici" */}
                  <div className="bg-paper p-5 rounded-2xl border border-rule shadow-sm">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-ink-3 mb-2.5">
                      Reprendre la lecture
                    </p>
                    <p className="font-serif text-[20px] leading-[2.2] text-ink m-0">
                      <ruby>J’ai<rt>ʒe</rt></ruby> <ruby>de<rt>də</rt></ruby> <ruby>sérieuses<rt>seʁjøz</rt></ruby> <ruby>raisons<rt>ʁɛzɔ̃</rt></ruby> <ruby>de<rt>də</rt></ruby> <ruby>croire<rt>kʁwaʁ</rt></ruby> <ruby>que<rt>kə</rt></ruby> <ruby>la<rt>la</rt></ruby> <ruby>planète<rt>planɛt</rt></ruby>…
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-6 mt-6">
                    <button
                      type="button"
                      onClick={handleResumeReading}
                      className="bg-prune hover:bg-prune-2 text-white text-[11px] font-bold uppercase tracking-widest px-7 py-3 rounded-full shadow transition-all flex items-center gap-2"
                    >
                      <span>Continuer la lecture</span>
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('shadowing')}
                      className="text-[11px] font-bold uppercase tracking-widest text-ink-2 border-b border-rule hover:border-ink pb-0.5 transition-colors"
                    >
                      Studio Phonétique
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-paper border border-rule rounded-2xl p-8 text-center space-y-4">
                <BookOpen size={36} className="text-sauge mx-auto" />
                <h3 className="font-serif text-2xl text-ink">Votre bibliothèque vous attend</h3>
                <p className="text-xs text-ink-2 max-w-md mx-auto">
                  Choisissez votre premier livre parmi les œuvres annotées de notre catalogue pour démarrer votre apprentissage.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('library')}
                  className="bg-prune hover:bg-prune-2 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full shadow transition-all"
                >
                  Explorer le Catalogue
                </button>
              </div>
            )}
          </section>

          {/* SECCIÓN: PALABRA DEL DÍA */}
          <section className="bg-paper p-6 rounded-2xl border border-rule shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9.5px] uppercase tracking-widest font-bold text-bleuet-ink bg-soleil-wash px-2.5 py-0.5 rounded">
                Mot du jour
              </span>
              <span className="text-xs text-ink-3">· Liaison obligatoire</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-serif text-[32px] text-ink leading-tight flex items-baseline gap-2">
                  <span className="text-[20px] text-ink-3">le</span>
                  <span>les</span>
                  <span className="text-terre font-bold">‿</span>
                  <span>hommes</span>
                </div>
                <p className="font-ipa text-sauge text-[14px] mt-1 font-bold">
                  /le.z‿ɔm/
                </p>
                <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                  « Les hommes ». Le <em>s</em> muet se prononce <span className="font-bold text-terre">/z/</span> lors de la liaison avec la voyelle suivante (liaison obligatoire en français).
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('shadowing')}
                className="self-start sm:self-auto bg-paper-warm hover:bg-paper-2 border border-rule text-ink text-[11px] font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
              >
                Pratiquer la liaison
              </button>
            </div>
          </section>

        </div>

        {/* Columna Derecha: Sistema de Repaso (SRS) & Metas */}
        <div className="space-y-8">
          
          {/* Carte de Répétition Espacée */}
          <div className="bg-paper p-7 rounded-2xl border border-rule shadow-sm">
            <span className="inline-block bg-soleil text-soleil-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-4">
              Cartes du jour
            </span>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-serif text-[56px] font-normal text-ink leading-none">
                12
              </span>
              <span className="text-[13px] text-ink-3">
                cartes prêtes pour révision
              </span>
            </div>

            <p className="text-[13px] text-ink-2 mb-6">
              Cinq minutes par jour suffisent pour consolider la mémorisation lexicale à long terme.
            </p>

            <div className="space-y-2.5 text-[12.5px] border-t border-rule/60 pt-4 mb-6">
              <div className="flex justify-between text-ink-2">
                <span>Nouvelles</span>
                <span className="font-bold text-ink">4</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>En apprentissage</span>
                <span className="font-bold text-ink">3</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>En révision</span>
                <span className="font-bold text-ink">4</span>
              </div>
              <div className="flex justify-between text-ink-2">
                <span>À consolider</span>
                <span className="font-bold text-terre-ink">1</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('vocabulary')}
              className="w-full bg-sauge hover:bg-sauge-2 text-white font-bold text-[12px] uppercase tracking-wider py-3 rounded-full transition-all shadow"
            >
              Démarrer la session FSRS
            </button>
          </div>

          {/* Langues & Niveaux */}
          <div className="bg-paper p-6 rounded-2xl border border-rule shadow-sm space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-ink-3 m-0">
              Parcours Linguistique
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Français Littéraire (B1)</span>
                  <span className="text-sauge">7 / 24 chapitres</span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div className="h-full bg-sauge rounded-full w-[29%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12.5px] font-semibold text-ink mb-1">
                  <span>Phonétique & Formants F1/F2</span>
                  <span className="text-bleuet-ink">3 / 18 voyelles</span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 rounded-full overflow-hidden">
                  <div className="h-full bg-bleuet-ink rounded-full w-[16%]" />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
