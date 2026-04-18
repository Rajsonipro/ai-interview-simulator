import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, { username: res.data.username, user_id: res.data.user_id })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-slide-up">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#060d1a',
            margin: '0 auto 16px'
          }}>I</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Sign in to continue your interview prep</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,31,54,0.9), rgba(10,22,40,0.95))',
          border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: 20,
          padding: 32,
          backdropFilter: 'blur(10px)',
        }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', background: 'rgba(15,31,54,0.5)', border: '1px solid rgba(71,85,105,0.5)',
                  color: '#f1f5f9', borderRadius: 12, padding: '12px 16px', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', background: 'rgba(15,31,54,0.5)', border: '1px solid rgba(71,85,105,0.5)',
                  color: '#f1f5f9', borderRadius: 12, padding: '12px 16px', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#060d1a', border: 'none', borderRadius: 12, padding: '14px',
                fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(6,13,26,0.4)', borderTopColor: '#060d1a', borderRadius: '50%' }} className="spinner" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 20, textAlign: 'center', padding: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 10, fontSize: 12, color: '#78716c' }}>
          💡 Register a new account to get started
        </div>
      </div>
    </div>
  )
}
