import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, TrendingUp, Sparkles, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding/Hero */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-white" />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-white" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex p-5 rounded-2xl bg-white/15 backdrop-blur-sm mb-8 shadow-lg">
              <TrendingUp size={44} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Start Your Journey</h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Join thousands taking control of their finances with AI-powered tracking and insights.
            </p>

            <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
              {[
                'Free forever — no hidden charges',
                'AI receipt scanning included',
                'Beautiful analytics & charts',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/80"
                >
                  <div className="p-1 rounded-full bg-white/20">
                    <Sparkles size={12} />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-12 right-12 text-center">
          <p className="text-white/40 text-sm font-medium">SpendWise — AI Finance Tracker</p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--app-bg)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/20 mb-4">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--app-text)]">SpendWise</h1>
            <p className="text-[var(--app-text-secondary)] mt-1 font-medium">Create your account</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-[var(--app-text)] tracking-tight">Create account</h1>
            <p className="text-[var(--app-text-secondary)] mt-1 font-medium">to start tracking your finances</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                <input
                  type="text"
                  required
                  className="input-field !pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                <input
                  type="email"
                  required
                  className="input-field !pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field !pl-10 !pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full !py-3 shadow-lg shadow-indigo-500/20">
              Create Account <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--app-border)] text-center">
            <p className="text-sm text-[var(--app-text-secondary)] font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
