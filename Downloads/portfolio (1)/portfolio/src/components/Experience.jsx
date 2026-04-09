import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TIMELINE = [
  
 
 {
  type: 'experience',
  title: 'ISTE Event Team Member',
  org: 'ISTE Student Chapter · MBIT',
  period: '2026',
  desc: 'Actively contributed to planning and executing technical and non-technical events, managing coordination, promotions, and on-ground operations to ensure smooth and engaging experiences.',
  tags: ['Event Management', 'Teamwork', 'Leadership', 'Coordination', 'Communication'],
  icon: '🎤',
  color: 'var(--neon-pink)',
},
  
{
  type: 'experience',
  title: 'Web Development Intern',
  org: 'CodeAlpha',
  period: '2026',
  desc: 'Worked on real-world web development tasks during a virtual internship at CodeAlpha, building responsive web applications and enhancing front-end performance. Gained practical experience in developing user-friendly interfaces and writing clean, maintainable code.',
  tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design'],
  icon: '💻',
  color: 'var(--neon-blue)',
}
  
]

function TimelineItem({ item, index, total }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const isLeft = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      className={`relative flex ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-0 mb-8`}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Card */}
      <div className={`w-full md:w-5/12 ${isLeft ? 'md:pr-10' : 'md:pl-10'}`}>
        <div className="glass border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all duration-300"
          style={{ boxShadow: 'none' }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 30px rgba(0,245,255,0.08)`}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">{item.title}</div>
              <div className="font-body text-xs text-[var(--text-secondary)] mt-0.5">{item.org}</div>
            </div>
          </div>
          <div className="font-mono text-xs mb-3 px-2 py-0.5 rounded-md inline-block"
            style={{ background: `rgba(0,245,255,0.07)`, color: 'var(--neon-cyan)', border: '1px solid rgba(0,245,255,0.15)' }}>
            {item.period}
          </div>
          <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{item.desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-[var(--text-secondary)]">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Center dot (desktop) */}
      <div className="hidden md:flex w-2/12 items-start justify-center pt-6">
        <motion.div
          className="w-3 h-3 rounded-full border-2 z-10 relative"
          style={{ borderColor: item.color, background: 'var(--bg-primary)' }}
          animate={inView ? { scale: [1, 1.4, 1] } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="absolute inset-0.5 rounded-full" style={{ background: item.color, opacity: 0.6 }} />
        </motion.div>
      </div>

      {/* Empty right / left side */}
      <div className="hidden md:block w-5/12" />
    </motion.div>
  )
}

export default function Experience() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="experience" ref={ref} className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label mb-3">04 · Journey</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--text-primary)]">
            Education &{' '}
            <span className="gradient-text">Experience</span>
          </h2>
        </motion.div>

        {/* Timeline vertical line */}
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-px timeline-line" />
          {TIMELINE.map((item, i) => (
            <TimelineItem key={i} item={item} index={i} total={TIMELINE.length} />
          ))}
        </div>
      </div>
    </section>
  )
}
