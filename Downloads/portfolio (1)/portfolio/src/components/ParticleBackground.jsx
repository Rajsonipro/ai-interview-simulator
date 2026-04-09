import React, { useEffect, useRef } from 'react'

export default function ParticleBackground({ isDark }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef([])
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf
    let W = window.innerWidth
    let H = window.innerHeight

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const onScroll = () => {
      scrollRef.current = window.scrollY
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll, { passive: true })

    const createParticles = () => {
      const count = Math.min(120, Math.floor((W * H) / 9000))
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 2.1 + 0.8,
        alpha: Math.random() * 0.56 + 0.24,
      }))
    }
    createParticles()

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
    const mix = (a, b, t) => a + (b - a) * t

    const CYAN = isDark ? '0,245,255' : '0,110,220'
    const PURPLE = isDark ? '191,90,242' : '130,70,220'
    const GOLD = isDark ? '255,191,0' : '255,170,90'

    const draw = () => {
      const scrollY = clamp(scrollRef.current, 0, H * 1.5)
      const progress = clamp(scrollY / (H * 1.5), 0, 1)

      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, 'rgba(3, 4, 10, 1)')
      bg.addColorStop(0.4, 'rgba(8, 10, 24, 1)')
      bg.addColorStop(1, 'rgba(2, 2, 8, 1)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1

      const glowGradient = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, H * 0.35)
      glowGradient.addColorStop(0, 'rgba(255,255,255,0.08)')
      glowGradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, W, H)

      const pts = particlesRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const scrollStrength = progress * 0.08

      pts.forEach((p) => {
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 130) {
          const force = (130 - dist) / 130
          p.vx += (dx / dist) * force * 0.16
          p.vy += (dy / dist) * force * 0.16
        }

        p.vx += (Math.random() - 0.5) * 0.014
        p.vy += (Math.random() - 0.5) * 0.014 + scrollStrength
        p.vx *= 0.985
        p.vy *= 0.985

        p.x += p.vx
        p.y += p.vy

        if (p.x < -30) p.x = W + 30
        if (p.x > W + 30) p.x = -30
        if (p.y < -30) p.y = H + 30
        if (p.y > H + 30) p.y = -30

        const radius = p.size * (1 + progress * 0.2)
        const alpha = p.alpha * (0.1 + progress * 0.05)
        ctx.save()
        ctx.shadowBlur = 8
        ctx.shadowColor = `rgba(255,255,255,${alpha * 0.8})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
        ctx.restore()
      })

      const lineColor = `rgba(255,255,255,${0.03 + progress * 0.05})`
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 0.35
      for (let i = 0; i < pts.length; i += 2) {
        for (let j = i + 1; j < pts.length; j += 4) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140 + progress * 80) {
            ctx.globalAlpha = (1 - d / (140 + progress * 80)) * 0.25
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      for (let i = 0; i < 4; i += 1) {
        const x = W * (0.15 + i * 0.25) + Math.sin(Date.now() * 0.0008 + i) * 24
        const y = H * 0.05 + i * H * 0.22 + Math.cos(Date.now() * 0.0009 + i) * 18
        const lineAlpha = 0.06 + progress * 0.08
        ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + (i % 2 ? 20 : -20), H)
        ctx.stroke()
      }

      const markerPositions = [0.18, 0.47, 0.76]
      markerPositions.forEach((position, index) => {
        const threshold = clamp((progress - position) / 0.15, 0, 1)
        if (threshold > 0) {
          const y = H * position + Math.sin(Date.now() * 0.0009 + index) * 14
          const radius = 34 + threshold * 16
          const alpha = threshold * 0.23
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(W * (0.2 + index * 0.25), y, radius, 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.08})`
          ctx.beginPath()
          ctx.arc(W * (0.2 + index * 0.25), y, radius * 0.26, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.48 }}
    />
  )
}
