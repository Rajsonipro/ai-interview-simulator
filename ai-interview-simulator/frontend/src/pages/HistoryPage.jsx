import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI, reportAPI } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      interviewAPI.getHistory(user.id),
      reportAPI.getUserStats(user.id)
    ]).then(([historyRes, statsRes]) => {
      setHistory(historyRes.data.history || []);
      setStats(statsRes.data);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [user.id]);

  const getDomainEmoji = (domain) => {
    const map = { 'Software Developer': '💻', 'HR': '👥', 'Marketing': '📊' };
    return map[domain] || '🎯';
  };

  const getDiffColor = (diff) => {
    const map = { Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#ef4444' };
    return map[diff] || '#6366f1';
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="glass-card p-10 flex flex-col items-center max-w-sm w-full">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-6"></div>
        <p className="text-white text-lg font-medium animate-pulse">Loading Progress Center...</p>
      </div>
    </div>
  );

  const lineData = {
    labels: [...history].reverse().map((_, i) => `Sess ${i + 1}`),
    datasets: [{
      label: 'Performance Trend',
      data: [...history].reverse().map(s => s.avg_score),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255, 255, 255, 0.5)' } },
      x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.5)' } }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-fade-in relative z-10 min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Interview History</h1>
          <p className="text-slate-400">Review your past performances and track your progress</p>
        </div>
        <button 
          className="glass-button px-6 py-3 shrink-0 self-start md:self-auto"
          onClick={() => navigate('/dashboard')}
        >
          <span className="mr-2">+</span> New Session
        </button>
      </div>

      {history.length > 0 && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
           <div className="lg:col-span-2 glass-card p-6 md:p-8 h-[350px]">
              <h3 className="text-lg font-bold text-white mb-6">Score Trend</h3>
              <div className="h-[250px] w-full">
                <Line data={lineData} options={lineOptions} />
              </div>
           </div>
           <div className="glass-card p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-6">Skill Comparison</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Technical</span>
                      <span className="text-indigo-400">{Math.round(stats.avg_technical || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${stats.avg_technical || 0}%` }}></div></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Communication</span>
                      <span className="text-emerald-400">{Math.round(stats.avg_communication || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.avg_communication || 0}%` }}></div></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>Confidence</span>
                      <span className="text-amber-400">{Math.round(stats.avg_confidence || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.avg_confidence || 0}%` }}></div></div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                 <p className="text-xs text-slate-500 italic">"Practice makes perfect. Keep up the consistency!"</p>
              </div>
           </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border-white/5 opacity-80 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 mb-6 rounded-full bg-slate-800/50 flex items-center justify-center text-5xl border border-white/5 shadow-inner">
            📋
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No interviews yet</h3>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">Start your first AI mock interview to begin tracking your performance here.</p>
          <button className="glass-button px-8 py-3" onClick={() => navigate('/dashboard')}>
            Start an Interview 🚀
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((session, i) => (
            <div key={i} className="glass-card p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(37,99,235,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[40px] -z-10 group-hover:bg-primary-500/10 transition-all"></div>
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-2xl border border-white/10 shadow-sm group-hover:border-primary-500/30 transition-colors">
                    {getDomainEmoji(session.domain)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{session.domain}</h3>
                    <div className="text-xs text-slate-400 font-medium">
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 inline-flex border border-white/10 bg-slate-900/50 rounded-lg p-1 self-start">
                  <span 
                    className="px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase"
                    style={{ backgroundColor: getDiffColor(session.difficulty) + '15', color: getDiffColor(session.difficulty) }}
                  >
                    {session.difficulty}
                  </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-2xl font-bold text-white mb-1">{session.questions_answered || 0}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Qs Answered</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: getDiffColor(session.difficulty) }}></div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-blue mb-1">
                    {Math.round(session.avg_score || 0)}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Score</div>
                </div>
              </div>

              <button
                className="w-full py-3 bg-white/5 hover:bg-primary-600/20 border border-white/10 hover:border-primary-500/50 text-white rounded-xl transition-all font-medium text-sm flex items-center justify-center group-hover:text-primary-400"
                onClick={() => navigate('/report/' + session.session_id)}
              >
                View Detailed Report 
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
