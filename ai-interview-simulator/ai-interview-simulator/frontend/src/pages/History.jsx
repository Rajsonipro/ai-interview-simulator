import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function History() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/history')
      setSessions(res.data.sessions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (!score) return '#475569'
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const domainIcon = (domain) => {
    const icons = { 'Software Developer': '💻', 'HR': '🤝', 'Marketing': '📊' }
    return icons[domain] || '🎯'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} className="spinner" />
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          Interview History
        </h1>
        <p style={{ color: '#475569', fontSize: 14 }}>Your past interview sessions and performance</p>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
          <h3 style={{ color: '#64748b', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No interviews yet</h3>
          <p style={{ color: '#334155', fontSize: 14, marginBottom: 24 }}>Start your first interview to see your history here</p>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#060d1a',
            border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            Start Interview
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sessions.map(session => {
            const avgScore = session.avg_score ? Math.round(session.avg_score) : null
            return (
              <div key={session.id} style={{
                background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)',
                borderRadius: 16, padding: '20px 24px', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onClick={() => navigate(`/report/${session.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(71,85,105,0.3)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 22, flexShrink: 0
                    }}>
                      {domainIcon(session.domain)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 15, marginBottom: 4 }}>{session.domain}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>{session.difficulty}</span>
                        <span style={{ color: '#334155' }}>•</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>
                          {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ color: '#334155' }}>•</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{session.response_count} question{session.response_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {avgScore !== null && (
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        border: `2px solid ${getScoreColor(avgScore)}`,
                        background: `${getScoreColor(avgScore)}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: getScoreColor(avgScore),
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {avgScore}
                      </div>
                    )}
                    <span style={{ color: '#334155', fontSize: 18 }}>→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#060d1a',
          border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>
          + New Interview
        </button>
      </div>
    </div>
  )
}
