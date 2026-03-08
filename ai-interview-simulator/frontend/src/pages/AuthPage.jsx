import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [emailToVerify, setEmailToVerify] = useState('');
  
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Handle Social Login Message
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:8000" && event.origin !== "http://127.0.0.1:8000") return;
      if (event.data.token && event.data.user) {
        login(event.data.token, event.data.user);
        navigate('/dashboard');
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [login, navigate]);

  const handleSocialLogin = (provider) => {
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    const url = `http://localhost:8000/api/auth/oauth/${provider}`;
    window.open(url, "Social Login", `width=${width},height=${height},top=${top},left=${left}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login({ email: form.email, password: form.password });
        login(response.data.access_token, response.data.user);
        navigate('/dashboard');
      } else {
        await authAPI.register(form);
        setEmailToVerify(form.email);
        setShowOtp(true);
      }
    } catch (err) {
      console.error(err);
      const apiError = err.response?.data?.detail;
      if (apiError === 'Email not verified. Please verify your account.') {
          setEmailToVerify(form.email);
          setShowOtp(true);
      } else {
        setError(apiError || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.verifyOtp({ 
        email: emailToVerify, 
        otp: otp.join('') 
      });
      login(response.data.access_token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (showOtp) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-10 animate-slide-up text-center">
            <div className="text-4xl mb-6">📧</div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
            <p className="text-slate-400 mb-8">Enter the 6-digit code sent to <br/><span className="text-primary-400 font-semibold">{emailToVerify}</span></p>
            
            <div className="flex justify-between gap-2 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                  value={data}
                  onChange={e => handleOtpChange(e.target, index)}
                  onFocus={e => e.target.select()}
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

            <button 
              className="w-full glass-button py-4 mb-4" 
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button className="text-slate-400 text-sm hover:text-white transition-colors" onClick={() => setShowOtp(false)}>
                ← Back to Login
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow max-md:hidden" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row glass-card overflow-hidden animate-slide-up relative z-10 shadow-2xl border-white/5">
        
        {/* Left Box */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center relative bg-gradient-to-br from-surface/80 to-background/90 border-r border-white/5">
          <div className="relative z-10 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Master Your <span className="text-primary-400">Interview</span></h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">AI-powered mock interviews to analyze your response and help you land your dream job.</p>
            
            {/* Social Logins */}
            <div className="space-y-4">
               <button onClick={() => handleSocialLogin('google')} className="w-full py-4 px-6 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3"/>
                  Continue with Google
               </button>
               <button onClick={() => handleSocialLogin('github')} className="w-full py-4 px-6 bg-[#24292e] text-white font-semibold rounded-xl flex items-center justify-center hover:bg-[#1b1f23] transition-all shadow-sm">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.008.069-.008 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                  Continue with GitHub
               </button>
               <button onClick={() => handleSocialLogin('facebook')} className="w-full py-4 px-6 bg-[#1877f2] text-white font-semibold rounded-xl flex items-center justify-center hover:bg-[#166fe5] transition-all shadow-sm">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Continue with Facebook
               </button>
            </div>

            <div className="flex items-center my-8">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-4 text-slate-500 text-sm font-medium">OR</span>
                <div className="flex-1 border-t border-white/10"></div>
            </div>
          </div>
        </div>

        {/* Right Box - Auth Form */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center bg-background/50 backdrop-blur-md">
          <div className="max-w-md w-full mx-auto">
            
            <div className="flex p-1 bg-surface/50 rounded-xl mb-10 border border-white/10">
              <button
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-primary-600 text-white' : 'text-slate-400'}`}
                onClick={() => { navigate('/login'); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-primary-600 text-white' : 'text-slate-400'}`}
                onClick={() => { navigate('/register'); setError(''); }}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-slide-up">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
                  <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" className="w-full px-5 py-4 glass-input mt-1" required minLength={3} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" className="w-full px-5 py-4 glass-input mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full px-5 py-4 glass-input mt-1" required minLength={6} />
              </div>

              <button type="submit" className="w-full py-4 mt-6 text-lg glass-button flex justify-center items-center" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
