import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import AnalyzePost from './pages/AnalyzePost'
import AnalysisHistory from './pages/AnalysisHistory'
import AnalysisDetail from './pages/AnalysisDetail'
import Login from './pages/Login'

function ProtectedLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/analyze"   element={<AnalyzePost />} />
          <Route path="/history"   element={<AnalysisHistory />} />
          <Route path="/analysis/:id" element={<AnalysisDetail />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/*"     element={<ProtectedLayout />} />
    </Routes>
  )
}
