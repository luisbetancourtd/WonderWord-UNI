import React from 'react';
import { Sun, Book, Moon, Bell } from 'lucide-react';
import type { ThemeType } from '../../types';

interface TopBarProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  breadcrumb?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ currentTheme, onThemeChange, breadcrumb = "Le Petit Prince / Chapitre IV / 18 min restants" }) => {
  return (
    <header className="sticky top-0 z-30 bg-rail h-14 px-10 flex items-center justify-between select-none">
      {/* Halo discret */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(90% 200% at 6% 50%, rgba(196,99,47,.2), transparent 58%), radial-gradient(70% 180% at 74% 50%, rgba(0,106,100,.2), transparent 62%)'
        }}
      />

      {/* Fil d'Ariane */}
      <div className="relative flex items-center gap-2.5 text-[11.5px] text-rail-ink-2 tracking-wide font-medium">
        <span>{breadcrumb}</span>
      </div>

      {/* Contrôles de Droite */}
      <div className="relative flex items-center gap-5">
        {/* Sélecteur de Thème Ergonmique */}
        <div className="flex items-center gap-1 p-1 bg-black/30 rounded-full border border-white/5">
          <button
            type="button"
            onClick={() => onThemeChange('papel')}
            title="Mode Papier Naturel"
            className={`w-7 h-6 rounded-full flex items-center justify-center transition-all ${
              currentTheme === 'papel'
                ? 'bg-soleil text-[#463605] shadow'
                : 'text-rail-ink-3 hover:text-white'
            }`}
          >
            <Sun size={13} />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('sepia')}
            title="Mode Sépia Reposant"
            className={`w-7 h-6 rounded-full flex items-center justify-center transition-all ${
              currentTheme === 'sepia'
                ? 'bg-[#eaa90d] text-[#463605] shadow'
                : 'text-rail-ink-3 hover:text-white'
            }`}
          >
            <Book size={13} />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('noche')}
            title="Mode Nuit Profonde"
            className={`w-7 h-6 rounded-full flex items-center justify-center transition-all ${
              currentTheme === 'noche'
                ? 'bg-soleil text-[#16141a] shadow'
                : 'text-rail-ink-3 hover:text-white'
            }`}
          >
            <Moon size={13} />
          </button>
        </div>

        <span className="w-px h-4 bg-white/10" />

        {/* Cloche Notifications */}
        <button 
          type="button" 
          aria-label="Notifications"
          className="relative text-rail-ink-2 hover:text-white transition-colors"
        >
          <Bell size={15} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-soleil" />
        </button>

        {/* Profil Utilisateur */}
        <span className="text-[11px] tracking-wider uppercase text-rail-ink-2 font-semibold">
          Kevin
        </span>
      </div>
    </header>
  );
};
