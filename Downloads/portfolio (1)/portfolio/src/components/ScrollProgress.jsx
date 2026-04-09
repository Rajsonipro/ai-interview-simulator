import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * ScrollProgress – thin neon line at the very top of the viewport
 * that fills as the user scrolls down the page.
 */
export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar || typeof window === 'undefined') return

    try {
      gsap.to(bar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          scrub: 0.3,
          start: 'top top',
          end: 'bottom bottom',
        },
      })
    } catch (error) {
      console.warn('ScrollProgress failed to initialize:', error)
    }
  }, [])

  return (
    <div
      ref={barRef}
      className="progress-bar"
      style={{ right: 0, transformOrigin: 'left', scaleX: 0 }}
    />
  )
}
