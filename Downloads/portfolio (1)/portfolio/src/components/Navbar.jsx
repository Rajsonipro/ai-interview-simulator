import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
]

/**
 * Navbar – glassmorphism bar that:
 * • Appears on scroll down with blur + border
 * • Has animated mobile menu
 * • Theme toggle with sun/moon icon
 */
export default function Navbar({ isDark, onThemeToggle }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Track active section via IntersectionObserver
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1))
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { threshold: 0.4 }
    )
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const handleNav = (href) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled ? 'glass border-b border-white/5 py-3' : 'py-6'
      }`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="font-display font-bold text-xl gradient-text"
          data-cursor-hover
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >
          RS<span className="text-white/20">.</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNav(href)}
              data-cursor-hover
              className={`relative font-body text-sm font-medium transition-colors duration-200 ${
                active === href.slice(1) ? 'text-[var(--neon-cyan)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
              {active === href.slice(1) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 inset-x-0 h-px bg-[var(--neon-cyan)]"
                  style={{ boxShadow: '0 0 8px var(--neon-cyan)' }}
                />
              )}
            </button>
          ))}

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            data-cursor-hover
            className="glass rounded-full p-2 border border-white/10 hover:border-[var(--neon-cyan)]/40 transition-all duration-300"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun size={16} className="text-[var(--neon-cyan)]" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon size={16} className="text-[var(--neon-purple)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden glass rounded-lg p-2 border border-white/10"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-cursor-hover
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {NAV_LINKS.map(({ label, href }) => (
                <button
                  key={label}
                  onClick={() => handleNav(href)}
                  className="text-left font-body text-sm text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors"
                >
                  {label}
                </button>
              ))}
              <button onClick={onThemeToggle} className="text-left font-body text-sm text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
