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

export interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  wordCount: number;
}

export interface BookSummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  description?: string;
  coverColor: string;
  publisher: string;
  language: string;
  cefrLevel: string;
  year: number;
  genre: string;
  totalChapters: number;
  totalWords: number;
  chapters?: ChapterSummary[];
  isAdded?: boolean;
  currentChapter?: number;
  progressPercent?: number;
  status?: string;
  lastReadAt?: string;
}

export interface ChapterDetail {
  id: string;
  number: number;
  title: string;
  contentHtml: string;
  wordCount: number;
  audioUrl?: string;
}
