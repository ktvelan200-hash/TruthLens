// ============================================================
// TruthLens – Axios API Client
// ============================================================
import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  TokenResponse, LoginRequest, RegisterRequest, User,
  NewsSearchResponse, NewsSearchParams, SavedArticle,
  PredictRequest, PredictResponse,
  PredictionHistoryItem,
  DashboardStats,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail: string }>) => {
    const msg =
      err.response?.data?.detail ??
      (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Network error');
    return Promise.reject(new Error(msg));
  }
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (body: RegisterRequest) =>
    api.post<TokenResponse>('/auth/register', body).then((r) => r.data),

  login: (body: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', body).then((r) => r.data),

  me: () =>
    api.get<User>('/auth/me').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------
export const newsApi = {
  getNews: (params: NewsSearchParams = {}) =>
    api.get<NewsSearchResponse>('/news', { params }).then((r) => r.data),

  getHeadlines: (params: NewsSearchParams = {}) =>
    api.get<NewsSearchResponse>('/news/headlines', { params }).then((r) => r.data),

  saveArticle: (body: {
    title: string; description?: string; source?: string;
    author?: string; url: string; image_url?: string; published_at?: string;
  }) =>
    api.post<SavedArticle>('/news/save', body).then((r) => r.data),

  getSavedArticles: () =>
    api.get<SavedArticle[]>('/news/saved').then((r) => r.data),

  deleteSavedArticle: (id: number) =>
    api.delete(`/news/saved/${id}`),
};

// ---------------------------------------------------------------------------
// Prediction
// ---------------------------------------------------------------------------
export const predictionApi = {
  predict: (body: PredictRequest) =>
    api.post<PredictResponse>('/predict', body).then((r) => r.data),

  modelInfo: () =>
    api.get<{ model_ready: boolean; metrics: Record<string, unknown> }>('/model/info').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export const historyApi = {
  getHistory: (params: {
    filter_by?: string; search?: string; page?: number; page_size?: number;
  } = {}) =>
    api.get<PredictionHistoryItem[]>('/history', { params }).then((r) => r.data),

  getCount: () =>
    api.get<{ total: number; real: number; fake: number }>('/history/count').then((r) => r.data),

  getById: (id: number) =>
    api.get<PredictionHistoryItem>(`/history/${id}`).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/history/${id}`),

  clearAll: () =>
    api.delete('/history'),
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export const healthApi = {
  // Uses the configured `api` instance so the Vite dev-server proxy
  // (which covers both /api and /health) forwards it correctly.
  check: () =>
    api.get<{ status: string; db_connected: boolean; model_ready: boolean }>(
      '/health',
      // Override baseURL: health lives at root, not under /api
      { baseURL: '' }
    ).then((r) => r.data),
};

export default api;
