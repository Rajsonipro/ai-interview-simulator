import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, Check, X, Sparkles, Scan } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ReceiptScanner = ({ isOpen, onClose, onTransactionAdded }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setLoading(true);
    setScannedData(null);

    try {
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      base64Reader.onloadend = async () => {
        try {
          const base64Data = base64Reader.result;
          const { data } = await api.post('/api/scan', { imageBase64: base64Data });
          setScannedData(data);
        } catch (err) {
          console.error('Scan Error:', err);
          alert(err.response?.data?.message || 'Failed to scan receipt. Please try again.');
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      console.error('FileReader Error:', err);
      alert('Failed to read file');
      setLoading(false);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = { target: { files: [file] } };
      handleFileChange(dt);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.post('/api/transactions', {
        ...scannedData,
        type: 'expense'
      });
      onTransactionAdded();
      onClose();
      setPreview(null);
      setScannedData(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setScannedData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--app-border)] shadow-[var(--shadow-glass)]"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">AI Receipt Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-lg transition text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload area */}
          {!preview && !scannedData && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              className={`relative rounded-2xl p-10 text-center cursor-pointer transition-all group overflow-hidden ${
                dragOver
                  ? 'border-2 border-[var(--app-accent)] bg-[var(--app-accent-soft)]'
                  : 'border-2 border-dashed border-[var(--app-border)] hover:border-[var(--app-accent)] bg-[var(--app-accent-light)]'
              }`}
            >
              {/* Scan line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--app-accent)] to-transparent opacity-30 animate-scan-line" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110 group-hover:-translate-y-1 shadow-lg shadow-indigo-500/20"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Upload size={24} className="text-white" />
                </div>
                <p className="font-semibold text-[var(--app-text)] mb-1.5">
                  {dragOver ? 'Drop your receipt here' : 'Drop or click to upload'}
                </p>
                <p className="text-sm text-[var(--app-text-secondary)]">
                  Supports JPEG, PNG — AI will extract merchant, date & amount
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </motion.div>
          )}

          {/* Preview */}
          {preview && (
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[var(--app-card)] border border-[var(--app-border)] shadow-inner">
              <img src={preview} alt="Receipt" className="w-full h-full object-contain" />

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                >
                  {/* Scanning animation */}
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-[var(--app-border)] flex items-center justify-center">
                      <Scan size={28} className="text-white animate-pulse-soft" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin-slow" />
                  </div>
                  <p className="font-semibold text-white text-lg">Scanning receipt...</p>
                  <p className="text-sm text-white/60 mt-1">This may take a few seconds</p>
                </div>
              )}
            </div>
          )}

          {/* Scanned data results */}
          <AnimatePresence>
            {scannedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Success check */}
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
                  <div className="p-1 rounded-full bg-[var(--color-success-soft)]">
                    <Check size={14} />
                  </div>
                  Receipt scanned successfully
                </div>

                {/* Data grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Merchant', value: scannedData.title },
                    { label: 'Amount', value: `₹${scannedData.amount}` },
                    { label: 'Category', value: scannedData.category },
                    { label: 'Date', value: scannedData.date },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-accent-light)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                        {item.label}
                      </p>
                      <p className="font-bold text-[var(--app-text)] capitalize">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-[var(--app-text-secondary)] border border-[var(--app-border)] bg-[var(--app-card)] hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] transition-all"
                  >
                    Rescan
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 shadow-md"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {loading ? 'Saving...' : 'Save Transaction'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReceiptScanner;
