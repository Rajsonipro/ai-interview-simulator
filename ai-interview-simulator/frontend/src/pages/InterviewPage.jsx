import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI } from '../services/api';

const FILLER_WORDS_LIST = ['um', 'uh', 'like', 'you know', 'basically', 'literally',
  'actually', 'sort of', 'kind of', 'i mean', 'right', 'okay so'];

function highlightFillers(text) {
  if (!text) return text;
  let result = text;
  FILLER_WORDS_LIST.forEach(filler => {
    const regex = new RegExp(`\\b(${filler})\\b`, 'gi');
    result = result.replace(regex, `<mark class="filler-highlight">$1</mark>`);
  });
  return result;
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = location.state?.sessionData;
  const { user } = useAuth();

  if (!sessionData) return <Navigate to="/dashboard" />;

  const { session_id, questions, domain, difficulty } = sessionData;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  
  // Fraud Detection State
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [fraudLog, setFraudLog] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lastWarning, setLastWarning] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [facePresent, setFacePresent] = useState(true); // Default to true, logic below
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text + ' ';
        else interimText += text;
      }
      if (finalText) setTranscript(prev => prev + finalText);
      setInterimTranscript(interimText);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') {
        setError(`Speech recognition error: ${e.error}. Please try typing your answer.`);
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); clearInterval(timerRef.current); };
  }, []);

  // --- Fraud Detection Listeners ---
  useEffect(() => {
    const addIncident = (type, pts, msg) => {
      const timestamp = new Date().toLocaleTimeString();
      setSuspicionScore(prev => prev + pts);
      setFraudLog(prev => [...prev, `[${timestamp}] ${msg}`]);
      setLastWarning(msg);
      // Clear warning after 5s
      setTimeout(() => setLastWarning(''), 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        addIncident('TAB_SWITCH', 2, 'Tab switching detected. Please stay on the interview screen.');
      }
    };

    const handleBlur = () => {
      addIncident('WINDOW_BLUR', 2, 'Window lost focus. Please avoid opening other applications.');
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      addIncident('COPY_PASTE', 3, 'Copy / Paste attempt blocked.');
      return false;
    };

    const handleRightClick = (e) => {
      e.preventDefault();
      addIncident('CONTEXT_MENU', 1, 'Right-Click attempt blocked.');
      return false;
    };

    // Add Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('selectstart', handleRightClick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('selectstart', handleRightClick);
    };
  }, []);

  // --- Webcam Logic ---
  useEffect(() => {
    let checkInterval;
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowWebcam(true);
        
        // Simple Face Detection Simulation (Check every 5s)
        checkInterval = setInterval(() => {
          // In a production app, we would use face-api.js here.
          // For now, we simulate detection and check for stream health.
          const isHealthy = stream.getVideoTracks()[0].enabled;
          if (!isHealthy) {
            setFacePresent(false);
            const timestamp = new Date().toLocaleTimeString();
            setSuspicionScore(prev => prev + 5);
            setFraudLog(prev => [...prev, `[${timestamp}] Face not detected for proctoring.`]);
            setLastWarning("Face not detected! Please ensure you are visible to the camera.");
          } else {
            setFacePresent(true);
          }
        }, 5000);

      } catch (err) {
        console.error("Webcam error:", err);
        setError("Could not access webcam. Please ensure permissions are granted for proctoring.");
      }
    };

    startWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Text-To-Speech (TTS) logic
  const speakQuestion = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a good female English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || 
                           voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  // Ensure voices are loaded (Chrome sometimes needs this)
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }, []);

  // Auto-speak when question changes
  useEffect(() => {
    if (questions && questions[currentQ]) {
      speakQuestion(questions[currentQ]);
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [currentQ, questions, speakQuestion]);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // mute AI if user starts talking
    setTranscript('');
    setInterimTranscript('');
    setCurrentEval(null);
    setError('');
    startTimeRef.current = Date.now();
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const submitAnswer = async () => {
    const finalAnswer = transcript.trim();
    if (!finalAnswer || finalAnswer.length < 5) {
      setError('Please provide an answer before submitting.');
      return;
    }

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setEvaluating(true);
    setError('');
    const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;

    try {
      const response = await interviewAPI.evaluate({
        session_id,
        user_id: user.id,
        question: questions[currentQ],
        answer: finalAnswer,
        duration_seconds: duration,
        suspicion_score: suspicionScore,
        fraud_log: fraudLog.join('\n')
      });
      
      // Reset local fraud points after each submission to prevent compounding
      setSuspicionScore(0);
      setFraudLog([]);

      const evaluation = response.data;
      setCurrentEval(evaluation);
      setAnswers(prev => [...prev, {
        question: questions[currentQ],
        answer: finalAnswer,
        evaluation
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      setAllDone(true);
    } else {
      setCurrentQ(prev => prev + 1);
      setTranscript('');
      setCurrentEval(null);
      setRecordingDuration(0);
      setError('');
      if (textareaRef.current) textareaRef.current.value = '';
    }
  };

  const goToReport = () => navigate('/report/' + session_id);

  const ScoreBar = ({ label, score, color }) => (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span className="text-slate-300">{label}</span>
        <span style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="w-full bg-slate-800/50 rounded-full h-3 border border-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}80` }}
        >
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (allDone) {
    const avgScore = answers.length > 0
      ? Math.round(answers.reduce((s, a) => s + (a.evaluation?.overall_score || 0), 0) / answers.length)
      : 0;

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-lg w-full p-10 text-center animate-slide-up relative overflow-hidden group">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary-600/10 blur-[100px] -z-10 group-hover:bg-primary-500/20 transition-all duration-700"></div>
          
          <div className="text-6xl mb-6 animate-float">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">Interview Complete!</h2>
          <p className="text-slate-400 mb-8">You answered all {questions.length} questions</p>
          
          <div className="inline-flex justify-center items-center w-40 h-40 rounded-full border-4 border-primary-500/30 bg-primary-900/30 shadow-[0_0_30px_rgba(37,99,235,0.3)] mb-4 relative">
             <div className="absolute inset-2 rounded-full border border-primary-400/20 animate-spin-slow"></div>
             <div className="flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white tracking-tighter">{avgScore}</span>
                <span className="text-sm text-primary-400 uppercase tracking-widest font-semibold mt-1">Avg Score</span>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button className="flex-1 glass-button py-4" onClick={goToReport}>
              📊 View Full Report
            </button>
            <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all font-medium backdrop-blur-sm" onClick={() => navigate('/dashboard')}>
              🏠 Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 animate-fade-in relative z-10">
      
      {/* Fraud Warning Overlay */}
      {lastWarning && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-white/20 font-bold animate-bounce flex items-center space-x-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>{lastWarning}</span>
        </div>
      )}

      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4 glass-card p-4 px-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-primary-900/40 text-primary-400 border border-primary-500/30 text-sm font-semibold tracking-wide">
            {domain}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 text-sm font-semibold tracking-wide">
            {difficulty}
          </span>
        </div>
        <div className="flex-1 max-w-xs ml-auto">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            <span>Question {currentQ + 1}</span>
            <span>of {questions.length}</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-primary-600 to-neon-blue h-full rounded-full transition-all duration-500" 
              style={{ width: `${((currentQ) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Interview Area */}
        <div className="lg:col-span-8 space-y-6">
          
            {/* Question Card */}
            <div className="relative">
              <div className="glass-card p-8 md:p-10 relative overflow-hidden group mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-bl-full -z-10 group-hover:bg-primary-500/20 transition-all"></div>
                
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-primary-400 font-bold text-xl font-mono">Q{currentQ + 1}.</div>
                  <button 
                      onClick={() => speakQuestion(questions[currentQ])}
                      className="p-2 rounded-lg bg-white/5 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 border border-transparent hover:border-primary-500/30 transition-all flex-shrink-0"
                      title="Play Audio"
                    >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                  {questions[currentQ]}
                </h2>
              </div>
              
              {/* Added Webcam Feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-4 h-48 relative overflow-hidden flex items-center justify-center">
                   {showWebcam ? (
                     <video 
                       ref={videoRef} 
                       autoPlay 
                       muted 
                       playsInline 
                       className="w-full h-full object-cover rounded-xl"
                     />
                   ) : (
                     <div className="text-slate-500 text-sm">Initializing Camera...</div>
                   )}
                   <div className="absolute top-6 left-6 flex items-center bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-white tracking-widest uppercase">Live Proctor</span>
                   </div>
                </div>
                
                <div className="glass-card p-6 flex flex-col justify-center">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${suspicionScore > 5 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Integrity Status</div>
                      <div className={`text-lg font-bold ${suspicionScore > 5 ? 'text-red-400' : 'text-green-400'}`}>
                        {suspicionScore > 10 ? 'Highly Suspicious' : suspicionScore > 4 ? 'Warning' : 'Normal'}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${Math.min(100, suspicionScore * 10)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 italic">Behavioral monitoring active. Switch tabs or applications will be logged.</p>
                </div>
              </div>
            </div>

          {/* Answer Area */}
          <div className="glass-card p-8 relative">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                   <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                 </div>
                 <h3 className="text-lg font-semibold text-white">Your Answer</h3>
              </div>
              
              <div className="flex items-center">
                {speechSupported ? (
                  <>
                    {!isRecording ? (
                      <button 
                        className="px-6 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium flex items-center transition-all disabled:opacity-50"
                        onClick={startRecording} disabled={evaluating || !!currentEval}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
                        Record Answer
                      </button>
                    ) : (
                      <div className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-full pl-6 pr-2 py-1.5">
                        <div className="flex items-center text-red-400 font-mono text-sm tracking-wider w-16">
                           <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                           {formatTime(recordingDuration)}
                        </div>
                        <button 
                          className="px-4 py-1.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                          onClick={stopRecording}
                        >
                          Stop
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-amber-400 bg-amber-400/10 px-4 py-2 rounded-lg border border-amber-400/20">
                    🎤 Speech recognition not supported. Please type your answer.
                  </div>
                )}
              </div>
            </div>

            <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${isRecording ? 'ring-2 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)] bg-slate-900/80' : 'bg-slate-900/40 border border-white/10 focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/50'}`}>
              
              {speechSupported && (
                 <div className="p-6 text-slate-300 text-lg leading-relaxed min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {(transcript || interimTranscript) ? (
                    <div className="whitespace-pre-wrap">
                      <span dangerouslySetInnerHTML={{ __html: highlightFillers(transcript) }} />
                      <span className="text-slate-500 italic ml-1">{interimTranscript}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 flex items-center h-full">
                      {isRecording ? (
                        <div className="flex items-center">
                           <span className="animate-pulse mr-2 text-red-500 font-bold">Listening...</span> Speak now.
                        </div>
                      ) : (
                        <span>Click <strong className="text-red-400">"Record Answer"</strong> to use your voice, or type your response manually below.</span>
                      )}
                    </div>
                  )}
                 </div>
              )}
              
              <div className="border-t border-white/5 bg-slate-900/60 flex relative">
                 <textarea
                   ref={textareaRef}
                   className="w-full bg-transparent border-0 p-4 text-white placeholder-slate-500 focus:ring-0 resize-none outline-none"
                   placeholder={speechSupported ? "Speak or type your answer here..." : "Type your answer here..."}
                   value={transcript}
                   onChange={(e) => setTranscript(e.target.value)}
                   disabled={evaluating || !!currentEval || isRecording}
                   rows={3}
                 />
                 {isRecording && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-[2px] z-10 text-red-400 font-medium tracking-wide">
                       Audio recording in progress...
                    </div>
                 )}
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400 animate-slide-up">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {!currentEval && !isRecording && (
              <button
                className="w-full mt-8 py-4 text-lg glass-button flex justify-center items-center group shadow-xl"
                onClick={submitAnswer}
                disabled={evaluating || (!transcript.trim() && (!textareaRef.current?.value?.trim()))}
              >
                {evaluating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Gemini AI is analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span> Submit for AI Evaluation
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar / Evaluation Results */}
        <div className="lg:col-span-4">
          {currentEval ? (
            <div className="glass-card p-6 sticky top-24 animate-slide-up border-primary-500/30 shadow-[0_0_30px_rgba(37,99,235,0.15)] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[50px] -z-10"></div>
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">📊</span> Gemini Analysis
              </h3>

              <div className="flex items-center justify-between mb-8 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                 <div>
                    <div className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Overall</div>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-blue">
                       {Math.round(currentEval.overall_score)}<span className="text-lg text-slate-500 font-medium">/100</span>
                    </div>
                 </div>
                 <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                      style={{ 
                         borderColor: currentEval.overall_score > 80 ? '#22c55e' : currentEval.overall_score > 60 ? '#f59e0b' : '#ef4444',
                         color: currentEval.overall_score > 80 ? '#22c55e' : currentEval.overall_score > 60 ? '#f59e0b' : '#ef4444'
                      }}>
                    {(currentEval.overall_score > 80 ? 'A' : currentEval.overall_score > 60 ? 'B' : 'C')}
                 </div>
              </div>

              <div className="space-y-1 mb-8">
                <ScoreBar label="Technical Accuracy" score={currentEval.technical_score} color="#6366f1" />
                <ScoreBar label="Communication" score={currentEval.communication_score} color="#22c55e" />
                <ScoreBar label="Confidence" score={currentEval.confidence_score} color="#f59e0b" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Pace (WPM)</div>
                  <div className="text-xl font-bold text-white">{currentEval.words_per_minute}</div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Fillers</div>
                  <div className={`text-xl font-bold ${currentEval.filler_words > 3 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {currentEval.filler_words}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">💬 Feedback</h4>
                <p className="text-slate-300 bg-white/5 border border-white/10 p-4 rounded-xl text-sm leading-relaxed">
                   {currentEval.feedback}
                </p>
              </div>

              {currentEval.improvement_tips?.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                     <svg className="w-4 h-4 text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     Key Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {currentEval.improvement_tips.map((tip, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-400">
                        <span className="text-emerald-400 mr-2">✓</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="w-full glass-button py-3 text-base" onClick={nextQuestion}>
                {currentQ + 1 >= questions.length ? 'Finish Interview' : 'Next Question ➡️'}
              </button>
            </div>
          ) : (
            <div className="glass-card p-6 sticky top-24 opacity-60 flex flex-col items-center justify-center min-h-[400px] text-center">
               <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-6">
                  <span className="text-3xl grayscale opacity-50">🤖</span>
               </div>
               <h3 className="text-lg font-bold text-slate-300 mb-2">Awaiting Answer</h3>
               <p className="text-sm text-slate-500 max-w-xs">Record or type your response to receive real-time AI evaluation and feedback.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
