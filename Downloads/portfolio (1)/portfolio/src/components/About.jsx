import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const SKILLS = [
  { name: 'React / Next.js', level: 85, color: 'var(--neon-cyan)' },
  
  { name: 'Python / ML', level: 75, color: 'var(--neon-cyan)' },
 {   name: 'DSA ', level: 60, color: 'var(--neon-purple)' },
  { name: 'C / C++', level: 78, color: 'var(--neon-cyan)' },
  { name: 'IoT / Embedded', level: 72, color: 'var(--neon-purple)' },
]

const TECH_ICONS = [
  { label: 'React', emoji: '⚛️' },
  { label: 'Python', emoji: '🐍' },
  { label: 'JavaScript', emoji: '⚡' },
  { label: 'Git', emoji: '🔀' },
  { label: 'Arduino', emoji: '🤖' },
]

function SkillBar({ name, level, color, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="font-body text-sm text-[var(--text-primary)]">{name}</span>
        <span className="font-mono text-xs text-[var(--text-secondary)]">{level}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color === 'var(--neon-cyan)' ? 'var(--neon-purple)' : 'var(--neon-cyan)'})` }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1.2, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

/**
 * About – Introduction card + skills progress bars + tech icon grid
 */
export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" ref={ref} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <div className="section-label mb-3">01 · About</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--text-primary)]">
            The Person Behind the{' '}
            <span className="gradient-text">Code</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-10"
        >
          {/* Left – Bio + tech icons */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <p className="font-body text-[var(--text-secondary)] leading-relaxed text-sm mb-4">
                Hey! I'm <span className="text-[var(--neon-cyan)] font-medium">Raj Soni</span>, a
                Computer Engineering student at{' '}
                <span className="text-[var(--text-primary)]">MBIT (CVM University)</span>. I'm
                passionate about building end-to-end software — from polished React UIs to cloud
                deployments and hardware prototypes.
              </p>
              <p className="font-body text-[var(--text-secondary)] leading-relaxed text-sm">
                Currently exploring the intersection of{' '}
                <span className="text-[var(--neon-purple)] font-medium">AI / ML</span> and real-world
                IoT systems. I love writing clean, performant code and crafting experiences that
                feel effortless to use.
              </p>
            </div>

            {/* Tech icon grid */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="font-display text-sm font-semibold text-[var(--text-secondary)] mb-4 tracking-widest uppercase">
                Tech Toolkit
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {TECH_ICONS.map(({ label, emoji }) => (
                  <div
                    key={label}
                    data-cursor-hover
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-mono text-xs text-[var(--text-secondary)] group-hover:text-[var(--neon-cyan)] transition-colors">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right – Skill bars */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="font-display text-sm font-semibold text-[var(--text-secondary)] mb-6 tracking-widest uppercase">
              Proficiency
            </h3>
            {SKILLS.map((skill, i) => (
              <SkillBar key={skill.name} {...skill} index={i} />
            ))}

            {/* Extra info cards */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
              {[
                { value: '10+', label: 'Projects' },
                { value: '2+', label: 'Years Coding' },
                { value: '5+', label: 'Certifications' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,245,255,0.04)' }}>
                  <div className="font-display font-bold text-xl text-[var(--neon-cyan)]">{value}</div>
                  <div className="font-body text-xs text-[var(--text-secondary)]">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
