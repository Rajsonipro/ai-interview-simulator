import React from 'react'
import { motion } from 'framer-motion'
import { Github, Linkedin, Instagram, Heart } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="font-display font-bold text-lg gradient-text"></div>

        {/* Copyright */}
        <p className="font-body text-xs text-[var(--text-secondary)] flex items-center gap-1">
          
          <Heart size={11} className="text-[var(--neon-purple)] inline" fill="currentColor" /> &
        
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-3">
          {[
            { icon: Github, href: 'https://github.com/Rajsonipro' },
            { icon: Linkedin, href: 'https://www.linkedin.com/in/raj-soni-0208s/' },
            { icon: Instagram, href: 'https://www.instagram.com/raj__208' },
          ].map(({ icon: Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="w-8 h-8 glass rounded-full border border-white/8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] hover:border-[var(--neon-cyan)]/40 transition-all duration-300"
            >
              <Icon size={13} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
