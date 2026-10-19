import api from './client'
import type {
  ImportPreviewResult,
  ImportConfirmResult,
  Analysis,
  Comment,
  DashboardSummary,
  SentimentDistribution,
  SentimentTrendPoint,
  TopItem,
  PlatformCount,
  PaginatedResponse,
  AnalysisListFilters,
  DashboardFilters,
} from '../types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (password: string) =>
    api.post<{ success: boolean; data: { token: string } }>('/auth/login', { password }).then(r => r.data),

  verify: () =>
    api.post<{ success: boolean }>('/auth/verify').then(r => r.data),
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export const postsApi = {
  getPost: (id: number) =>
    api.get(`/posts/${id}`).then(r => r.data),
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export const analysesApi = {
  list: (params?: AnalysisListFilters) =>
    api.get<PaginatedResponse<Analysis>>('/analyses', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<{ success: boolean; data: Analysis }>(`/analyses/${id}`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/analyses/${id}`).then(r => r.data),

  reanalyze: (id: number) =>
    api.post(`/analyses/${id}/reanalyze`).then(r => r.data),

  getComments: (id: number, params?: { page?: number; limit?: number; sentiment?: string; search?: string; sortBy?: string; sortOrder?: string }) =>
    api.get<PaginatedResponse<Comment>>(`/analyses/${id}/comments`, { params }).then(r => r.data),

  pollStatus: (id: number) =>
    api.get<{ success: boolean; data: Analysis }>(`/analyses/${id}`).then(r => r.data),
}

// ─── Imports ──────────────────────────────────────────────────────────────────

export const importsApi = {
  /**
   * Upload a CSV file for preview and cleaning.
   * Returns summary, preview rows, skipped rows, and an importToken.
   */
  preview: (formData: FormData) =>
    api.post<{ success: boolean; data: ImportPreviewResult }>('/imports/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  /**
   * Confirm a previewed import and start the ML analysis pipeline.
   */
  confirm: (importToken: string) =>
    api.post<{ success: boolean; data: ImportConfirmResult }>('/imports/confirm', { importToken }).then(r => r.data),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary', { params }).then(r => r.data),

  sentiment: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: SentimentDistribution }>('/dashboard/sentiment', { params }).then(r => r.data),

  trends: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: SentimentTrendPoint[] }>('/dashboard/trends', { params }).then(r => r.data),

  topics: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: TopItem[] }>('/dashboard/topics', { params }).then(r => r.data),

  keywords: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: TopItem[] }>('/dashboard/keywords', { params }).then(r => r.data),

  platform: (params?: DashboardFilters) =>
    api.get<{ success: boolean; data: PlatformCount[] }>('/dashboard/platform', { params }).then(r => r.data),

  negative: (params?: DashboardFilters) =>
    api.get('/dashboard/negative', { params }).then(r => r.data),

  recent: (limit?: number) =>
    api.get('/dashboard/recent', { params: { limit } }).then(r => r.data),
}
