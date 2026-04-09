import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * LoadingScreen – cinematic intro:
 * • Counter 0–100%
 * • Scan line effect
 * • Glitchy name reveal
 * • Slides up on exit
 */
export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate counter from 0 to 100
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100 }
        // Accelerate near end
        return p + (p < 70 ? 1.5 : p < 90 ? 0.8 : 0.5)
      })
    }, 20)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#050508' }}
      exit={{ y: '-100%', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Scan line */}
      <div className="scanline absolute inset-x-0 top-0 pointer-events-none" />

      {/* Corner decorations */}
      {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-6 h-6 border-[var(--neon-cyan)] opacity-40`}
          style={{
            borderTop: i < 2 ? '2px solid' : 'none',
            borderBottom: i >= 2 ? '2px solid' : 'none',
            borderLeft: i % 2 === 0 ? '2px solid' : 'none',
            borderRight: i % 2 === 1 ? '2px solid' : 'none',
          }}
        />
      ))}

      {/* Name */}
      <motion.div
        className="font-display font-bold text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <span className="text-5xl md:text-7xl gradient-text tracking-tight">RS</span>
        <div
          className="text-xs font-mono tracking-[0.4em] mt-2 uppercase"
          style={{ color: 'var(--neon-cyan)', opacity: 0.7 }}
        >
          Portfolio · Loading
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-48 h-px bg-white/10 relative overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))' }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>

      {/* Counter */}
      <div className="font-mono text-xs mt-3" style={{ color: 'var(--neon-cyan)', opacity: 0.6 }}>
        {Math.floor(progress).toString().padStart(3, '0')}%
      </div>
    </motion.div>
  )
}
