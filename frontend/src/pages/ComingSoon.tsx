import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

const C = {
  bg: '#080808',
  border: '#252525',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const SERIF = "'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"

const titleBySection: Record<string, string> = {
  films: 'Films',
  lists: 'Lists',
  'for-you': 'Recomendaciones',
  vault: 'Vault de la comunidad',
  members: 'Members',
  journal: 'Journal',
}

export default function ComingSoonPage() {
  const location = useLocation()
  const { section = 'feature' } = useParams()

  const rawSection = useMemo(() => {
    if (section !== 'feature') return section
    return location.pathname.replace(/^\//, '').trim() || 'feature'
  }, [location.pathname, section])

  const title = useMemo(() => {
    const normalized = rawSection.toLowerCase()
    return titleBySection[normalized] ?? normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }, [rawSection])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 720,
          border: `1px solid ${C.border}`,
          background: 'rgba(17,17,17,0.9)',
          padding: '30px 26px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 10 }}>
          Navegacion en progreso
        </div>
        <h1 style={{ margin: '0 0 10px', fontFamily: SERIF, fontSize: 'clamp(34px, 7vw, 56px)', fontWeight: 400 }}>
          {title}
        </h1>
        <p style={{ margin: '0 0 18px', fontFamily: SERIF, fontSize: 20, fontStyle: 'italic', color: C.textSoft }}>
          Esta seccion se conecta en la siguiente fase.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${C.accentDim}`,
            color: C.accent,
            padding: '10px 18px',
            textDecoration: 'none',
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
