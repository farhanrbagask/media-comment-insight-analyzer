import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

const routeMeta: Record<string, { label: string; parent?: string; parentPath?: string }> = {
  '/':              { label: 'Dashboard' },
  '/import':        { label: 'Import Data',       parent: 'Data Input' },
  '/history':       { label: 'Analysis History',  parent: 'Analysis' },
  '/analysis/:id':  { label: 'Analysis Detail',   parent: 'Analysis History', parentPath: '/history' },
}

function getRouteMeta(pathname: string) {
  if (pathname.startsWith('/analysis/') && pathname !== '/analysis/') {
    return routeMeta['/analysis/:id']
  }
  return routeMeta[pathname] || { label: 'Page' }
}

export default function Topbar() {
  const location = useLocation()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const meta = getRouteMeta(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Breadcrumb */}
        <nav className="topbar-breadcrumb">
          <span>Insight Analyzer</span>
          {meta.parent && (
            <>
              <ChevronRight size={12} className="topbar-breadcrumb-sep" />
              {meta.parentPath ? (
                <a
                  href={meta.parentPath}
                  onClick={e => { e.preventDefault(); navigate(meta.parentPath!) }}
                  style={{ cursor: 'pointer', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                >
                  {meta.parent}
                </a>
              ) : (
                <span>{meta.parent}</span>
              )}
            </>
          )}
          <ChevronRight size={12} className="topbar-breadcrumb-sep" />
          <span className="topbar-current">{meta.label}</span>
        </nav>
      </div>

      <div className="topbar-right">
        {/* System label */}
        <div className="topbar-system-label">
          Satlantas Polres Gresik
        </div>

        {/* User */}
        <button className="topbar-user" onClick={handleLogout} title="Sign out">
          <div className="topbar-avatar">ADM</div>
          <span>Admin</span>
        </button>
      </div>
    </header>
  )
}
