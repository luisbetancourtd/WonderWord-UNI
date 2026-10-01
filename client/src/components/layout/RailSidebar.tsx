import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookOpenCheck, 
  Brain, 
  Mic, 
  Settings 
} from 'lucide-react';
import type { ViewType } from '../../types';

interface RailSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const RailSidebar: React.FC<RailSidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[252px] bg-rail flex flex-col z-40 box-border overflow-hidden select-none">
      {/* Halo de aquarelle arrière */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(120% 55% at 12% 0%, rgba(196,99,47,.20), transparent 62%), radial-gradient(100% 48% at 92% 42%, rgba(0,106,100,.20), transparent 66%), radial-gradient(120% 46% at 0% 100%, rgba(123,155,209,.16), transparent 60%)'
        }}
      />

      {/* Titre Logo */}
      <div className="relative px-6 pt-6 pb-5 border-b border-[rgba(255,255,255,0.11)]">
        <h1 className="font-serif text-[21px] text-rail-ink leading-none m-0 mb-2 font-normal tracking-tight">
          WonderWord
        </h1>
        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-rail-ink-3">
          Inmersión Literaria
        </span>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto py-5 space-y-1">
        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-rail-ink-3 mb-2 px-6">
          Lectura
        </p>

        {/* Dashboard */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'dashboard'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'dashboard' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <LayoutDashboard size={16} className={currentView === 'dashboard' ? 'text-soleil' : ''} />
          <span className="flex-1">Dashboard</span>
        </button>

        {/* Biblioteca */}
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'library'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'library' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <BookOpen size={16} className={currentView === 'library' ? 'text-soleil' : ''} />
          <span className="flex-1">Biblioteca</span>
        </button>

        {/* Lector & Estudio */}
        <button
          type="button"
          onClick={() => onNavigate('reader')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'reader'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'reader' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <BookOpenCheck size={16} className={currentView === 'reader' ? 'text-soleil' : ''} />
          <span className="flex-1">Lector & Estudio</span>
        </button>

        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-rail-ink-3 pt-6 mb-2 px-6">
          Práctica & Fonética
        </p>

        {/* Vocabulaire */}
        <button
          type="button"
          onClick={() => onNavigate('vocabulary')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'vocabulary'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'vocabulary' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <Brain size={16} className={currentView === 'vocabulary' ? 'text-soleil' : ''} />
          <span className="flex-1">Vocabulario & Repaso</span>
          <span className="font-serif text-[13px] text-soleil">18</span>
        </button>

        {/* Shadowing & Fonética */}
        <button
          type="button"
          onClick={() => onNavigate('shadowing')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'shadowing'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'shadowing' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <Mic size={16} className={currentView === 'shadowing' ? 'text-soleil' : ''} />
          <span className="flex-1">Shadowing & Fonética</span>
        </button>

        <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-rail-ink-3 pt-6 mb-2 px-6">
          Système
        </p>

        {/* Paramètres */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`w-full relative flex items-center gap-3 px-6 py-2.5 text-[13.5px] transition-colors text-left ${
            currentView === 'settings'
              ? 'font-semibold text-rail-ink bg-[rgba(255,255,255,0.10)] rounded-r-full'
              : 'font-medium text-rail-ink-2 hover:text-rail-ink'
          }`}
        >
          {currentView === 'settings' && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-soleil rounded-r" />
          )}
          <Settings size={16} className={currentView === 'settings' ? 'text-soleil' : ''} />
          <span className="flex-1">Ajustes</span>
        </button>
      </nav>

      {/* Widget Régularité du bas */}
      <div className="relative px-6 py-4 border-t border-[rgba(255,255,255,0.11)] flex items-center gap-3.5 bg-black/10">
        <div className="relative w-[48px] height-[48px] flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 52 52" className="w-12 h-12 -rotate-90">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="4.5" />
            <circle 
              cx="26" cy="26" r="22" 
              fill="none" 
              stroke="var(--sauge-2)" 
              strokeWidth="4.5" 
              strokeLinecap="round" 
              strokeDasharray="138.2" 
              strokeDashoffset="55.2" 
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-serif text-[12px] text-rail-ink">
            18
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-rail-ink-2 leading-tight m-0">18 de 30 min hoy</p>
          <p className="text-[10.5px] text-soleil font-semibold mt-1 leading-tight">Racha de 14 días</p>
        </div>
      </div>
    </aside>
  );
};
