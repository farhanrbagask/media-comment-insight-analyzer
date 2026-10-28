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

const SENTIMENT_COLORS = { positive: '#4A7C59', neutral: '#B8923E', negative: '#9E4B4B' }

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '0.5px solid var(--color-border)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(26,26,26,0.08)',
  fontSize: 12,
  fontFamily: 'var(--font-body)',
}

/* ─── Inline Styles ────────────────────────────────────────────────────── */

const ds = {
  postCard: {
    marginBottom: 0,
  } as React.CSSProperties,
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  } as React.CSSProperties,
  caption: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.75,
    padding: '16px 18px',
    background: 'var(--color-surface-2)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 18,
    borderLeft: '2px solid var(--color-accent)',
    letterSpacing: '0.01em',
  } as React.CSSProperties,
  postMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 24,
  } as React.CSSProperties,
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
  } as React.CSSProperties,
  metaLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-text-muted)',
  } as React.CSSProperties,
  metaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  } as React.CSSProperties,
  sentimentGrid: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: 28,
    alignItems: 'center',
  } as React.CSSProperties,
  sentimentBars: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
  } as React.CSSProperties,
  sentimentTrack: {
    height: 5,
    background: 'var(--color-surface-3)',
    borderRadius: 999,
    overflow: 'hidden',
  } as React.CSSProperties,
  sentimentFill: (pct: number, color: string): React.CSSProperties => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: 999,
    background: color,
    transition: 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
  }),
  topicsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,
  topicItem: {
    display: 'grid',
    gridTemplateColumns: '24px 1fr 100px 40px',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,
  topicRank: {
    width: 22,
    height: 22,
    background: 'var(--color-surface-3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  } as React.CSSProperties,
  topicName: {
    fontSize: 13,
    color: 'var(--color-text-primary)',
    fontWeight: 500,
    letterSpacing: '0.01em',
  } as React.CSSProperties,
  topicBarTrack: {
    height: 5,
    background: 'var(--color-surface-3)',
    borderRadius: 999,
    overflow: 'hidden',
  } as React.CSSProperties,
  topicBarFill: (pct: number): React.CSSProperties => ({
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: 999,
    width: `${pct}%`,
    transition: 'width 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
  }),
  topicPct: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--color-accent)',
    textAlign: 'right' as const,
    fontFamily: 'var(--font-heading)',
    fontSize: 14,
  } as React.CSSProperties,
}

/* ─── Post Info Card ──────────────────────────────────────────────────── */

function PostInfoCard({ analysis }: { analysis: any }) {
  return (
    <div className="card" style={ds.postCard}>
      <div style={ds.postHeader}>
        <span className={`badge badge-${analysis.platform}`}>
          {analysis.platform === 'instagram' ? '📷' : '🎵'} {analysis.platform}
        </span>
        {analysis.author && (
          <span style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 600 }}>
            @{analysis.author}
          </span>
        )}
        <a href={analysis.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Open post">
          <ExternalLink size={13} strokeWidth={1.5} /> Open Post
        </a>
      </div>

      {analysis.caption && (
        <p style={ds.caption}>{analysis.caption}</p>
      )}

      <div style={ds.postMeta}>
        {analysis.post_published_at && (
          <div style={ds.metaItem}>
            <span style={ds.metaLabel}>Published</span>
            <span style={ds.metaValue}>
              {format(new Date(analysis.post_published_at), 'dd MMM yyyy')}
            </span>
          </div>
        )}
        {analysis.post_like_count > 0 && (
          <div style={ds.metaItem}>
            <span style={ds.metaLabel}>Likes</span>
            <span style={{ ...ds.metaValue, fontFamily: 'var(--font-heading)', fontSize: 16 }}>{analysis.post_like_count.toLocaleString()}</span>
          </div>
        )}
        <div style={ds.metaItem}>
          <span style={ds.metaLabel}>Comments Analyzed</span>
          <span style={{ ...ds.metaValue, fontFamily: 'var(--font-heading)', fontSize: 16 }}>{(analysis.total_comments || 0).toLocaleString()}</span>
        </div>
        <div style={ds.metaItem}>
          <span style={ds.metaLabel}>Analyzed On</span>
          <span style={ds.metaValue}>{format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Sentiment Summary ────────────────────────────────────────────────── */

function SentimentSummary({ analysis }: { analysis: any }) {
  const data = [
    { name: 'Positive', value: analysis.positive_count || 0, pct: parseFloat(analysis.positive_percentage || 0), color: SENTIMENT_COLORS.positive },
    { name: 'Neutral',  value: analysis.neutral_count  || 0, pct: parseFloat(analysis.neutral_percentage  || 0), color: SENTIMENT_COLORS.neutral  },
    { name: 'Negative', value: analysis.negative_count || 0, pct: parseFloat(analysis.negative_percentage || 0), color: SENTIMENT_COLORS.negative },
  ]

  return (
    <div className="card">
      <div className="section-header"><span className="section-title">Sentiment Distribution</span></div>
      <div style={ds.sentimentGrid}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: any) => `${v.toLocaleString()} comments`} />
          </PieChart>
        </ResponsiveContainer>
        <div style={ds.sentimentBars}>
          {data.map(({ name, value, pct, color }) => (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', letterSpacing: '0.01em' }}>{name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={ds.sentimentTrack}>
                <div style={ds.sentimentFill(pct, color)} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                {value.toLocaleString()} comments
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Keywords & Topics ────────────────────────────────────────────────── */

function KeywordsCard({ keywords }: { keywords?: any[] }) {
  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hash size={15} strokeWidth={1.8} />Top Keywords
        </span>
      </div>
      {!keywords?.length
        ? <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-title">No keywords</div></div>
        : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={keywords.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              <YAxis type="category" dataKey="keyword" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-body)' }} width={80} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="frequency" fill="#7A8C6A" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}

function TopicsCard({ topics }: { topics?: any[] }) {
  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={15} strokeWidth={1.8} />Top Topics
        </span>
      </div>
      {!topics?.length
        ? <div className="empty-state" style={{ padding: '20px 0' }}><div className="empty-state-title">No topics</div></div>
        : (
          <div style={ds.topicsList}>
            {topics.slice(0, 8).map((t: any, i: number) => (
              <div key={t.topic} style={ds.topicItem}>
                <span style={ds.topicRank}>{i + 1}</span>
                <span style={ds.topicName}>{t.topic}</span>
                <div style={ds.topicBarTrack}>
                  <div style={ds.topicBarFill(t.percentage || 0)} />
                </div>
                <span style={ds.topicPct}>{parseFloat(t.percentage || 0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

/* ─── Insight Card ─────────────────────────────────────────────────────── */

function InsightCard({ insight }: { insight: any }) {
  if (!insight) return null

  const sections = [
    { key: 'overall',        title: 'Overall Sentiment',    color: 'var(--color-accent)' },
    { key: 'positive',       title: 'Positive Highlights',  color: 'var(--color-positive)' },
    { key: 'negative',       title: 'Negative Feedback',    color: 'var(--color-negative)' },
    { key: 'topics',         title: 'Topic Insights',       color: 'var(--color-neutral)' },
    { key: 'recommendation', title: 'Recommendation',       color: '#8B6E4E' },
  ]

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={15} strokeWidth={1.8} />Generated Insight
        </span>
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

/* ─── Comment Explorer ─────────────────────────────────────────────────── */

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
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={15} strokeWidth={1.8} />Comment Explorer
        </span>
        {pagination && <span className="text-sm text-muted">{pagination.total.toLocaleString()} comments</span>}
      </div>

      {/* Comment filters */}
      <div className="filter-bar mb-4">
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={13} strokeWidth={1.8} className="search-icon" />
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
                  {c.username && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.02em' }}>@{c.username}</div>}
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{c.raw_text}</div>
                </td>
                <td>
                  <span className={`badge badge-${c.sentiment || 'neutral'}`}>
                    {c.sentiment || 'neutral'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)', color: SENTIMENT_COLORS[c.sentiment as keyof typeof SENTIMENT_COLORS] || 'var(--color-text-muted)' }}>
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

/* ─── Delete Modal ─────────────────────────────────────────────────────── */

function DeleteModal({ id, onConfirm, onCancel }: { id: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, marginBottom: 10 }}>Delete this analysis?</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.7, letterSpacing: '0.01em' }}>
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

/* ─── Main Page ────────────────────────────────────────────────────────── */

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
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 160, marginBottom: 22 }} />
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
          <Info size={16} strokeWidth={1.8} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            <ArrowLeft size={15} strokeWidth={1.8} /> Back
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: 26 }}>Analysis Detail</h1>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>ID #{analysis.id}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="reanalyze-btn"
            className="btn btn-secondary btn-sm"
            onClick={() => reanalyzeMutation.mutate()}
            disabled={reanalyzeMutation.isPending}
          >
            <RotateCcw size={13} strokeWidth={1.8} />
            {reanalyzeMutation.isPending ? 'Starting...' : 'Analyze Again'}
          </button>
          <button
            id="delete-analysis-btn"
            className="btn btn-danger btn-sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 size={13} strokeWidth={1.8} /> Delete
          </button>
        </div>
      </div>

      {/* Status banner for in-progress */}
      {!isCompleted && analysis.status !== 'failed' && (
        <div className="alert alert-info mb-4">
          <div className="spinner" style={{ width: 14, height: 14, borderWidth: '1.5px', flexShrink: 0 }} />
          Analysis is {analysis.status}... This page will update automatically.
        </div>
      )}

      {analysis.status === 'failed' && (
        <div className="alert alert-error mb-4">
          <Info size={15} strokeWidth={1.8} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Analysis failed</div>
            <div style={{ fontSize: 13 }}>{analysis.error_message || 'An error occurred during analysis.'}</div>
          </div>
        </div>
      )}

      {/* Post Info */}
      <PostInfoCard analysis={analysis} />
      <div style={{ height: 22 }} />

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
