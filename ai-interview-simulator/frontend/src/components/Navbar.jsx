import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ navigate, currentPage }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-card border-x-0 border-t-0 rounded-none bg-surface/60 px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => navigate('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-neon-blue flex items-center justify-center shadow-neon group-hover:scale-105 transition-transform duration-300">
            <span className="text-xl">🎯</span>
          </div>
          <span className="text-xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 group-hover:from-white group-hover:to-primary-400 transition-colors">
            InterviewAI
          </span>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex space-x-1 glass-card border-none bg-black/20 p-1 rounded-xl">
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentPage === 'dashboard' ? 'bg-primary-500/20 text-primary-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            onClick={() => navigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${currentPage === 'history' ? 'bg-primary-500/20 text-primary-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            onClick={() => navigate('history')}
          >
            History
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors border border-transparent hover:border-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shadow-lg border border-primary-400/30 ${!user?.avatar_url ? 'bg-primary-600' : ''}`}>
               {user?.avatar_url ? (
                 <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
               ) : (
                 user?.username?.[0]?.toUpperCase()
               )}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-slate-200">{user?.username}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-56 glass-card p-2 origin-top-right animate-slide-up border border-white/10 shadow-2xl">
              <div className="px-4 py-3 border-b border-white/5 mb-2">
                <p className="text-sm text-slate-300 truncate">{user?.email}</p>
              </div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
