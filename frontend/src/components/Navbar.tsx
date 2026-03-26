import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Menu, X } from 'lucide-react'
import { getCurrentUser, getStoredAccessToken } from '../services/authServices'
import { fetchSearchMovies } from '../services/movieDetailServices'
import { resolveNavPathWithFallback } from '../lib/navigation'
import { createSlug } from '../utils/stringUtils'
import { C, SERIF, SANS, TMDB_BASE, SIZES, tmdbImg } from '../pages/TVDetail/constants'
import styles from './Navbar.module.css'

// ─── TYPES ────────────────────────────────────────────────────
export type NavViewer = {
  id: number
  username: string
  avatar_url?: string | null
  membership?: string | null
  role?: string | null
}

type SearchSuggestion = {
  id: number
  title?: string
  name?: string
  media_type?: 'movie' | 'tv' | 'person'
  poster_path?: string | null
  profile_path?: string | null
}

// ─── HELPERS ──────────────────────────────────────────────────
function initials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return 'CV'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'CV'
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function NavImg({ src, alt, style }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false)
  if (!src || err) return <div style={{ ...style, background: C.elevated }} />
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} />
}

// ─── HOOK ─────────────────────────────────────────────────────
export function useNavViewer() {
  const [viewer, setViewer] = useState<NavViewer | null>(null)

  useEffect(() => {
    const token = getStoredAccessToken()
    if (!token) return
    getCurrentUser()
      .then(u => setViewer({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url ?? null,
        membership: u.membership ?? null,
        role: u.role ?? null,
      }))
      .catch(() => setViewer(null))
  }, [])

  return viewer
}

// ─── COMPONENT ────────────────────────────────────────────────
interface NavbarProps {
  viewer: NavViewer | null
  onLogout: () => void
}

export default function Navbar({ viewer, onLogout }: NavbarProps) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [openDropdown, setOpenDropdown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    if (!debouncedQuery) return
    const id = window.setTimeout(async () => {
      try {
        const data = await fetchSearchMovies(debouncedQuery)
        setResults(Array.isArray(data.results) ? data.results.slice(0, 6) : [])
      } catch {
        setResults([])
      }
    }, 250)
    return () => window.clearTimeout(id)
  }, [debouncedQuery])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpenDropdown(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const navLinks = viewer
    ? ['Films', 'Lists', 'Members', 'Journal']
    : ['Sign in', 'Create account', 'Films', 'Lists', 'Members', 'Journal']

  const openAuthModal = (mode: 'login' | 'register') => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode } }))
  }

  const navigateByType = (item: SearchSuggestion) => {
    const label = item.title || item.name || 'sin-titulo'
    if (item.media_type === 'person') { navigate(`/person/${item.id}`); return }
    if (item.media_type === 'tv') { navigate(`/tv/${item.id}`); return }
    navigate(`/movie/${item.id}-${createSlug(label)}`)
  }

  const handleNavLink = (item: string) => {
    if (item === 'Sign in') { openAuthModal('login'); return }
    if (item === 'Create account') { openAuthModal('register'); return }
    navigate(resolveNavPathWithFallback(item))
  }

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : styles.navbarDefault}`}>
      {/* LEFT */}
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          Cine<span className={styles.logoAccent}>Vault</span>
        </Link>
        <ul className={styles.desktopLinks}>
          {navLinks.map(item => (
            <li key={item}>
              <button className={styles.navBtn} onClick={() => handleNavLink(item)}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        {/* Search */}
        <div className={styles.searchWrapper} ref={wrapperRef}>
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              value={query}
              placeholder="Buscar"
              onFocus={() => setOpenDropdown(true)}
              onChange={e => { setQuery(e.target.value); setOpenDropdown(true) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && query.trim()) {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                  setOpenDropdown(false)
                }
              }}
            />
          </div>
          {openDropdown && debouncedQuery && (
            <div className={styles.searchDropdown}>
              {results.length > 0 ? results.map(item => (
                <button key={`${item.media_type}-${item.id}`} className={styles.searchItem}
                  onClick={() => { navigateByType(item); setOpenDropdown(false); setQuery('') }}>
                  <NavImg
                    src={item.media_type === 'person'
                      ? tmdbImg(item.profile_path, SIZES.PROFILE)
                      : tmdbImg(item.poster_path, SIZES.PROFILE)}
                    alt={item.title || item.name || ''}
                    style={{ width: 30, height: 45, objectFit: 'cover' }}
                  />
                  <span className={styles.searchItemTitle}>{item.title || item.name || 'Sin título'}</span>
                </button>
              )) : (
                <div className={styles.searchEmpty}>Sin resultados</div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <div className={styles.mobileMenuBtn}>
          <button className={styles.mobileToggle} onClick={() => setMobileNavOpen(v => !v)}>
            {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
          {mobileNavOpen && (
            <div className={styles.mobileDropdown}>
              <div className={styles.mobileSearchBox}>
                <input
                  className={styles.searchInput}
                  value={query}
                  placeholder="Buscar"
                  onFocus={() => setOpenDropdown(true)}
                  onChange={e => { setQuery(e.target.value); setOpenDropdown(true) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && query.trim()) {
                      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                      setOpenDropdown(false)
                      setMobileNavOpen(false)
                    }
                  }}
                />
              </div>
              {navLinks.map(item => (
                <button key={item} className={styles.mobileNavBtn}
                  onClick={() => { handleNavLink(item); setMobileNavOpen(false) }}>
                  {item}
                </button>
              ))}
              {!viewer && (
                <button className={styles.mobileNavBtn} onClick={() => { navigate(-1); setMobileNavOpen(false) }}>
                  Volver
                </button>
              )}
              {viewer && (
                <>
                  <button className={styles.mobileNavBtn} onClick={() => { navigate('/profile'); setMobileNavOpen(false) }}>Mi perfil</button>
                  <button className={styles.mobileNavBtn} onClick={() => { navigate('/settings'); setMobileNavOpen(false) }}>Configuración</button>
                  <button className={styles.mobileNavBtnDanger} onClick={() => { onLogout(); setMobileNavOpen(false) }}>Cerrar sesión</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* User area */}
        {!viewer ? (
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={14} strokeWidth={1.5} />
            Volver
          </button>
        ) : (
          <div ref={menuRef} className={styles.userActions}>
            <button className={styles.avatarBtn} onClick={() => setMenuOpen(v => !v)}>
              {viewer.avatar_url
                ? <NavImg src={viewer.avatar_url} alt={viewer.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div className={styles.avatarFallback}>{initials(viewer.username)}</div>
              }
            </button>
            {menuOpen && (
              <div className={styles.userDropdown}>
                <button className={styles.dropdownBtn} onClick={() => navigate('/profile')}>Mi perfil</button>
                <button className={styles.dropdownBtn} onClick={() => navigate('/settings')}>Configuración</button>
                <button className={styles.dropdownBtnDanger} onClick={onLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}