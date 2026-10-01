import React, { useState } from 'react';
import { BookOpen, Mail, Lock, User as UserIcon } from 'lucide-react';
import { apiFetch, ApiError } from '../../lib/api';
import type { User, AuthResponse } from '../../types';

interface AuthViewProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.includes('@')) {
      errors.email = "L'adresse email est invalide.";
    }
    if (password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (mode === 'register') {
      if (!displayName.trim()) {
        errors.displayName = "Le nom d'utilisateur est requis.";
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' 
        ? { email, password }
        : { email, password, displayName, nativeLang: 'fr', targetLang: 'es' };

      const response = await apiFetch<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      onAuthSuccess(response.token, response.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue s'est produite.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FDFBF7] text-ink relative p-6">
      {/* Texture de papier en fond */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-terre/10 p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-prune/5 rounded-full flex items-center justify-center mb-4 text-prune">
            <BookOpen size={32} strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl text-ink mb-2">WonderWord</h1>
          <p className="text-ink-2/70 text-sm tracking-wide uppercase font-sans">
            Inmersión Literaria & Fonética Viva
          </p>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-terre/20 mb-6">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              mode === 'login' ? 'text-prune' : 'text-ink-2 hover:text-ink'
            }`}
            onClick={() => setMode('login')}
          >
            Se connecter
            {mode === 'login' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-prune rounded-t-full" />
            )}
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${
              mode === 'register' ? 'text-prune' : 'text-ink-2 hover:text-ink'
            }`}
            onClick={() => setMode('register')}
          >
            S'inscrire
            {mode === 'register' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-prune rounded-t-full" />
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-prune/5 border border-prune/20 rounded-lg text-prune text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <div className="relative flex items-center">
                <UserIcon className="absolute left-3 text-terre/50" size={18} />
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-terre/20 rounded-xl py-3 pl-10 pr-4 text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 transition-all placeholder:text-terre/40"
                />
              </div>
              {fieldErrors.displayName && (
                <p className="text-prune text-xs mt-1.5 ml-1">{fieldErrors.displayName}</p>
              )}
            </div>
          )}

          <div>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-terre/50" size={18} />
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-terre/20 rounded-xl py-3 pl-10 pr-4 text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 transition-all placeholder:text-terre/40"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-prune text-xs mt-1.5 ml-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-terre/50" size={18} />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-terre/20 rounded-xl py-3 pl-10 pr-4 text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 transition-all placeholder:text-terre/40"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-prune text-xs mt-1.5 ml-1">{fieldErrors.password}</p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-terre/50" size={18} />
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-terre/20 rounded-xl py-3 pl-10 pr-4 text-ink focus:outline-none focus:border-prune/50 focus:ring-1 focus:ring-prune/50 transition-all placeholder:text-terre/40"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-prune text-xs mt-1.5 ml-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-prune hover:bg-prune/90 text-white rounded-full py-3.5 mt-2 font-medium tracking-wide transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </span>
            ) : (
              mode === 'login' ? 'Se connecter' : 'Créer mon compte'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
