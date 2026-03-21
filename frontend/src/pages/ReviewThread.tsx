import { Link, useParams } from 'react-router-dom'

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

export default function ReviewThreadPage() {
  const { username = 'usuario', slugId = 'pelicula', index } = useParams()
  const indexLabel = index ? ` #${index}` : ''

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
          maxWidth: 760,
          border: `1px solid ${C.border}`,
          background: 'rgba(17,17,17,0.9)',
          padding: '30px 26px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.accentDim, marginBottom: 10 }}>
          Hilo de reseña
        </div>
        <h1 style={{ margin: '0 0 10px', fontFamily: SERIF, fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 400 }}>
          {username} · {slugId}{indexLabel}
        </h1>
        <p style={{ margin: '0 0 18px', fontFamily: SERIF, fontSize: 20, fontStyle: 'italic', color: C.textSoft }}>
          Esta vista mostrará la reseña en grande con likes y respuestas editables.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/${encodeURIComponent(username)}`}
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
            Ir al perfil
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${C.border}`,
              color: C.textSoft,
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
        </div>
      </section>
    </main>
  )
}
