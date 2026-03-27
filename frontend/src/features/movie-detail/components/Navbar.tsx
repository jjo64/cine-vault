import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { C, SANS, SERIF, TMDB_BASE, SIZES } from '../constants';
import type { Viewer, SearchSuggestion } from '../types';
import { Img } from './Img';
import { fetchSearchMovies } from '../../../services/movieDetailServices';
import { createSlug } from '../../../utils/stringUtils';
import { resolveNavPathWithFallback } from '../../../lib/navigation';
import { initials } from '../../../utils/stringUtils';

interface NavbarProps {
  viewer: Viewer | null;
  onLogout: () => void;
}

export function Navbar({ viewer, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useMemo(() => query.trim(), [query]);
  const visibleResults = debouncedQuery ? results : [];

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await fetchSearchMovies(debouncedQuery);
        setResults(Array.isArray(data.results) ? data.results.slice(0, 6) : []);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedQuery]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpenDropdown(false);
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const navLinks = viewer ? ['Films', 'Lists', 'Members', 'Journal'] : ['Sign in', 'Create account', 'Films', 'Lists', 'Members', 'Journal'];
  
  const openAuthModal = (mode: 'login' | 'register') => {
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode } }));
  };

  const navigateByType = (item: SearchSuggestion) => {
    const label = item.title || item.name || 'sin-titulo';
    if (item.media_type === 'person') {
      navigate(`/person/${item.id}`);
      return;
    }
    if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`);
      return;
    }
    navigate(`/movie/${item.id}-${createSlug(label)}`);
  };

  return (
    <nav
      className="md-navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '72px',
        background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom, rgba(8,8,8,0.97) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'background 0.4s, border-color 0.4s',
      }}
    >
      <div className="md-nav-left" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link className="md-logo-link" to="/" style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text, textDecoration: 'none' }}>
          Cine<span style={{ color: C.accent }}>Vault</span>
        </Link>
        <ul className="md-desktop-links" style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0, gap: 24 }}>
          {navLinks.map((item) => {
            const isAuthLink = item === 'Sign in' || item === 'Create account';
            return (
              <li key={item}>
                {isAuthLink ? (
                  <button
                    onClick={() => openAuthModal(item === 'Create account' ? 'register' : 'login')}
                    style={{ border: 'none', padding: 0, background: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft, cursor: 'pointer' }}
                  >
                    {item}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(resolveNavPathWithFallback(item))}
                    style={{ border: 'none', padding: 0, background: 'none', fontFamily: SANS, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textSoft, cursor: 'pointer' }}
                  >
                    {item}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="md-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="md-search-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
          <div style={{ height: 38, width: '220px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
            <input
              value={query}
              onFocus={() => setOpenDropdown(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenDropdown(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query.trim()) {
                  navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                  setOpenDropdown(false);
                }
              }}
              placeholder="Buscar"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: C.text, fontFamily: SANS, fontSize: 12 }}
            />
          </div>
          {openDropdown && query.trim() && (
            <div className="md-search-dropdown" style={{ position: 'absolute', top: 44, right: 0, width: '420px', border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', borderRadius: 6, overflow: 'hidden', maxHeight: '65vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              {visibleResults.length > 0 ? (
                visibleResults.map((item) => (
                  <button
                    key={`${item.media_type || 'movie'}-${item.id}`}
                    onClick={() => {
                      navigateByType(item);
                      setOpenDropdown(false);
                      setQuery('');
                    }}
                    style={{ width: '100%', border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', color: C.text, display: 'flex', alignItems: 'center', gap: 12, padding: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Img 
                      src={item.media_type === 'person' ? (item.profile_path ? `${TMDB_BASE}${SIZES.PROFILE}${item.profile_path}` : '') : (item.poster_path ? `${TMDB_BASE}${SIZES.PROFILE}${item.poster_path}` : '')} 
                      alt={item.title || item.name || 'Sin titulo'} 
                      style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 2 }} 
                    />
                    <div style={{ minWidth: 0 }}>
                       <div style={{ fontFamily: SANS, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.name || 'Sin titulo'}</div>
                       <div style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft, textTransform: 'uppercase' }}>{item.media_type}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ padding: 16, color: C.textSoft, fontFamily: SANS, fontSize: 11, textAlign: 'center' }}>Sin resultados</div>
              )}
            </div>
          )}
        </div>

        {!viewer ? (
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textSoft, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS }}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            Volver
          </button>
        ) : (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen((v) => !v)} style={{ border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', borderRadius: 999, width: 38, height: 38, overflow: 'hidden', padding: 0 }}>
              {viewer.avatar_url ? <Img src={viewer.avatar_url} alt={viewer.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: C.textSoft, fontFamily: SANS, fontSize: 11 }}>{initials(viewer.username)}</div>}
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 44, minWidth: 180, border: `1px solid ${C.border}`, background: 'rgba(8,8,8,0.98)', padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <button onClick={() => navigate('/profile')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mi perfil</button>
                <button onClick={() => navigate('/settings')} style={{ width: '100%', border: 'none', background: 'transparent', color: C.text, textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuración</button>
                <button onClick={onLogout} style={{ width: '100%', border: 'none', background: 'transparent', color: '#ff8d8d', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', fontFamily: SANS, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cerrar sesión</button>
              </div>
            )}
          </div>
        )}

        <button
          className="md-mobile-menu-btn"
          onClick={() => setMobileNavOpen((value) => !value)}
          style={{ width: 36, height: 36, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, cursor: 'pointer', display: 'none', placeItems: 'center' }}
        >
          {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </div>
    </nav>
  );
}
