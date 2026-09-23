import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react'
import { analysesApi } from '../api'
import { format } from 'date-fns'
import './AnalysisHistory.css'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed:  { label: 'Completed',  cls: 'badge-positive' },
    failed:     { label: 'Failed',     cls: 'badge-negative' },
    pending:    { label: 'Pending',    cls: '' },
    fetching:   { label: 'Fetching',   cls: 'badge-neutral'  },
    processing: { label: 'Processing', cls: 'badge-accent'   },
  }
  const cfg = map[status] || { label: status, cls: '' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

function DeleteModal({ id, onConfirm, onCancel }: { id: number; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Analysis?</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          This will permanently remove the analysis result and all associated comments, keywords, and topics. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button id={`delete-confirm-${id}`} className="btn btn-danger" onClick={onConfirm}>Delete Analysis</button>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisHistory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Filters & pagination state
  const [search, setSearch]       = useState('')
  const [platform, setPlatform]   = useState('')
  const [status, setStatus]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [page, setPage]           = useState(1)
  const [sortBy, setSortBy]       = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const params = {
    page, limit: 20,
    ...(search   && { search }),
    ...(platform && { platform }),
    ...(status   && { status }),
    ...(dateFrom && { dateFrom }),
    sortBy, sortOrder,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['analyses', params],
    queryFn: () => analysesApi.list(params).then(r => r),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => analysesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      setDeleteId(null)
    },
  })

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortOrder('desc') }
    setPage(1)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null
    return sortOrder === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
  }

  const analyses = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-subtitle">All posts you've analyzed</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          + Analyze New Post
        </button>
      </div>

      {/* Filters */}
      <div className="card card-sm mb-4">
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
            <Search size={15} className="search-icon" />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by URL, author, or caption..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <select className="filter-select" value={platform} onChange={e => { setPlatform(e.target.value); setPage(1) }}>
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>

          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
          </select>

          <input
            type="date"
            className="filter-select"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            title="From date"
          />

          {(search || platform || status || dateFrom) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPlatform(''); setStatus(''); setDateFrom(''); setPage(1) }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Date <SortIcon col="created_at" /></span>
              </th>
              <th>Platform</th>
              <th>Post</th>
              <th onClick={() => toggleSort('total_comments')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>Comments <SortIcon col="total_comments" /></span>
              </th>
              <th>Sentiment</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
            )}

            {!isLoading && analyses.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No analyses yet</div>
                    <p style={{ fontSize: 13 }}>Start by analyzing a social media post URL.</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/analyze')}>
                      Analyze Your First Post
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && analyses.map((a: any) => (
              <tr key={a.id}>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {format(new Date(a.created_at), 'dd MMM yyyy')}
                </td>
                <td>
                  <span className={`badge badge-${a.platform}`}>
                    {a.platform === 'instagram' ? '📷' : '🎵'} {a.platform}
                  </span>
                </td>
                <td>
                  <div style={{ maxWidth: 240 }}>
                    {a.author && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                        @{a.author}
                      </div>
                    )}
                    <div className="truncate" style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 220 }}>
                      {a.url}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {(a.total_comments || 0).toLocaleString()}
                </td>
                <td>
                  {a.status === 'completed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-positive)' }}>
                        +{parseFloat(a.positive_percentage || 0).toFixed(0)}% pos
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-negative)' }}>
                        -{parseFloat(a.negative_percentage || 0).toFixed(0)}% neg
                      </div>
                    </div>
                  )}
                </td>
                <td><StatusBadge status={a.status} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      id={`view-${a.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/analysis/${a.id}`)}
                      title="View Analysis"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      id={`delete-${a.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteId(a.id)}
                      title="Delete"
                      style={{ color: 'var(--color-negative)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination mt-4">
          <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {[...Array(Math.min(pagination.totalPages, 7))].map((_, i) => {
            const p = i + 1
            return (
              <button key={p} className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )
          })}
          <button className="pagination-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <DeleteModal
          id={deleteId}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
