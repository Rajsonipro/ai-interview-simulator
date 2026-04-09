import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Cursor from './components/Cursor'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Education from './components/Education'
import Experience from './components/Experience'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ParticleBackground from './components/ParticleBackground'

export default function App() {
  // ── Theme state (default: dark) ──────────────────────────
  const [isDark, setIsDark] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark])

  // Simulate loading (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`noise relative ${isDark ? 'dark' : 'light'}`}>
      {/* Custom cursor – hidden on touch devices */}
      <Cursor />

      {/* Scroll progress indicator */}
      <ScrollProgress />

      {/* Animated particle / gradient background */}
      <ParticleBackground isDark={isDark} />

      {/* Subtle grid overlay */}
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />

      {/* Loading screen with framer exit animation */}
      <AnimatePresence initial={false} mode="wait">
        {isLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      {/* Main content – hidden until loading done */}
      {!isLoading && (
        <>
          <Navbar isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} />
          <main className="relative z-10">
            <Hero />
            <About />
            <Projects />
            <Education />
            <Experience />
            <Contact />
          </main>
          <Footer />
        </>
      )}
    </div>
  )
}
