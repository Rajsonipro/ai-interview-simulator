import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Download, Trash2, Sparkles, Filter, Search, X, FileText, FileSpreadsheet } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import ReceiptScanner from '../components/ReceiptScanner';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '', amount: '', type: 'expense', category: '', date: '', note: ''
  });

  const [typeFilter, setTypeFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('newest');

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get(`/api/transactions?type=${typeFilter}&sort=${sortFilter}`);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, sortFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/transactions', formData);
      setShowModal(false);
      setFormData({ title: '', amount: '', type: 'expense', category: '', date: '', note: '' });
      fetchTransactions();
    } catch (error) {
      alert(`Failed to create transaction: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await api.delete(`/api/transactions/${id}`);
      fetchTransactions();
    }
  };

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
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV');
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await api.get('/api/transactions/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF');
    }
  };

  // Filter by search
  const filteredTransactions = transactions.filter(t =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-6">
      {!user && (
        <div className="p-4 rounded-xl border border-[var(--color-warning-soft)]"
          style={{ background: 'var(--color-warning-soft)' }}
        >
          <p className="font-medium text-sm text-[var(--color-warning)]">
            Please log in to manage your transactions.
          </p>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Manage your financial activity</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScanner(true)}
              className="btn-primary shadow-lg shadow-indigo-500/20"
              aria-label="Open AI Scanner"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">AI Scan</span>
            </button>
            <button onClick={() => setShowModal(true)} className="btn-secondary">
              <Plus size={16} />
              <span className="hidden sm:inline">Add Manual</span>
            </button>
          </div>
        )}
      </motion.div>

      <ReceiptScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onTransactionAdded={fetchTransactions}
      />

      {/* Summary */}
      {!loading && transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="p-3.5 rounded-xl bg-[var(--color-success-soft)] border border-[var(--color-success)]/20">
            <p className="text-xs font-semibold text-[var(--color-success)] uppercase tracking-wider">Income</p>
            <p className="text-lg font-bold text-[var(--color-success)] mt-1">{formatINR(totalIncome)}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20">
            <p className="text-xs font-semibold text-[var(--color-danger)] uppercase tracking-wider">Expenses</p>
            <p className="text-lg font-bold text-[var(--color-danger)] mt-1">{formatINR(totalExpense)}</p>
          </div>
        </motion.div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field !pl-10 !pr-8 !py-2.5 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              onChange={e => setTypeFilter(e.target.value)}
              className="input-field !py-2.5 text-sm appearance-none pr-8"
              value={typeFilter}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <select
              onChange={e => setSortFilter(e.target.value)}
              className="input-field !py-2.5 text-sm appearance-none pr-8"
              value={sortFilter}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            onClick={downloadCSV}
            className="btn-icon !p-2 border border-[var(--app-border)] rounded-lg hover:bg-[var(--color-success-soft)] hover:text-[var(--color-success)] hover:border-[var(--color-success)]/30 transition-all"
            title="Export CSV"
          >
            <FileSpreadsheet size={16} />
          </button>
          <button
            onClick={downloadPDF}
            className="btn-icon !p-2 border border-[var(--app-border)] rounded-lg hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/30 transition-all"
            title="Export PDF"
          >
            <FileText size={16} />
          </button>
        </div>
      </div>

      {/* Transactions Table/Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card !p-0 overflow-hidden"
      >
        {/* Table for large screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-border)] bg-[var(--app-accent-light)]">
                <th className="table-header">Date</th>
                <th className="table-header">Description</th>
                <th className="table-header">Category</th>
                <th className="table-header">Amount</th>
                <th className="table-header w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredTransactions.map((t, i) => (
                <motion.tr
                  key={t._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--app-border-light)] row-hover"
                >
                  <td className="table-cell text-[var(--app-text-secondary)] text-xs font-medium">
                    {new Date(t.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="table-cell">
                    <span className="font-semibold text-[var(--app-text)]">{t.title}</span>
                    {t.note && <p className="text-xs text-[var(--app-text-secondary)] mt-0.5">{t.note}</p>}
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-neutral text-[10px]">{t.category}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`font-bold ${t.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="btn-icon !p-1.5 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card list for small screens */}
        <div className="lg:hidden space-y-1 p-3">
          {!loading && filteredTransactions.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-xl bg-[var(--app-accent-light)] flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[var(--app-text)] truncate text-sm">{t.title}</h4>
                  <span className="badge badge-neutral text-[10px]">{t.category}</span>
                </div>
                <p className="text-xs text-[var(--app-text-secondary)] mt-0.5">
                  {new Date(t.date).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-bold text-sm ${t.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                </span>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="btn-icon !p-1.5 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <Search size={48} />
            </div>
            <p className="text-sm">No transactions found</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 !py-2 !px-4 text-sm"
            >
              <Plus size={14} /> Add your first transaction
            </button>
          </div>
        )}

        {loading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 skeleton" />
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showModal && user && (
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
                <h2 className="text-xl font-bold text-[var(--app-text)]">Add Transaction</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-icon hover:bg-[var(--app-accent-soft)]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Groceries, Salary"
                    required
                    className="input-field"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    required
                    className="input-field"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Type</label>
                    <select
                      className="input-field"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g., Food"
                      required
                      className="input-field"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1.5">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add a note..."
                    className="input-field"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
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
                  <button type="submit" className="flex-1 btn-primary shadow-lg shadow-indigo-500/20">
                    Save Transaction
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

export default Transactions;
