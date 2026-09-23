import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  ArrowLeft, RotateCcw, Trash2, ExternalLink, Search,
  MessageSquare, Hash, Lightbulb, Info
} from 'lucide-react'
import { analysesApi } from '../api'
import { format } from 'date-fns'
import './AnalysisDetail.css'

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444' }

// ─── Post Info Card ──────────────────────────────────────────────────────────

function PostInfoCard({ analysis }: { analysis: any }) {
  return (
    <div className="card detail-post-card">
      <div className="detail-post-header">
        <span className={`badge badge-${analysis.platform}`}>
          {analysis.platform === 'instagram' ? '📷' : '🎵'} {analysis.platform}
        </span>
        {analysis.author && (
          <span style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>
            @{analysis.author}
          </span>
        )}
        <a href={analysis.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Open post">
          <ExternalLink size={14} /> Open Post
        </a>
      </div>

      {analysis.caption && (
        <p className="detail-caption">{analysis.caption}</p>
      )}

      <div className="detail-post-meta">
        {analysis.post_published_at && (
          <div className="meta-item">
            <span className="meta-label">Published</span>
            <span className="meta-value">
              {format(new Date(analysis.post_published_at), 'dd MMM yyyy')}
            </span>
          </div>
        )}
        {analysis.post_like_count > 0 && (
          <div className="meta-item">
            <span className="meta-label">Likes</span>
            <span className="meta-value">{analysis.post_like_count.toLocaleString()}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-label">Comments Analyzed</span>
          <span className="meta-value">{(analysis.total_comments || 0).toLocaleString()}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Analyzed On</span>
          <span className="meta-value">{format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Sentiment Summary ────────────────────────────────────────────────────────

function SentimentSummary({ analysis }: { analysis: any }) {
  const data = [
    { name: 'Positive', value: analysis.positive_count || 0, pct: parseFloat(analysis.positive_percentage || 0), color: SENTIMENT_COLORS.positive },
    { name: 'Neutral',  value: analysis.neutral_count  || 0, pct: parseFloat(analysis.neutral_percentage  || 0), color: SENTIMENT_COLORS.neutral  },
    { name: 'Negative', value: analysis.negative_count || 0, pct: parseFloat(analysis.negative_percentage || 0), color: SENTIMENT_COLORS.negative },
  ]

  return (
    <div className="card">
      <div className="section-header"><span className="section-title">Sentiment Distribution</span></div>
      <div className="sentiment-summary-grid">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={(v: any) => `${v.toLocaleString()} comments`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="sentiment-bars">
          {data.map(({ name, value, pct, color }) => (
            <div key={name} className="sentiment-bar-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
              </div>
              <div className="sentiment-track">
                <div className="sentiment-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {value.toLocaleString()} comments
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Keywords & Topics ────────────────────────────────────────────────────────

function KeywordsCard({ keywords }: { keywords: any[] }) {
  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title"><Hash size={15} style={{ display: 'inline', marginRight: 6 }} />Top Keywords</span>
      </div>
      {!keywords?.length
        ? <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-title">No keywords</div></div>
        : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={keywords.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="keyword" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
              <Bar dataKey="frequency" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}

function TopicsCard({ topics }: { topics: any[] }) {
  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title"><MessageSquare size={15} style={{ display: 'inline', marginRight: 6 }} />Top Topics</span>
      </div>
      {!topics?.length
        ? <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-title">No topics</div></div>
        : (
          <div className="topics-list">
            {topics.slice(0, 8).map((t: any, i: number) => (
              <div key={t.topic} className="topic-item">
                <span className="topic-rank">{i + 1}</span>
                <span className="topic-name">{t.topic}</span>
                <div className="topic-bar-track">
                  <div className="topic-bar-fill" style={{ width: `${t.percentage || 0}%` }} />
                </div>
                <span className="topic-pct">{parseFloat(t.percentage || 0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: any }) {
  if (!insight) return null

  const sections = [
    { key: 'overall',        title: 'Overall Sentiment',    color: 'var(--color-accent-light)' },
    { key: 'positive',       title: 'Positive Highlights',  color: 'var(--color-positive)' },
    { key: 'negative',       title: 'Negative Feedback',    color: 'var(--color-negative)' },
    { key: 'topics',         title: 'Topic Insights',       color: 'var(--color-neutral)' },
    { key: 'recommendation', title: 'Recommendation',       color: '#a855f7' },
  ]

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title"><Lightbulb size={15} style={{ display: 'inline', marginRight: 6 }} />Generated Insight</span>
      </div>
      <div className="insight-section">
        {sections.map(({ key, title, color }) =>
          insight[key] ? (
            <div key={key} className="insight-item" style={{ '--insight-color': color } as any}>
              <div className="insight-item-title">{title}</div>
              <div className="insight-item-text">{insight[key]}</div>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

// ─── Comment Explorer ─────────────────────────────────────────────────────────

function CommentExplorer({ analysisId }: { analysisId: number }) {
  const [search, setSearch]     = useState('')
  const [sentiment, setSentiment] = useState('')
  const [sortBy, setSortBy]     = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage]         = useState(1)

  const params = {
    page, limit: 50,
    ...(search    && { search }),
    ...(sentiment && { sentiment }),
    sortBy, sortOrder,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['comments', analysisId, params],
    queryFn: () => analysesApi.getComments(analysisId, params).then(r => r),
  })

  const comments   = data?.data       || []
  const pagination = data?.pagination

  return (
    <div>
      <div className="section-header mb-4">
        <span className="section-title"><MessageSquare size={15} style={{ display: 'inline', marginRight: 6 }} />Comment Explorer</span>
        {pagination && <span className="text-sm text-muted">{pagination.total.toLocaleString()} comments</span>}
      </div>

      {/* Comment filters */}
      <div className="filter-bar mb-4">
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search comments..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="filter-select" value={sentiment} onChange={e => { setSentiment(e.target.value); setPage(1) }}>
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1) }}>
          <option value="created_at">Date</option>
          <option value="sentiment_score">Score</option>
          <option value="like_count">Likes</option>
        </select>
        <select className="filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Comment</th>
              <th>Sentiment</th>
              <th style={{ textAlign: 'right' }}>Score</th>
              <th>Topic</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[...Array(5)].map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                ))}
              </tr>
            ))}
            {!isLoading && comments.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <div className="empty-state-title">No comments found</div>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && comments.map((c: any) => (
              <tr key={c.id}>
                <td style={{ maxWidth: 340 }}>
                  {c.username && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 3 }}>@{c.username}</div>}
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{c.raw_text}</div>
                </td>
                <td>
                  <span className={`badge badge-${c.sentiment || 'neutral'}`}>
                    {c.sentiment || 'neutral'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: SENTIMENT_COLORS[c.sentiment as keyof typeof SENTIMENT_COLORS] || 'var(--color-text-muted)' }}>
                  {c.sentiment_score ? parseFloat(c.sentiment_score).toFixed(2) : '—'}
                </td>
                <td>
                  {c.topic && <span className="badge badge-accent" style={{ fontSize: 11 }}>{c.topic}</span>}
                </td>
                <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {c.published_at ? format(new Date(c.published_at), 'dd MMM') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
            const p = i + 1
            return <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          })}
          <button className="pagination-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ id, onConfirm, onCancel }: { id: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete this analysis?</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          This will remove the analysis result and its associated data. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button id={`confirm-delete-${id}`} className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDelete, setShowDelete] = useState(false)

  const { data: res, isLoading, error: queryError } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => analysesApi.get(parseInt(id!)).then(r => r.data),
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === 'pending' || status === 'fetching' || status === 'processing' ? 3000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => analysesApi.delete(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      navigate('/history')
    },
  })

  const reanalyzeMutation = useMutation({
    mutationFn: () => analysesApi.reanalyze(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis', id] })
    },
  })

  const analysis = res

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 160, marginBottom: 20 }} />
        <div className="grid-2">
          <div className="skeleton" style={{ height: 280 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
      </div>
    )
  }

  if (queryError || !analysis) {
    return (
      <div className="page-wrapper">
        <div className="alert alert-error">
          <Info size={16} />
          Analysis not found or could not be loaded.
        </div>
        <button className="btn btn-secondary mt-4" onClick={() => navigate('/history')}>
          Back to History
        </button>
      </div>
    )
  }

  const isCompleted = analysis.status === 'completed'
  const insight = typeof analysis.generated_insight === 'string'
    ? JSON.parse(analysis.generated_insight)
    : analysis.generated_insight

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>Analysis Detail</h1>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>ID #{analysis.id}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="reanalyze-btn"
            className="btn btn-secondary btn-sm"
            onClick={() => reanalyzeMutation.mutate()}
            disabled={reanalyzeMutation.isPending}
          >
            <RotateCcw size={14} />
            {reanalyzeMutation.isPending ? 'Starting...' : 'Analyze Again'}
          </button>
          <button
            id="delete-analysis-btn"
            className="btn btn-danger btn-sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Status banner for in-progress */}
      {!isCompleted && analysis.status !== 'failed' && (
        <div className="alert alert-info mb-4">
          <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, flexShrink: 0 }} />
          Analysis is {analysis.status}... This page will update automatically.
        </div>
      )}

      {analysis.status === 'failed' && (
        <div className="alert alert-error mb-4">
          <Info size={16} />
          <div>
            <div style={{ fontWeight: 600 }}>Analysis failed</div>
            <div style={{ fontSize: 13 }}>{analysis.error_message || 'An error occurred during analysis.'}</div>
          </div>
        </div>
      )}

      {/* Post Info */}
      <PostInfoCard analysis={analysis} />
      <div style={{ height: 20 }} />

      {/* Sentiment + Topics */}
      {isCompleted && (
        <>
          <div className="grid-2 mb-6">
            <SentimentSummary analysis={analysis} />
            <TopicsCard topics={analysis.topics} />
          </div>

          <div className="mb-6">
            <KeywordsCard keywords={analysis.keywords} />
          </div>

          <div className="mb-6">
            <InsightCard insight={insight} />
          </div>

          <div className="card">
            <CommentExplorer analysisId={parseInt(id!)} />
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <DeleteModal
          id={parseInt(id!)}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
