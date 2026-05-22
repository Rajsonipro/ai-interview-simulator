import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import AIChatBot from './AIChatBot';
import { useTheme } from '../context/ThemeContext';
import { Menu, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="app-header shrink-0 z-40">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden btn-icon"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <motion.div
                key={isDark ? 'dark' : 'light'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="max-w-[1480px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AIChatBot />
    </div>
  );
};

export default Layout;
