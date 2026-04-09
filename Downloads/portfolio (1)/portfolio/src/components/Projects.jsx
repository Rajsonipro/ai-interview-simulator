import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Github, ExternalLink } from 'lucide-react'

const PROJECTS = [
  {
    title: 'Bridge Health Monitoring IoT System',
    description:
      'Real-time structural health monitoring system using NodeMCU ESP8266, MPU6050, and FSR sensors — streams telemetry to ThingSpeak for live analytics.',
    tags: ['IoT', 'ESP8266', 'ThingSpeak', 'C++', 'MQTT'],
    color: 'var(--neon-cyan)',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    emoji: '🌉',
  },
  {
    title: 'Smart Car Health Monitoring System',
    description:
      'An IoT-based system that monitors real-time vehicle health parameters like engine temperature, gas levels, and current flow, sending live data to the cloud for predictive maintenance and safety alerts.',
    tags: ['ESP32', 'IoT', 'ThingSpeak', 'Sensors'],
    color: 'var(--neon-green)',
    gradient: 'from-green-500/10 to-emerald-500/10',
    emoji: '🚗',
  },
  {
    title: 'AI-Based Interview Simulator',
    description:
      'An intelligent interview preparation platform that simulates real interview scenarios using AI, providing dynamic questions, feedback, and performance analysis to improve candidate confidence.',
    tags: ['AI', 'LLM', 'React', 'OpenAI API'],
    color: 'var(--neon-blue)',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    emoji: '🤖',
  },
  {
    title: 'Health & Fitness App',
    description:
      'A user-centric fitness tracking application that monitors daily activities, calorie intake, and workout routines, offering personalized health insights and progress tracking.',
    tags: ['React', 'Firebase', 'UI/UX', 'HealthTech'],
    color: 'var(--neon-orange)',
    gradient: 'from-orange-500/10 to-yellow-500/10',
    emoji: '💪',
  },
]

/** 3D tilt card on mouse move */
function ProjectCard({ project, index }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14
    setTilt({ x, y })
  }
  const resetTilt = () => setTilt({ x: 0, y: 0 })

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        transform: `perspective(700px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: 'transform 0.15s ease',
      }}
      className="project-card glass border border-white/5 rounded-2xl overflow-hidden group"
      data-cursor-hover
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Card header / image area */}
      <div className={`relative h-36 bg-gradient-to-br ${project.gradient} flex items-center justify-center overflow-hidden`}>
        <span className="text-5xl filter drop-shadow-lg">{project.emoji}</span>
        {/* Glow blob */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: project.color }}
        />
        {/* Top-right index number */}
        <div className="absolute top-3 right-4 font-mono text-xs text-white/20">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-2 group-hover:text-[var(--neon-cyan)] transition-colors">
          {project.title}
        </h3>
        <p className="font-body text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs px-2 py-0.5 rounded-md"
              style={{
                background: `rgba(0,245,255,0.07)`,
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(0,245,255,0.15)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover
            className="flex items-center gap-1.5 font-body text-xs text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors"
          >
            <Github size={13} /> GitHub
          </a>
          <a
            href="#"
            data-cursor-hover
            className="flex items-center gap-1.5 font-body text-xs text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors"
          >
            <ExternalLink size={13} /> Live Demo
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="projects" ref={ref} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label mb-3">02 · Projects</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--text-primary)]">
            Things I've{' '}
            <span className="gradient-text">Built</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </div>

        {/* View more */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover
            className="inline-flex items-center gap-2 font-body text-sm text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] border-b border-transparent hover:border-[var(--neon-cyan)] transition-all pb-0.5"
          >
            <Github size={14} /> View all on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  )
}
