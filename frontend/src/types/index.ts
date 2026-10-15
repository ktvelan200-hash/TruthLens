// ============================================================
// TruthLens – Shared TypeScript Types
// ============================================================

// --- Auth ---
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// --- News ---
export interface NewsArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  url_to_image: string | null;
  source_name: string;
  author: string | null;
  published_at: string | null;
}

export interface NewsSearchResponse {
  articles: NewsArticle[];
  total_results: number;
  page: number;
  page_size: number;
}

export interface SavedArticle {
  id: number;
  title: string;
  description: string | null;
  source: string | null;
  author: string | null;
  url: string;
  image_url: string | null;
  published_at: string | null;
}

export interface NewsSearchParams {
  q?: string;
  category?: string;
  country?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

// --- Prediction ---
export interface PredictRequest {
  headline: string;
  content: string;
  source?: string;
  article_url?: string;
  image_url?: string;
  author?: string;
  published_at?: string;
}

export interface KeywordInfo {
  word: string;
  score: number;
}

export interface PredictResponse {
  prediction: 'REAL' | 'FAKE';
  confidence: number;
  label: number;
  fake_probability: number;
  real_probability: number;
  keywords: KeywordInfo[];
  processed_text_preview: string;
}

export interface PredictionHistoryItem {
  id: number;
  headline: string;
  prediction: 'REAL' | 'FAKE';
  confidence: number;
  source: string | null;
  article_url: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}

// --- Dashboard ---
export interface DailyStats {
  date: string;
  real_count: number;
  fake_count: number;
}

export interface DashboardStats {
  total_analyzed: number;
  real_count: number;
  fake_count: number;
  avg_confidence: number;
  real_percentage: number;
  fake_percentage: number;
  daily_stats: DailyStats[];
}

// --- UI ---
export type Theme = 'light' | 'dark';

export interface ApiError {
  detail: string;
  status?: number;
}

export const NEWS_CATEGORIES = [
  'business', 'entertainment', 'general',
  'health', 'science', 'sports', 'technology',
] as const;

export const NEWS_COUNTRIES = [
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'in', label: 'India' },
  { code: 'au', label: 'Australia' },
  { code: 'ca', label: 'Canada' },
  { code: 'de', label: 'Germany' },
  { code: 'fr', label: 'France' },
  { code: 'jp', label: 'Japan' },
] as const;
