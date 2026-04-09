import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Github, Linkedin, Instagram, Mail, Send, CheckCircle } from 'lucide-react'

const SOCIAL = [
  { icon: Github, href: 'https://github.com/Rajsonipro', label: 'GitHub', color: '#fff' },
  { icon: Linkedin, href: 'https://www.linkedin.com/in/raj-soni-0208s/', label: 'LinkedIn', color: '#0a66c2' },
  { icon: Instagram, href: 'https://www.instagram.com/raj__208', label: 'Instagram', color: '#e1306c' },
  { icon: Mail, href: 'mail to:rajsoni02082006@gmail.com', label: 'Email', color: 'var(--neon-cyan)' },
]

export default function Contact() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you'd wire up a real email API (e.g. EmailJS / Formspree)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setForm({ name: '', email: '', message: '' })
  }

  const inputClass = (field) => `
    w-full glass border rounded-xl px-4 py-3 font-body text-sm text-[var(--text-primary)]
    placeholder-[var(--text-secondary)] outline-none transition-all duration-300
    ${focused === field
      ? 'border-[var(--neon-cyan)]/60 shadow-[0_0_20px_rgba(0,245,255,0.08)]'
      : 'border-white/8 hover:border-white/15'}
  `

  return (
    <section id="contact" ref={ref} className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label mb-3">05 · Contact</div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-[var(--text-primary)]">
            Let's{' '}
            <span className="gradient-text">Connect</span>
          </h2>
          <p className="font-body text-[var(--text-secondary)] text-sm mt-4 max-w-md mx-auto">
            Have a project idea, internship opportunity, or just want to say hi? My inbox is always open.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Left – Social + Email */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="space-y-6"
          >
            <div className="glass border border-white/5 rounded-2xl p-6">
              <h3 className="font-display font-semibold text-sm text-[var(--text-secondary)] tracking-widest uppercase mb-5">
                Find Me On
              </h3>
              <div className="space-y-3">
                {SOCIAL.map(({ icon: Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor-hover
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center glass border border-white/10 group-hover:border-current transition-colors"
                      style={{ '--tw-border-opacity': 0.3 }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span className="font-body text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                      {label}
                    </span>
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--neon-cyan)]">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Email display */}
            <div
              className="glass border border-white/5 rounded-2xl p-5 flex items-center gap-3"
              data-cursor-hover
            >
              <Mail size={16} className="text-[var(--neon-cyan)] flex-shrink-0" />
              <a
                href="mailto:rajsoni02082006@gmail.com"
                className="font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--neon-cyan)] transition-colors"
              >
                rajsoni02082006@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Right – Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <form
              onSubmit={handleSubmit}
              className="glass border border-white/5 rounded-2xl p-6 space-y-4"
            >
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                placeholder="Your Name"
                required
                data-cursor-hover
                className={inputClass('name')}
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="Your Email"
                required
                data-cursor-hover
                className={inputClass('email')}
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                onFocus={() => setFocused('message')}
                onBlur={() => setFocused(null)}
                placeholder="Your Message"
                required
                rows={5}
                data-cursor-hover
                className={inputClass('message') + ' resize-none'}
              />

              <button
                type="submit"
                data-cursor-hover
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-black transition-all duration-300 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))' }}
              >
                {submitted ? (
                  <>
                    <CheckCircle size={15} />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Message
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
