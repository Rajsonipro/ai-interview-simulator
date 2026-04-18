import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reportAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

export default function ReportPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportAPI.getSessionReport(sessionId)
      .then(res => setReport(res.data))
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card p-10 flex flex-col items-center max-w-sm w-full">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-6"></div>
        <p className="text-white text-lg font-medium animate-pulse">Analyzing Results...</p>
        <p className="text-slate-500 text-sm mt-2">Generating your performance report</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card p-10 flex flex-col items-center max-w-sm w-full border-red-500/20 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
        <p className="text-red-400 mb-6">{error}</p>
        <button className="glass-button w-full py-3" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    </div>
  );
  if (!report) return null;

  const { responses, average_technical, average_communication, average_confidence, average_overall } = report;

  const barData = {
    labels: responses.map((_, i) => `Q${i + 1}`),
    datasets: [
      {
        label: 'Technical',
        data: responses.map(r => r.technical_score),
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Communication',
        data: responses.map(r => r.communication_score),
        backgroundColor: 'rgba(34, 197, 94, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Confidence',
        data: responses.map(r => r.confidence_score),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 6,
      }
    ]
  };

  const radarData = {
    labels: ['Technical', 'Communication', 'Confidence'],
    datasets: [{
      label: 'Your Scores',
      data: [average_technical, average_communication, average_confidence],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
    }]
  };

  const doughnutData = {
    labels: ['Technical', 'Communication', 'Confidence'],
    datasets: [{
      data: [average_technical, average_communication, average_confidence],
      backgroundColor: ['#6366f1', '#22c55e', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: "'Inter', sans-serif" } } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: { 
        min: 0, 
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12, family: "'Inter', sans-serif" } }
      }
    },
    plugins: {
      legend: { display: false },
       tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    }
  };

  const getGrade = (score) => {
    if (score >= 85) return { grade: 'A', label: 'Excellent', color: '#22c55e' };
    if (score >= 70) return { grade: 'B', label: 'Good', color: '#6366f1' };
    if (score >= 55) return { grade: 'C', label: 'Average', color: '#f59e0b' };
    return { grade: 'D', label: 'Needs Work', color: '#ef4444' };
  };

  const grade = getGrade(average_overall);

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="glass-card p-6 flex items-start gap-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[30px] -z-10 opacity-20" style={{ backgroundColor: color }}></div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border bg-slate-800/80 shadow-inner" style={{ borderColor: `${color}30` }}>
        {icon}
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">{title}</h3>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-fade-in relative z-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-[80px] -z-10"></div>
        
        <div>
           <div className="flex items-center gap-3 mb-3">
             <span className="px-3 py-1 bg-primary-900/40 text-primary-400 border border-primary-500/30 rounded-md text-xs font-bold tracking-wider uppercase">
               {report.domain}
             </span>
             <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-white/10 rounded-md text-xs font-bold tracking-wider uppercase">
               {report.difficulty}
             </span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">Performance Report</h1>
           <p className="text-slate-400 flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             {report.questions_answered} Questions Answered
           </p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-white/10 rounded-2xl md:min-w-[200px] shadow-inner relative">
           <div className="absolute inset-0 rounded-2xl border" style={{ borderColor: grade.color + '40' }}></div>
           <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 z-10">Overall Score</span>
           <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 z-10">
             {Math.round(average_overall)}<span className="text-2xl text-slate-500 font-medium">/100</span>
           </div>
           <div className="mt-2 text-sm font-semibold" style={{ color: grade.color }}>
             {grade.grade} - {grade.label}
           </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard 
          title="Technical" 
          value={`${Math.round(average_technical)}%`} 
          subtitle="Accuracy score" 
          color="#6366f1" 
          icon="⚙️" 
        />
        <StatCard 
          title="Communication" 
          value={`${Math.round(average_communication)}%`} 
          subtitle="Clarity score" 
          color="#22c55e" 
          icon="🗣" 
        />
        <StatCard 
          title="Confidence" 
          value={`${Math.round(average_confidence)}%`} 
          subtitle="Tone score" 
          color="#f59e0b" 
          icon="🌟" 
        />
        <StatCard 
          title="Fillers" 
          value={report.total_filler_words || 0} 
          subtitle="Total umms/uhs" 
          color="#ef4444" 
          icon="🤔" 
        />
        <StatCard 
          title="Pace" 
          value={report.average_wpm || 0} 
          subtitle="Avg words/min" 
          color="#3b82f6" 
          icon="⚡" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 glass-card p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Score Progression
          </h3>
          <div className="h-[300px] w-full relative">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        
        <div className="glass-card p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Skill Balance
          </h3>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      {/* Behavior Report (Cheating Detection) */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-sm mr-3 border border-red-500/30 shadow-inner">🛡️</span>
          Behavior & Integrity Report
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className={`absolute inset-0 opacity-5 -z-10 ${report.suspicion_score > 10 ? 'bg-red-500' : report.suspicion_score > 4 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
            
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl mb-4 shadow-lg ${
              report.suspicion_score > 10 ? 'border-red-500 text-red-500 bg-red-500/10' : 
              report.suspicion_score > 4 ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
              'border-emerald-500 text-emerald-500 bg-emerald-500/10'
            }`}>
              {report.suspicion_score}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Suspicion Score</h3>
            <p className={`text-sm font-bold uppercase tracking-widest ${
               report.suspicion_score > 10 ? 'text-red-500' : 
               report.suspicion_score > 4 ? 'text-amber-500' : 
               'text-emerald-500'
            }`}>
              {report.suspicion_score > 10 ? 'Significant Anomalies' : 
               report.suspicion_score > 4 ? 'Minor Warnings' : 
               'Excellent Integrity'}
            </p>
          </div>

          <div className="md:col-span-2 glass-card p-6 md:p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Activity Log (Monitor)</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-4">
              {report.fraud_log ? report.fraud_log.split('\n').filter(x => x.trim()).map((log, idx) => (
                <div key={idx} className="flex items-start bg-white/5 border border-white/5 p-3 rounded-xl">
                  <span className="text-red-400 mr-3 mt-0.5">•</span>
                  <p className="text-sm text-slate-300 font-mono italic">{log}</p>
                </div>
              )) : (
                <div className="h-32 flex items-center justify-center text-slate-500 italic text-sm">
                  No suspicious activity recorded during this session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question Review Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-8 h-8 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm mr-3 border border-primary-500/30 shadow-inner">📋</span>
          Detailed Response Analysis
        </h2>
        <div className="space-y-6">
          {responses.map((r, i) => (
            <div key={i} className="glass-card p-6 md:p-8 relative overflow-hidden group">
               <div className="absolute left-0 top-0 w-1 h-full bg-primary-500 opacity-50"></div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="text-primary-400 font-mono font-bold mb-2 tracking-widest text-sm uppercase">Question {i + 1}</div>
                  <h3 className="text-xl font-semibold text-white mb-6 leading-snug">{r.question}</h3>
                  
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 mb-6">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                       <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                       Your Answer
                    </div>
                    <p className="text-slate-300 leading-relaxed italic border-l-2 border-white/10 pl-4">{r.answer}</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-slate-400"><span className="mr-2">📝</span> {r.words_per_minute} wpm</div>
                      <div className="flex items-center text-slate-400"><span className="mr-2">🗣</span> {r.filler_words} fillers</div>
                    </div>
                  </div>

                  {r.feedback && (
                    <div>
                      <div className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-3 flex items-center">
                         <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         AI Feedback
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="lg:w-72 shrink-0">
                  <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/5 h-full flex flex-col justify-center">
                    <div className="text-center mb-6 border-b border-white/10 pb-6">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Overall Score</div>
                      <div className="text-4xl font-black text-white">{Math.round(r.overall_score)}</div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1.5">
                          <span>Tech</span>
                          <span>{Math.round(r.technical_score)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${r.technical_score}%` }}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1.5">
                          <span>Comm</span>
                          <span>{Math.round(r.communication_score)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${r.communication_score}%` }}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1.5">
                          <span>Conf</span>
                          <span>{Math.round(r.confidence_score)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${r.confidence_score}%` }}></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 pb-10">
         <button className="py-4 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all font-medium backdrop-blur-sm" onClick={() => navigate('/history')}>
            View History
         </button>
         <button className="glass-button px-10 py-4 text-lg" onClick={() => navigate('/dashboard')}>
            New Interview
         </button>
      </div>
    </div>
  );
}
