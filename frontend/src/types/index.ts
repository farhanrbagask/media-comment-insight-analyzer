// ─── Primitive types ─────────────────────────────────────────────────────────

export type Platform = 'instagram' | 'tiktok'

export type AnalysisStatus =
  | 'pending'
  | 'fetching'
  | 'processing'
  | 'completed'
  | 'failed'

export type Sentiment = 'positive' | 'neutral' | 'negative'

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: Pagination
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Database entities ────────────────────────────────────────────────────────

export interface Post {
  id: number
  platform: Platform
  platform_post_id: string
  url: string
  author: string | null
  caption: string | null
  published_at: string | null
  like_count: number
  comment_count: number
  thumbnail_url: string | null
  import_source: 'csv' | null
  imported_filename: string | null
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: number
  post_id: number
  status: AnalysisStatus
  error_message: string | null
  fetched_at: string | null
  total_comments: number
  positive_count: number
  neutral_count: number
  negative_count: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  generated_insight: AnalysisInsight | null
  is_latest: boolean
  created_at: string
  updated_at: string
  // Joined from posts
  platform?: Platform
  url?: string
  author?: string | null
  thumbnail_url?: string | null
  // Joined relations
  keywords?: Keyword[]
  topics?: Topic[]
}

export interface AnalysisInsight {
  overall: string
  positive: string
  negative: string
  topics: string
  recommendation: string
}

export interface Comment {
  id: number
  post_id: number
  analysis_id: number | null
  platform_comment_id: string | null
  username: string | null
  raw_text: string
  processed_text: string | null
  published_at: string | null
  like_count: number
  sentiment: Sentiment | null
  sentiment_score: number | null
  topic: string | null
  is_skipped: boolean
  skip_reason: string | null
  created_at: string
}

export interface Keyword {
  id: number
  analysis_id: number
  keyword: string
  frequency: number
  percentage: number
}

export interface Topic {
  id: number
  analysis_id: number
  topic: string
  frequency: number
  percentage: number
}

// ─── CSV Import types ─────────────────────────────────────────────────────────

/** Raw row from IG Lead Scrapper CSV before cleaning */
export interface CsvRow {
  userId?: string
  userName?: string
  commentId?: string
  commentText: string
  profileUrl?: string
  date?: string
}

/** A single valid comment after CSV cleaning */
export interface ParsedComment {
  platformCommentId: string | null
  username: string | null
  rawText: string
  normalizedText: string
  publishedAt: string | null
  profileUrl: string | null
  platform: Platform
  postUrl: string
}

/** A row that was excluded during CSV cleaning */
export interface SkippedRow {
  rowNum: number
  rawText: string
  skipReason: 'empty_text' | 'duplicate_id'
  commentId?: string
}

/** Summary returned after CSV preview */
export interface ImportSummary {
  totalRows: number
  valid: number
  skipped: number
  duplicates: number
  filename: string
  platform: Platform
  postUrl: string
}

/** Full response from POST /api/imports/preview */
export interface ImportPreviewResult {
  importToken: string
  preview: ParsedComment[]
  skipped: SkippedRow[]
  summary: ImportSummary
}

/** Response from POST /api/imports/confirm */
export interface ImportConfirmResult {
  postId: number
  analysisId: number
}

// ─── Dashboard types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_analyses: number
  total_posts: number
  total_comments: number
  positive_comments: number
  neutral_comments: number
  negative_comments: number
}

export interface SentimentDistribution {
  positive: number
  neutral: number
  negative: number
  total: number
  positive_pct: number
  neutral_pct: number
  negative_pct: number
}

export interface SentimentTrendPoint {
  date: string
  positive: number
  neutral: number
  negative: number
  total: number
}

export interface TopItem {
  keyword?: string
  topic?: string
  total_frequency: number
}

export interface PlatformCount {
  platform: Platform
  count: number
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface DashboardFilters {
  platform?: Platform
  dateFrom?: string
  dateTo?: string
  dateRange?: string
}

export interface AnalysisListFilters {
  page?: number
  limit?: number
  search?: string
  platform?: Platform | string
  status?: AnalysisStatus | string
  dateFrom?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | string
}
