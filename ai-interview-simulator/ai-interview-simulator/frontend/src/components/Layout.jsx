import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav style={{
        background: 'linear-gradient(90deg, rgba(6,13,26,0.98) 0%, rgba(10,22,40,0.98) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: '#060d1a'
              }}>I</div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
                Interview<span style={{ color: '#f59e0b' }}>AI</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              <Link to="/dashboard" style={{ color: isActive('/dashboard') ? '#f59e0b' : '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
                Dashboard
              </Link>
              <Link to="/history" style={{ color: isActive('/history') ? '#f59e0b' : '#94a3b8', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
                History
              </Link>
            </div>

            {/* User */}
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 13, color: '#64748b' }}>
                👤 <span style={{ color: '#cbd5e1' }}>{user?.username}</span>
              </span>
              <button onClick={handleLogout} style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(245,158,11,0.1)', padding: '16px', textAlign: 'center', color: '#334155', fontSize: 12 }}>
        InterviewAI © 2024 — AI-Powered Interview Preparation
      </footer>
    </div>
  )
}
