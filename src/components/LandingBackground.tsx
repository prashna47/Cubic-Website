import { useEffect, useRef } from 'react'

/**
 * Ambient "slow liquid light" backdrop for the landing page.
 *
 * A handful of large, soft radial-gradient blobs are drawn to a low-resolution
 * canvas with additive blending, so where two blobs overlap the light sums and
 * they read as merging — then drift apart again. Motion comes from summed
 * sine waves at incommensurate frequencies, so there is no perceptible loop and
 * no sudden direction change. The canvas is rendered small and upscaled, then
 * CSS-blurred, for a frosted-glass finish and near-zero GPU cost.
 */

type BlobSpec = {
  bx: number // base x, fraction of width
  by: number // base y, fraction of height
  ax: number // drift amplitude x
  ay: number // drift amplitude y
  fx: number // drift frequency x (rad/s)
  fy: number // drift frequency y
  px: number // phase x
  py: number // phase y
  r: number // base radius, fraction of min(w,h)
  rAmp: number // radius breathing amplitude
  rF: number // radius breathing frequency
  rP: number // radius phase
  sqF: number // squash/stretch frequency
  sqP: number // squash/stretch phase
  rotF: number // slow rotation rate (rad/s)
  alpha: number // peak alpha (kept low — soft glow, never harsh white)
  tint: [number, number, number]
}

const BLOBS: BlobSpec[] = [
  {
    bx: 0.3,
    by: 0.34,
    ax: 0.11,
    ay: 0.09,
    fx: 0.016,
    fy: 0.012,
    px: 0.3,
    py: 1.9,
    r: 0.72,
    rAmp: 0.09,
    rF: 0.019,
    rP: 0.5,
    sqF: 0.013,
    sqP: 0.0,
    rotF: 0.006,
    alpha: 0.13,
    tint: [255, 255, 255],
  },
  {
    bx: 0.7,
    by: 0.3,
    ax: 0.1,
    ay: 0.12,
    fx: 0.012,
    fy: 0.017,
    px: 2.2,
    py: 0.7,
    r: 0.6,
    rAmp: 0.08,
    rF: 0.015,
    rP: 1.4,
    sqF: 0.011,
    sqP: 1.1,
    rotF: -0.005,
    alpha: 0.11,
    tint: [244, 246, 252],
  },
  {
    bx: 0.52,
    by: 0.68,
    ax: 0.13,
    ay: 0.1,
    fx: 0.009,
    fy: 0.013,
    px: 3.5,
    py: 3.0,
    r: 0.85,
    rAmp: 0.1,
    rF: 0.011,
    rP: 0.2,
    sqF: 0.008,
    sqP: 2.2,
    rotF: 0.004,
    alpha: 0.1,
    tint: [228, 230, 238],
  },
  {
    bx: 0.18,
    by: 0.76,
    ax: 0.09,
    ay: 0.08,
    fx: 0.017,
    fy: 0.011,
    px: 1.3,
    py: 4.1,
    r: 0.52,
    rAmp: 0.06,
    rF: 0.021,
    rP: 2.7,
    sqF: 0.015,
    sqP: 0.7,
    rotF: -0.007,
    alpha: 0.09,
    tint: [255, 255, 255],
  },
  {
    bx: 0.84,
    by: 0.78,
    ax: 0.08,
    ay: 0.11,
    fx: 0.013,
    fy: 0.016,
    px: 5.1,
    py: 3.4,
    r: 0.58,
    rAmp: 0.07,
    rF: 0.017,
    rP: 1.9,
    sqF: 0.012,
    sqP: 3.0,
    rotF: 0.005,
    alpha: 0.09,
    tint: [234, 236, 243],
  },
]

// Two incommensurate sines → smooth wander with no obvious period.
function wob(t: number, f: number, p: number) {
  return 0.62 * Math.sin(t * f + p) + 0.38 * Math.sin(t * f * 0.37 + p * 1.7)
}

export default function LandingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let w = 0
    let h = 0
    let unit = 0
    const RES = 0.32 // render at ~1/3 size, upscale for free softness

    const resize = () => {
      // Fallbacks so a 0-size / detached context can't produce NaN dimensions.
      const cw = canvas.clientWidth || window.innerWidth || 1280
      const ch = canvas.clientHeight || window.innerHeight || 720
      w = Math.max(320, Math.min(760, Math.round(cw * RES)))
      h = Math.max(200, Math.round(w * (ch / cw)))
      canvas.width = w
      canvas.height = h
      unit = Math.min(w, h)
    }
    resize()

    const draw = (nowMs: number) => {
      if (!Number.isFinite(unit) || unit <= 0) return
      const t = nowMs / 1000
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (const b of BLOBS) {
        const x = (b.bx + b.ax * wob(t, b.fx, b.px)) * w
        const y = (b.by + b.ay * wob(t, b.fy, b.py)) * h
        const r = (b.r + b.rAmp * Math.sin(t * b.rF + b.rP)) * unit
        const squash = 0.2 * Math.sin(t * b.sqF + b.sqP)

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * b.rotF)
        ctx.scale(1 + squash, 1 - squash)

        const [cr, cg, cb] = b.tint
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${b.alpha})`)
        g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${b.alpha * 0.32})`)
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    let raf = 0
    let last = -999

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 32) return // cap ~30fps; motion is slow
      last = now
      draw(now)
    }

    const onResize = () => {
      resize()
      if (reduceMotion) draw(0)
    }
    window.addEventListener('resize', onResize)

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!raf && !reduceMotion) {
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (reduceMotion) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="landing-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
