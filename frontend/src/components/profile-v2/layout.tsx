import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Search, Settings, Share2, Edit3 } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { backdropImages } from './assets'
import { createSlug } from '../../utils/stringUtils'
import { C, SANS, SERIF, inputButtonReset } from './theme'
import { Img } from './primitives'
import type { ProfileHeaderData, ProfileStatsData } from './models'
import { searchMovies } from '../../services/searchServices'

export const TAB_LIST = ['Resumen', 'Vault', 'Watchlist', 'Reseñas', 'Listas'] as const

type SearchMovieResult = {
  id: number
  title: string
  poster_path?: string | null
}

export function Navbar({
  onNavigateHome,
  onSearch,
  isMobile,
}: {
  onNavigateHome: () => void
  onSearch: (query: string) => void
  isMobile: boolean
}) {
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchMovieResult[]>([])
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
      .then((data: { results?: SearchMovieResult[] }) => {
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
    if (!debouncedQuery) return [] as SearchMovieResult[]
    return searchResults.slice(0, 6)
  }, [debouncedQuery, searchResults])

  const submitSearch = () => {
    if (!trimmedQuery) return
    onSearch(trimmedQuery)
    setIsSearchOpen(false)
  }

  const goToMovie = (movie: SearchMovieResult) => {
    navigate(`/movie/${movie.id}-${createSlug(movie.title)}`)
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '14px 16px' : '20px 48px',
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

      <ul style={{ display: isMobile ? 'none' : 'flex', gap: 36, listStyle: 'none', margin: 0, padding: 0 }}>
        {['Explorar', 'Feed', 'Esta noche', 'Perfil'].map((link) => {
          const isActive = link === 'Perfil'
          return (
            <li key={link}>
              <button
                onClick={link === 'Explorar' ? onNavigateHome : undefined}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 20 }}>
        <div ref={wrapperRef} style={{ position: 'relative', width: isMobile ? 132 : 270 }}>
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
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                width: '100%',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: 'rgba(7,8,11,0.98)',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
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
                      key={movie.id}
                      onClick={() => goToMovie(movie)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
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
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Poster'}
                        alt={movie.title}
                        style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: isMobile ? 13 : 16,
                          fontWeight: 700,
                          letterSpacing: '0.01em',
                          textTransform: 'uppercase',
                          lineHeight: 1.1,
                        }}
                      >
                        {movie.title}
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

        {isMobile && (
          <div style={{ position: 'relative' }}>
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
                {['Explorar', 'Feed', 'Esta noche', 'Perfil'].map((label) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (label === 'Explorar') onNavigateHome()
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
        )}
      </div>
    </nav>
  )
}

export function ProfileHero({
  header,
  stats,
  canEditProfile,
  isMobile,
  isTablet,
}: {
  header: ProfileHeaderData
  stats: ProfileStatsData
  canEditProfile: boolean
  isMobile: boolean
  isTablet: boolean
}) {
  return (
    <div style={{ position: 'relative', height: isMobile ? 620 : isTablet ? 560 : 480, overflow: 'hidden' }}>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isMobile ? '0 16px 24px' : isTablet ? '0 24px 30px' : '0 48px 40px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? 16 : 32,
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 100,
              height: 100,
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
          <div style={{ fontFamily: SERIF, fontSize: isMobile ? 34 : 44, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em', color: C.text, marginBottom: 6 }}>
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
              <button style={{ padding: '8px 12px', background: 'transparent', color: C.textSoft, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <Settings size={13} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 16 : 40, alignSelf: isMobile ? 'stretch' : 'flex-end', paddingBottom: 8, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          {[
            [String(stats.views), 'vistas'],
            [String(stats.reviews), 'reseñas'],
            [String(stats.vault), 'vault'],
            [String(stats.watchlist), 'watchlist'],
          ].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 300, display: 'block', color: C.text, lineHeight: 1 }}>{num}</span>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.textSoft, marginTop: 3, display: 'block', fontFamily: SANS }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export function TabsBar({ active, onSelect, isMobile }: { active: string; onSelect: (tab: string) => void; isMobile: boolean }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8,8,8,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? '0 10px' : '0 48px',
        display: 'flex',
        overflowX: 'auto',
        gap: 0,
        fontFamily: SANS,
      }}
    >
      {TAB_LIST.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          style={{
            padding: isMobile ? '14px 14px' : '18px 24px',
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
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export function Footer({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: isMobile ? '16px' : '20px 48px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 10 : 0,
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
