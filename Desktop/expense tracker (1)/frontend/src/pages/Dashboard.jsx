import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  Sparkles,
  Plus,
  ArrowRight,
  Coins,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

function StatCard({ label, value, hint, variant, trend, icon: Icon, delay }) {
  const variantStyles = {
    balance: { glow: 'stat-card-balance', icon: 'from-indigo-500 via-purple-500 to-indigo-600' },
    income: { glow: 'stat-card-income', icon: 'from-emerald-500 to-teal-600' },
    expense: { glow: 'stat-card-expense', icon: 'from-rose-500 to-pink-600' },
    savings: { glow: 'stat-card-savings', icon: 'from-amber-500 to-orange-600' },
  };

  const s = variantStyles[variant] || variantStyles.balance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay || 0, ease: [0.22, 1, 0.36, 1] }}
      className="stat-card group"
    >
      <div className="stat-glow" />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl md:text-[1.75rem] font-bold text-[var(--app-text)] mt-2 tracking-tight leading-none">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 bg-gradient-to-br ${s.icon} shadow-lg shadow-indigo-500/15 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}>
          <Icon size={18} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-4 relative z-10">
        {trend === 'up' && <ArrowUpRight size={14} className="text-[var(--color-success)]" />}
        {trend === 'down' && <ArrowDownRight size={14} className="text-[var(--color-danger)]" />}
        <p className="text-xs text-[var(--app-text-secondary)] font-medium">{hint}</p>
      </div>
    </motion.div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[260px] flex flex-col items-center justify-center text-[var(--app-muted)] text-sm gap-3">
      <div className="p-3 rounded-xl bg-[var(--app-accent-soft)]">
        <Wallet size={24} className="text-[var(--app-accent)]" />
      </div>
      <p>{message}</p>
      <Link to="/transactions" className="btn-primary text-xs !py-2">
        <Plus size={14} /> Add your first transaction
      </Link>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="text-xs font-semibold text-[var(--app-muted)] mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--app-text-secondary)]">{p.name}:</span>
            <span className="font-semibold text-[var(--app-text)]">{formatINR(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.fill || payload[0].color }} />
          <span className="text-[var(--app-text-secondary)]">{payload[0].name}:</span>
          <span className="font-semibold text-[var(--app-text)]">{formatINR(payload[0].value)}</span>
        </div>
      </div>
    );
  }
  return null;
}

const Dashboard = () => {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartGrid = isDark ? '#1e293b' : '#e8edf4';
  const chartText = isDark ? '#64748b' : '#94a3b8';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/api/transactions');
        setTransactions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTx = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [transactions, currentMonth, currentYear]
  );

  const totalIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0';

  const monthlyChartData = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) {
        map[key] = {
          label: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
          income: 0,
          expense: 0,
          sort: d.getFullYear() * 12 + d.getMonth(),
        };
      }
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expense += t.amount;
    });
    return Object.values(map)
      .sort((a, b) => a.sort - b.sort)
      .slice(-6)
      .map(({ label, income, expense }) => ({ name: label, income, expense }));
  }, [transactions]);

  // Monthly net balance for area chart
  const monthlyNetData = useMemo(() => {
    let running = 0;
    return monthlyChartData.map((m) => {
      running += m.income - m.expense;
      return { name: m.name, net: running };
    });
  }, [monthlyChartData]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category || 'Other', value: curr.amount });
      return acc;
    }, []);
    return grouped.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const downloadCSV = async () => {
    try {
      const response = await api.get('/api/transactions/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 space-y-5">
            <div className="h-[380px] skeleton" />
            <div className="h-[380px] skeleton" />
          </div>
          <div className="xl:col-span-5">
            <div className="h-[380px] skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center gap-3 flex-wrap"
      >
        <Link to="/transactions" className="btn-primary text-sm shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> Add Transaction
        </Link>
        <button onClick={downloadCSV} className="btn-secondary text-sm">
          <Download size={16} /> Export CSV
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Current Balance"
          value={formatINR(balance)}
          hint={`${savingsRate}% saved this month`}
          variant="balance"
          trend={balance >= 0 ? 'up' : 'down'}
          icon={Wallet}
          delay={0}
        />
        <StatCard
          label="Monthly Income"
          value={formatINR(totalIncome)}
          hint="This month"
          variant="income"
          trend="up"
          icon={TrendingUp}
          delay={0.08}
        />
        <StatCard
          label="Monthly Expenses"
          value={formatINR(totalExpense)}
          hint="This month"
          variant="expense"
          trend="down"
          icon={TrendingDown}
          delay={0.14}
        />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          hint="Of monthly income"
          variant="savings"
          icon={PiggyBank}
          delay={0.2}
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left column */}
        <div className="xl:col-span-7 space-y-5">
          {/* Net Worth Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/15">
                  <Coins size={16} className="text-white" />
                </div>
                <h2 className="section-title">Net Worth Trend</h2>
              </div>
            </div>
            {monthlyNetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyNetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--app-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
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
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="net"
                    name="Net Balance"
                    stroke="var(--app-accent)"
                    strokeWidth={2.5}
                    fill="url(#netGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--app-accent)', stroke: 'var(--app-card)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No data for net worth yet" />
            )}
          </motion.div>

          {/* Monthly Overview Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/15">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <h2 className="section-title">Income vs Expenses</h2>
              </div>
            </div>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData} barGap={8} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
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
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="var(--app-accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No data for monthly chart yet" />
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-5 space-y-5">
          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/15">
                <PiggyBank size={16} className="text-white" />
              </div>
              <h2 className="section-title">Spending by Category</h2>
            </div>
            {categoryData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 mt-2">
                  {categoryData.map((cat, i) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-[var(--app-accent-light)] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-[var(--app-text-secondary)] truncate text-xs font-medium">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-[var(--app-text)] text-xs">{formatINR(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart message="No expense categories yet" />
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/15">
                  <Sparkles size={16} className="text-white" />
                </div>
                <h2 className="section-title">Recent Activity</h2>
              </div>
            </div>

            <div className="space-y-1">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t, i) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl row-hover cursor-default"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 text-white shadow-md"
                      style={{
                        background: t.type === 'income'
                          ? 'var(--gradient-success)'
                          : 'var(--gradient-danger)'
                      }}
                    >
                      {getInitials(t.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--app-text)] truncate leading-tight">
                        {t.title}
                      </p>
                      <p className="text-xs text-[var(--app-text-secondary)] mt-0.5">
                        {new Date(t.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {t.category ? ` · ${t.category}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          t.type === 'income'
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatINR(t.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state py-8">
                  <div className="empty-state-icon">
                    <Wallet size={40} />
                  </div>
                  <p className="text-sm">No transactions yet.</p>
                </div>
              )}
            </div>

            {recentTransactions.length > 0 && (
              <Link
                to="/transactions"
                className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--app-border)] text-sm font-semibold text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors group"
              >
                View all transactions
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
