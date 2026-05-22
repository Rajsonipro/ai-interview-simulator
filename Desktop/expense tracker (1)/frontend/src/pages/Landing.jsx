import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, Shield, Zap, ArrowRight, CheckCircle, Sparkles, BarChart3, CreditCard, Scan, Smartphone } from 'lucide-react';

const Landing = () => {
  const features = [
    { icon: CreditCard, title: 'Track Transactions', desc: 'Log income and expenses with AI-powered categorization and smart insights' },
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Beautiful charts and visualizations that reveal your spending patterns' },
    { icon: Shield, title: 'Budget Control', desc: 'Set limits, monitor spending, and get alerts before you overspend' },
    { icon: Scan, title: 'AI Receipt Scanning', desc: 'Upload a receipt and let AI extract all the data for you instantly' },
  ];

  const perks = [
    'Intuitive interface designed for everyone',
    'Real-time expense tracking and analytics',
    'Beautiful charts and visualizations',
    'Export your data anytime in CSV or PDF',
    'AI-powered receipt scanning',
    'Your data is always secure and private',
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--app-bg)]">
      {/* Header */}
      <header
        className="px-6 md:px-8 py-5 w-full border-b border-[var(--app-border)] sticky top-0 z-50"
        style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <TrendingUp size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--app-text)]">SpendWise</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm font-medium">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary shadow-lg shadow-indigo-500/25">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-6 py-20 md:py-32 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
              style={{ background: 'var(--gradient-primary)' }}
            />
            <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.04]"
              style={{ background: 'var(--gradient-primary)' }}
            />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
              style={{ background: 'var(--gradient-purple)' }}
            />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--app-border)] text-sm font-medium shadow-sm"
                style={{ background: 'var(--app-accent-light)', color: 'var(--app-accent)' }}
              >
                <Sparkles size={14} />
                AI-Powered Finance Tracking
              </motion.div>

              <h2 className="text-5xl md:text-7xl font-extrabold text-[var(--app-text)] tracking-tight leading-[1.05]">
                Take Control of Your{' '}
                <span className="gradient-text">Finances</span>
              </h2>

              <p className="text-lg md:text-xl text-[var(--app-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                SpendWise is a premium AI-powered expense tracker that helps you understand your spending habits,
                set budgets, and achieve your financial goals with confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link to="/register" className="btn-primary !px-8 !py-4 text-base shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all">
                Start Free Now <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary !px-8 !py-4 text-base">
                Sign In
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 pt-12 border-t border-[var(--app-border)] max-w-lg mx-auto"
            >
              <div>
                <p className="text-3xl font-bold text-[var(--app-text)]">100%</p>
                <p className="text-sm text-[var(--app-text-secondary)] font-medium">Free & Secure</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--app-text)]">Real-time</p>
                <p className="text-sm text-[var(--app-text-secondary)] font-medium">Analytics</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[var(--app-text)]">Instant</p>
                <p className="text-sm text-[var(--app-text-secondary)] font-medium">Setup</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="px-6 md:px-8 py-20 border-t border-[var(--app-border)]"
          style={{ background: 'var(--app-card)' }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeInUp} className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-[var(--app-text)] mb-4 tracking-tight">
                Powerful Features
              </h3>
              <p className="text-[var(--app-text-secondary)] max-w-xl mx-auto text-lg">
                Everything you need to manage your finances in one beautiful dashboard
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="card hover:translate-y-[-4px] transition-all duration-300 group"
                  >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 w-fit shadow-lg shadow-indigo-500/20 mb-5 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                      <Icon size={22} className="text-white" />
                    </div>
                    <h4 className="font-bold text-[var(--app-text)] mb-2 text-lg">{feature.title}</h4>
                    <p className="text-sm text-[var(--app-text-secondary)] leading-relaxed">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-6 md:px-8 py-20 max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-[var(--app-text)] mb-4 tracking-tight">
              Why Choose SpendWise?
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3">
            {perks.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-[var(--app-accent-light)] border border-[var(--app-border)]"
              >
                <div className="p-1 rounded-full bg-[var(--color-success-soft)]">
                  <CheckCircle size={16} className="text-[var(--color-success)]" />
                </div>
                <span className="text-[var(--app-text)] font-medium text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="px-6 md:px-8 py-24 relative overflow-hidden"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <div className="absolute inset-0 opacity-[0.05]">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-white" />
            <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-white" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div {...fadeInUp}>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Ready to take control?
              </h3>
              <p className="text-white/70 mb-8 max-w-lg mx-auto text-lg">
                Join thousands of users who are already managing their finances smarter.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-2xl hover:shadow-black/10 transition-all hover:-translate-y-0.5 shadow-lg"
              >
                Create Account Free <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-8 py-8 border-t border-[var(--app-border)] text-center">
        <p className="text-sm text-[var(--app-text-secondary)]">© 2024 SpendWise. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
