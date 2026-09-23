import api from './client'

export const authApi = {
  login: (password: string) =>
    api.post('/auth/login', { password }).then(r => r.data),

  verify: () =>
    api.post('/auth/verify').then(r => r.data),
}

export const postsApi = {
  analyze: (url: string) =>
    api.post('/posts/analyze', { url }).then(r => r.data),

  getPost: (id: number) =>
    api.get(`/posts/${id}`).then(r => r.data),
}

export const analysesApi = {
  list: (params?: Record<string, any>) =>
    api.get('/analyses', { params }).then(r => r.data),

  get: (id: number) =>
    api.get(`/analyses/${id}`).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/analyses/${id}`).then(r => r.data),

  reanalyze: (id: number) =>
    api.post(`/analyses/${id}/reanalyze`).then(r => r.data),

  getComments: (id: number, params?: Record<string, any>) =>
    api.get(`/analyses/${id}/comments`, { params }).then(r => r.data),

  pollStatus: (id: number) =>
    api.get(`/analyses/${id}`).then(r => r.data),
}

export const dashboardApi = {
  summary: (params?: Record<string, any>) =>
    api.get('/dashboard/summary', { params }).then(r => r.data),

  sentiment: (params?: Record<string, any>) =>
    api.get('/dashboard/sentiment', { params }).then(r => r.data),

  trends: (params?: Record<string, any>) =>
    api.get('/dashboard/trends', { params }).then(r => r.data),

  topics: (params?: Record<string, any>) =>
    api.get('/dashboard/topics', { params }).then(r => r.data),

  keywords: (params?: Record<string, any>) =>
    api.get('/dashboard/keywords', { params }).then(r => r.data),

  platform: (params?: Record<string, any>) =>
    api.get('/dashboard/platform', { params }).then(r => r.data),

  negative: (params?: Record<string, any>) =>
    api.get('/dashboard/negative', { params }).then(r => r.data),

  recent: (limit?: number) =>
    api.get('/dashboard/recent', { params: { limit } }).then(r => r.data),
}
