// src/features/movie/components/Hero/Hero.tsx
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Bookmark, Heart, List, Menu, MessageSquare, Share2 } from 'lucide-react'
import { StarRating } from '../StarRating'
import { Img } from '../Img'
import styles from './Hero.module.css'

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
    <div ref={heroRef} className={styles.hero}>
      {/* Fondo base */}
      <div className={styles.heroBg} />

      {/* Backdrop */}
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className={styles.heroBackdrop}
        />
      )}

      {/* Overlays de gradiente */}
      <div className={styles.heroOverlay} />
      <div className={styles.heroGlow} />

      {/* Poster flotante (solo desktop) */}
      {posterUrl && (
        <motion.div
          className={`${styles.heroPoster} ${styles.heroPosterDesktop}`}
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ y: posterY }}
        >
          <div className={styles.posterFrame}>
            <Img
              src={posterUrl}
              alt={`${title} poster`}
              loading="eager"
              fetchPriority="high"
              width={500}
              height={750}
              className={styles.posterImg}
            />
            <div className={styles.posterSheen} />
            <div className={styles.posterBorder} />
          </div>
        </motion.div>
      )}

      {/* Contenido principal */}
      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
      >
        {/* Metadata superior */}
        <div className={styles.metaRow}>
          <span className={styles.genreBadge}>{genresText}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaInfo}>
            {releaseYear} · {country} · {runtime}
          </span>
        </div>

        {/* Bloque título */}
        <div className={styles.titleBlock}>
          <div className={styles.titleTextGroup}>
            <h1 className={styles.title}>{title}</h1>
            {originalTitle && originalTitle !== title && (
              <div className={styles.subtitle}>{originalTitle}</div>
            )}
            <div className={styles.directorLine}>
              <span>{directorLabel}</span>{' '}
              {director ? (
                <Link to={`/person/${director.id}`} className={styles.directorLink}>
                  {director.name}
                </Link>
              ) : (
                'Desconocido'
              )}
            </div>
          </div>

          {/* Poster en mobile (columna derecha) */}
          {posterUrl && (
            <div className={`${styles.heroPoster} ${styles.heroPosterMobile}`}>
              <div
                className={styles.posterMobileImg}
                style={{ backgroundImage: `url(${TMDB_BASE}w500${posterPath})` }}
              />
            </div>
          )}
        </div>

        {/* Ratings */}
        <div className={styles.ratingsRow}>
          <StarRating value={userRating} onChange={onRate} />

          <div className={styles.scoreBlock}>
            <div className={styles.scoreNumberGroup}>
              <span className={styles.scoreNumber}>{score}</span>
              <span className={styles.scoreOver}>/5</span>
            </div>
            <div className={styles.scoreInfoStack}>
              <span className={styles.scoreLabel}>CINEVAULT</span>
              <span className={styles.scoreVotes}>{votes} ratings</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.actionsRow}>
          <button
            onClick={onToggleVault}
            className={`${styles.actionBtn} ${inVault ? styles.actionBtnActive : styles.actionBtnPrimary}`}
          >
            {inVault ? '✓ En mi Vault' : '+ Vault'}
          </button>

          <button
            onClick={onWriteReview}
            className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
          >
            <MessageSquare size={13} strokeWidth={1.5} />
            Review o log
          </button>

          <div className={styles.iconGroup}>
            <button
              title="Watchlist"
              aria-label="Añadir a mi lista de seguimiento"
              onClick={onToggleWatchlist}
              className={`${styles.iconBtn} ${inWatchlist ? styles.iconBtnActive : ''}`}
            >
              <Bookmark size={15} strokeWidth={1.5} fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>

            <button
              title="Me gusta"
              aria-label="Marcar como película favorita"
              onClick={onToggleFavorite}
              className={`${styles.iconBtn} ${liked ? styles.iconBtnActive : ''}`}
            >
              <Heart size={15} strokeWidth={1.5} fill={liked ? 'currentColor' : 'none'} />
            </button>

            <div ref={actionMenuRef} className={styles.menuWrapper}>
              <button
                ref={actionMenuButtonRef}
                title="Más opciones"
                aria-label="Más opciones"
                onClick={(e) => {
                  e.stopPropagation()
                  setActionMenuOpen((prev) => !prev)
                }}
                className={`${styles.iconBtn} ${actionMenuOpen ? styles.iconBtnActive : ''}`}
              >
                <Menu size={15} strokeWidth={1.8} />
              </button>

              {actionMenuOpen && actionMenuPos.top !== 0 && (
                <div
                  className={styles.dropdownMenu}
                  style={{ top: actionMenuPos.top, left: actionMenuPos.left }}
                >
                  <button className={styles.dropdownItem} onClick={() => { setActionMenuOpen(false); onAddToList() }}>
                    <List size={14} strokeWidth={1.8} />
                    <span>Añadir a lista</span>
                  </button>
                  <button className={styles.dropdownItem} onClick={() => { setActionMenuOpen(false); onShare() }}>
                    <Share2 size={14} strokeWidth={1.8} />
                    <span>Compartir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll prompt */}
      <motion.div
        className={styles.scrollPrompt}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className={styles.scrollLine}>
          <motion.div
            className={styles.scrollLineFill}
            animate={{ x: ['-100%', '0%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
        </div>
        <span className={styles.scrollText}>Seguir leyendo</span>
      </motion.div>
    </div>
  )
}