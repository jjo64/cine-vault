import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react'
import { resolveNavPathWithFallback } from '../lib/navigation'
import { logoutCurrentUser } from '../services/authServices'
import './Navbar.css'

interface NavbarProps {
    className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className = '' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false)
        }
    };

    const goTo = (label: string) => {
        navigate(resolveNavPathWithFallback(label))
    }

    const handleSignOut = async () => {
        await logoutCurrentUser()
        goTo('home')
    }

    return (
        <nav className={`subpage-navbar ${className}`} aria-label="Navegación principal">
            <div className="nav-container">
                <div className="nav-left">
                    <Link to="/" className="nav-logo">🎬 Cinevault</Link>
                    <div className="nav-menu">
                        <Link to={resolveNavPathWithFallback('films')}>FILMS</Link>
                        <Link to={resolveNavPathWithFallback('diary')}>DIARY</Link>
                        <Link to={resolveNavPathWithFallback('esta noche')}>ESTA NOCHE</Link>
                        <Link to={resolveNavPathWithFallback('feed')}>FEED</Link>
                        <Link to={resolveNavPathWithFallback('activity')}>ACTIVITY</Link>
                        <Link to={resolveNavPathWithFallback('lists')}>LISTS</Link>
                    </div>
                </div>

                <div className="nav-right">
                    <form className="nav-search" onSubmit={handleSearch} role="search">
                        <button type="submit" className="nav-search-btn" aria-label="Buscar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <label htmlFor="nav-search-desktop" style={{
                            position: 'absolute', width: 1, height: 1, padding: 0,
                            margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)',
                            whiteSpace: 'nowrap', border: 0,
                        }}>Buscar películas</label>
                        <input
                            id="nav-search-desktop"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="nav-search-input"
                            placeholder=""
                            aria-label="Buscar películas, directores o personas"
                        />
                    </form>

                    <div className="user-area">
                        <div
                            className="user-profile"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setShowUserMenu((prev) => !prev)
                                }
                                if (e.key === 'Escape') setShowUserMenu(false)
                            }}
                            ref={menuRef}
                            role="button"
                            tabIndex={0}
                            aria-haspopup="menu"
                            aria-expanded={showUserMenu}
                            aria-label="Menú de usuario"
                        >
                            <img src="https://i.pravatar.cc/32?u=me" alt="Tu foto de perfil" className="nav-avatar" />
                            <span className="nav-username">USUARIO</span>
                            <span className={`nav-chevron ${showUserMenu ? 'up' : ''}`}>▼</span>

                            {showUserMenu && (
                                <div className="user-dropdown" role="menu" aria-label="Menú de navegación">
                                    <Link to="/" role="menuitem">Home</Link>
                                    <Link to="/profile" role="menuitem">Profile</Link>
                                    <Link to={resolveNavPathWithFallback('films')} role="menuitem">Films</Link>
                                    <Link to={resolveNavPathWithFallback('diary')} role="menuitem">Diary</Link>
                                    <Link to={resolveNavPathWithFallback('esta noche')} role="menuitem">Esta noche</Link>
                                    <Link to={resolveNavPathWithFallback('feed')} role="menuitem">Feed</Link>
                                    <Link to={resolveNavPathWithFallback('activity')} role="menuitem">Activity</Link>
                                    <Link to={resolveNavPathWithFallback('lists')} role="menuitem">Lists</Link>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/settings" role="menuitem">Settings</Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleSignOut}
                                        style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="nav-hamburger"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="nav-mobile-overlay"
                        >
                            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <button className="btn-log-green">
                            <span>+ LOG</span>
                        </button>
                    </div>
                </div>
            </div>
            <div
                id="nav-mobile-overlay"
                className={`nav-mobile-overlay ${isMobileMenuOpen ? 'nav-mobile-overlay--open' : ''}`}
                aria-hidden={!isMobileMenuOpen}
                role="navigation"
                aria-label="Menú móvil"
            >
                <form className="nav-mobile-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="nav-search-input"
                        placeholder="Buscar..."
                    />
                </form>

                {['FILMS', 'DIARY', 'ESTA NOCHE', 'FEED', 'ACTIVITY', 'LISTS', 'PROFILE'].map((link) => (
                    <Link
                        key={`mobile-${link}`}
                        to={resolveNavPathWithFallback(link)}
                        className="nav-mobile-link"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {link}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
