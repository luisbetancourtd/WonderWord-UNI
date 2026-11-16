import React from 'react';
import { Sun, Book, Moon, LogOut, User as UserIcon } from 'lucide-react';
import type { ThemeType, User, ViewType } from '../../types';

interface TopBarProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  breadcrumb?: string;
  user?: User | null;
  onLogout?: () => void;
  onNavigate?: (view: ViewType) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTheme,
  onThemeChange,
  breadcrumb = 'Tableau de bord',
  user,
  onLogout,
  onNavigate,
}) => {
  const displayUserName =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Lecteur';
  const userInitial = displayUserName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-rail h-14 px-8 md:px-10 flex items-center justify-between select-none border-b border-white/5">
      {/* Halo discret */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(90% 200% at 6% 50%, rgba(196,99,47,.2), transparent 58%), radial-gradient(70% 180% at 74% 50%, rgba(0,106,100,.2), transparent 62%)',
        }}
      />

      {/* Fil d'Ariane */}
      <div className="relative flex items-center gap-2.5 text-[11.5px] text-rail-ink-2 tracking-wide font-medium truncate max-w-[50%]">
        <span className="truncate">{breadcrumb}</span>
      </div>

      {/* Contrôles de Droite */}
      <div className="relative flex items-center gap-4">
        {/* Sélecteur de Thème Ergonomique */}
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

        {/* Profil Utilisateur Dynamique */}
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('settings')}
          title={`Profil de ${displayUserName} (${user?.email || ''}) — Cliquer pour modifier`}
          className="flex items-center gap-2.5 px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayUserName}
              className="w-6 h-6 rounded-full object-cover border border-soleil/60"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-sauge text-white text-[11px] font-bold flex items-center justify-center border border-white/20">
              {userInitial || <UserIcon size={12} />}
            </span>
          )}
          <span className="text-[11.5px] tracking-wider uppercase text-rail-ink font-semibold max-w-[160px] truncate">
            {displayUserName}
          </span>
        </button>

        {/* Bouton Déconnexion */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter (Cerrar sesión)"
            className="text-rail-ink-2 hover:text-soleil p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};
