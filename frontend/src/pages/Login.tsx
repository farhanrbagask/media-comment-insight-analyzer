import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store/authStore'
import './Login.css'

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Background grid */}
      <div className="login-bg-grid" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={28} />
          </div>
          <h1 className="login-title">Comment Insight<br />Analyzer</h1>
          <p className="login-subtitle">
            AI-powered social media comment intelligence
          </p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <label className="input-label" htmlFor="password">
              <Lock size={13} style={{ display: 'inline', marginRight: 4 }} />
              Admin Password
            </label>
            <div className="password-input-wrapper">
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
                className="password-toggle"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Logging in...</> : 'Login'}
          </button>
        </form>

        <p className="login-hint">
          Single-user application. No registration required.
        </p>
      </div>
    </div>
  )
}
