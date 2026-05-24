import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────

const VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address',
  username: (v) => v.length >= 3 ? '' : 'Username must be at least 3 characters',
  password: (v) => {
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(v)) return 'Password must contain a number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v)) return 'Password must contain a special character';
    return '';
  },
};

const TOAST_DURATION = 4000;

// ─────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-emerald-500/90 border-emerald-400/40 text-emerald-50',
    error: 'bg-red-500/90 border-red-400/40 text-red-50',
    info: 'bg-blue-500/90 border-blue-400/40 text-blue-50',
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-slide-up flex items-center gap-3 text-sm font-semibold ${styles[type] || styles.info}`}>
      {type === 'success' && <span className="text-lg">✓</span>}
      {type === 'error' && <span className="text-lg">✕</span>}
      {type === 'info' && <span className="text-lg">ℹ</span>}
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Password Input Component
// ─────────────────────────────────────────────

function PasswordInput({ value, onChange, placeholder, error, disabled, label, name, autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && <label className="text-sm font-medium text-slate-300 ml-1 mb-1.5 block">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full px-5 py-4 glass-input mt-1 pr-14 ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5 ml-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// OTP Input Component
// ─────────────────────────────────────────────

function OtpInput({ otp, setOtp, disabled }) {
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3 mb-6">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={`w-12 h-14 sm:w-14 sm:h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// AuthFlows — Step Components
// ─────────────────────────────────────────────

function SignInForm({ onSuccess, onNavigateRegister, onShowForgotPassword, toast }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    const emailErr = VALIDATORS.email(form.email);
    const passErr = VALIDATORS.password(form.password);
    if (emailErr) errs.email = emailErr;
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      const response = await authAPI.login(form);
      const { session_token, user } = response.data;
      login(session_token, user);
      onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === 'Email not verified. A new verification code has been sent to your email.') {
        toast({ message: 'A new verification code has been sent to your email.', type: 'info' });
        onSuccess('otp', form.email);
      } else {
        setApiError(detail || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const width = 600, height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const popup = window.open(
      `${backendUrl}/api/auth/oauth/${provider}`,
      `${provider}_auth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const handleMessage = (event) => {
      if (event.data?.session_token && event.data?.user) {
        login(event.data.session_token, event.data.user);
        onSuccess();
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-300 ml-1 mb-1.5 block">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          className={`w-full px-5 py-4 glass-input ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}`}
          required
        />
        {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
      </div>

      <PasswordInput
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Enter your password"
        error={errors.password}
        label="Password"
        autoComplete="current-password"
      />

      <div className="flex justify-end -mt-2">
        <button
          type="button"
          onClick={onShowForgotPassword}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          Forgot password?
        </button>
      </div>

      {apiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Signing in...</>
        ) : 'Sign In'}
      </button>

      {/* Social Login Buttons */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
        <div className="relative flex justify-center"><span className="px-4 text-xs font-semibold text-slate-500 bg-background/50">or continue with</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-sm font-medium text-slate-300 hover:text-white"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('github')}
          className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-sm font-medium text-slate-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </button>
      </div>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{' '}
        <button type="button" onClick={onNavigateRegister} className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
          Register
        </button>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────

function RegisterForm({ onSuccess, onNavigateLogin, toast }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    const emailErr = VALIDATORS.email(form.email);
    const userErr = VALIDATORS.username(form.username);
    const passErr = VALIDATORS.password(form.password);
    if (emailErr) errs.email = emailErr;
    if (userErr) errs.username = userErr;
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      await authAPI.register(form);
      toast({ message: 'Registration successful! Check your email for the verification code.', type: 'success' });
      onSuccess('otp', form.email);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-300 ml-1 mb-1.5 block">Username</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="johndoe"
          autoComplete="username"
          className={`w-full px-5 py-4 glass-input ${errors.username ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}`}
          required
        />
        {errors.username && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.username}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-300 ml-1 mb-1.5 block">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          className={`w-full px-5 py-4 glass-input ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}`}
          required
        />
        {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
      </div>

      <PasswordInput
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Create a strong password"
        error={errors.password}
        label="Password"
        autoComplete="new-password"
      />

      {form.password && !errors.password && (
        <div className="space-y-1.5 -mt-1">
          {[
            { test: form.password.length >= 8, label: 'At least 8 characters' },
            { test: /[A-Z]/.test(form.password), label: 'One uppercase letter' },
            { test: /[a-z]/.test(form.password), label: 'One lowercase letter' },
            { test: /[0-9]/.test(form.password), label: 'One number' },
            { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(form.password), label: 'One special character' },
          ].map((req, i) => (
            <div key={i} className={`flex items-center text-xs gap-2 ${req.test ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{req.test ? '✓' : '○'}</span>
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Creating account...</>
        ) : 'Create Account'}
      </button>

      <p className="text-center text-sm text-slate-400 mt-4">
        Already have an account?{' '}
        <button type="button" onClick={onNavigateLogin} className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────

function OtpScreen({ email, onVerified, onBack, onResend, toast }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOtp({ email, otp: code });
      const { session_token, user } = response.data;
      login(session_token, user);
      onVerified();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
      // Reset OTP on error
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await authAPI.resendOtp({ email });
      toast({ message: 'A new verification code has been sent to your email.', type: 'success' });
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setCanResend(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center py-6">
      <div className="text-5xl mb-6">📧</div>
      <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
      <p className="text-slate-400 mb-8">
        Enter the 6-digit code sent to{' '}
        <span className="text-primary-400 font-semibold">{email}</span>
      </p>

      <OtpInput otp={otp} setOtp={setOtp} disabled={loading} />

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || otp.join('').length < 6}
        className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed mb-4"
      >
        {loading ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Verifying...</>
        ) : 'Verify & Continue'}
      </button>

      <div className="flex flex-col items-center gap-3">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Resend verification code
          </button>
        ) : (
          <p className="text-slate-500 text-sm">Resend code in {countdown}s</p>
        )}
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Back to form
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────

function ForgotPasswordScreen({ onBack, onShowReset, toast }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = VALIDATORS.email(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast({ message: 'If this email is registered, you will receive a password reset code.', type: 'info' });
      // After brief delay, progress to reset screen
      setTimeout(() => onShowReset(email), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-2xl font-bold text-white mb-2">Forgot password?</h2>
        <p className="text-slate-400">Enter your email and we'll send you a reset code.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-300 ml-1 mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-5 py-4 glass-input"
            required
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60"
        >
          {loading ? (
            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Sending...</>
          ) : 'Send Reset Code'}
        </button>

        {sent && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium animate-slide-up">
            ✓ Reset code sent! Redirecting...
          </div>
        )}

        <button type="button" onClick={onBack} className="w-full text-center text-slate-400 hover:text-white text-sm transition-colors mt-4">
          ← Back to sign in
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────

function ResetPasswordScreen({ email, onSuccess, onBack, toast }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('otp'); // 'otp' | 'password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authAPI.verifyForgotOtp({ email, otp: code });
      setStep('password');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const passErr = VALIDATORS.password(newPassword);
    if (passErr) {
      setError(passErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = otp.join('');
      await authAPI.resetPassword({ email, otp: code, new_password: newPassword });
      toast({ message: 'Password reset successfully! Please sign in with your new password.', type: 'success' });
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'password') {
    return (
      <div className="w-full max-w-md mx-auto py-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-white mb-2">Set new password</h2>
          <p className="text-slate-400">Choose a strong password for your account.</p>
        </div>

        <div className="space-y-5">
          <PasswordInput
            name="newPassword"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            placeholder="New password"
            label="New Password"
            autoComplete="new-password"
            error={step === 'password' && error && !error.includes('match') ? error : ''}
          />

          <PasswordInput
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
            placeholder="Confirm new password"
            label="Confirm Password"
            autoComplete="new-password"
          />

          {newPassword && (
            <div className="space-y-1.5">
              {[
                { test: newPassword.length >= 8, label: 'At least 8 characters' },
                { test: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
                { test: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
                { test: /[0-9]/.test(newPassword), label: 'One number' },
                { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword), label: 'One special character' },
              ].map((req, i) => (
                <div key={i} className={`flex items-center text-xs gap-2 ${req.test ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span>{req.test ? '✓' : '○'}</span>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          {error && error.includes('match') && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60"
          >
            {loading ? (
              <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Resetting...</>
            ) : 'Reset Password'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto text-center py-6">
      <div className="text-5xl mb-6">🔑</div>
      <h2 className="text-2xl font-bold text-white mb-2">Enter reset code</h2>
      <p className="text-slate-400 mb-8">
        Enter the code sent to{' '}
        <span className="text-primary-400 font-semibold">{email}</span>
      </p>

      <OtpInput otp={otp} setOtp={setOtp} disabled={loading} />

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up">
          {error}
        </div>
      )}

      <button
        onClick={handleVerifyOtp}
        disabled={loading || otp.join('').length < 6}
        className="w-full py-4 text-base glass-button flex items-center justify-center disabled:opacity-60 mb-4"
      >
        {loading ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Verifying...</>
        ) : 'Verify Code'}
      </button>

      <button onClick={onBack} className="text-slate-400 hover:text-white text-sm transition-colors">
        ← Back
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main AuthPage Component
// ─────────────────────────────────────────────

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [showOtp, setShowOtp] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
    setShowOtp(false);
    // Auto-show forgot password screen when visiting /forgot-password
    if (location.pathname === '/forgot-password') {
      setShowForgotPassword(true);
    } else {
      setShowForgotPassword(false);
    }
    setShowResetPassword(false);
  }, [location.pathname]);

  const showToast = ({ message, type }) => {
    setToast({ message, type });
    setToastKey((k) => k + 1);
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleOtpFlow = (email) => {
    setEmailToVerify(email);
    setShowOtp(true);
    setShowForgotPassword(false);
    setShowResetPassword(false);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setShowOtp(false);
    setShowResetPassword(false);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setShowOtp(false);
    navigate('/login');
  };

  const handleShowReset = (email) => {
    setResetEmail(email);
    setShowResetPassword(true);
    setShowForgotPassword(false);
  };

  // ── Render ──

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <Toast key={toastKey} message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow max-md:hidden" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-6xl flex flex-col lg:flex-row glass-card overflow-hidden animate-slide-up relative z-10 shadow-2xl border-white/5">

        {/* Left Panel - Branding */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative bg-gradient-to-br from-surface/80 to-background/90 border-r border-white/5">
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-neon-blue flex items-center justify-center shadow-neon">
                <span className="text-2xl">🎯</span>
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                InterviewAI
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Master Your <span className="text-primary-400">Interview</span>
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              AI-powered mock interviews to analyze your responses and help you land your dream job.
            </p>

            <div className="space-y-4">
              {[
                { icon: '🤖', text: 'Realistic AI-generated questions tailored to your role' },
                { icon: '📊', text: 'Detailed performance analytics with actionable feedback' },
                { icon: '🛡️', text: 'Secure proctoring with integrity monitoring' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="text-xl">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center my-8">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-4 text-slate-500 text-sm font-medium">Get Started</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Forms */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center bg-background/50 backdrop-blur-md">
          <div className="max-w-md w-full mx-auto">
            {/* Tab Toggle (only for login/register) */}
            {!showOtp && !showForgotPassword && !showResetPassword && (
              <div className="flex p-1 bg-surface/50 rounded-xl mb-8 border border-white/10">
                <button
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${!isRegister ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => { navigate('/login'); }}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${isRegister ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  onClick={() => { navigate('/register'); }}
                >
                  Register
                </button>
              </div>
            )}

            {/* Title */}
            {showForgotPassword && (
              <p className="text-sm text-slate-400 mb-1 text-center">Password Reset</p>
            )}
            {showResetPassword && (
              <p className="text-sm text-slate-400 mb-1 text-center">Set New Password</p>
            )}

            {/* Render the appropriate form */}
            {showOtp ? (
              <OtpScreen
                email={emailToVerify}
                onVerified={handleAuthSuccess}
                onBack={() => setShowOtp(false)}
                onResend={showToast}
                toast={showToast}
              />
            ) : showResetPassword ? (
              <ResetPasswordScreen
                email={resetEmail}
                onSuccess={() => navigate('/login')}
                onBack={handleBackToLogin}
                toast={showToast}
              />
            ) : showForgotPassword ? (
              <ForgotPasswordScreen
                onBack={handleBackToLogin}
                onShowReset={handleShowReset}
                toast={showToast}
              />
            ) : isRegister ? (
              <RegisterForm
                onSuccess={handleOtpFlow}
                onNavigateLogin={() => navigate('/login')}
                toast={showToast}
              />
            ) : (
              <SignInForm
                onSuccess={handleAuthSuccess}
                onNavigateRegister={() => navigate('/register')}
                onShowForgotPassword={handleForgotPassword}
                toast={showToast}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
