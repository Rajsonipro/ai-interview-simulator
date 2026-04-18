import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI, reportAPI } from '../services/api';

const DOMAINS = [
  {
    id: 'Software Developer',
    icon: '💻',
    title: 'Software Developer',
    desc: 'DSA, system design, web dev, APIs'
  },
  {
    id: 'HR',
    icon: '👥',
    title: 'Human Resources',
    desc: 'Talent management, recruitment, policies'
  },
  {
    id: 'Marketing',
    icon: '📊',
    title: 'Marketing',
    desc: 'Digital marketing, campaigns, growth'
  }
];

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Beginner', color: '#22c55e', desc: '0-1 years experience' },
  { id: 'Intermediate', label: 'Intermediate', color: '#f59e0b', desc: '2-4 years experience' },
  { id: 'Advanced', label: 'Advanced', color: '#ef4444', desc: '5+ years experience' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domain, setDomain] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (user?.id) {
      reportAPI.getUserStats(user.id)
        .then(res => setStats(res.data))
        .catch(() => {});
    }
  }, [user]);

  const handleStart = async () => {
    if (!domain || !difficulty) {
      setError('Please select both a domain and difficulty level.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await interviewAPI.createSession({
        user_id: user.id,
        domain,
        difficulty,
        resume_text: resumeText
      });
      navigate('/interview', { state: { sessionData: response.data } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Failed to start interview. Make sure the backend is running.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setUploadingResume(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await interviewAPI.uploadResume(formData);
      setResumeText(res.data.content);
    } catch (err) {
      console.error(err);
      setError('Failed to parse resume. Please try a different file.');
      setResumeFile(null);
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in relative z-10">
      
      <div className="w-full max-w-5xl glass-card p-8 md:p-12 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-primary-600/20 transition-all duration-700"></div>
        
        <div className="text-center md:text-left mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-blue">{user?.username}</span> 👋
          </h1>
          <p className="text-slate-400 text-lg">Configure your interview session and start practicing</p>
        </div>

        {stats && stats.total_sessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Sessions', val: stats.total_sessions },
              { label: 'Questions', val: stats.total_questions },
              { label: 'Avg Score', val: Math.round(stats.avg_overall || 0) },
              { label: 'Best Score', val: Math.round(stats.best_score || 0) }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-12">
          {/* Domain Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm mr-3 border border-primary-500/30">1</span>
              Select Interview Domain
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  className={`relative p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden ${
                    domain === d.id 
                    ? 'bg-primary-600/20 border-primary-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                  onClick={() => setDomain(d.id)}
                >
                  {domain === d.id && <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/20 rounded-bl-full -z-10"></div>}
                  <div className="text-4xl mb-4">{d.icon}</div>
                  <h4 className="text-xl font-bold text-white mb-2">{d.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{d.desc}</p>
                  
                  {domain === d.id && (
                    <div className="absolute top-4 right-4 text-primary-400 bg-primary-900/50 rounded-full p-1 border border-primary-500/50 animate-slide-up">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm mr-3 border border-primary-500/30">2</span>
              Select Difficulty Level
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  className={`p-6 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                    difficulty === d.id 
                    ? 'bg-white/10 border-white/50 shadow-glass' 
                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
                  onClick={() => setDifficulty(d.id)}
                >
                  {difficulty === d.id && (
                     <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(45deg, transparent, ${d.color}, transparent)` }}></div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold mb-2 flex items-center" style={{ color: difficulty === d.id ? d.color : 'white' }}>
                      {d.label}
                    </h4>
                    <p className="text-sm text-slate-400">{d.desc}</p>
                  </div>
                  {difficulty === d.id && (
                    <div className="absolute bottom-4 right-4">
                      <svg className="w-6 h-6 animate-pulse" style={{ color: d.color }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload (Optional but Recommended) */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm mr-3 border border-primary-500/30">3</span>
              Personalize with Resume (Optional)
            </h3>
            <div className={`p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center ${
              resumeText ? 'bg-primary-900/10 border-primary-500/50' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
            }`}>
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleResumeUpload}
              />
              {uploadingResume ? (
                 <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-primary-400 mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-slate-400">Reading your resume...</p>
                 </div>
              ) : resumeText ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-4 border border-primary-500/50">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Resume Analyzed!</h4>
                  <p className="text-sm text-slate-400 mb-4">{resumeFile?.name} uploaded successfully.</p>
                  <label htmlFor="resume-upload" className="text-primary-400 hover:text-primary-300 text-sm font-medium cursor-pointer underline underline-offset-4">Change file</label>
                </div>
              ) : (
                <label htmlFor="resume-upload" className="cursor-pointer group text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:bg-primary-500/20 group-hover:text-primary-400 group-hover:border-primary-500/50 transition-all">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Upload your Resume</h4>
                  <p className="text-sm text-slate-400">Get personalized questions based on your experience.<br/>Supports PDF and TXT up to 10MB.</p>
                </label>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400 animate-slide-up">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between">
          <div className="text-slate-400 mb-6 md:mb-0 text-center md:text-left h-12 flex items-center">
            {domain && difficulty ? (
              <span className="animate-fade-in">
                You'll be interviewed as a <strong className="text-white" style={{color: DIFFICULTIES.find(x=>x.id===difficulty)?.color}}>{difficulty}</strong> <strong className="text-white">{domain}</strong> candidate
                with <strong className="text-primary-400">5 AI-generated questions</strong>.
              </span>
            ) : (
             <span className="opacity-50">Select domain and difficulty to start</span>
            )}
          </div>
          
          <button
            className="w-full md:w-auto px-8 py-4 text-lg tracking-wide glass-button flex justify-center items-center group disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStart}
            disabled={loading || !domain || !difficulty}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generating Questions...
              </>
            ) : (
              <>
                🚀 Start Interview
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
