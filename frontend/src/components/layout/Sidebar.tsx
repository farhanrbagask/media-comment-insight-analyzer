import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, History, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/import',  icon: Upload,          label: 'Import CSV'       },
  { to: '/history', icon: History,         label: 'Analysis History' },
]

/* ─── Inline Styles ────────────────────────────────────────────────────── */

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed' as const,
    left: 0,
    top: 0,
    background: 'var(--color-surface)',
    borderRight: '0.5px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 100,
    overflowY: 'auto' as const,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '32px 28px',
    borderBottom: '0.5px solid var(--color-border)',
  },
  logoMark: {
    width: '36px',
    height: '36px',
    background: 'var(--color-ink)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoMarkInner: {
    color: '#FBFBFA',
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: 1,
  },
  logoTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  logoSub: {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  nav: {
    flex: 1,
    padding: '28px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  navLabel: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)',
    padding: '0 12px',
    marginBottom: '12px',
  },
  bottom: {
    padding: '20px 16px',
    borderTop: '0.5px solid var(--color-border)',
  },
  logout: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-muted)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    transition: 'all var(--transition)',
  },
} as const

const navItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '11px 14px',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
  textDecoration: 'none',
  letterSpacing: '0.01em',
}

const navItemActive: React.CSSProperties = {
  ...navItemBase,
  background: 'var(--color-accent-dim)',
  color: 'var(--color-accent)',
  fontWeight: 600,
}

export default function Sidebar() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoArea}>
        <div style={styles.logoMark}>
          <span style={styles.logoMarkInner}>CI</span>
        </div>
        <div>
          <div style={styles.logoTitle}>Insight</div>
          <div style={styles.logoSub}>Analyzer</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navLabel}>Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => isActive ? navItemActive : navItemBase}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={styles.bottom}>
        <button
          style={styles.logout}
          onClick={handleLogout}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--color-negative-dim)'
            e.currentTarget.style.color = 'var(--color-negative)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = 'var(--color-text-muted)'
          }}
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
