import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { fetchTVDetail, type TVDetailApi } from '../services/tvDetailServices'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#252525',
  accent: '#D4AF7A',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
} as const

const SANS = "'Syne', sans-serif"
const SERIF = "'Cormorant Garamond', serif"
const TMDB_ORIGINAL = 'https://image.tmdb.org/t/p/original'
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w500'

function image(path?: string | null, base = TMDB_ORIGINAL) {
  return path ? `${base}${path}` : ''
}

export default function TVDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TVDetailApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let alive = true

    fetchTVDetail(id)
      .then((data) => {
        if (!alive) return
        setDetail(data)
      })
      .catch((err) => {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar la serie')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [id])

  if (!id) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS, padding: 24 }}>
        <button onClick={() => navigate(-1)} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: '8px 12px', cursor: 'pointer' }}>
          Volver
        </button>
        <p style={{ marginTop: 16, color: '#ff9b9b' }}>ID de serie invalido.</p>
      </div>
    )
  }

  const creators =
    detail?.created_by && detail.created_by.length > 0
      ? detail.created_by.map((item) => item.name).slice(0, 3).join(', ')
      : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.textSoft, display: 'grid', placeItems: 'center', fontFamily: SANS }}>
        Cargando serie...
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS, padding: 24 }}>
        <button onClick={() => navigate(-1)} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.text, padding: '8px 12px', cursor: 'pointer' }}>
          Volver
        </button>
        <p style={{ marginTop: 16, color: '#ff9b9b' }}>{error || 'No encontramos la serie.'}</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: SANS }}>
      <header
        style={{
          position: 'relative',
          minHeight: 420,
          borderBottom: `1px solid ${C.border}`,
          backgroundImage: `linear-gradient(to bottom, rgba(8,8,8,0.2), rgba(8,8,8,0.95)), url(${image(detail.backdrop_path)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '24px clamp(16px, 4vw, 56px)',
          display: 'flex',
          alignItems: 'end',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 18 }}>
            <Link to="/" style={{ color: C.textSoft, textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              CineVault
            </Link>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{ border: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.45)', color: C.text, padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(34px, 6vw, 72px)', lineHeight: 1.03 }}>
            {detail.name}
          </h1>
          <div style={{ marginTop: 8, color: C.textSoft, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
            {(detail.first_air_date || '').slice(0, 4)}
            {detail.number_of_seasons ? ` · ${detail.number_of_seasons} temporadas` : ''}
            {detail.vote_average ? ` · ${detail.vote_average.toFixed(1)} / 10` : ''}
          </div>
        </div>
      </header>

      <main style={{ width: 'min(1100px, 100%)', margin: '0 auto', padding: '22px clamp(16px, 4vw, 56px) 40px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
          <div>
            {detail.poster_path ? (
              <img src={image(detail.poster_path, TMDB_POSTER)} alt={detail.name} style={{ width: '100%', border: `1px solid ${C.border}`, display: 'block' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', border: `1px solid ${C.border}`, background: C.elevated }} />
            )}
          </div>
          <div>
            {!!detail.tagline && (
              <p style={{ marginTop: 0, color: C.accent, fontFamily: SERIF, fontSize: 22, fontStyle: 'italic' }}>{detail.tagline}</p>
            )}
            <p style={{ margin: '0 0 18px', color: C.text, lineHeight: 1.75, fontSize: 17, fontFamily: SERIF }}>
              {detail.overview || 'Sin descripcion disponible.'}
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              {!!creators && (
                <div style={{ color: C.textSoft, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Creadores: <span style={{ color: C.text }}>{creators}</span>
                </div>
              )}
              {Array.isArray(detail.genres) && detail.genres.length > 0 && (
                <div style={{ color: C.textSoft, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Generos: <span style={{ color: C.text }}>{detail.genres.map((g) => g.name).join(', ')}</span>
                </div>
              )}
              {!!detail.last_air_date && (
                <div style={{ color: C.textSoft, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Ultima emision: <span style={{ color: C.text }}>{detail.last_air_date}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
