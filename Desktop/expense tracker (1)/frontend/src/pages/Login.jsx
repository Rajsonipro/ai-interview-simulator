import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

const BLOCKED_DOMAINS = new Set([
  'test.com',
  'fake.com',
  'example.com',
  'email.com',
  'tempmail.com',
  'mailinator.com',
  'yopmail.com',
  'trashmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'dispostable.com',
  'getnada.com',
  'moakt.com',
  'sharklasers.com',
  'spam4.me',
]);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = useCallback((value) => {
    const cleanedEmail = String(value || '').trim().toLowerCase();

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedEmail)) return false;

    // No double dots
    if (cleanedEmail.includes('..')) return false;

    const parts = cleanedEmail.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domainPart] = parts;

    // Local part and domain should be reasonable
    if (localPart.length < 2) return false;
    if (domainPart.length < 4) return false;
    if (!domainPart.includes('.')) return false;

    // Block disposable / clearly fake domains
    if (BLOCKED_DOMAINS.has(domainPart)) return false;

    // Block domains that start/end badly
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;

    // Block emails like a@b.c
    const domainSections = domainPart.split('.');
    if (domainSections.some((section) => section.length < 2)) return false;

    return true;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a real and valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await login(trimmedEmail, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setGoogleLoading(true);

    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Google sign-in failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled. Please try again or use email.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding / Hero */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-white" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-white" />
          <div className="absolute top-2/3 left-1/2 w-40 h-40 rounded-full bg-white" />
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
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Track your expenses, set budgets, and achieve your financial
              goals with AI-powered insights.
            </p>

            <div className="mt-10 space-y-4 text-left max-w-xs mx-auto">
              {[
                'AI-powered expense tracking',
                'Real-time analytics & insights',
                'Smart budget management',
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
          <p className="text-white/40 text-sm font-medium">
            SpendWise — AI Finance Tracker
          </p>
        </div>
      </div>

      {/* Right panel — Auth Form */}
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
            <h1 className="text-2xl font-bold text-[var(--app-text)]">
              SpendWise
            </h1>
            <p className="text-[var(--app-text-secondary)] mt-1 font-medium">
              Sign in to your account
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-[var(--app-text)] tracking-tight">
              Sign in
            </h1>
            <p className="text-[var(--app-text-secondary)] mt-1 font-medium">
              to continue to SpendWise
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-6 p-4 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-danger-soft)',
                  color: 'var(--color-danger)',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign-In Button */}
          <div className="mb-6">
            <div className="relative group">
              {googleLoading && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
                  style={{ background: 'var(--app-card)' }}
                >
                  <Loader2
                    size={20}
                    className="animate-spin text-[var(--app-accent)]"
                  />
                </div>
              )}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
                logo_alignment="center"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--app-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--app-bg)] text-[var(--app-muted)] font-medium">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none"
                />
                <input
                  type="email"
                  required
                  className="input-field !pl-10"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[var(--app-text-secondary)]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field !pl-10 !pr-10"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Footer — no Sign Up link */}
          <div className="mt-8 pt-6 border-t border-[var(--app-border)] text-center">
            <p className="text-xs text-[var(--app-muted)]">
              By continuing, you agree to SpendWise&apos;s{' '}
              <span className="font-medium text-[var(--app-text-secondary)]">
                Terms
              </span>{' '}
              and{' '}
              <span className="font-medium text-[var(--app-text-secondary)]">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;