import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, History, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import './Sidebar.css'

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/analyze', icon: PlusCircle,      label: 'Analyze Post'     },
  { to: '/history', icon: History,         label: 'Analysis History' },
]

export default function Sidebar() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} />
        </div>
        <div>
          <div className="sidebar-logo-title">Insight</div>
          <div className="sidebar-logo-sub">Analyzer</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Menu</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
