import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Search, Settings, Share2, Edit3, X, UserPlus, UserMinus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { backdropImages, IMG } from './assets'
import { createSlug } from '../../utils/stringUtils'
import { C, SANS, SERIF, inputButtonReset } from './theme'
import { Img } from './primitives'
import type { ProfileConnection, ProfileHeaderData, ProfileStatsData } from './models'
import { searchMovies, type SearchSuggestionItem } from '../../services/searchServices'

export const TAB_LIST = ['Resumen', 'Vault', 'Diario', 'Watchlist', 'Reseñas', 'Listas'] as const

export function Navbar({
  onNavigateHome,
  onSearch,
}: {
  onNavigateHome: () => void
  onSearch: (query: string) => void
}) {
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchSuggestionItem[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const trimmedQuery = searchQuery.trim()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [trimmedQuery])

  useEffect(() => {
    if (!debouncedQuery) {
      return
    }

    searchMovies(debouncedQuery)
      .then((data: { results?: SearchSuggestionItem[] }) => {
        setSearchResults(Array.isArray(data?.results) ? data.results : [])
      })
      .catch(() => {
        setSearchResults([])
      })
      .finally(() => {
        setIsSearching(false)
      })
  }, [debouncedQuery])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const visibleResults = useMemo(() => {
    if (!debouncedQuery) return [] as SearchSuggestionItem[]
    return searchResults.slice(0, 6)
  }, [debouncedQuery, searchResults])

  const submitSearch = () => {
    if (!trimmedQuery) return
    onSearch(trimmedQuery)
    setIsSearchOpen(false)
  }

  const goToItem = (item: SearchSuggestionItem) => {
    const label = item.title || item.name || 'sin-titulo'
    if (item.media_type === 'person') {
      navigate(`/person/${item.id}`)
    } else if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`)
    } else {
      navigate(`/movie/${item.id}-${createSlug(label)}`)
    }
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <nav
      className="profile-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(8,8,8,0.98) 0%, transparent 100%)',
        fontFamily: SANS,
      }}
    >
      <button
        onClick={onNavigateHome}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '0.12em',
          color: C.text,
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        Cine<span style={{ color: C.accent }}>Vault</span>
      </button>

      <ul className="profile-nav-links" style={{ gap: 36, listStyle: 'none', margin: 0, padding: 0 }}>
        {['Explorar', 'Feed', 'Esta noche', 'Diario', 'Perfil'].map((link) => {
          const isActive = link === 'Perfil'
          return (
            <li key={link}>
              <button
                onClick={() => {
                  if (link === 'Explorar') onNavigateHome()
                  if (link === 'Diario') navigate('/diary')
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: isActive ? C.text : C.textSoft,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  paddingBottom: isActive ? 4 : 0,
                  borderBottom: isActive ? `1px solid ${C.accent}` : 'none',
                }}
              >
                {link}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="profile-nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
        <div ref={wrapperRef} className="profile-nav-search-wrapper" style={{ position: 'relative' }}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitSearch()
            }}
            style={{
              height: 40,
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: 'rgba(14,14,14,0.98)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px 0 16px',
              gap: 10,
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                const nextValue = event.target.value
                const nextTrimmed = nextValue.trim()
                setSearchQuery(nextValue)
                if (!nextTrimmed) {
                  setSearchResults([])
                  setIsSearching(false)
                } else {
                  setIsSearching(true)
                }
                setIsSearchOpen(true)
              }}
              placeholder="Buscar"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: SANS,
                fontSize: 16,
                color: C.text,
              }}
            />
            <button type="submit" style={{ ...inputButtonReset, color: C.textSoft, padding: 2 }}>
              <Search size={17} />
            </button>
          </form>

          {isSearchOpen && trimmedQuery && (
            <div
              className="profile-search-dropdown"
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 'min(92vw, 420px)',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: 'rgba(7,8,11,0.98)',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
                maxHeight: '65vh',
                overflowY: 'auto',
              }}
            >
              {isSearching && (
                <div style={{ padding: '12px 14px', fontSize: 11, letterSpacing: '0.08em', color: C.textSoft, textTransform: 'uppercase' }}>
                  Buscando...
                </div>
              )}

              {!isSearching && visibleResults.length > 0 && (
                <div>
                  {visibleResults.map((movie) => (
                    <button
                      key={`${movie.media_type || 'movie'}-${movie.id}`}
                      onClick={() => goToItem(movie)}
                      className="profile-search-item"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        padding: 10,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${C.border}`,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: C.text,
                      }}
                    >
                      <Img
                        src={movie.media_type === 'person'
                          ? (movie.profile_path ? `https://image.tmdb.org/t/p/w92${movie.profile_path}` : '/no-poster.svg')
                          : (movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/no-poster.svg')}
                        alt={movie.title || movie.name || 'Sin titulo'}
                        style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                      />
                      <span
                        className="profile-search-title"
                        style={{
                          fontFamily: SANS,
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          textTransform: 'uppercase',
                          lineHeight: 1.2,
                        }}
                      >
                        {movie.title || movie.name || 'Sin titulo'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && visibleResults.length === 0 && (
                <div style={{ padding: '12px 14px', fontSize: 11, letterSpacing: '0.08em', color: C.textSoft, textTransform: 'uppercase' }}>
                  Sin resultados para "{trimmedQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <button style={{ ...inputButtonReset, color: C.textSoft, padding: 4, position: 'relative' }}>
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 6,
              height: 6,
              background: C.accent,
              borderRadius: '50%',
            }}
          />
        </button>

        <div className="profile-mobile-only" style={{ position: 'relative', display: 'none' }}>
          <button
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            style={{
              ...inputButtonReset,
              color: C.textSoft,
              padding: '8px 9px',
              border: `1px solid ${C.border}`,
              borderRadius: 999,
            }}
          >
            <span style={{ fontSize: 11, letterSpacing: '0.08em' }}>Menu</span>
          </button>

          {isMobileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 42,
                minWidth: 170,
                border: `1px solid ${C.border}`,
                background: 'rgba(7,8,11,0.98)',
                padding: 8,
                display: 'grid',
                gap: 6,
              }}
            >
              {['Explorar', 'Feed', 'Esta noche', 'Diario', 'Perfil'].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === 'Explorar') onNavigateHome()
                    if (label === 'Diario') navigate('/diary')
                    setIsMobileMenuOpen(false)
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: C.text,
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontFamily: SANS,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export function ProfileHero({
  header,
  stats,
  followers,
  following,
  onNavigateToUser,
  canEditProfile,
  isPublicProfile,
  isFollowing,
  followBusy,
  onToggleFollow,
  onEditProfile,
  onOpenSettings,
}: {
  header: ProfileHeaderData
  stats: ProfileStatsData
  followers: ProfileConnection[]
  following: ProfileConnection[]
  onNavigateToUser: (username: string) => void
  canEditProfile: boolean
  isPublicProfile?: boolean
  isFollowing?: boolean
  followBusy?: boolean
  onToggleFollow?: () => void
  onEditProfile?: () => void
  onOpenSettings?: () => void
}) {
  const [openList, setOpenList] = useState<'followers' | 'following' | null>(null)
  const listItems = openList === 'followers' ? followers : following

  useEffect(() => {
    if (!openList) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenList(null)
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [openList])

  return (
    <div className="profile-hero">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 2,
          opacity: 0.22,
          filter: 'blur(1px)',
        }}
      >
        {backdropImages.map((src, index) => (
          <div key={index} style={{ overflow: 'hidden', height: '100%' }}>
            <Img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} />
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, transparent 0%, rgba(8,8,8,0.3) 40%, rgba(8,8,8,0.88) 75%, ${C.bg} 100%)`,
        }}
      />

      <motion.div
        className="profile-hero-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            className="profile-hero-avatar-wrapper"
            style={{
              borderRadius: '50%',
              border: `2px solid ${C.accent}`,
              overflow: 'hidden',
              boxShadow: `0 0 40px ${C.accentGlow}`,
            }}
          >
            <Img src={header.avatarUrl} alt={header.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, background: C.accent, borderRadius: '50%', border: `2px solid ${C.bg}` }} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="profile-hero-name" style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em', color: C.text, marginBottom: 6 }}>
            {header.displayName}
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, letterSpacing: '0.12em', fontFamily: SANS, marginBottom: 12 }}>
            @{header.username} · miembro desde {header.memberSince}
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: C.textSoft, maxWidth: 520, lineHeight: 1.5 }}>
            {header.bio}
          </div>

          {canEditProfile && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={onEditProfile}
                style={{
                  padding: '8px 20px',
                  background: C.accent,
                  color: C.bg,
                  border: 'none',
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Edit3 size={11} /> Editar perfil
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: C.textSoft,
                  border: `1px solid ${C.border}`,
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Share2 size={11} /> Compartir
              </button>
              <button onClick={onOpenSettings} style={{ padding: '8px 12px', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <Settings size={13} />
              </button>
            </div>
          )}

          {!canEditProfile && isPublicProfile && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={onToggleFollow}
                disabled={followBusy}
                style={{
                  padding: '8px 16px',
                  background: isFollowing ? 'transparent' : C.accent,
                  color: isFollowing ? C.textSoft : C.bg,
                  border: `1px solid ${isFollowing ? C.border : C.accentDim}`,
                  fontFamily: SANS,
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: followBusy ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isFollowing ? <UserMinus size={11} /> : <UserPlus size={11} />}
                {followBusy ? 'Actualizando...' : isFollowing ? 'Dejar de seguir' : 'Seguir'}
              </button>
            </div>
          )}
        </div>

        <div className="profile-hero-stats-wrapper">
          {[
            { num: String(stats.views), label: 'vistas' },
            { num: String(stats.reviews), label: 'reseñas' },
            { num: String(stats.watchlist), label: 'watchlist' },
          ].map((item) => (
            <div key={item.label} className="profile-hero-stat-item" style={{ textAlign: 'center' }}>
              <span className="profile-hero-stat-num" style={{ fontFamily: SERIF, fontWeight: 300, display: 'block', color: C.text, lineHeight: 1 }}>{item.num}</span>
              <span className="profile-hero-stat-label" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, marginTop: 3, display: 'block', fontFamily: SANS }}>
                {item.label}
              </span>
            </div>
          ))}
          <button
            onClick={() => setOpenList(openList === 'following' ? null : 'following')}
            className="profile-hero-stat-item"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'center', padding: 0 }}
          >
            <span className="profile-hero-stat-num" style={{ fontFamily: SERIF, fontWeight: 300, display: 'block', color: C.text, lineHeight: 1 }}>{stats.following}</span>
            <span className="profile-hero-stat-label" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, marginTop: 3, display: 'block', fontFamily: SANS }}>
              following
            </span>
          </button>
          <button
            onClick={() => setOpenList(openList === 'followers' ? null : 'followers')}
            className="profile-hero-stat-item"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'center', padding: 0 }}
          >
            <span className="profile-hero-stat-num" style={{ fontFamily: SERIF, fontWeight: 300, display: 'block', color: C.text, lineHeight: 1 }}>{stats.followers}</span>
            <span className="profile-hero-stat-label" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, marginTop: 3, display: 'block', fontFamily: SANS }}>
              followers
            </span>
          </button>
        </div>

      </motion.div>

      <AnimatePresence>
        {openList && (
          <motion.div
            onClick={() => setOpenList(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 120,
              background: 'rgba(4,5,8,0.62)',
              backdropFilter: 'blur(2px)',
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: 420,
                maxHeight: 'min(78vh, 620px)',
                overflow: 'hidden',
                border: `1px solid ${C.border}`,
                background: 'linear-gradient(160deg, rgba(15,18,25,0.98) 0%, rgba(9,11,16,0.98) 100%)',
                boxShadow: '0 28px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 14px 10px',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent, fontFamily: SANS }}>
                  {openList === 'followers' ? 'Followers' : 'Following'}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenList(null)}
                  aria-label="Cerrar popup"
                  style={{
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.textSoft,
                    width: 30,
                    height: 30,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ maxHeight: 'calc(min(78vh, 620px) - 56px)', overflowY: 'auto', padding: '8px 10px 10px' }}>
                {listItems.length === 0 && (
                  <div style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: 'italic', padding: '10px 6px 12px' }}>
                    Aún no hay usuarios aquí.
                  </div>
                )}
                {listItems.map((user) => (
                  <button
                    key={`${openList}-${user.id}`}
                    onClick={() => {
                      setOpenList(null)
                      onNavigateToUser(user.username)
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 8px',
                      color: C.text,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${C.border}`, flexShrink: 0 }}>
                      <Img src={user.avatarUrl || IMG.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontFamily: SANS, fontSize: 13 }}>@{user.username}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TabsBar({ active, onSelect }: { active: string; onSelect: (tab: string) => void }) {
  return (
    <div
      className="profile-tabs-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8,8,8,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        gap: 0,
        fontFamily: SANS,
      }}
    >
      {TAB_LIST.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className="profile-tab-btn"
          style={{
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: active === tab ? C.text : C.textSoft,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: active === tab ? `2px solid ${C.accent}` : '2px solid transparent',
            marginBottom: -1,
            transition: 'color 0.2s, border-color 0.2s',
            fontFamily: SANS,
            flex: '0 0 auto',
            whiteSpace: 'nowrap',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function Footer() {
  return (
    <div
      className="profile-footer"
      style={{
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMuted }}>
        Cine<span style={{ color: C.accent }}>Vault</span>
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SERIF, fontStyle: 'italic' }}>
        "Toda gran colección empieza con una."
      </div>
    </div>
  )
}
