export type ViewType = 'dashboard' | 'library' | 'reader' | 'shadowing' | 'vocabulary' | 'settings';

export type ThemeType = 'papel' | 'sepia' | 'noche';

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
