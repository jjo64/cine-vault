import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Bookmark, Heart, List, Menu, MessageSquare, Share2 } from 'lucide-react'
import { StarRating } from '../StarRating'
import { Img } from '../Img'
import { C, SANS } from '../../constants'

const TMDB_BASE = 'https://image.tmdb.org/t/p/'

export type HeroDirector = {
  id: number
  name: string
}

export type MediaHeroProps = {
  /** Título principal */
  title: string
  /** Título original (para el subtítulo) */
  originalTitle?: string
  /** Año de estreno */
  releaseYear: number | string
  /** País de producción */
  country: string
  /** Duración formateada, ej. "142 min" o "60 min / ep" */
  runtime: string
  /** Géneros, máx 2, ej. "Drama · Thriller" */
  genresText: string
  /** Objeto director/creador para el link */
  director?: HeroDirector | null
  /** Score sobre 5, ej. "4.2" */
  score: string
  /** Votos formateados, ej. "12.345" */
  votes: string
  /** Ruta TMDB del poster, ej. "/abc123.jpg" */
  posterPath?: string | null
  /** Ruta TMDB del backdrop */
  backdropPath?: string | null
  /** Tipo de medio: controla la label del director */
  mediaType?: 'movie' | 'tv'
  // --- Estado del usuario ---
  userRating: number
  inVault: boolean
  inWatchlist: boolean
  liked: boolean
  // --- Callbacks ---
  onRate: (value: number) => void
  onToggleVault: () => void
  onToggleWatchlist: () => void
  onToggleFavorite: () => void
  onAddToList: () => void
  onWriteReview: () => void
  onShare: () => void
}

export function Hero({
  title,
  originalTitle,
  releaseYear,
  country,
  runtime,
  genresText,
  director,
  score,
  votes,
  posterPath,
  backdropPath,
  mediaType = 'movie',
  userRating,
  inVault,
  inWatchlist,
  liked,
  onRate,
  onToggleVault,
  onToggleWatchlist,
  onToggleFavorite,
  onAddToList,
  onWriteReview,
  onShare,
}: MediaHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const actionMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, left: 0 })

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const posterY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  const posterUrl = posterPath ? `${TMDB_BASE}w342${posterPath}` : ''
  const backdropUrl = backdropPath ? `${TMDB_BASE}w1280${backdropPath}` : ''
  const directorLabel = mediaType === 'tv' ? 'Una serie creada por' : 'Una película de'

  useEffect(() => {
    if (!actionMenuOpen) return

    const updatePos = () => {
      const rect = actionMenuButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      setActionMenuPos({
        top: rect.bottom + 8,
        left: Math.max(10, rect.right - 190),
      })
    }

    updatePos()

    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (actionMenuRef.current?.contains(target)) return
      if (actionMenuButtonRef.current?.contains(target)) return
      setActionMenuOpen(false)
    }

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActionMenuOpen(false)
    }

    const timerId = setTimeout(() => document.addEventListener('mousedown', onOutside), 0)
    window.addEventListener('keydown', onEscape)
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)

    return () => {
      clearTimeout(timerId)
      document.removeEventListener('mousedown', onOutside)
      window.removeEventListener('keydown', onEscape)
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [actionMenuOpen])

  return (
    <div ref={heroRef} className="md-hero">
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d1118 0%, #08090d 40%, #0a0c08 100%)' }} />

      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="md-hero-backdrop"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.47) saturate(0.76)',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.78) 28%, rgba(8,8,8,0.5) 46%, rgba(8,8,8,0.2) 68%, rgba(8,8,8,0.04) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 58% 70% at 24% 52%, rgba(8,8,8,0.5) 0%, rgba(8,8,8,0.24) 52%, rgba(8,8,8,0.06) 78%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 42% 56% at 80% 42%, rgba(8,8,8,0.52) 0%, rgba(8,8,8,0.3) 34%, rgba(8,8,8,0.1) 64%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 36% 50% at 80% 42%, rgba(212,175,122,0.14) 0%, rgba(212,175,122,0.08) 34%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 500, height: 400, background: 'radial-gradient(ellipse at bottom left, rgba(212,175,122,0.10), transparent 70%)', pointerEvents: 'none' }} />

      {posterUrl && (
        <motion.div
          className="md-hero-poster md-hero-poster-desktop"
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ y: posterY, position: 'absolute', top: '15%', right: '12%', zIndex: 10, width: '300px' }}
        >
          <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
            <Img
              src={posterUrl}
              alt={`${title} poster`}
              loading="eager"
              fetchPriority="high"
              width={500}
              height={750}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6) brightness(0.85)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.25) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(212,175,122,0.15)', borderRadius: 2 }} />
          </div>
        </motion.div>
      )}

      <motion.div
        className="md-hero-content"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
      >
        <div className="md-meta-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#D4AF7A', padding: '4px 10px', border: '1px solid #9A7A48', fontFamily: 'Syne, sans-serif' }}>{genresText}</span>
          <span style={{ color: '#D0D0D0', fontSize: 12 }}>·</span>
          <span style={{ fontSize: 11, color: '#D8D8D8', letterSpacing: '0.08em', fontFamily: 'Syne, sans-serif' }}>
            {releaseYear} · {country} · {runtime}
          </span>
        </div>

        <div className="md-title-block">
          <div className="md-title-text-group">
            <h1 className="md-hero-title">{title}</h1>
            {originalTitle && originalTitle !== title && (
              <div className="md-hero-subtitle">{originalTitle}</div>
            )}
            <div className="md-hero-director">
              <span>{directorLabel}</span>{' '}
              {director ? (
                <Link to={`/person/${director.id}`} style={{ color: '#D4AF7A', textDecoration: 'none' }}>
                  {director.name}
                </Link>
              ) : (
                'Desconocido'
              )}
            </div>
          </div>

          {posterUrl && (
            <div className="md-hero-poster md-only-mobile">
              <div
                style={{ backgroundImage: `url(${TMDB_BASE}w500${posterPath})`, backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '2/3', borderRadius: '6px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              />
            </div>
          )}
        </div>

        <div className="md-hero-ratings">
          <StarRating value={userRating} onChange={onRate} />

          <div className="md-hero-score">
            <div className="md-score-number-group">
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 300, color: '#C8A96E', lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 16, color: '#D2D2D2', fontFamily: 'Syne, sans-serif' }}>/5</span>
            </div>
            <div className="md-score-info-stack">
              <span style={{ fontSize: 10, color: '#D2D2D2', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>CINEVAULT</span>
              <span style={{ fontSize: 11, color: '#CACACA', fontFamily: 'Syne, sans-serif' }}>{votes} ratings</span>
            </div>
          </div>
        </div>

        <div className="md-actions-row">
          <button
            onClick={onToggleVault}
            className="md-action-btn"
            style={{ padding: '0 24px', background: inVault ? '#9A7A48' : '#D4AF7A', color: '#080808' }}
          >
            {inVault ? '✓ En mi Vault' : '+ Vault'}
          </button>

          <button
            onClick={onWriteReview}
            className="md-action-btn"
            style={{ padding: '0 24px', background: 'transparent', color: '#D0D0D0', border: '1px solid #3A3A3A', gap: 8 }}
          >
            <MessageSquare size={13} strokeWidth={1.5} />
            Review o log
          </button>

          <div className="md-action-icons-row">
            <button
              title="Watchlist"
              aria-label="Añadir a mi lista de seguimiento"
              onClick={onToggleWatchlist}
              className="md-action-icon-btn"
              style={{ color: inWatchlist ? '#D4AF7A' : '#A1A1A1', border: `1px solid ${inWatchlist ? '#9A7A48' : '#252525'}` }}
            >
              <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>

            <button
              title="Me gusta"
              aria-label="Marcar como película favorita"
              onClick={onToggleFavorite}
              className="md-action-icon-btn"
              style={{ color: liked ? '#D4AF7A' : '#A1A1A1', border: `1px solid ${liked ? '#9A7A48' : '#252525'}` }}
            >
              <Heart size={15} strokeWidth={1.5} fill={liked ? 'currentColor' : 'none'} />
            </button>

            <div ref={actionMenuRef} className="md-menu-wrapper">
              <button
                ref={actionMenuButtonRef}
                title="Más opciones"
                aria-label="Más opciones"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionMenuOpen((prev) => !prev)
                }}
                className="md-action-icon-btn"
                style={{ color: actionMenuOpen ? '#D4AF7A' : '#A1A1A1', border: `1px solid ${actionMenuOpen ? '#9A7A48' : '#252525'}` }}
              >
                <Menu size={15} strokeWidth={1.8} />
              </button>

              {actionMenuOpen && actionMenuPos.top !== 0 && (
                <div
                  className="md-dropdown-menu"
                  style={{ position: 'fixed', top: actionMenuPos.top, left: actionMenuPos.left, minWidth: 180, border: '1px solid #252525', background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(10px)', boxShadow: '0 18px 40px rgba(0,0,0,0.45)', padding: 6, display: 'grid', gap: 4, zIndex: 30 }}
                >
                  <button className="md-menu-item" onClick={() => { setActionMenuOpen(false); onAddToList() }}>
                    <List size={14} strokeWidth={1.8} />
                    <span>Añadir a lista</span>
                  </button>
                  <button className="md-menu-item" onClick={() => { setActionMenuOpen(false); onShare() }}>
                    <Share2 size={14} strokeWidth={1.8} />
                    <span>Compartir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div className="md-hero-scroll-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ position: 'absolute', bottom: 290, left: 52, alignItems: 'center', gap: 12, zIndex: 50 }}>
        <div style={{ width: 32, height: 1, background: 'rgba(226,226,226,0.58)', position: 'relative', overflow: 'hidden' }}>
          <motion.div animate={{ x: ['-100%', '0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, background: C.accent }} />
        </div>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#DADADA', fontFamily: SANS }}>Seguir leyendo</span>
      </motion.div>
    </div>
  )
}
