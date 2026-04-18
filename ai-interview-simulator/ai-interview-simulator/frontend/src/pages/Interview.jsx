import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const STATES = { LOADING: 'loading', READY: 'ready', RECORDING: 'recording', PROCESSING: 'processing', RESULT: 'result', DONE: 'done' }

export default function Interview() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { domain = 'Software Developer', difficulty = 'Intermediate' } = state || {}

  const [appState, setAppState] = useState(STATES.LOADING)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [savedResponses, setSavedResponses] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    initSession()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) { try { recognitionRef.current.stop() } catch (e) {} }
    }
  }, [])

  const initSession = async () => {
    try {
      const sessionRes = await api.post('/sessions/create', { domain, difficulty })
      setSessionId(sessionRes.data.session_id)
      const qRes = await api.post('/questions/generate', { domain, difficulty })
      setQuestions(qRes.data.questions)
      setAppState(STATES.READY)
    } catch (err) {
      setError('Failed to initialize interview. Please check if the backend is running.')
      setAppState(STATES.READY)
    }
  }

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome.')
      return
    }
    setTranscript('')
    setError('')
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let final = '', interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      setTranscript(prev => (final ? prev + final : prev + interim).trim())
    }
    recognition.onerror = (e) => {
      if (e.error !== 'aborted') setError(`Speech recognition error: ${e.error}`)
    }
    recognition.start()
    recognitionRef.current = recognition
    startTimeRef.current = Date.now()
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    setAppState(STATES.RECORDING)
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch (e) {} }
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const submitAnswer = useCallback(async (manualText) => {
    stopRecording()
    const answerText = (manualText || transcript).trim()
    if (!answerText) { setError('Please provide an answer before submitting.'); setAppState(STATES.RECORDING); return }
    setAppState(STATES.PROCESSING)
    const duration = recordingTime || 60
    try {
      const evalRes = await api.post('/evaluate/answer', {
        question: questions[currentQ], answer: answerText,
        domain, difficulty, duration_seconds: duration
      })
      setEvaluation({ ...evalRes.data, answer: answerText })

      if (sessionId) {
        await api.post('/responses/save', {
          session_id: sessionId, question: questions[currentQ], answer: answerText,
          technical_score: evalRes.data.technical_score,
          communication_score: evalRes.data.communication_score,
          confidence_score: evalRes.data.confidence_score,
          feedback: evalRes.data.feedback,
          filler_word_count: evalRes.data.filler_word_count || 0,
          words_per_minute: evalRes.data.words_per_minute || 0
        })
        setSavedResponses(prev => [...prev, { question: questions[currentQ], evaluation: evalRes.data }])
      }
      setAppState(STATES.RESULT)
    } catch (err) {
      setError('Failed to evaluate answer. Please try again.')
      setAppState(STATES.READY)
    }
  }, [transcript, questions, currentQ, domain, difficulty, sessionId, recordingTime, stopRecording])

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setAppState(STATES.DONE)
    } else {
      setCurrentQ(prev => prev + 1)
      setTranscript('')
      setEvaluation(null)
      setError('')
      setAppState(STATES.READY)
    }
  }

  const viewReport = () => {
    if (sessionId) navigate(`/report/${sessionId}`)
    else navigate('/dashboard')
  }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const ScoreBadge = ({ score, label, color }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 8px',
        border: `3px solid ${color}`,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace"
      }}>
        {score}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{label}</div>
    </div>
  )

  if (appState === STATES.LOADING) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%' }} className="spinner" />
      <p style={{ color: '#64748b' }}>Generating your personalized interview...</p>
    </div>
  )

  if (appState === STATES.DONE) return (
    <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }} className="animate-slide-up">
      <div style={{ fontSize: 80, marginBottom: 24 }}>🎉</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
        Interview Complete!
      </h1>
      <p style={{ color: '#64748b', fontSize: 16, marginBottom: 36 }}>
        You've answered all {questions.length} questions. Check your detailed performance report.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={viewReport} style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#060d1a',
          border: 'none', borderRadius: 12, padding: '14px 32px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer'
        }}>
          📊 View Full Report
        </button>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'rgba(15,31,54,0.8)', color: '#94a3b8',
          border: '1px solid rgba(71,85,105,0.5)', borderRadius: 12, padding: '14px 32px',
          fontSize: 15, fontWeight: 500, cursor: 'pointer'
        }}>
          New Interview
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#f59e0b' }}>{domain}</span>
            <span style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#94a3b8' }}>{difficulty}</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: '#f1f5f9' }}>
            Question {currentQ + 1} of {questions.length}
          </h2>
        </div>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 32, height: 4, borderRadius: 2,
              background: i < currentQ ? '#22c55e' : i === currentQ ? '#f59e0b' : 'rgba(71,85,105,0.3)'
            }} />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15,31,54,0.9), rgba(10,22,40,0.95))',
        border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: 32, marginBottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>❓</div>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: '#e2e8f0', fontWeight: 400 }}>
            {questions[currentQ] || 'Loading question...'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Recording Panel */}
      {(appState === STATES.READY || appState === STATES.RECORDING) && (
        <div style={{
          background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)',
          borderRadius: 20, padding: 28, marginBottom: 20
        }}>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {appState === STATES.READY ? (
              <button onClick={startRecording} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(239,68,68,0.3)'
              }}>
                <div style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%' }} />
                Start Recording
              </button>
            ) : (
              <>
                <button onClick={() => submitAnswer()} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#060d1a', border: 'none', borderRadius: 12, padding: '12px 24px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                  ⏹ Stop & Submit
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }} className="recording-pulse" />
                  <span style={{ color: '#ef4444', fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Transcript */}
          <div style={{ minHeight: 100 }}>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, fontWeight: 500 }}>
              LIVE TRANSCRIPT
            </div>
            <div style={{
              background: 'rgba(6,13,26,0.6)', border: '1px solid rgba(71,85,105,0.2)',
              borderRadius: 10, padding: 16, minHeight: 80, fontSize: 14,
              color: transcript ? '#e2e8f0' : '#334155', lineHeight: 1.7
            }}>
              {transcript || (appState === STATES.RECORDING ? '🎙️ Listening...' : 'Your transcribed speech will appear here')}
            </div>
          </div>

          {/* Manual submit if transcript exists */}
          {transcript && appState === STATES.RECORDING && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#475569' }}>{transcript.split(' ').length} words</span>
            </div>
          )}

          {/* Text input fallback */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>Or type your answer:</div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Type your answer here as an alternative to voice recording..."
              rows={4}
              style={{
                width: '100%', background: 'rgba(15,31,54,0.5)', border: '1px solid rgba(71,85,105,0.3)',
                color: '#e2e8f0', borderRadius: 10, padding: '12px', fontSize: 13,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6
              }}
            />
            {transcript && appState === STATES.READY && (
              <button onClick={() => submitAnswer()} style={{
                marginTop: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#060d1a', border: 'none', borderRadius: 10, padding: '10px 24px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>
                Submit Answer →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing */}
      {appState === STATES.PROCESSING && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', margin: '0 auto 16px' }} className="spinner" />
          <p style={{ color: '#94a3b8' }}>AI is evaluating your answer...</p>
        </div>
      )}

      {/* Result */}
      {appState === STATES.RESULT && evaluation && (
        <div className="animate-slide-up">
          {/* Scores */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(15,31,54,0.9), rgba(10,22,40,0.95))',
            border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: 28, marginBottom: 20
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 24, textAlign: 'center' }}>
              ✅ EVALUATION RESULTS
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
              <ScoreBadge score={evaluation.technical_score} label="Technical" color="#3b82f6" />
              <ScoreBadge score={evaluation.communication_score} label="Communication" color="#22c55e" />
              <ScoreBadge score={evaluation.confidence_score} label="Confidence" color="#a855f7" />
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 8px',
                  border: '3px solid #f59e0b', background: 'rgba(245,158,11,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {Math.round((evaluation.technical_score + evaluation.communication_score + evaluation.confidence_score) / 3)}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>OVERALL</div>
              </div>
            </div>

            {/* Extra stats */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {evaluation.words_per_minute > 0 && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#93c5fd' }}>
                  🗣 {evaluation.words_per_minute} WPM
                </div>
              )}
              {evaluation.filler_word_count !== undefined && (
                <div style={{ background: evaluation.filler_word_count > 5 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${evaluation.filler_word_count > 5 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 8, padding: '6px 14px', fontSize: 13, color: evaluation.filler_word_count > 5 ? '#fca5a5' : '#86efac' }}>
                  💬 {evaluation.filler_word_count} filler word{evaluation.filler_word_count !== 1 ? 's' : ''}
                </div>
              )}
              {evaluation.word_count > 0 && (
                <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#d8b4fe' }}>
                  📝 {evaluation.word_count} words
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div style={{
            background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(71,85,105,0.3)',
            borderRadius: 16, padding: 24, marginBottom: 20
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10, letterSpacing: '0.05em' }}>AI FEEDBACK</h4>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: 14 }}>{evaluation.feedback}</p>
          </div>

          {/* Next */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={viewReport} style={{
              background: 'rgba(15,31,54,0.8)', color: '#94a3b8',
              border: '1px solid rgba(71,85,105,0.5)', borderRadius: 12, padding: '12px 24px',
              fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}>
              View Report
            </button>
            <button onClick={nextQuestion} style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#060d1a',
              border: 'none', borderRadius: 12, padding: '12px 32px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>
              {currentQ + 1 >= questions.length ? '🏁 Finish Interview' : '→ Next Question'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
