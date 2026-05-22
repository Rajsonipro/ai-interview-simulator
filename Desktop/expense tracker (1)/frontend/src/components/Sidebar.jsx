import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  CreditCard,
  LogOut,
  TrendingUp,
  X,
  ChevronLeft,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Budget', path: '/budget', icon: Wallet },
  { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
];

const sidebarVariants = {
  open: { width: 264, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  collapsed: { width: 76, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const mobileOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const mobileSidebarVariants = {
  hidden: { x: '-100%', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  visible: { x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function Logo({ collapsed }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
        <TrendingUp size={20} className="text-white" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <h2 className="text-base font-bold text-[var(--sidebar-active)] tracking-tight">SpendWise</h2>
          <p className="text-[10px] font-medium text-[var(--sidebar-text)] tracking-wide">Premium Finance</p>
        </motion.div>
      )}
    </div>
  );
}

function NavLinks({ pathname, collapsed, onNavigate }) {
  return (
    <nav className="flex-1 mt-5 px-2.5 space-y-0.5">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.path;
        return (
          <Link
            key={link.name}
            to={link.path}
            onClick={onNavigate}
            title={collapsed ? link.name : undefined}
            className={`nav-link ${isActive ? 'nav-link-active' : ''} ${collapsed ? 'justify-center px-0 py-3' : ''}`}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {isActive && (
                <motion.div
                  layoutId="nav-pulse"
                  className="absolute -inset-1 rounded-lg bg-[var(--app-accent)] opacity-20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {link.name}
              </motion.span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter({ user, logout, initials, collapsed }) {
  return (
    <div className="p-3 mt-auto border-t border-[var(--sidebar-border)]">
      {collapsed ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
            {initials}
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg text-[var(--sidebar-text)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-all"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--sidebar-active)] truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[var(--sidebar-text)] truncate">{user?.email?.split('@')[0] || ''}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-lg text-[var(--sidebar-text)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-all shrink-0"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={collapsed ? 'collapsed' : 'open'}
        variants={sidebarVariants}
        className="hidden md:flex flex-col h-full shrink-0 relative"
        style={{
          background: 'var(--gradient-sidebar)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Decorative gradient orb */}
        <div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'var(--gradient-primary)' }}
        />

        <div className="p-5 pb-4 flex items-center justify-between relative z-10">
          <Logo collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon !p-1.5 hover:bg-[var(--sidebar-hover)] rounded-lg"
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        <NavLinks pathname={pathname} collapsed={collapsed} />
        <div className="relative z-10">
          {!collapsed && (
            <div className="px-5 pb-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--sidebar-text)] opacity-50">
                <Sparkles size={10} />
                <span>AI-Powered Finance Tracking</span>
              </div>
            </div>
          )}
          <UserFooter user={user} logout={logout} initials={initials} collapsed={collapsed} />
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              variants={mobileOverlayVariants}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              variants={mobileSidebarVariants}
              className="relative w-[280px] h-full flex flex-col"
              style={{
                background: 'var(--gradient-sidebar)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid var(--sidebar-border)',
              }}
            >
              <div className="p-5 flex items-center justify-between border-b border-[var(--sidebar-border)]">
                <Logo collapsed={false} />
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-icon hover:bg-[var(--sidebar-hover)] rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <NavLinks pathname={pathname} collapsed={false} onNavigate={onClose} />
              <UserFooter user={user} logout={logout} initials={initials} collapsed={false} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
