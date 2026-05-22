import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const popularSubscriptions = [
  'Netflix',
  'Spotify',
  'Amazon Prime',
  'Disney+ Hotstar',
  'YouTube Premium',
  'ChatGPT Plus',
  'Apple Music',
  'Gym Membership',
  'Internet/WiFi',
  'Mobile Recharge',
  'Adobe Creative Cloud',
  'Canva Pro',
  'Microsoft 365',
  'Google One',
  'Zomato Gold',
  'Swiggy One',
  'Jio Fiber',
  'PlayStation Plus',
  'Xbox Game Pass',
  'Hostinger',
];

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    nextBillingDate: '',
    category: 'Entertainment',
  });

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/api/subscriptions');
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/subscriptions', {
        ...formData,
        amount: Number(formData.amount),
      });

      setShowModal(false);
      setFormData({
        name: '',
        amount: '',
        frequency: 'monthly',
        nextBillingDate: '',
        category: 'Entertainment',
      });

      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      alert('Failed to add subscription');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subscription?')) return;

    try {
      await api.delete(`/api/subscriptions/${id}`);
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      alert('Failed to delete subscription');
    }
  };

  const totalMonthlyCost = subscriptions.reduce((acc, sub) => {
    const amount = Number(sub.amount) || 0;

    if (sub.frequency === 'monthly') return acc + amount;
    if (sub.frequency === 'weekly') return acc + amount * 4;
    if (sub.frequency === 'yearly') return acc + amount / 12;

    return acc;
  }, 0);

  const getFrequencyColor = (freq) => {
    const colors = {
      weekly: {
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
      },
      monthly: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/20',
        text: 'text-indigo-700 dark:text-indigo-300',
      },
      yearly: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
      },
    };
    return colors[freq] || colors.monthly;
  };

  const getFrequencyIcon = (freq) => {
    const icons = {
      weekly: '📅',
      monthly: '🔄',
      yearly: '📆',
    };
    return icons[freq] || '🔄';
  };

  const getDaysUntilBilling = (date) => {
    const billing = new Date(date);
    if (isNaN(billing.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    billing.setHours(0, 0, 0, 0);

    return Math.ceil(
      (billing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">Track and manage recurring bills</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} /> Add Subscription
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-1 card"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
              <CreditCard size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
                Monthly Commitment
              </p>
              <p className="text-2xl font-bold text-[var(--app-text)] mt-1">
                {formatINR(totalMonthlyCost)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-[var(--app-text-secondary)] p-2.5 rounded-lg bg-[var(--app-accent-light)]">
              <div className="p-1.5 rounded-lg bg-[var(--app-accent-soft)]">
                <Sparkles size={14} className="text-[var(--app-accent)]" />
              </div>
              <span className="font-medium">
                {subscriptions.length} active subscription
                {subscriptions.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-[var(--app-text-secondary)] p-2.5 rounded-lg bg-[var(--color-warning-soft)]">
              <div className="p-1.5 rounded-lg bg-[var(--color-warning-soft)]">
                <AlertCircle size={14} className="text-[var(--color-warning)]" />
              </div>
              <span className="font-medium">
                {
                  subscriptions.filter((s) => {
                    const days = getDaysUntilBilling(s.nextBillingDate);
                    return days !== null && days >= 0 && days <= 7;
                  }).length
                }{' '}
                due within 7 days
              </span>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 skeleton" />
              ))}
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {subscriptions.map((sub, idx) => {
                  const daysUntil = getDaysUntilBilling(sub.nextBillingDate);
                  const freqColor = getFrequencyColor(sub.frequency);

                  return (
                    <motion.div
                      key={sub._id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      className="card group relative overflow-hidden"
                    >
                      <div
                        className="stat-glow"
                        style={{ background: 'var(--gradient-primary)' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-md">
                              {getFrequencyIcon(sub.frequency)}
                            </div>
                            <div>
                              <h3 className="font-bold text-[var(--app-text)]">
                                {sub.name}
                              </h3>
                              <span
                                className={`badge text-[10px] mt-1 ${freqColor.bg} ${freqColor.text}`}
                              >
                                {sub.frequency}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(sub._id)}
                            className="btn-icon !p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--app-text-secondary)]">
                              <Calendar size={12} />
                              Next:{' '}
                              {new Date(sub.nextBillingDate).toLocaleDateString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </div>

                            <div
                              className={`flex items-center gap-1.5 text-xs font-medium ${
                                daysUntil === null
                                  ? 'text-[var(--app-text-secondary)]'
                                  : daysUntil < 0
                                  ? 'text-[var(--color-danger)]'
                                  : daysUntil <= 3
                                  ? 'text-[var(--color-warning)]'
                                  : 'text-[var(--app-text-secondary)]'
                              }`}
                            >
                              <Clock size={12} />
                              {daysUntil === null
                                ? 'Invalid date'
                                : daysUntil < 0
                                ? 'Expired'
                                : daysUntil === 0
                                ? 'Due today'
                                : `${daysUntil} days left`}
                            </div>
                          </div>

                          <p className="text-xl font-bold text-[var(--app-text)]">
                            {formatINR(Number(sub.amount) || 0)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="empty-state h-full border border-dashed border-[var(--app-border)] rounded-2xl min-h-[240px]">
              <Clock size={40} className="opacity-40" />
              <p className="text-sm mt-2">No subscriptions tracked yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary mt-4 !py-2 !px-4 text-sm shadow-lg shadow-indigo-500/20"
              >
                <Plus size={14} /> Add your first subscription
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md rounded-2xl border border-[var(--app-border)] p-6"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: 'var(--shadow-glass)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--app-text)]">
                  Track New Subscription
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-icon hover:bg-[var(--app-accent-soft)]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                    Company/Service
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Netflix, Gym"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />

                  <div className="flex flex-wrap gap-2 mt-3">
                    {popularSubscriptions.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setFormData({ ...formData, name: item })}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      required
                      className="input-field"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                      Billing Cycle
                    </label>
                    <select
                      className="input-field"
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value })
                      }
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                    Next Billing Date
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.nextBillingDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextBillingDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary shadow-lg shadow-indigo-500/20"
                  >
                    Start Tracking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscriptions;