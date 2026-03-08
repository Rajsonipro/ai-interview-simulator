import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import api from '../utils/api'

Chart.register(...registerables)

export default function Report() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const barChartRef = useRef(null)
  const radarChartRef = useRef(null)
  const barInstance = useRef(null)
  const radarInstance = useRef(null)

  useEffect(() => {
    fetchReport()
    return () => {
      if (barInstance.current) barInstance.current.destroy()
      if (radarInstance.current) radarInstance.current.destroy()
    }
  }, [sessionId])

  useEffect(() => {
    if (report?.responses?.length > 0) {
      setTimeout(() => { renderCharts() }, 100)
    }
  }, [report])

  const fetchReport = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}/report`)
      setReport(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderCharts = () => {
    if (!report?.responses?.length) return

    // Bar chart
    if (barChartRef.current) {
      if (barInstance.current) barInstance.current.destroy()
      const labels = report.responses.map((_, i) => `Q${i + 1}`)
      barInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Technical', data: report.responses.map(r => r.technical_score), backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
            { label: 'Communication', data: report.responses.map(r => r.communication_score), backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 6 },
            { label: 'Confidence', data: report.responses.map(r => r.confidence_score), backgroundColor: 'rgba(168,85,247,0.7)', borderRadius: 6 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'DM Sans' } } } },
          scales: {
            x: { grid: { color: 'rgba(71,85,105,0.2)' }, ticks: { color: '#64748b' } },
            y: { min: 0, max: 100, grid: { color: 'rgba(71,85,105,0.2)' }, ticks: { color: '#64748b' } }
          }
        }
      })
    }

    // Radar chart
    if (radarChartRef.current && report.summary) {
      if (radarInstance.current) radarInstance.current.destroy()
      const s = report.summary
      radarInstance.current = new Chart(radarChartRef.current, {
        type: 'radar',
        data: {
          labels: ['Technical', 'Communication', 'Confidence'],
          datasets: [{
            label: 'Your Scores',
            data: [s.avg_technical, s.avg_communication, s.avg_confidence],
            backgroundColor: 'rgba(245,158,11,0.15)',
            borderColor: '#f59e0b',
            pointBackgroundColor: '#f59e0b',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            r: {
              min: 0, max: 100,
              grid: { color: 'rgba(71,85,105,0.3)' },
              ticks: { color: '#475569', backdropColor: 'transparent', stepSize: 25 },
              pointLabels: { color: '#94a3b8', font: { size: 13 } }
            }
          }
        }
      })
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Average'
    return 'Needs Work'
  }

  const getTips = (summary) => {
    const tips = []
    if (summary.avg_technical < 60) tips.push('Study core technical concepts and practice explaining them clearly.')
    if (summary.avg_communication < 60) tips.push('Structure answers using the STAR method: Situation, Task, Action, Result.')
    if (summary.avg_confidence < 60) tips.push('Practice speaking assertively. Reduce hedging phrases like "I think" or "maybe".')
    if (summary.total_filler_words > 10) tips.push(`Reduce filler words — you used ${summary.total_filler_words} across the session. Record yourself and review.`)
    if (summary.avg_words_per_minute < 100) tips.push('Speak slightly faster — aim for 120-150 WPM for natural conversation.')
    if (summary.avg_words_per_minute > 180) tips.push('Slow down your pace — you\'re speaking too fast. Aim for 120-150 WPM.')
    if (tips.length === 0) tips.push('Great performance! Keep practicing to maintain consistency across all metrics.')
    return tips
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} className="spinner" />
      <p style={{ color: '#64748b' }}>Loading your report...</p>
    </div>
  )

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <p style={{ color: '#ef4444' }}>Report not found.</p>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: 16, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back to Dashboard</button>
    </div>
  )

  const { session, responses, summary } = report

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#f59e0b' }}>{session?.domain}</span>
            <span style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#94a3b8' }}>{session?.difficulty}</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
            Performance Report
          </h1>
          <p style={{ color: '#475569', fontSize: 13 }}>
            {new Date(session?.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'rgba(15,31,54,0.8)', color: '#94a3b8', border: '1px solid rgba(71,85,105,0.3)',
          borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer'
        }}>
          ← Dashboard
        </button>
      </div>

      {responses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
          No responses recorded for this session yet.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Overall Score', value: summary.overall_score, unit: '', color: getScoreColor(summary.overall_score), big: true },
              { label: 'Technical', value: summary.avg_technical, unit: '', color: '#3b82f6' },
              { label: 'Communication', value: summary.avg_communication, unit: '', color: '#22c55e' },
              { label: 'Confidence', value: summary.avg_confidence, unit: '', color: '#a855f7' },
              { label: 'Avg WPM', value: summary.avg_words_per_minute, unit: '', color: '#06b6d4' },
              { label: 'Filler Words', value: summary.total_filler_words, unit: '', color: summary.total_filler_words > 10 ? '#ef4444' : '#22c55e' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(10,22,40,0.8)', border: `1px solid ${item.color}25`,
                borderRadius: 14, padding: '18px 16px', textAlign: 'center',
                boxShadow: item.big ? `0 0 0 1px ${item.color}30, 0 8px 24px ${item.color}10` : 'none'
              }}>
                <div style={{ fontSize: item.big ? 32 : 26, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.value}{item.unit}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{item.label}</div>
                {item.big && <div style={{ fontSize: 11, color: item.color, marginTop: 4, fontWeight: 500 }}>{getScoreLabel(item.value)}</div>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
            <div style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>SCORES BY QUESTION</h3>
              <div style={{ height: 220 }}>
                <canvas ref={barChartRef} />
              </div>
            </div>
            <div style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>SKILL RADAR</h3>
              <div style={{ height: 220 }}>
                <canvas ref={radarChartRef} />
              </div>
            </div>
          </div>

          {/* Improvement Tips */}
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', marginBottom: 16 }}>💡 IMPROVEMENT TIPS</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {getTips(summary).map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>→</span>
                  <span style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Per-Question Breakdown */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>Question Breakdown</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {responses.map((_, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{
                  background: activeTab === i ? 'rgba(245,158,11,0.1)' : 'rgba(15,31,54,0.5)',
                  border: `1px solid ${activeTab === i ? 'rgba(245,158,11,0.3)' : 'rgba(71,85,105,0.3)'}`,
                  color: activeTab === i ? '#f59e0b' : '#64748b',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer'
                }}>
                  Q{i + 1}
                </button>
              ))}
            </div>

            {responses[activeTab] && (
              <div style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)', borderRadius: 16, padding: 24 }} className="animate-fade-in">
                <h4 style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
                  {responses[activeTab].question}
                </h4>

                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Technical', score: responses[activeTab].technical_score, color: '#3b82f6' },
                    { label: 'Communication', score: responses[activeTab].communication_score, color: '#22c55e' },
                    { label: 'Confidence', score: responses[activeTab].confidence_score, color: '#a855f7' },
                  ].map(m => (
                    <div key={m.label} style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{m.label}</span>
                        <span style={{ fontSize: 12, color: m.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{m.score}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(71,85,105,0.3)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${m.score}%`, background: m.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 500 }}>YOUR ANSWER</div>
                  <div style={{ background: 'rgba(6,13,26,0.6)', border: '1px solid rgba(71,85,105,0.2)', borderRadius: 8, padding: 12, fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
                    {responses[activeTab].answer}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 500 }}>AI FEEDBACK</div>
                  <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    {responses[activeTab].feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
