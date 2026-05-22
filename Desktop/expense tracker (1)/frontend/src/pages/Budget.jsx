import { useState, useEffect } from 'react';
import api from '../utils/api';
import { AlertCircle, CheckCircle, Target, Wallet, TrendingUp } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Budget = () => {
  const [budget, setBudget] = useState(null);
  const [limitAmount, setLimitAmount] = useState('');
  const { isDark } = useTheme();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const selectedYear = Number(selectedMonth.split('-')[0]);
  const selectedMonthNum = Number(selectedMonth.split('-')[1]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchBudget = async () => {
    try {
      const { data } = await api.get(
        `/api/budget?month=${selectedMonthNum}&year=${selectedYear}`
      );
      setBudget(data);
      if (data) setLimitAmount(data.limitAmount);
      else setLimitAmount('');
    } catch (error) {
      console.error(error);
      setBudget(null);
    }
  };

  useEffect(() => {
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budget', {
        month: selectedMonthNum,
        year: selectedYear,
        limitAmount: Number(limitAmount),
      });
      fetchBudget();
    } catch (error) {
      console.error(error);
      alert(
        `Failed to set budget limit: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const percentage = budget
    ? Math.min((budget.spentAmount / budget.limitAmount) * 100, 100)
    : 0;

  const isWarning = percentage >= 80;
  const isDanger = percentage >= 100;

  const progressColor = isDanger
    ? 'from-rose-500 to-pink-500'
    : isWarning
      ? 'from-amber-500 to-orange-500'
      : 'from-emerald-500 to-teal-500';

  const remaining = budget
    ? Math.max(0, budget.limitAmount - budget.spentAmount)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Monthly Budget</h1>
        <p className="page-subtitle">
          {monthNames[selectedMonthNum - 1]} {selectedYear} — Manage your spending limits
        </p>
      </motion.div>

      {/* Set Budget Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card relative overflow-hidden"
      >
        <div className="stat-glow" style={{ background: 'var(--gradient-primary)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--app-text)]">Set Your Budget</h2>
              <p className="text-sm text-[var(--app-text-secondary)]">
                Define a spending limit for a selected month
              </p>
            </div>
          </div>

          <form onSubmit={handleSetBudget} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                  Select Month
                </label>
                <input
                  type="month"
                  required
                  className="input-field"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">
                  Monthly Budget Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--app-muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    className="input-field !pl-8 !py-3 text-lg font-semibold"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto !py-3 px-6 shadow-lg shadow-indigo-500/20"
              >
                Set Limit
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {budget && (
        <div className="space-y-5">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[var(--color-danger-soft)]">
                  <TrendingUp size={16} className="text-[var(--color-danger)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
                  Spent
                </p>
              </div>
              <p className="text-2xl font-bold text-[var(--app-text)]">
                {formatINR(budget.spentAmount)}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[var(--color-success-soft)]">
                  <Wallet size={16} className="text-[var(--color-success)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
                  Limit
                </p>
              </div>
              <p className="text-2xl font-bold text-[var(--app-text)]">
                {formatINR(budget.limitAmount)}
              </p>
            </div>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span
                  className={`text-lg font-bold ${
                    isDanger
                      ? 'text-[var(--color-danger)]'
                      : isWarning
                        ? 'text-[var(--color-warning)]'
                        : 'text-[var(--color-success)]'
                  }`}
                >
                  {percentage.toFixed(0)}% Used
                </span>
                <p className="text-xs text-[var(--app-text-secondary)] mt-0.5">
                  of your monthly budget
                </p>
              </div>
              <span className="text-sm font-semibold text-[var(--app-text-secondary)]">
                {formatINR(remaining)} left
              </span>
            </div>

            <div className="w-full h-3 rounded-full overflow-hidden bg-[var(--app-border)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full bg-gradient-to-r ${progressColor} relative`}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-soft" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-[var(--app-muted)]">
              <span>₹0</span>
              <span>{formatINR(budget.limitAmount)}</span>
            </div>
          </motion.div>

          {/* Status Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            {isDanger && (
              <div
                className="p-5 rounded-xl border"
                style={{
                  background: 'var(--color-danger-soft)',
                  borderColor: 'var(--color-danger)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={22}
                    className="text-[var(--color-danger)] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-[var(--color-danger)]">
                      Budget Exceeded
                    </p>
                    <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                      You've exceeded your monthly budget by{' '}
                      <strong>
                        {formatINR(budget.spentAmount - budget.limitAmount)}
                      </strong>
                      . Consider adjusting your spending or increasing your limit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isWarning && !isDanger && (
              <div
                className="p-5 rounded-xl border"
                style={{
                  background: 'var(--color-warning-soft)',
                  borderColor: 'var(--color-warning)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={22}
                    className="text-[var(--color-warning)] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-[var(--color-warning)]">
                      Budget Limit Approaching
                    </p>
                    <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                      You've used <strong>{percentage.toFixed(0)}%</strong> of your monthly budget.
                      Only <strong>{formatINR(remaining)}</strong> remaining.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isWarning && !isDanger && budget.spentAmount > 0 && (
              <div
                className="p-5 rounded-xl border"
                style={{
                  background: 'var(--color-success-soft)',
                  borderColor: 'var(--color-success)',
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle
                    size={22}
                    className="text-[var(--color-success)] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-[var(--color-success)]">
                      Great! You're On Track
                    </p>
                    <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                      You have <strong>{formatINR(remaining)}</strong> left to spend this month.
                      Keep up the good habits!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Budget;