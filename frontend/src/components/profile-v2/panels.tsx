import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart2,
  BookOpen,
  Check,
  Clock,
  Eye,
  Film,
  Filter,
  Globe,
  Lock,
  Play,
  Plus,
  SortDesc,
  Trophy,
  Upload,
} from 'lucide-react'
import { C, SANS, SERIF, textClampOneLine } from './theme'
import { Badge, Img, SectionHeader, Stars } from './primitives'
import { vaultMockItems, userListsMock, IMG } from './assets'
import type { RecentlyWatchedItem, ReviewItem, WatchlistItem } from './models'
import { createSlug } from '../../utils/stringUtils'

const movieHref = (movieId: number, title: string, tmdbId: number | null) => `/movie/${tmdbId ?? movieId}-${createSlug(title)}`

function NightRec({ recommendation, isMobile }: { recommendation: WatchlistItem | null; isMobile: boolean }) {
  const [watched, setWatched] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        padding: isMobile ? '18px 16px' : '24px 28px',
        marginBottom: 48,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 14 : 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 200,
          height: '100%',
          background: `linear-gradient(90deg, ${C.accentGlow}, transparent)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: 54, flexShrink: 0, aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        <Img
          src={recommendation?.posterUrl || IMG.cinema}
          alt={recommendation?.title || 'Recomendación'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5)' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent, marginBottom: 6, display: 'block', fontFamily: SANS }}>
          Esta noche, sin excusas
        </span>
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 20 : 24, fontWeight: 400, lineHeight: 1.2, color: C.text }}>
          {recommendation?.title || 'Sin recomendación'}
        </div>
        <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, fontFamily: SANS }}>
          {recommendation
            ? `${recommendation.director} · ${recommendation.year || 'Año desconocido'} · Drama`
            : 'Agrega películas a tu watchlist para tener recomendación automática.'}
        </div>
      </div>

      <div style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 8, position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => setWatched((value) => !value)}
          style={{
            padding: '10px 18px',
            background: watched ? C.accentDim : C.accent,
            color: C.bg,
            border: 'none',
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {watched ? <><Check size={11} /> Vista</> : 'Marcar como vista'}
        </button>
        <div style={{ fontSize: 11, color: C.gold, display: 'flex', alignItems: 'center', gap: 5, fontFamily: SANS, flexWrap: 'wrap' }}>
          <Trophy size={11} /> +40 pts si la ves esta noche
        </div>
      </div>
    </motion.div>
  )
}

// FilmCard horizontal compacta solo para móvil en Resumen
function FilmCardMobile({ film, delay = 0 }: { film: RecentlyWatchedItem; delay?: number }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
      style={{
        cursor: 'pointer',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: 10,
      }}
    >
      <div style={{ width: 48, height: 70, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
        <Img
          src={film.posterUrl}
          alt={film.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7)' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1.3, marginBottom: 2, ...textClampOneLine }}>
          {film.title}
        </div>
        <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS, marginBottom: 3 }}>{film.year || '—'}</div>
        <Stars rating={film.rating} size={9} />
      </div>
    </motion.div>
  )
}

function FilmCard({ film, delay = 0 }: { film: RecentlyWatchedItem; delay?: number }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
      style={{ cursor: 'pointer' }}
    >
      <div
        style={{
          aspectRatio: '2/3',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 10,
          transform: hovered ? 'translateY(-4px)' : 'none',
          transition: 'transform 0.3s ease',
        }}
      >
        <Img
          src={film.posterUrl}
          alt={film.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: hovered ? 'saturate(1)' : 'saturate(0.7)',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'filter 0.4s ease, transform 0.4s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 50%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 12,
          }}
        >
          <Stars rating={film.rating} size={10} />
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.text, lineHeight: 1.3, marginBottom: 2, fontFamily: SERIF, ...textClampOneLine }}>
        {film.title}
      </div>
      <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{film.year || 'Año desconocido'}</div>
      <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', fontFamily: SERIF, marginTop: 1 }}>{film.director}</div>
    </motion.div>
  )
}

// VaultCard compacta horizontal para móvil en Resumen
function VaultCardMobile({ item, delay = 0 }: { item: (typeof vaultMockItems)[number]; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '10px 12px',
        overflow: 'hidden',
      }}
    >
      {/* thumbnail fijo */}
      <div style={{ width: 64, height: 40, flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
        <Img
          src={item.img}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.4) brightness(0.6)' }}
        />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <Play size={10} fill="white" color="white" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontSize: 14, color: C.text, lineHeight: 1.2, marginBottom: 3, ...textClampOneLine }}>
          {item.title}
        </div>
        <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS, display: 'flex', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{item.duration}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={9} />{item.views}</span>
        </div>
      </div>
      <Badge>{item.type}</Badge>
    </motion.div>
  )
}

function VaultCard({ item, delay = 0 }: { item: (typeof vaultMockItems)[number]; delay?: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.accentDim : C.border}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'border-color 0.3s, transform 0.3s',
        overflow: 'hidden',
      }}
    >
      <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Img
          src={item.img}
          alt={item.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: hovered ? 'saturate(0.7) brightness(0.8)' : 'saturate(0.4) brightness(0.6)',
            transition: 'filter 0.4s',
          }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <Badge>{item.type}</Badge>
        </div>
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `1px solid ${hovered ? C.accent : 'rgba(255,255,255,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            background: hovered ? C.accentGlow : 'rgba(255,255,255,0.05)',
            transition: 'all 0.2s',
          }}
        >
          <Play size={12} fill="white" color="white" style={{ marginLeft: 2 }} />
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 400, lineHeight: 1.3, color: C.text, marginBottom: 4 }}>{item.title}</div>
        <div style={{ fontSize: 11, color: C.textSoft, display: 'flex', gap: 12, alignItems: 'center', fontFamily: SANS }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{item.duration}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={10} />{item.views} vistas</span>
        </div>
      </div>
    </motion.div>
  )
}

function ReviewCard({ review, delay = 0, compact = false }: { review: ReviewItem; delay?: number; compact?: boolean }) {
  const navigate = useNavigate()
  const richText = review.text
    .replace(/<b>/g, `<strong style="color:${C.text};font-style:normal;font-weight:500">`)
    .replace(/<\/b>/g, '</strong>')

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 0', display: 'flex', flexDirection: 'row', gap: 12 }}
      >
        {/* Póster fijo */}
        <div style={{ width: 52, height: 76, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
          <Img src={review.posterUrl} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => navigate(movieHref(review.movieId, review.title, review.tmdbId))}
            style={{ border: 'none', background: 'none', padding: 0, margin: 0, fontFamily: SERIF, fontSize: 17, fontWeight: 400, color: C.text, cursor: 'pointer', textAlign: 'left', display: 'block', marginBottom: 4, ...textClampOneLine }}
          >
            {review.title}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Stars rating={review.rating} size={10} />
            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}>{review.createdAtLabel}</span>
          </div>
          {/* Texto truncado a 2 líneas en móvil */}
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 13,
              fontStyle: 'italic',
              color: C.textSoft,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: richText }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {review.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '2px 7px', fontFamily: SANS }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 0', display: 'grid', gridTemplateColumns: '56px 1fr', gap: 20 }}
    >
      <div style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden' }}>
        <Img src={review.posterUrl} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6)' }} />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(movieHref(review.movieId, review.title, review.tmdbId))}
            style={{ border: 'none', background: 'none', padding: 0, margin: 0, fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: C.text, cursor: 'pointer' }}
          >
            {review.title}
          </button>
          <Stars rating={review.rating} size={11} />
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto', fontFamily: SANS }}>{review.createdAtLabel}</span>
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.textSoft, lineHeight: 1.7, maxWidth: 680 }} dangerouslySetInnerHTML={{ __html: richText }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {review.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSoft, border: `1px solid ${C.border}`, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: SANS }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function WatchlistStrip({ watchlistFilms }: { watchlistFilms: WatchlistItem[] }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 48, scrollbarWidth: 'none' }}>
      {watchlistFilms.slice(0, 8).map((film, index) => (
        <motion.div
          key={film.movieId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          style={{ flexShrink: 0, width: 80, cursor: 'pointer' }}
          onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
        >
          <div
            style={{ aspectRatio: '2/3', borderRadius: 1, overflow: 'hidden', marginBottom: 6, transition: 'transform 0.3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <Img src={film.posterUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6)' }} />
          </div>
          <div style={{ fontSize: 10, color: C.text, fontFamily: SANS, ...textClampOneLine }}>{film.title}</div>
          <div style={{ fontSize: 9, color: C.textSoft, fontFamily: SANS }}>{film.year || '—'}</div>
        </motion.div>
      ))}
      <div style={{ flexShrink: 0, width: 80, cursor: 'pointer' }}>
        <div style={{ aspectRatio: '2/3', borderRadius: 1, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 300, color: C.textSoft }}>+{Math.max(0, watchlistFilms.length - 8)}</span>
        </div>
        <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>más...</div>
      </div>
    </div>
  )
}

export function OverviewPanel({
  recentlyWatched,
  watchlistFilms,
  reviewItems,
  isMobile,
  isTablet,
  onJumpToTab,
}: {
  recentlyWatched: RecentlyWatchedItem[]
  watchlistFilms: WatchlistItem[]
  reviewItems: ReviewItem[]
  isMobile: boolean
  isTablet: boolean
  onJumpToTab: (tab: 'Historial' | 'Vault' | 'Watchlist' | 'Reseñas') => void
}) {
  const recommendation = watchlistFilms[0] || null
  return (
    <div>
      <NightRec recommendation={recommendation} isMobile={isMobile} />

      <SectionHeader title="Vistas recientemente" link="Ver historial" onLinkClick={() => onJumpToTab('Historial')} />
      {isMobile ? (
        // Lista vertical compacta en móvil
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 48 }}>
          {recentlyWatched.slice(0, 4).map((film, index) => (
            <FilmCardMobile key={film.movieId} film={film} delay={index * 0.05} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, marginBottom: 48 }}>
          {recentlyWatched.map((film, index) => (
            <FilmCard key={film.movieId} film={film} delay={index * 0.05} />
          ))}
        </div>
      )}

      <SectionHeader title="Mi Vault" link="Ver todo" onLinkClick={() => onJumpToTab('Vault')} />
      {isMobile ? (
        // Lista compacta horizontal en móvil
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 48 }}>
          {vaultMockItems.slice(0, 3).map((item, index) => (
            <VaultCardMobile key={item.id} item={item} delay={index * 0.08} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          {vaultMockItems.slice(0, 3).map((item, index) => (
            <VaultCard key={item.id} item={item} delay={index * 0.08} />
          ))}
        </div>
      )}

      <SectionHeader title="Última reseña" link="Ver todas" onLinkClick={() => onJumpToTab('Reseñas')} />
      <div style={{ marginBottom: 48 }}>
        {reviewItems[0] ? <ReviewCard review={reviewItems[0]} compact={isMobile} /> : null}
      </div>

      <SectionHeader title="Watchlist" em={`— ${watchlistFilms.length} pendientes`} link="Ver completa" onLinkClick={() => onJumpToTab('Watchlist')} />
      <WatchlistStrip watchlistFilms={watchlistFilms} />
    </div>
  )
}

const VAULT_FILTERS = ['Todo', 'Reflexion', 'Edit', 'Critica', 'Recomendacion']

export function VaultPanel({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) {
  const [filter, setFilter] = useState('Todo')
  const filtered = filter === 'Todo' ? vaultMockItems : vaultMockItems.filter((item) => item.type === filter)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 26, color: C.text }}>
          Mi Vault <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: isMobile ? 17 : 20 }}>— {vaultMockItems.length} publicaciones</em>
        </div>
        <button
          style={{
            padding: '9px 20px',
            background: C.accent,
            color: C.bg,
            border: 'none',
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: isMobile ? 'flex-start' : 'auto',
          }}
        >
          <Upload size={11} /> Subir al Vault
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 28,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          flexWrap: 'nowrap',
          paddingBottom: 4,
        }}
      >
        {VAULT_FILTERS.map((filterName) => (
          <button
            key={filterName}
            onClick={() => setFilter(filterName)}
            style={{
              padding: '6px 16px',
              background: filter === filterName ? C.accent : 'transparent',
              color: filter === filterName ? C.bg : C.textSoft,
              border: `1px solid ${filter === filterName ? C.accent : C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {filterName}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map((item, index) => (
          <VaultCard key={item.id} item={item} delay={index * 0.06} />
        ))}
      </div>
    </div>
  )
}

export function WatchlistPanel({ watchlistFilms, isMobile }: { watchlistFilms: WatchlistItem[]; isMobile: boolean }) {
  const navigate = useNavigate()
  const [watched, setWatched] = useState<number[]>([])
  const toggle = (id: number) => setWatched((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 10,
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 26, color: C.text }}>
          Watchlist <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: isMobile ? 17 : 20 }}>— {watchlistFilms.length} películas</em>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '7px 14px',
              background: 'transparent',
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Filter size={10} /> Filtrar
          </button>
          <button
            style={{
              padding: '7px 14px',
              background: 'transparent',
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <SortDesc size={10} /> Ordenar
          </button>
        </div>
      </div>

      {isMobile ? (
        // Lista vertical en móvil con póster + info
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {watchlistFilms.map((film, index) => {
            const isWatched = watched.includes(film.movieId)
            return (
              <motion.div
                key={film.movieId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ width: 44, height: 64, flexShrink: 0, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <Img
                    src={film.posterUrl}
                    alt={film.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isWatched ? 'grayscale(1) brightness(0.4)' : 'saturate(0.7)', transition: 'filter 0.3s' }}
                  />
                  {film.priority === 'alta' && !isWatched && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 14, color: isWatched ? C.textMuted : C.text, lineHeight: 1.3, marginBottom: 2, ...textClampOneLine }}>
                    {film.title}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{film.year || '—'} · {film.director}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(film.movieId) }}
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `1px solid ${isWatched ? C.accent : C.border}`,
                    background: isWatched ? C.accent : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {isWatched && <Check size={12} color={C.bg} />}
                </button>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
          {watchlistFilms.map((film, index) => {
            const isWatched = watched.includes(film.movieId)
            return (
              <motion.div
                key={film.movieId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
              >
                <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
                  <Img
                    src={film.posterUrl}
                    alt={film.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isWatched ? 'grayscale(1) brightness(0.4)' : 'saturate(0.7)', transition: 'filter 0.3s' }}
                  />
                  {film.priority === 'alta' && !isWatched && (
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(film.movieId) }}
                    style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isWatched && (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={14} color={C.bg} />
                      </div>
                    )}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: isWatched ? C.textMuted : C.text, fontFamily: SANS, lineHeight: 1.3, marginBottom: 2, ...textClampOneLine }}>
                  {film.title}
                </div>
                <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{film.year || 'Año desconocido'}</div>
                <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', fontFamily: SERIF }}>{film.director}</div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function HistoryPanel({ recentlyWatched, isMobile }: { recentlyWatched: RecentlyWatchedItem[]; isMobile: boolean }) {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 26, color: C.text }}>
          Historial <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: isMobile ? 17 : 20 }}>— {recentlyWatched.length} vistas recientes</em>
        </div>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recentlyWatched.map((film, index) => (
            <FilmCardMobile key={film.movieId} film={film} delay={index * 0.03} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
          {recentlyWatched.map((film, index) => (
            <motion.div
              key={film.movieId}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(movieHref(film.movieId, film.title, film.tmdbId))}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ aspectRatio: '2/3', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                <Img src={film.posterUrl} alt={film.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.72)' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text, lineHeight: 1.3, marginBottom: 2, fontFamily: SERIF, ...textClampOneLine }}>
                {film.title}
              </div>
              <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{film.year || 'Año desconocido'}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontStyle: 'italic', fontFamily: SERIF, marginTop: 1 }}>{film.director}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReviewsPanel({ reviewItems, isMobile }: { reviewItems: ReviewItem[]; isMobile: boolean }) {
  const [sort, setSort] = useState('Reciente')
  const sortedReviews = useMemo(() => {
    if (sort === 'Rating') return [...reviewItems].sort((a, b) => b.rating - a.rating)
    if (sort === 'Película') return [...reviewItems].sort((a, b) => a.title.localeCompare(b.title))
    return reviewItems
  }, [reviewItems, sort])

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 26, color: C.text }}>
          Reseñas <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: isMobile ? 17 : 20 }}>— {reviewItems.length} escritas</em>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          {['Reciente', 'Rating', 'Película'].map((sortName) => (
            <button
              key={sortName}
              onClick={() => setSort(sortName)}
              style={{
                padding: '6px 14px',
                background: sort === sortName ? C.elevated : 'transparent',
                color: sort === sortName ? C.text : C.textSoft,
                border: `1px solid ${C.border}`,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                flex: isMobile ? 1 : undefined,
              }}
            >
              {sortName}
            </button>
          ))}
        </div>
      </div>
      <div>
        {sortedReviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} delay={index * 0.07} compact={isMobile} />
        ))}
      </div>
      <button
        style={{
          marginTop: 32,
          padding: '12px 28px',
          background: 'transparent',
          color: C.accent,
          border: `1px solid ${C.accentDim}`,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'center' : 'flex-start',
        }}
      >
        <BookOpen size={12} /> Escribir nueva reseña
      </button>
    </div>
  )
}

export function ListsPanel({ isMobile }: { isMobile: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 22 : 26, color: C.text }}>
          Listas <em style={{ fontStyle: 'italic', color: C.textSoft, fontSize: isMobile ? 17 : 20 }}>— {userListsMock.length} curadas</em>
        </div>
        <button
          style={{
            padding: '9px 20px',
            background: 'transparent',
            color: C.accent,
            border: `1px solid ${C.accentDim}`,
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: isMobile ? 'flex-start' : 'auto',
          }}
        >
          <Plus size={11} /> Nueva lista
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        {userListsMock.map((list, index) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{ background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.3s' }}
            whileHover={{ borderColor: C.accentDim, y: -3 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', aspectRatio: '16/7', overflow: 'hidden' }}>
              {list.covers.map((src, coverIndex) => (
                <div key={coverIndex} style={{ overflow: 'hidden' }}>
                  <Img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.7)' }} />
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: C.text, lineHeight: 1.2 }}>{list.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.textSoft, flexShrink: 0, marginLeft: 12 }}>
                  {list.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                  <span style={{ fontSize: 10, fontFamily: SANS }}>{list.count} films</span>
                </div>
              </div>
              <div style={{ fontSize: 13, fontFamily: SERIF, fontStyle: 'italic', color: C.textSoft, lineHeight: 1.5 }}>{list.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ActivityStats() {
  const monthData = [
    { month: 'Oct', count: 8 },
    { month: 'Nov', count: 14 },
    { month: 'Dic', count: 11 },
    { month: 'Ene', count: 6 },
    { month: 'Feb', count: 19 },
    { month: 'Mar', count: 12 },
  ]
  const max = Math.max(...monthData.map((m) => m.count))

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart2 size={13} color={C.accent} />
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS }}>Actividad 2025</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
        {monthData.map(({ month, count }) => (
          <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', background: C.accent, opacity: 0.4 + (count / max) * 0.6, height: `${(count / max) * 48}px`, borderRadius: 1, transition: 'all 0.3s' }} />
            <span style={{ fontSize: 9, color: C.textMuted, fontFamily: SANS, letterSpacing: '0.1em' }}>{month}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: C.textSoft, fontFamily: SANS }}>
        <span style={{ color: C.text }}>70</span> películas este año · mejor mes: <span style={{ color: C.text }}>Febrero</span>
      </div>
    </div>
  )
}

function GenreSidebar() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 24 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Film size={12} color={C.accent} /> Géneros favoritos
      </div>
      {[['Slow cinema', 82], ['Drama', 71], ['Documental', 55], ['Sci-fi', 34], ['Noir', 28]].map(([genre, percent]) => (
        <div key={String(genre)} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: C.text, fontFamily: SANS }}>{genre}</span>
            <span style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{percent}%</span>
          </div>
          <div style={{ height: 2, background: C.border, borderRadius: 1 }}>
            <div style={{ height: '100%', width: `${percent}%`, background: C.accent, borderRadius: 1 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AchievementsSidebar() {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, fontFamily: SANS, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Trophy size={12} color={C.gold} /> Logros recientes
      </div>
      {[
        { icon: '🎞️', title: 'Maratonista', desc: '5 películas en una semana' },
        { icon: '✍️', title: 'Crítica en desarrollo', desc: '50 reseñas escritas' },
        { icon: '🕯️', title: 'Ritual nocturno', desc: '7 noches seguidas' },
      ].map((badge) => (
        <div key={badge.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{badge.icon}</span>
          <div>
            <div style={{ fontSize: 12, color: C.text, fontFamily: SANS, marginBottom: 2 }}>{badge.title}</div>
            <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>{badge.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSidebar({ isTabletOrDown }: { isTabletOrDown: boolean }) {
  if (isTabletOrDown) return null
  return (
    <aside>
      <div style={{ position: 'sticky', top: 60 }}>
        <ActivityStats />
        <GenreSidebar />
        <AchievementsSidebar />
      </div>
    </aside>
  )
}