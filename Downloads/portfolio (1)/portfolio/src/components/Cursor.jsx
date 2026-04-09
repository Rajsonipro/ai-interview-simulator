import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

/**
 * Cursor – custom dual-ring cursor with:
 * • Smooth GSAP-powered lag-follow for the ring
 * • Expand + glow on hover over interactive elements
 * • Shrink on mousedown (click feedback)
 */
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [clicking, setClicking] = useState(false)
  const pos = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const dot = dotRef.current
    const ringEl = ringRef.current
    if (!dot || !ringEl) return

    // ── Move dot instantly, ring follows with lerp ──────────
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      gsap.set(dot, { x: e.clientX, y: e.clientY })
    }

    // ── Lerp animation loop ──────────────────────────────────
    let raf
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12
      ring.current.y += (pos.current.y - ring.current.y) * 0.12
      gsap.set(ringEl, { x: ring.current.x, y: ring.current.y })
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    // ── Hover detection for interactive elements ─────────────
    const targets = 'a, button, [data-cursor-hover], input, textarea'
    const addHover = (e) => {
      if (e.target.closest(targets)) setHovered(true)
    }
    const removeHover = (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest(targets)) setHovered(false)
    }

    const onDown = () => setClicking(true)
    const onUp = () => setClicking(false)

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', addHover)
    document.addEventListener('mouseout', removeHover)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', addHover)
      document.removeEventListener('mouseout', removeHover)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div
        ref={ringRef}
        className={`cursor-ring ${hovered ? 'hovered' : ''} ${clicking ? 'clicking' : ''}`}
      />
    </>
  )
}
