import { CalendarCheck, FileCheck2, Trophy } from 'lucide-react'

const CARDS = [
  { icon: CalendarCheck, title: 'Interview booked', subtitle: 'Fri, 10:00 AM', position: 'hero-card-booked', delay: '-1s' },
  { icon: FileCheck2, title: 'Resume matched', subtitle: '98% match', position: 'hero-card-resume', delay: '-4s' },
  { icon: Trophy, title: 'Offer received', subtitle: 'Welcome aboard', position: 'hero-card-offer', delay: '-2s' },
]

const cubes = Array.from({ length: 27 }, (_, i) => ({
  x: i % 3, y: Math.floor(i / 3) % 3, z: Math.floor(i / 9),
})).sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z))

function project(x: number, y: number, z: number) {
  return `${200 + (x - y) * 44},${208 + (x + y) * 23 - z * 51}`
}

/** Decorative vector cube: 27 individual blocks, with independent floating cards. */
export default function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-cube-glow" />
      <svg className="hero-cube" viewBox="0 0 400 420" fill="none">
        <defs>
          <linearGradient id="cube-top" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffb3c0" /><stop offset=".12" stopColor="#fa4865" />
            <stop offset=".38" stopColor="#9c0b2b" /><stop offset=".68" stopColor="#bd1036" /><stop offset="1" stopColor="#ff5b7c" />
          </linearGradient>
          <linearGradient id="cube-left" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f92e53" /><stop offset=".16" stopColor="#b00c30" /><stop offset=".6" stopColor="#490619" /><stop offset="1" stopColor="#a61036" />
          </linearGradient>
          <linearGradient id="cube-right" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#2d0312" /><stop offset=".5" stopColor="#680a26" /><stop offset=".85" stopColor="#d31b49" /><stop offset="1" stopColor="#ff577a" />
          </linearGradient>
          <radialGradient id="cube-reflection" cx=".12" cy=".05" r=".85">
            <stop stopColor="#fff4f7" stopOpacity=".9" /><stop offset=".14" stopColor="#ff95b0" stopOpacity=".3" /><stop offset=".55" stopColor="#ff5781" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cube-shadow"><stop stopColor="#e72948" stopOpacity=".55" /><stop offset="1" stopColor="#9a102a" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="200" cy="385" rx="145" ry="24" fill="url(#cube-shadow)" />
        <g className="hero-cube-blocks" stroke="#fa536c" strokeWidth=".75" strokeLinejoin="round">
          {cubes.map(({ x, y, z }) => {
            const s = .9
            return (
              <g key={`${x}-${y}-${z}`}>
                <polygon fill="url(#cube-left)" points={[project(x, y + s, z), project(x + s, y + s, z), project(x + s, y + s, z + s), project(x, y + s, z + s)].join(' ')} />
                <polygon fill="url(#cube-right)" points={[project(x + s, y, z), project(x + s, y + s, z), project(x + s, y + s, z + s), project(x + s, y, z + s)].join(' ')} />
                <polygon fill="url(#cube-top)" points={[project(x, y, z + s), project(x + s, y, z + s), project(x + s, y + s, z + s), project(x, y + s, z + s)].join(' ')} />
                <polygon fill="url(#cube-reflection)" stroke="none" points={[project(x, y, z + s), project(x + s, y, z + s), project(x + s, y + s, z + s), project(x, y + s, z + s)].join(' ')} />
                <polyline stroke="#ffe5ed" strokeOpacity=".8" strokeWidth=".85" points={[project(x, y + s, z + s), project(x + s, y + s, z + s), project(x + s, y, z + s)].join(' ')} />
              </g>
            )
          })}
        </g>
      </svg>
      {CARDS.map(({ icon: Icon, title, subtitle, position, delay }) => (
        <div key={title} className={`hero-info-card ${position}`} style={{ animationDelay: delay }}>
          <span className="hero-card-icon"><Icon size={20} strokeWidth={1.6} /></span>
          <div><p className="text-sm font-semibold text-fg">{title}</p><p className="mt-0.5 text-xs text-muted">{subtitle}</p></div>
        </div>
      ))}
    </div>
  )
}
