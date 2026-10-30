import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'

/* ─── Styles ───────────────────────────────────────────────────────────── */

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    position: 'relative' as const,
    overflow: 'hidden',
    padding: '24px',
  },
  bgPattern: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0.35,
    backgroundImage:
      'radial-gradient(circle at 1px 1px, var(--color-surface-3) 1px, transparent 0)',
    backgroundSize: '32px 32px',
    pointerEvents: 'none' as const,
  },
  bgGlow: {
    position: 'absolute' as const,
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(92, 107, 79, 0.06), transparent 70%)',
    pointerEvents: 'none' as const,
  },
  card: {
    background: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '56px 48px',
    width: '100%',
    maxWidth: '420px',
    position: 'relative' as const,
    zIndex: 1,
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideUp 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    marginBottom: '44px',
  },
  logoMark: {
    width: '56px',
    height: '56px',
    background: 'var(--color-ink)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkText: {
    color: '#FBFBFA',
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1,
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    fontWeight: 600,
    textAlign: 'center' as const,
    color: 'var(--color-text-primary)',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    textAlign: 'center' as const,
    letterSpacing: '0.02em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  passwordWrap: {
    position: 'relative' as const,
  },
  toggle: {
    position: 'absolute' as const,
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.3s',
    background: 'none',
    border: 'none',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    textAlign: 'center' as const,
    marginTop: '24px',
    letterSpacing: '0.01em',
  },
  divider: {
    height: '0.5px',
    background: 'var(--color-border)',
    margin: '32px 0 0',
  },
} as const

export default function Login() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setToken } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password.trim()) { setError('Please enter your password.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(password)
      setToken(res.data.token)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message || 'Login failed. Check your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      {/* Subtle dot pattern */}
      <div style={s.bgPattern} />
      <div style={s.bgGlow} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoMark}>
            <span style={s.logoMarkText}>CI</span>
          </div>
          <h1 style={s.title}>Comment Insight<br />Analyzer</h1>
          <p style={s.subtitle}>
            AI-powered social media comment intelligence
          </p>
        </div>

        {/* Form */}
        <form style={s.form} onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <label className="input-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lock size={11} strokeWidth={2} />
              Admin Password
            </label>
            <div style={s.passwordWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input ${error ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                style={s.toggle}
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <span className="input-error-msg" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} /> {error}
              </span>
            )}
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: '1.5px' }} /> Authenticating...</> : 'Sign In'}
          </button>
        </form>

        <div style={s.divider} />
        <p style={s.hint}>
          Single-user application · No registration required
        </p>
      </div>
    </div>
  )
}
