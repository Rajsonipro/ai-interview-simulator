import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DOMAINS = [
  { id: 'Software Developer', label: 'Software Developer', icon: '💻', desc: 'Algorithms, system design, coding best practices' },
  { id: 'HR', label: 'Human Resources', icon: '🤝', desc: 'Behavioral, leadership, situational questions' },
  { id: 'Marketing', label: 'Marketing', icon: '📊', desc: 'Strategy, campaigns, analytics, brand building' },
]

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Beginner', icon: '🌱', color: '#22c55e', desc: 'Foundational concepts, entry-level' },
  { id: 'Intermediate', label: 'Intermediate', icon: '⚡', color: '#f59e0b', desc: 'Practical experience, mid-level' },
  { id: 'Advanced', label: 'Advanced', icon: '🔥', color: '#ef4444', desc: 'Expert knowledge, senior-level' },
]

export default function Dashboard() {
  const [domain, setDomain] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleStart = () => {
    if (domain && difficulty) {
      navigate('/interview', { state: { domain, difficulty } })
    }
  }

  const cardBase = {
    border: '2px solid rgba(71,85,105,0.3)',
    borderRadius: 16, padding: '20px 24px', cursor: 'pointer',
    transition: 'all 0.2s', background: 'rgba(15,31,54,0.5)',
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Hero greeting */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#f59e0b', marginBottom: 20 }}>
          ✨ AI-Powered Interview Coach
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
          Hello, <span style={{ color: '#f59e0b' }}>{user?.username}</span> 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Configure your interview session and get real-time AI feedback on your performance.
        </p>
      </div>

      {/* Domain Selection */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1', marginBottom: 16 }}>
          1. Choose your domain
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {DOMAINS.map(d => (
            <div key={d.id} onClick={() => setDomain(d.id)} style={{
              ...cardBase,
              borderColor: domain === d.id ? '#f59e0b' : 'rgba(71,85,105,0.3)',
              background: domain === d.id ? 'rgba(245,158,11,0.1)' : 'rgba(15,31,54,0.5)',
              boxShadow: domain === d.id ? '0 0 0 1px rgba(245,158,11,0.3), 0 8px 24px rgba(245,158,11,0.1)' : 'none',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
              <div style={{ fontWeight: 600, color: domain === d.id ? '#f59e0b' : '#e2e8f0', marginBottom: 4, fontSize: 15 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1', marginBottom: 16 }}>
          2. Select difficulty level
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {DIFFICULTIES.map(d => (
            <div key={d.id} onClick={() => setDifficulty(d.id)} style={{
              ...cardBase,
              borderColor: difficulty === d.id ? d.color : 'rgba(71,85,105,0.3)',
              background: difficulty === d.id ? `${d.color}15` : 'rgba(15,31,54,0.5)',
              boxShadow: difficulty === d.id ? `0 0 0 1px ${d.color}40, 0 8px 24px ${d.color}15` : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{d.icon}</div>
              <div style={{ fontWeight: 600, color: difficulty === d.id ? d.color : '#e2e8f0', fontSize: 15, marginBottom: 4 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleStart}
          disabled={!domain || !difficulty}
          style={{
            background: (!domain || !difficulty) ? 'rgba(245,158,11,0.2)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: (!domain || !difficulty) ? 'rgba(245,158,11,0.4)' : '#060d1a',
            border: 'none', borderRadius: 14, padding: '16px 48px',
            fontSize: 16, fontWeight: 700, cursor: (!domain || !difficulty) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: (!domain || !difficulty) ? 'none' : '0 8px 32px rgba(245,158,11,0.3)',
          }}
        >
          🎯 Start Interview Session
        </button>
        {(!domain || !difficulty) && (
          <p style={{ marginTop: 12, color: '#475569', fontSize: 13 }}>
            Select both a domain and difficulty level to continue
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 60 }}>
        {[
          { label: 'Questions Per Session', value: '5', icon: '❓' },
          { label: 'AI Evaluation Metrics', value: '3', icon: '🎯' },
          { label: 'Speech Analysis', value: 'Live', icon: '🎙️' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(245,158,11,0.1)',
            borderRadius: 14, padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
