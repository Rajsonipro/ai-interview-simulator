import React, { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Github, Linkedin } from 'lucide-react'

// Typing animation hook
function useTyping(strings, speed = 80, deleteSpeed = 40, pause = 1800) {
  const [text, setText] = useState('')
  const [strIndex, setStrIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = strings[strIndex]
    const delay = deleting
      ? deleteSpeed
      : charIndex === current.length
      ? pause
      : speed

    const timer = setTimeout(() => {
      if (!deleting && charIndex === current.length) {
        setDeleting(true)
      } else if (deleting && charIndex === 0) {
        setDeleting(false)
        setStrIndex((i) => (i + 1) % strings.length)
      } else {
        setCharIndex((c) => c + (deleting ? -1 : 1))
        setText(current.slice(0, charIndex + (deleting ? -1 : 1)))
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [charIndex, deleting, strIndex, strings, speed, deleteSpeed, pause])

  return text
}

const TYPED_STRINGS = [
  'AI / ML Enthusiast',
  'IoT ',
  'Python Enthusiast',
]

/**
 * Hero – full-screen landing with:
 * • Typing animation
 * • Floating badge
 * • CTA buttons
 * • Scroll-parallax effect on text
 */
export default function Hero() {
  const typedText = useTyping(TYPED_STRINGS)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const scrollDown = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[400, 600, 800].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: size,
              height: size,
              borderColor: `rgba(0,245,255,${0.04 - i * 0.01})`,
              animation: `spin ${20 + i * 10}s linear infinite ${i % 2 ? 'reverse' : ''}`,
            }}
          />
        ))}
      </div>

      {/* Hero content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {/* Status badge */}
        <motion.div
          className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
          <span className="font-mono text-xs text-[var(--text-secondary)]">Available for Internship / Projects</span>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="font-display font-black text-6xl md:text-8xl lg:text-9xl leading-none mb-4 tracking-[0.03em] font-syne gradient-text text-glow-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.8)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          Raj Soni
        </motion.h1>

        {/* Typing animation */}
        <motion.div
          className="font-mono text-lg md:text-2xl text-[var(--neon-cyan)] mb-6 h-8 flex items-center justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span>{typedText}</span>
          <span className="typing-cursor" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="font-body text-[var(--text-secondary)] text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          Computer Engineering student at MBIT · Building intelligent systems,
          beautiful interfaces, and cool hardware.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            data-cursor-hover
            className="relative overflow-hidden px-7 py-3 rounded-full font-medium text-sm text-black transition-all duration-300 group"
            style={{ background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))' }}
          >
            <span className="relative z-10">View Projects</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>

          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            data-cursor-hover
            className="glass px-7 py-3 rounded-full font-medium text-sm border border-white/15 hover:border-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] transition-all duration-300"
          >
            Contact Me
          </button>
        </motion.div>

        {/* Social links */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05 }}
        >
          {[
            { icon: Github, href: 'https://github.com', label: 'GitHub' },
            { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
          ].map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="glass w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] transition-all duration-300 text-[var(--text-secondary)]"
              aria-label={label}
            >
              <Icon size={16} />
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll down hint */}
      <motion.button
        onClick={scrollDown}
        data-cursor-hover
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
      >
        <span className="font-mono text-xs tracking-widest">SCROLL</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ArrowDown size={14} />
        </motion.div>
      </motion.button>
    </section>
  )
}
