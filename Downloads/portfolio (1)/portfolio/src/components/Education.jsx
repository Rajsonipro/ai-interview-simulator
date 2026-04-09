import React, { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { BookOpen, Award, ChevronDown, Star, Calendar, MapPin, School } from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const EDUCATION = [
  {
    degree: 'B.Tech — Computer Engineering',
    institution: 'Madhuben & Bhanubhai Patel Institute of Technology',
    short: 'MBIT · CVM University',
    period: '2023 – 2027',
    location: 'New Vallabh Vidyanagar, Gujarat',
    cgpa: '8.5+',
    status: 'Ongoing',
    statusColor: 'var(--neon-green)',
    icon: '🎓',
    color: 'var(--neon-cyan)',
   
    description:
      'Pursuing a comprehensive Computer Engineering curriculum with deep dives into AI/ML, cloud platforms, embedded systems, and full-stack web development.',
    courses: [
      'Data Structures & Algorithms',
      'Operating Systems',
      'Cloud Computing',
      'Machine Learning',
      'Computer Networks',
      'Software Engineering',
      'Database Management',
      'IoT & Embedded Systems',
    ],
    
  },
  {
    degree: 'HSC — Science Stream (PCM + CS)',
    institution: 'Gujarat Secondary and Higher Secondary Education Board',
    short: 'GSEB',
    period: '2021 – 2023',
    school: 'D.N HIGH SCHOOL,ANAND',
    location: 'Gujarat, India',
    cgpa: '85 Percentile',
    percentage: '70%',
    status: 'Completed',
    statusColor: 'var(--neon-cyan)',
    icon: '📚',
    color: 'var(--neon-purple)',
   
    description:
      'Completed Higher Secondary with Physics, Chemistry, Mathematics, and Computer Science. Developed a strong foundation in logical thinking and problem solving.',
    courses: [
      'Physics',
      'Chemistry',
      'Mathematics',
      'Computer Science',
      'English',
    ],
    achievements: [
      'Scored 89th percentile across board',
      'Won inter-school programming contest',
      'Led science exhibition project on renewable energy',
    ],
  },
  {
    degree: 'SSC — Secondary School',
    institution: 'Gujarat Secondary Education Board',
    short: 'GSEB',
    period: '2019 – 2021',
    school: 'D.N HIGH SCHOOL,ANAND',
    location: 'Gujarat, India',
    cgpa: '93%',
    status: 'Completed',
    statusColor: 'var(--neon-cyan)',
    icon: '🏫',
    color: 'var(--neon-cyan)',
    guide: null,
    batch: null,
    description:
      'Completed secondary schooling with distinction, developing early interest in computers and mathematics.',
    courses: ['Mathematics', 'Science', 'English', 'Social Science', 'Computer'],
   
  },
]



// ── Sub-components ────────────────────────────────────────────────────────────

function EducationCard({ edu, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="glass border border-white/5 rounded-2xl overflow-hidden group"
      data-cursor-hover
      style={{ transition: 'box-shadow 0.3s ease' }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = `0 0 40px rgba(0,245,255,0.07), 0 0 0 1px rgba(0,245,255,0.1)`)
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Card Header ─ always visible */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="flex items-start gap-4">
            {/* Icon bubble */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `rgba(0,245,255,0.07)`, border: `1px solid rgba(0,245,255,0.15)` }}
            >
              {edu.icon}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  {edu.degree}
                </h3>
                {/* Status badge */}
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    color: edu.statusColor,
                    borderColor: `${edu.statusColor}40`,
                    background: `${edu.statusColor}10`,
                  }}
                >
                  {edu.status}
                </span>
              </div>

              <p className="font-body text-sm text-[var(--text-secondary)]">{edu.institution}</p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                  <Calendar size={11} style={{ color: 'var(--neon-cyan)' }} />
                  {edu.period}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)]">
                  <MapPin size={11} style={{ color: 'var(--neon-cyan)' }} />
                  {edu.location}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--neon-cyan)' }}>
                  <Star size={11} />
                  {edu.cgpa}
                </span>
              </div>

              {/* Guide / batch — only for B.Tech */}
              {edu.guide && (
                <div className="mt-2 font-mono text-xs text-[var(--text-secondary)]">
                  Guide: <span className="text-[var(--text-primary)]">{edu.guide}</span>
                  {edu.batch && (
                    <span className="ml-2 opacity-60">· {edu.batch}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((p) => !p)}
            data-cursor-hover
            className="flex-shrink-0 w-8 h-8 glass rounded-full border border-white/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] hover:border-[var(--neon-cyan)]/40 transition-all duration-300"
            aria-label="Toggle details"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={14} />
            </motion.div>
          </button>
        </div>

        {/* Description */}
        <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed mt-4">
          {edu.description}
        </p>
      </div>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/5 pt-5 grid sm:grid-cols-2 gap-5">
              {/* Courses */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={13} style={{ color: 'var(--neon-cyan)' }} />
                  <span className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)]">
                    Courses
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(edu.courses || []).map((c) => (
                    <span
                      key={c}
                      className="font-mono text-xs px-2.5 py-1 rounded-lg"
                      style={{
                        background: 'rgba(0,245,255,0.05)',
                        border: '1px solid rgba(0,245,255,0.12)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} style={{ color: 'var(--neon-purple)' }} />
                  <span className="font-mono text-xs tracking-widest uppercase text-[var(--text-secondary)]">
                    Highlights
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {(edu.achievements || []).map((a) => (
                    <li
                      key={a}
                      className="font-body text-xs text-[var(--text-secondary)] flex items-start gap-2"
                    >
                      <span style={{ color: 'var(--neon-purple)', marginTop: 2 }}>▸</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}



// ── Main Section ──────────────────────────────────────────────────────────────

export default function Education() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="education" ref={ref} className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label mb-3">03 · Education</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--text-primary)]">
            Academic{' '}
            <span className="gradient-text">Background</span>
          </h2>
          <p className="font-body text-[var(--text-secondary)] text-sm mt-4 max-w-md mx-auto">
            My formal education journey — click any card to expand courses & highlights.
          </p>
        </motion.div>

        {/* Education cards */}
        <div className="space-y-4">
          {EDUCATION.map((edu, i) => (
            <EducationCard key={edu.degree} edu={edu} index={i} />
          ))}
        </div>


      </div>
    </section>
  )
}
