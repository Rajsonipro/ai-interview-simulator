import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: payload[0].payload.fill || payload[0].color,
            }}
          />
          <span className="text-[var(--app-text-secondary)]">
            {payload[0].name}:
          </span>
          <span className="font-semibold text-[var(--app-text)]">
            {formatINR(payload[0].value)}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

const normalizeCategory = (value = 'Other') =>
  String(value).trim().toLowerCase();

const formatCategory = (value = 'Other') => {
  const cleaned = normalizeCategory(value);
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const parseAmount = (value) => {
  const amount = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const Analytics = () => {
  const { isDark } = useTheme();

  const [transactions, setTransactions] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);

  const chartGrid = isDark ? '#1e293b' : '#e8edf4';
  const chartText = isDark ? '#64748b' : '#94a3b8';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/api/transactions');
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Transaction fetch error:', error);
        setTransactions([]);
      }
    };

    const fetchForecast = async () => {
      try {
        setForecastLoading(true);
        const { data } = await api.get('/api/analytics/forecast');

        setForecast({
          hasSpending: Boolean(data?.hasSpending),
          forecastedTotal:
            data?.forecastedTotal === null ||
            data?.forecastedTotal === undefined ||
            data?.forecastedTotal === ''
              ? null
              : Number(data.forecastedTotal),
          status: data?.status || 'On Track',
          totalSpentSoFar:
            data?.totalSpentSoFar === null ||
            data?.totalSpentSoFar === undefined ||
            data?.totalSpentSoFar === ''
              ? 0
              : Number(data.totalSpentSoFar),
          averageDailySpend:
            data?.averageDailySpend === null ||
            data?.averageDailySpend === undefined ||
            data?.averageDailySpend === ''
              ? 0
              : Number(data.averageDailySpend),
          budgetLimit:
            data?.budgetLimit === null ||
            data?.budgetLimit === undefined ||
            data?.budgetLimit === ''
              ? null
              : Number(data.budgetLimit),
        });
      } catch (err) {
        console.error('Forecast fetch error:', err);
        setForecast({
          hasSpending: false,
          forecastedTotal: null,
          status: 'On Track',
          totalSpentSoFar: 0,
          averageDailySpend: 0,
          budgetLimit: null,
        });
      } finally {
        setForecastLoading(false);
      }
    };

    fetchTransactions();
    fetchForecast();
  }, []);

  const expenses = Array.isArray(transactions)
    ? transactions.filter(
        (t) =>
          String(t.type || t.transactionType || '').toLowerCase() === 'expense'
      )
    : [];

  const categoryData = expenses.reduce((acc, curr) => {
    const category = formatCategory(curr.category || 'Other');
    const amount = parseAmount(curr.amount);

    const existing = acc.find((item) => item.name === category);

    if (existing) {
      existing.value += amount;
    } else {
      acc.push({
        name: category,
        value: amount,
      });
    }

    return acc;
  }, []);

  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  const monthlyExpenseData = (() => {
    const map = {};
    const MONTHS = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    expenses.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      if (Number.isNaN(d.getTime())) return;

      const key = `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
      if (!map[key]) map[key] = 0;
      map[key] += parseAmount(t.amount);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  })();

  const showForecastValue =
    forecast &&
    forecast.hasSpending &&
    forecast.forecastedTotal !== null &&
    Number.isFinite(Number(forecast.forecastedTotal));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Spending patterns and AI-powered forecasts</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-[var(--app-text)] mt-1">
                {formatINR(totalExpenses)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--app-text-secondary)]">
            <span className="status-dot" />
            {expenses.length} transactions recorded
          </div>
        </motion.div>

        <div>
          {forecastLoading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="card relative overflow-hidden"
            >
              <div className="animate-pulse">
                <div className="h-20 bg-[var(--app-accent-soft)] rounded-xl" />
                <div className="mt-4 h-4 w-2/3 bg-[var(--app-accent-soft)] rounded" />
                <div className="mt-2 h-4 w-1/2 bg-[var(--app-accent-soft)] rounded" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="card relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 opacity-[0.04]">
                <Sparkles size={120} />
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div
                  className="p-3 rounded-xl shadow-lg shadow-purple-500/20"
                  style={{
                    background:
                      forecast?.status === 'Over Budget Projected'
                        ? 'linear-gradient(135deg, var(--color-danger) 0%, #ef4444 100%)'
                        : 'linear-gradient(135deg, var(--color-success) 0%, #10b981 100%)',
                  }}
                >
                  <Sparkles size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
                    AI Spending Forecast
                  </p>

                  {showForecastValue ? (
                    <p className="text-2xl font-bold text-[var(--app-text)] mt-1">
                      {formatINR(Number(forecast.forecastedTotal))}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-[var(--app-text)] mt-1">
                      No spending data available
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {forecast?.hasSpending ? (
                      <>
                        {forecast.status === 'Over Budget Projected' ? (
                          <span
                            className="badge text-[10px]"
                            style={{
                              background: 'var(--color-danger-soft)',
                              color: 'var(--color-danger)',
                            }}
                          >
                            <AlertTriangle size={10} /> Over Budget Warning
                          </span>
                        ) : (
                          <span
                            className="badge text-[10px]"
                            style={{
                              background: 'var(--color-success-soft)',
                              color: 'var(--color-success)',
                            }}
                          >
                            Safe spending
                          </span>
                        )}
                        <span className="text-xs text-[var(--app-text-secondary)]">
                          End of month projection
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--app-text-secondary)]">
                        No spending data available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-1 card"
        >
          <h2 className="section-title mb-5">Category Breakdown</h2>
          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {categoryData
              .sort((a, b) => b.value - a.value)
              .map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl row-hover"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium text-sm text-[var(--app-text)] truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm text-[var(--app-text)]">
                      {formatINR(cat.value)}
                    </span>
                    <span className="text-xs text-[var(--app-muted)] font-medium">
                      ({totalExpenses ? ((cat.value / totalExpenses) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 card"
        >
          <h2 className="section-title mb-5">Expense Distribution</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={140}
                  innerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-[420px]">
              <Wallet size={48} />
              <p className="text-sm">No expense data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {monthlyExpenseData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/15">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h2 className="section-title">Monthly Expense Trend</h2>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyExpenseData} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={chartGrid}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: chartText, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: chartText, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => formatINR(value)}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid var(--app-border)',
                  background: 'var(--app-card)',
                  color: 'var(--app-text)',
                  boxShadow: 'var(--shadow-elevated)',
                }}
              />
              <Bar
                dataKey="value"
                name="Expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {expenses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-state border border-dashed border-[var(--app-border)] rounded-2xl py-12"
        >
          <p className="text-sm">
            No expenses recorded yet. Start tracking to see analytics!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;