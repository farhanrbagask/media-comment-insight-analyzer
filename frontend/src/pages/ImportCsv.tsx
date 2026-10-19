import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowRight,
  RotateCcw, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import { importsApi, analysesApi } from '../api'
import type { Platform, ImportPreviewResult, SkippedRow } from '../types'
import './AnalyzePost.css'
import './ImportCsv.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'previewing' | 'preview' | 'confirming' | 'analyzing' | 'done' | 'error'

const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'tiktok',   label: 'TikTok',    icon: '🎵' },
]

const ANALYSIS_STEPS = [
  { key: 'processing', label: 'Menyimpan komentar ke database...' },
  { key: 'sentiment',  label: 'Menganalisis sentimen...'          },
  { key: 'topics',     label: 'Mengekstrak topik...'              },
  { key: 'keywords',   label: 'Mengekstrak kata kunci...'         },
  { key: 'insight',    label: 'Menghasilkan insight...'           },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label, value, color,
}: { label: string; value: number; color: string }) {
  return (
    <div className="import-summary-card" style={{ borderColor: color }}>
      <div className="import-summary-value" style={{ color }}>{value.toLocaleString()}</div>
      <div className="import-summary-label">{label}</div>
    </div>
  )
}

function SkippedTable({
  rows,
}: { rows: SkippedRow[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!rows.length) return null

  const visible = expanded ? rows : rows.slice(0, 5)

  return (
    <div className="import-skipped">
      <button
        className="import-skipped-toggle"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {rows.length} baris dilewati {expanded ? '(sembunyikan)' : '(lihat detail)'}
      </button>
      {expanded && (
        <div className="table-wrapper" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Baris</th>
                <th>Alasan</th>
                <th>Teks</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => (
                <tr key={r.rowNum}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{r.rowNum}</td>
                  <td>
                    <span className={`badge ${r.skipReason === 'empty_text' ? 'badge-neutral' : 'badge-negative'}`}>
                      {r.skipReason === 'empty_text' ? 'Kosong' : 'Duplikat ID'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 300 }}>
                    <span className="truncate" style={{ display: 'block' }}>
                      {r.rawText || <em style={{ color: 'var(--color-text-muted)' }}>(kosong)</em>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && !expanded && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
              … dan {rows.length - 5} baris lainnya
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ProgressSteps({ activeStep }: { activeStep: number }) {
  return (
    <div className="progress-steps">
      {ANALYSIS_STEPS.map((s, i) => (
        <div
          key={s.key}
          className={`progress-step ${i === activeStep ? 'active' : ''} ${i < activeStep ? 'done' : ''}`}
        >
          <div className="step-icon">
            {i < activeStep
              ? <CheckCircle size={14} style={{ color: 'var(--color-positive)' }} />
              : i === activeStep
                ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{i + 1}</span>
            }
          </div>
          <span style={{
            fontSize: 13,
            color: i <= activeStep ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontWeight: i === activeStep ? 600 : 400,
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImportCsv() {
  const navigate  = useNavigate()

  // Form state
  const [file, setFile]         = useState<File | null>(null)
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [postUrl, setPostUrl]   = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Flow state
  const [step, setStep]           = useState<Step>('upload')
  const [errorMsg, setErrorMsg]   = useState('')
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null)
  const [analysisId, setAnalysisId]   = useState<number | null>(null)
  const [activeStep, setActiveStep]   = useState(-1)

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const handleFileSelect = useCallback((selected: File | null) => {
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Hanya file CSV yang diterima.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10 MB.')
      return
    }
    setFile(selected)
    setErrorMsg('')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0] ?? null)
  }, [handleFileSelect])

  const handlePreview = async () => {
    if (!file)          { setErrorMsg('Pilih file CSV terlebih dahulu.'); return }
    if (!postUrl.trim()){ setErrorMsg('URL postingan sumber wajib diisi.'); return }

    try { new URL(postUrl) } catch {
      setErrorMsg('URL postingan tidak valid. Pastikan dimulai dengan https://')
      return
    }

    setErrorMsg('')
    setStep('previewing')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('platform', platform)
      formData.append('post_url', postUrl)

      const res = await importsApi.preview(formData)
      setPreviewData(res.data)
      setStep('preview')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMsg(e.response?.data?.message ?? 'Gagal memproses CSV. Periksa format file.')
      setStep('upload')
    }
  }

  const simulateProgress = () => {
    let i = 0
    setActiveStep(0)
    const interval = setInterval(() => {
      i++
      if (i < ANALYSIS_STEPS.length) setActiveStep(i)
      else clearInterval(interval)
    }, 2000)
    return interval
  }

  const pollStatus = (id: number) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await analysesApi.pollStatus(id)
        const status = res.data?.status
        if (status === 'completed') {
          clearPoll()
          setActiveStep(ANALYSIS_STEPS.length)
          setTimeout(() => setStep('done'), 600)
        } else if (status === 'failed') {
          clearPoll()
          setErrorMsg(res.data?.error_message ?? 'Analisis gagal. Silakan coba lagi.')
          setStep('error')
        }
      } catch { /* keep polling silently */ }
    }, 2500)
  }

  const handleConfirm = async () => {
    if (!previewData) return
    setStep('confirming')

    try {
      const res = await importsApi.confirm(previewData.importToken)
      const id = res.data.analysisId
      setAnalysisId(id)
      setStep('analyzing')
      const progInterval = simulateProgress()
      pollStatus(id)
      setTimeout(() => clearInterval(progInterval), ANALYSIS_STEPS.length * 2100 + 500)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMsg(e.response?.data?.message ?? 'Gagal memulai analisis.')
      setStep('error')
    }
  }

  const reset = () => {
    clearPoll()
    setFile(null)
    setPlatform('instagram')
    setPostUrl('')
    setStep('upload')
    setErrorMsg('')
    setPreviewData(null)
    setAnalysisId(null)
    setActiveStep(-1)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-wrapper">
      <div className="analyze-header mb-6">
        <h1 className="page-title">Import CSV</h1>
        <p className="page-subtitle">Upload file CSV dari IG Lead Scrapper untuk dianalisis</p>
      </div>

      <div className="analyze-container">

        {/* ── Step 1: Upload ── */}
        {(step === 'upload' || step === 'previewing') && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon">
                <Upload size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Upload File CSV</h2>
            <p className="analyze-card-sub">
              Ekspor komentar dari IG Lead Scrapper dan upload di sini
            </p>

            {/* Drop zone */}
            <div
              id="csv-dropzone"
              className={`import-dropzone ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="import-file-info">
                  <FileText size={28} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="import-dropzone-placeholder">
                  <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    Drag &amp; drop atau klik untuk pilih file
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    CSV saja · Maks 10 MB · Maks 10.000 baris
                  </div>
                </div>
              )}
            </div>

            {/* Platform */}
            <div className="import-form-row">
              <label className="input-label">Platform</label>
              <div className="import-platform-group">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    id={`platform-${p.value}`}
                    type="button"
                    className={`import-platform-btn ${platform === p.value ? 'active' : ''}`}
                    onClick={() => setPlatform(p.value)}
                  >
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post URL */}
            <div className="input-wrapper import-form-row">
              <label className="input-label" htmlFor="post-url">URL Postingan Sumber</label>
              <input
                id="post-url"
                type="url"
                className={`input ${errorMsg && !file ? '' : errorMsg ? 'input-error' : ''}`}
                placeholder="https://www.instagram.com/p/..."
                value={postUrl}
                onChange={e => { setPostUrl(e.target.value); setErrorMsg('') }}
              />
            </div>

            {errorMsg && (
              <div className="import-error-banner">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <button
              id="preview-btn"
              className="btn btn-primary btn-lg w-full"
              onClick={handlePreview}
              disabled={step === 'previewing' || !file || !postUrl.trim()}
            >
              {step === 'previewing'
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Memproses CSV...</>
                : <><FileText size={18} /> Preview &amp; Validasi</>
              }
            </button>

            {/* Format hint */}
            <div className="import-format-hint">
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Kolom yang didukung:{' '}
                {['userId', 'userName', 'commentId', 'commentText', 'profileUrl', 'Date'].map(c => (
                  <code key={c} className="mono" style={{ fontSize: 11, background: 'var(--color-surface-3)', padding: '1px 5px', borderRadius: 4, margin: '0 2px' }}>
                    {c}
                  </code>
                ))}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === 'preview' && previewData && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-positive-dim)', color: 'var(--color-positive)' }}>
                <CheckCircle size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Ringkasan Cleaning</h2>
            <p className="analyze-card-sub">
              File <strong>{previewData.summary.filename}</strong> telah diproses.
              Tinjau hasilnya sebelum memulai analisis.
            </p>

            {/* Summary cards */}
            <div className="import-summary-grid">
              <SummaryCard label="Total Baris"    value={previewData.summary.totalRows}  color="var(--color-text-secondary)" />
              <SummaryCard label="Data Valid"     value={previewData.summary.valid}       color="var(--color-positive)"       />
              <SummaryCard label="Baris Kosong"   value={previewData.summary.skipped}     color="var(--color-neutral)"        />
              <SummaryCard label="Duplikat ID"    value={previewData.summary.duplicates}  color="var(--color-negative)"       />
            </div>

            {/* Post info */}
            <div className="analyze-duplicate-info">
              <div className="dup-row">
                <span className="text-muted text-sm">Platform</span>
                <span className={`badge badge-${previewData.summary.platform}`}>
                  {previewData.summary.platform === 'instagram' ? '📷' : '🎵'} {previewData.summary.platform}
                </span>
              </div>
              <div className="dup-row">
                <span className="text-muted text-sm">URL Postingan</span>
                <a
                  href={previewData.summary.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span className="truncate" style={{ maxWidth: 260 }}>{previewData.summary.postUrl}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Preview table */}
            {previewData.preview.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Preview 10 komentar pertama yang valid:
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Komentar</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.preview.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {c.username ? `@${c.username}` : '—'}
                          </td>
                          <td style={{ fontSize: 13, maxWidth: 320 }}>
                            <span className="truncate" style={{ display: 'block' }}>{c.rawText}</span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {c.publishedAt
                              ? new Date(c.publishedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Skipped rows detail */}
            <SkippedTable rows={previewData.skipped} />

            {/* Actions */}
            <div className="analyze-done-actions">
              <button
                id="confirm-btn"
                className="btn btn-primary btn-lg"
                onClick={handleConfirm}
              >
                Konfirmasi &amp; Mulai Analisis <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                <RotateCcw size={14} /> Upload Ulang
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Analyzing ── */}
        {step === 'analyzing' && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              </div>
            </div>
            <h2 className="analyze-card-title">Sedang Menganalisis...</h2>
            <p className="analyze-card-sub">Mohon tunggu, jangan tutup halaman ini.</p>
            <ProgressSteps activeStep={activeStep} />
          </div>
        )}

        {/* ── Confirming ── */}
        {step === 'confirming' && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              </div>
            </div>
            <h2 className="analyze-card-title">Menyiapkan analisis...</h2>
            <p className="analyze-card-sub">Menyimpan data ke database.</p>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 'done' && analysisId && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-positive-dim)', color: 'var(--color-positive)' }}>
                <CheckCircle size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Analisis Selesai!</h2>
            <p className="analyze-card-sub">
              Semua komentar telah dianalisis dan hasil telah disimpan.
            </p>
            <div className="analyze-done-actions">
              <button
                id="view-result-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate(`/analysis/${analysisId}`)}
              >
                Lihat Hasil Analisis <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                Import File Lain
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {step === 'error' && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-negative-dim)', color: 'var(--color-negative)' }}>
                <AlertCircle size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Terjadi Kesalahan</h2>
            <p className="analyze-card-sub" style={{ color: 'var(--color-negative)' }}>
              {errorMsg}
            </p>
            <div className="analyze-done-actions">
              <button id="retry-btn" className="btn btn-primary" onClick={reset}>
                <RotateCcw size={16} /> Coba Lagi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
