import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileText, MessageSquare, TrendingUp, TrendingDown, Minus,
  Filter, ExternalLink
} from 'lucide-react'
import { dashboardApi } from '../api'
import { format } from 'date-fns'
import './Dashboard.css'

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

function DashboardFilters({ filters, onChange }: { filters: any; onChange: (f: any) => void }) {
  return (
    <div className="filter-bar">
      <Filter size={15} style={{ color: 'var(--color-text-muted)' }} />
      <select
        className="filter-select"
        value={filters.platform || ''}
        onChange={e => onChange({ ...filters, platform: e.target.value || undefined })}
      >
        <option value="">All Platforms</option>
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
      </select>
      <select
        className="filter-select"
        value={filters.dateRange || ''}
        onChange={e => {
          const val = e.target.value
          const now = new Date()
          let dateFrom: string | undefined
          if (val === '7d')  dateFrom = new Date(now.getTime() - 7  * 86400000).toISOString()
          if (val === '30d') dateFrom = new Date(now.getTime() - 30 * 86400000).toISOString()
          if (val === 'today') dateFrom = new Date(now.setHours(0,0,0,0)).toISOString()
          onChange({ ...filters, dateRange: val || undefined, dateFrom, dateTo: val ? new Date().toISOString() : undefined })
        }}
      >
        <option value="">All Time</option>
        <option value="today">Today</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
      </select>
    </div>
  )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCards({ data }: { data: any }) {
  const kpis = [
    { label: 'Posts Analyzed',     value: data?.total_posts      ?? 0, color: 'var(--color-accent)',   icon: FileText },
    { label: 'Comments Analyzed',  value: data?.total_comments   ?? 0, color: 'var(--color-accent-light)', icon: MessageSquare },
    { label: 'Positive Comments',  value: data?.positive_comments ?? 0, color: 'var(--color-positive)', icon: TrendingUp },
    { label: 'Neutral Comments',   value: data?.neutral_comments  ?? 0, color: 'var(--color-neutral)',  icon: Minus },
    { label: 'Negative Comments',  value: data?.negative_comments ?? 0, color: 'var(--color-negative)', icon: TrendingDown },
  ]

  return (
    <div className="grid-kpi mb-6">
      {kpis.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="kpi-card" style={{ '--kpi-color': color } as any}>
          <div className="kpi-icon" style={{ background: `${color}20`, color }}>
            <Icon size={18} />
          </div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Sentiment Donut ──────────────────────────────────────────────────────────

function SentimentDonut({ data }: { data: any }) {
  const chartData = [
    { name: 'Positive', value: data?.positive ?? 0, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral',  value: data?.neutral  ?? 0, color: SENTIMENT_COLORS.neutral  },
    { name: 'Negative', value: data?.negative ?? 0, color: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0)

  const total = data?.total ?? 0

  return (
    <div className="card" style={{ height: 320 }}>
      <div className="section-header">
        <span className="section-title">Sentiment Distribution</span>
      </div>
      {total === 0 ? (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No data yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" stroke="none">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {chartData.map(({ name, value, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flex: 1 }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sentiment Trend ──────────────────────────────────────────────────────────

function SentimentTrend({ data }: { data: any[] }) {
  const chartData = (data || []).map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    Positive: d.positive,
    Neutral: d.neutral,
    Negative: d.negative,
  }))

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">Sentiment Trend</span>
      </div>
      {chartData.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">No trend data yet</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="Positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Neutral"  stroke={SENTIMENT_COLORS.neutral}  strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function TopBarChart({ title, data, dataKey, nameKey, color }: any) {
  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">{title}</span>
      </div>
      {!data?.length ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-title">No data yet</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis type="category" dataKey={nameKey} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} width={90} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
            <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Platform Distribution ────────────────────────────────────────────────────

function PlatformDist({ data }: { data: any[] }) {
  const PLAT_COLORS: Record<string, string> = {
    instagram: '#e1306c',
    tiktok: '#69c9d0',
  }

  const chartData = (data || []).map(d => ({
    name: d.platform.charAt(0).toUpperCase() + d.platform.slice(1),
    value: d.count,
    color: PLAT_COLORS[d.platform] || '#818cf8',
  }))

  return (
    <div className="card" style={{ height: 280 }}>
      <div className="section-header">
        <span className="section-title">Platform Distribution</span>
      </div>
      {!chartData.length ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-title">No data yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ResponsiveContainer width="55%" height={180}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" outerRadius={75} dataKey="value" stroke="none">
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chartData.map(({ name, value, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Recent Analyses ──────────────────────────────────────────────────────────

function RecentAnalyses({ data }: { data: any[] }) {
  const navigate = useNavigate()

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">Recent Analyses</span>
      </div>
      {!data?.length ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No analyses yet</div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Start by analyzing a social media post URL.</p>
        </div>
      ) : (
        <div className="recent-list">
          {data.map((a: any) => (
            <div key={a.id} className="recent-item" onClick={() => navigate(`/analysis/${a.id}`)}>
              <div className="recent-item-left">
                <span className={`badge badge-${a.platform}`}>
                  {a.platform === 'instagram' ? '📷' : '🎵'} {a.platform}
                </span>
                <span className="truncate" style={{ maxWidth: 200, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {a.author ? `@${a.author}` : a.url}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {a.total_comments?.toLocaleString()} comments
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-positive)' }}>
                  {parseFloat(a.positive_percentage || 0).toFixed(0)}% positive
                </span>
                <ExternalLink size={14} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [filters, setFilters] = useState<any>({})

  const apiFilters = {
    platform: filters.platform,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }

  const { data: summary, isLoading: sumLoading }    = useQuery({ queryKey: ['summary', apiFilters],    queryFn: () => dashboardApi.summary(apiFilters).then(r => r.data) })
  const { data: sentiment }                          = useQuery({ queryKey: ['sentiment', apiFilters],  queryFn: () => dashboardApi.sentiment(apiFilters).then(r => r.data) })
  const { data: trends }                             = useQuery({ queryKey: ['trends', apiFilters],     queryFn: () => dashboardApi.trends(apiFilters).then(r => r.data) })
  const { data: topics }                             = useQuery({ queryKey: ['topics', apiFilters],     queryFn: () => dashboardApi.topics(apiFilters).then(r => r.data) })
  const { data: keywords }                           = useQuery({ queryKey: ['keywords', apiFilters],   queryFn: () => dashboardApi.keywords(apiFilters).then(r => r.data) })
  const { data: platform }                           = useQuery({ queryKey: ['platform', apiFilters],   queryFn: () => dashboardApi.platform(apiFilters).then(r => r.data) })
  const { data: recent }                             = useQuery({ queryKey: ['recent'],                 queryFn: () => dashboardApi.recent(5).then(r => r.data) })

  const topicsForChart = (topics || []).map((t: any) => ({ topic: t.topic, total_frequency: t.total_frequency }))
  const keywordsForChart = (keywords || []).map((k: any) => ({ keyword: k.keyword, total_frequency: k.total_frequency }))

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Aggregated insights from all analyzed posts</p>
        </div>
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {/* KPI */}
      {sumLoading
        ? <div className="grid-kpi mb-6">{[...Array(5)].map((_, i) => <div key={i} className="kpi-card skeleton" style={{ height: 100 }} />)}</div>
        : <KpiCards data={summary} />
      }

      {/* Row 1: Sentiment + Trend */}
      <div className="grid-2 mb-6">
        <SentimentDonut data={sentiment} />
        <SentimentTrend data={trends || []} />
      </div>

      {/* Row 2: Topics + Keywords + Platform */}
      <div className="dashboard-row-3 mb-6">
        <TopBarChart title="Top Topics"   data={topicsForChart}   dataKey="total_frequency" nameKey="topic"   color="var(--color-accent)" />
        <TopBarChart title="Top Keywords" data={keywordsForChart} dataKey="total_frequency" nameKey="keyword" color="#8b5cf6" />
        <PlatformDist data={platform || []} />
      </div>

      {/* Recent */}
      <RecentAnalyses data={recent || []} />
    </div>
  )
}
