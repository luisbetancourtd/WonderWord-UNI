export type ViewType = 'dashboard' | 'library' | 'reader' | 'shadowing' | 'vocabulary' | 'settings';

export type ThemeType = 'papel' | 'sepia' | 'noche';

export interface User {
  id: string;
  email: string;
  displayName: string;
  nativeLang: string;
  targetLang: string;
  isVerified?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  emailSent?: boolean;
  verifyUrl?: string;
  message?: string;
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  publisher: string;
  progressPercent: number;
  currentPage: number;
  totalPages: number;
  language: string;
  year: number;
}
