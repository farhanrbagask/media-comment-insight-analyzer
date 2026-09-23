import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, Search, AlertCircle, CheckCircle, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react'
import { postsApi, analysesApi } from '../api'
import './AnalyzePost.css'

type Step = 'idle' | 'validating' | 'duplicate' | 'analyzing' | 'done' | 'error'

const PROGRESS_STEPS = [
  { key: 'fetching',    label: 'Fetching post data...'      },
  { key: 'comments',   label: 'Fetching comments...'        },
  { key: 'processing', label: 'Processing comments...'      },
  { key: 'sentiment',  label: 'Analyzing sentiment...'      },
  { key: 'topics',     label: 'Extracting topics...'        },
  { key: 'insight',    label: 'Generating insight...'       },
  { key: 'saving',     label: 'Saving results...'           },
]

export default function AnalyzePost() {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [existingData, setExistingData] = useState<any>(null)
  const [activeProgressStep, setActiveProgressStep] = useState(-1)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigate = useNavigate()

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  const simulateProgress = () => {
    let i = 0
    setActiveProgressStep(0)
    const interval = setInterval(() => {
      i++
      if (i < PROGRESS_STEPS.length) setActiveProgressStep(i)
      else clearInterval(interval)
    }, 1800)
    return interval
  }

  const pollAnalysis = (id: number) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await analysesApi.pollStatus(id)
        const status = res.data?.status
        if (status === 'completed') {
          clearPoll()
          setActiveProgressStep(PROGRESS_STEPS.length)
          setTimeout(() => { setStep('done') }, 500)
        } else if (status === 'failed') {
          clearPoll()
          setError(res.data?.error_message || 'Analysis failed. Please try again.')
          setStep('error')
        }
      } catch { /* keep polling */ }
    }, 2500)
  }

  const handleAnalyze = async (forceNew = false) => {
    if (!url.trim()) { setError('Please enter a URL.'); return }
    setError('')
    setStep('validating')

    try {
      const res = await postsApi.analyze(url.trim())

      // Duplicate detected
      if (res.data?.alreadyAnalyzed && !forceNew) {
        setExistingData(res.data)
        setStep('duplicate')
        return
      }

      // Started analysis
      const id = res.data?.analysis?.id
      setAnalysisId(id)
      setStep('analyzing')
      const progInterval = simulateProgress()
      pollAnalysis(id)

      // Clean up progress simulation after max time
      setTimeout(() => clearInterval(progInterval), PROGRESS_STEPS.length * 1900 + 500)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to start analysis. Please check the URL.'
      setError(msg)
      setStep('error')
    }
  }

  const handleReanalyze = async () => {
    if (!existingData?.latestAnalysis?.id) return
    setExistingData(null)
    setError('')
    setStep('analyzing')
    try {
      const { analysesApi } = await import('../api')
      const res = await analysesApi.reanalyze(existingData.latestAnalysis.id)
      const id = res.data?.analysis?.id
      setAnalysisId(id)
      simulateProgress()
      pollAnalysis(id)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Re-analysis failed.')
      setStep('error')
    }
  }

  const reset = () => {
    clearPoll()
    setUrl('')
    setStep('idle')
    setError('')
    setAnalysisId(null)
    setExistingData(null)
    setActiveProgressStep(-1)
  }

  return (
    <div className="page-wrapper">
      <div className="analyze-header mb-6">
        <h1 className="page-title">Analyze Post</h1>
        <p className="page-subtitle">Paste an Instagram or TikTok post URL to start analysis</p>
      </div>

      <div className="analyze-container">
        {/* URL Input Card */}
        {(step === 'idle' || step === 'validating' || step === 'error') && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon">
                <Link2 size={24} />
              </div>
            </div>

            <h2 className="analyze-card-title">Enter Post URL</h2>
            <p className="analyze-card-sub">
              Supports Instagram posts, reels, and TikTok videos
            </p>

            <div className="analyze-form">
              <div className="input-wrapper">
                <label className="input-label" htmlFor="post-url">Post URL</label>
                <input
                  id="post-url"
                  type="url"
                  className={`input analyze-url-input ${error ? 'input-error' : ''}`}
                  placeholder="https://www.instagram.com/p/... or https://www.tiktok.com/@..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  disabled={step === 'validating'}
                />
                {error && (
                  <span className="input-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {error}
                  </span>
                )}
              </div>

              <button
                id="analyze-btn"
                className="btn btn-primary btn-lg w-full"
                onClick={() => handleAnalyze()}
                disabled={step === 'validating' || !url.trim()}
              >
                {step === 'validating'
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Validating...</>
                  : <><Search size={18} /> Analyze Post</>
                }
              </button>
            </div>

            {/* Platform hints */}
            <div className="platform-hints">
              <div className="platform-hint">
                <span className="badge badge-instagram">📷 Instagram</span>
                <code className="mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  instagram.com/p/POST_ID
                </code>
              </div>
              <div className="platform-hint">
                <span className="badge badge-tiktok">🎵 TikTok</span>
                <code className="mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  tiktok.com/@user/video/ID
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Detection */}
        {step === 'duplicate' && existingData && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-neutral-dim)', color: 'var(--color-neutral)' }}>
                <AlertCircle size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Already Analyzed</h2>
            <p className="analyze-card-sub">
              This post has already been analyzed. What would you like to do?
            </p>

            <div className="analyze-duplicate-info">
              <div className="dup-row">
                <span className="text-muted text-sm">Platform</span>
                <span className={`badge badge-${existingData.post?.platform}`}>
                  {existingData.post?.platform === 'instagram' ? '📷' : '🎵'} {existingData.post?.platform}
                </span>
              </div>
              {existingData.post?.author && (
                <div className="dup-row">
                  <span className="text-muted text-sm">Author</span>
                  <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>@{existingData.post.author}</span>
                </div>
              )}
              {existingData.latestAnalysis && (
                <div className="dup-row">
                  <span className="text-muted text-sm">Last Analyzed</span>
                  <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {new Date(existingData.latestAnalysis.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                </div>
              )}
              {existingData.latestAnalysis?.total_comments && (
                <div className="dup-row">
                  <span className="text-muted text-sm">Comments</span>
                  <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                    {existingData.latestAnalysis.total_comments.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="analyze-dup-actions">
              <button
                id="view-existing-btn"
                className="btn btn-primary"
                onClick={() => navigate(`/analysis/${existingData.latestAnalysis?.id}`)}
              >
                <ExternalLink size={16} /> View Existing Analysis
              </button>
              <button
                id="reanalyze-btn"
                className="btn btn-secondary"
                onClick={handleReanalyze}
              >
                <RotateCcw size={16} /> Analyze Again
              </button>
              <button className="btn btn-ghost" onClick={reset}>
                Enter Different URL
              </button>
            </div>
          </div>
        )}

        {/* Analyzing Progress */}
        {step === 'analyzing' && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              </div>
            </div>
            <h2 className="analyze-card-title">Analyzing Post...</h2>
            <p className="analyze-card-sub">This may take a moment. Please don't close this page.</p>

            <div className="progress-steps">
              {PROGRESS_STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`progress-step ${i === activeProgressStep ? 'active' : ''} ${i < activeProgressStep ? 'done' : ''}`}
                >
                  <div className="step-icon">
                    {i < activeProgressStep
                      ? <CheckCircle size={14} style={{ color: 'var(--color-positive)' }} />
                      : i === activeProgressStep
                        ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                        : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{i + 1}</span>
                    }
                  </div>
                  <span style={{
                    fontSize: 13,
                    color: i <= activeProgressStep ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontWeight: i === activeProgressStep ? 600 : 400,
                  }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && analysisId && (
          <div className="card card-lg analyze-card">
            <div className="analyze-icon-row">
              <div className="analyze-icon" style={{ background: 'var(--color-positive-dim)', color: 'var(--color-positive)' }}>
                <CheckCircle size={24} />
              </div>
            </div>
            <h2 className="analyze-card-title">Analysis Complete!</h2>
            <p className="analyze-card-sub">
              All comments have been analyzed and results have been saved.
            </p>

            <div className="analyze-done-actions">
              <button
                id="view-result-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate(`/analysis/${analysisId}`)}
              >
                View Analysis Results <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                Analyze Another Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
