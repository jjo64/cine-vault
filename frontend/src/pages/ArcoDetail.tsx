import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, Star, Clock, Users, Check } from 'lucide-react'
import {
  fetchArcoDetail,
  marcarProgresoArco,
  toTmdbPoster,
  type ArcoDetail as ApiArcoDetail,
} from '../services/arcosServices'

const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  border: '#2A2A2A',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.15)',
  text: '#E2E2E2',
  textSoft: '#7A7A7A',
  textMuted: '#3A3A3A',
  gold: '#C8A96E',
} as const

const SERIF = "'Playfair Display', 'Cormorant Garamond', serif"
const SANS = "'Syne', sans-serif"

const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=400&q=80'

type ArcoFilm = {
  id: number
  movieId: number
  order: number
  title: string
  year: number | null
  duration: string
  poster: string
  note: string
  optional: boolean
  watched: boolean
}

function FilmEntry({
  film,
  canMark,
  onMark,
  pending,
  delay,
}: {
  film: ArcoFilm
  canMark: boolean
  onMark: () => void
  pending: boolean
  delay: number
}) {
  const [hov, setHov] = useState(false)
  const orderStr = String(film.order).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 80px 1fr auto',
        gap: 20,
        alignItems: 'flex-start',
        padding: '24px 0',
        borderBottom: `1px solid ${C.border}`,
        opacity: film.watched ? 0.62 : 1,
        transition: 'opacity 0.3s',
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 40,
          fontWeight: 400,
          color: hov ? C.accentDim : C.textMuted,
          lineHeight: 1,
          transition: 'color 0.3s',
          paddingTop: 4,
        }}
      >
        {orderStr}
      </div>

      <div
        style={{
          aspectRatio: '2/3',
          borderRadius: 1,
          overflow: 'hidden',
          filter: film.watched ? 'saturate(0.2) brightness(0.5)' : 'saturate(0.75)',
          transition: 'filter 0.3s',
          border: `1px solid ${C.border}`,
        }}
      >
        <img src={film.poster} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div>
        <div style={{ fontFamily: SERIF, fontSize: 22, color: film.watched ? C.textSoft : C.text, lineHeight: 1.2, marginBottom: 4 }}>{film.title}</div>
        <div style={{ fontSize: 12, color: C.accent, fontFamily: SANS, marginBottom: 2 }}>Orden editorial del arco</div>
        <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginBottom: 12, display: 'flex', gap: 12 }}>
          {film.year ? <span>{film.year}</span> : <span>Ano no disponible</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />
            {film.duration}
          </span>
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.textSoft, lineHeight: 1.65, maxWidth: 520, marginBottom: 12 }}>
          {film.note}
        </div>
        {film.optional && (
          <span
            style={{
              display: 'inline-block',
              marginTop: 4,
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: C.textMuted,
              border: `1px solid ${C.border}`,
              padding: '2px 8px',
              fontFamily: SANS,
            }}
          >
            OPCIONAL
          </span>
        )}
      </div>

      <div style={{ paddingTop: 4 }}>
        {canMark ? (
          <button
            onClick={onMark}
            disabled={pending}
            style={{
              padding: '8px 14px',
              background: film.watched ? C.elevated : 'transparent',
              color: film.watched ? C.accent : C.textSoft,
              border: `1px solid ${film.watched ? C.accentDim : C.border}`,
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: pending ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              opacity: pending ? 0.75 : 1,
            }}
          >
            {film.watched ? (
              <>
                <Check size={9} /> Vista
              </>
            ) : pending ? (
              'Guardando...'
            ) : (
              'Marcar vista'
            )}
          </button>
        ) : (
          <span style={{ color: C.textMuted, fontSize: 10, fontFamily: SANS }}>Inicia sesion para marcar</span>
        )}
      </div>
    </motion.div>
  )
}

const mapFilms = (detail: ApiArcoDetail) =>
  detail.movies.map((movie) => {
    const date = movie.movie_info?.release_date || ''
    const year = Number.parseInt(date.slice(0, 4), 10)

    return {
      id: movie.movie_id,
      movieId: movie.movie_id,
      order: movie.order,
      title: movie.movie_info?.title || `Pelicula #${movie.movie_id}`,
      year: Number.isNaN(year) ? null : year,
      duration: 'N/D',
      poster: toTmdbPoster(movie.movie_info?.poster_path) || FALLBACK_POSTER,
      note: movie.note || 'Sin nota editorial disponible.',
      optional: movie.optional,
      watched: movie.watched,
    }
  })

export function ArcoDetail() {
  const { id } = useParams<{ id: string }>()
  const arcoId = Number(id)

  const [detail, setDetail] = useState<ApiArcoDetail | null>(null)
  const [films, setFilms] = useState<ArcoFilm[]>([])
  const [joined, setJoined] = useState(true)
  const [loading, setLoading] = useState(true)
  const [savingMovieId, setSavingMovieId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!Number.isFinite(arcoId) || arcoId <= 0) {
        setError('ID de arco invalido.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const payload = await fetchArcoDetail(arcoId)
        if (!active) return
        setDetail(payload)
        setFilms(mapFilms(payload))
      } catch {
        if (active) {
          setError('No se pudo cargar el detalle del arco.')
          setDetail(null)
          setFilms([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [arcoId])

  const watchedCount = useMemo(() => films.filter((f) => f.watched).length, [films])
  const totalFilms = films.length
  const progressPct = totalFilms > 0 ? Math.round((watchedCount / totalFilms) * 100) : 0

  const onMark = async (movieId: number) => {
    setSavingMovieId(movieId)
    try {
      await marcarProgresoArco(arcoId, movieId)
      setFilms((prev) => prev.map((item) => (item.movieId === movieId ? { ...item, watched: true } : item)))
    } catch {
      setError('No se pudo marcar progreso. Verifica sesion y vuelve a intentar.')
    } finally {
      setSavingMovieId(null)
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: SANS }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          height: 60,
        }}
      >
        <Link to="/arcos" style={{ color: C.textSoft, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SANS }}>
          <ArrowLeft size={13} /> Arcos
        </Link>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ padding: '56px 48px 0', maxWidth: 1080, margin: '0 auto' }}>
        {loading && <div style={{ color: C.textSoft }}>Cargando arco...</div>}
        {error && <div style={{ color: '#C97B7B', marginBottom: 10 }}>{error}</div>}

        {detail && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, border: `1px solid ${C.accentDim}`, padding: '3px 10px', fontFamily: SANS }}>
                {detail.level}
              </span>
              {detail.official && (
                <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, border: `1px solid ${C.gold}`, padding: '3px 10px', fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={8} fill={C.gold} /> OFICIAL CINEVAULT
                </span>
              )}
            </div>

            <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: 20, letterSpacing: '-0.02em', maxWidth: 700 }}>
              {detail.title}
            </div>

            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: C.textSoft, lineHeight: 1.75, maxWidth: 640, marginBottom: 28 }}>
              {detail.description || 'Sin descripcion editorial.'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill={C.textMuted}>
                  <rect x="1" y="2" width="10" height="14" rx="1" />
                  <rect x="5" y="1" width="10" height="14" rx="1" fill={C.textMuted} opacity="0.5" />
                </svg>
                {detail.films} peliculas
              </span>
              <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={10} color={C.textMuted} /> {Math.max(2, Math.round((detail.films || 1) * 2.2))}h estimadas
              </span>
              <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={10} color={C.textMuted} /> {detail.usersCompleted.toLocaleString('es')} lo completaron
              </span>
            </div>

            {!joined ? (
              <button onClick={() => setJoined(true)} style={{ padding: '13px 32px', background: C.accent, color: C.bg, border: 'none', fontFamily: SANS, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Unirse al arco
              </button>
            ) : (
              <div style={{ maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.text, fontFamily: SANS }}>
                    Llevas <strong>{watchedCount}</strong> de <strong>{totalFilms}</strong> peliculas.
                  </span>
                  <span style={{ fontSize: 12, color: C.accent, fontFamily: SANS }}>{progressPct}%</span>
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 2 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, delay: 0.25, ease: 'easeOut' }} style={{ height: '100%', background: C.accent, borderRadius: 2 }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {joined && watchedCount > 0 && detail && (
        <div style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ background: C.surface, border: `1px solid ${C.accentDim}`, borderLeft: `3px solid ${C.accent}`, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: 200, height: '100%', background: `linear-gradient(90deg, ${C.accentGlow}, transparent)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS, marginBottom: 6 }}>
                Progreso
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text }}>
                Ya llevas {watchedCount} {watchedCount === 1 ? 'pelicula' : 'peliculas'} de este arco. Te quedan {Math.max(0, totalFilms - watchedCount)}.
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div style={{ maxWidth: 1080, margin: '48px auto 0', padding: '0 48px 80px' }}>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {films.length === 0 && !loading ? (
            <div style={{ color: C.textSoft, padding: '18px 0' }}>Este arco todavia no tiene peliculas cargadas.</div>
          ) : (
            films.map((film, i) => (
              <FilmEntry
                key={film.id}
                film={film}
                canMark={joined}
                pending={savingMovieId === film.movieId}
                onMark={() => onMark(film.movieId)}
                delay={i * 0.06}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
