import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../utils/api';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hello! I am your AI Financial Assistant. How can I help you manage your expenses today?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/chat', { query });
      const botMessage = { role: 'bot', text: response.data.text };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat AI Error:', error);
      const serverError = error.response?.data?.message || error.message || 'Check your internet connection';
      const errorMessage = { role: 'bot', text: `Sorry, ${serverError}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 w-[360px] sm:w-[400px] h-[540px] flex flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] shadow-[var(--shadow-glass)]"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Financial Co-Pilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/70 uppercase tracking-wider font-semibold">AI Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--app-border) transparent' }}
            >
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md'
                        : 'border border-[var(--app-border)] bg-[var(--app-card)]'
                    }`}>
                      {msg.role === 'user'
                        ? <User size={14} className="text-white" />
                        : <Bot size={14} className="text-[var(--app-accent)]" />
                      }
                    </div>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20'
                        : 'bg-[var(--app-card)] text-[var(--app-text)] border border-[var(--app-border)] rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[88%]">
                    <div className="w-7 h-7 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center">
                      <Bot size={14} className="text-[var(--app-accent)]" />
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text-secondary)] text-sm flex items-center gap-2 shadow-sm">
                      <Loader2 size={14} className="animate-spin text-[var(--app-accent)]" />
                      Analyzing data...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--app-border)] bg-[var(--app-accent-light)] shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--app-border)] rounded-xl py-2.5 pl-4 pr-12 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--glass-ring)] transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-center text-[var(--app-muted)] italic">
                Powered by Gemini 2.0 Flash
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white relative group shadow-xl shadow-indigo-500/25"
        style={{ background: 'var(--gradient-primary)' }}
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 border-2 border-white text-[9px] items-center justify-center font-bold text-white">1</span>
          </span>
        )}
        <div className="absolute right-full mr-4 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shadow-lg"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--app-border)',
            color: 'var(--app-text)',
          }}
        >
          Talk to your AI Co-Pilot
        </div>
      </motion.button>
    </div>
  );
};

export default AIChatBot;
