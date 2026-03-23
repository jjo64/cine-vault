import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { authorizedFetch } from '../services/authServices';
import { logoutCurrentUser } from '../services/authServices';
import { socket } from '../context/SocketContext';
import { Notificaciones } from './Notificaciones';
import { resolveNavPathWithFallback } from '../lib/navigation'
import './UserNavbar.css'

const UserNavbar: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
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
    }, [showUserMenu, showNotifications]);

    useEffect(() => {
        let active = true;

        const loadUnread = async () => {
            const res = await authorizedFetch('/api/notifications/unread');
            if (!res.ok || !active) return;

            const data = (await res.json()) as { count?: unknown };
            if (typeof data.count === 'number') {
                setUnreadCount(data.count);
            }
        };

        const handleNewNotification = () => {
            setUnreadCount((prev) => prev + 1);
        };

        loadUnread();
        socket.on('nueva_notificacion', handleNewNotification);

        return () => {
            active = false;
            socket.off('nueva_notificacion', handleNewNotification);
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsMobileMenuOpen(false);
        }
    };

    const handleToggleNotifications = () => {
        setShowNotifications((prev) => {
            const next = !prev;
            if (next) {
                setUnreadCount(0);
            }
            return next;
        });
    };

    const handleSignOut = async () => {
        await logoutCurrentUser()
        navigate('/')
    }

    const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);
    const primaryLinks = ['DIARY', 'ESTA NOCHE', 'FEED', 'ACTIVITY', 'LISTS', 'FILMS'];
    const profileLinks = ['Home', 'Profile', 'Films', 'Diary', 'Lists', 'Settings'];

    return (
        <nav className="user-navbar">
            <div className="user-navbar__container">
                <div className="user-navbar__left">
                    <Link to="/" className="user-navbar__logo">
                        <span className="user-navbar__logo-icon">🎬</span> Cinevault
                    </Link>
                    <div className="user-navbar__menu">
                        {primaryLinks.map(item => (
                            <Link key={item} to={resolveNavPathWithFallback(item)} className="user-navbar__menu-link">
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="user-navbar__right">
                    <form className="user-navbar__search" onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="user-navbar__search-input"
                            placeholder="Buscar..."
                        />
                        <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ab" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            className="user-navbar__search-icon"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </form>

                    <div className="user-navbar__actions">
                        <div ref={notificationsRef} className="user-navbar__notification-wrap">
                            <button
                                onClick={handleToggleNotifications}
                                className="user-navbar__notification-btn"
                                aria-label="Abrir notificaciones"
                            >
                                <Bell size={18} strokeWidth={2} />
                                {unreadCount > 0 && (
                                    <span className="user-navbar__badge">
                                        {badgeText}
                                    </span>
                                )}
                            </button>

                            <Link to="/activity" className="user-navbar__activity-link">
                                Activity
                            </Link>

                            {showNotifications && (
                                <div className="user-navbar__notifications-popover">
                                    <Notificaciones open={showNotifications} showTrigger={false} />
                                </div>
                            )}
                        </div>

                        <div className="user-navbar__user-profile" onClick={() => setShowUserMenu(!showUserMenu)} ref={menuRef}>
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="user-navbar__avatar" />
                            <span className="user-navbar__username">JJO64</span>
                            <span className="user-navbar__chevron">▼</span>

                            {showUserMenu && (
                                <div className="user-navbar__dropdown">
                                    {[...profileLinks, 'Sign Out'].map(link => (
                                        link === 'Sign Out' ? (
                                            <button key={link} onClick={handleSignOut} className="user-navbar__dropdown-button">
                                                {link}
                                            </button>
                                        ) : (
                                            <Link key={link} to={resolveNavPathWithFallback(link)} className="user-navbar__dropdown-link">
                                                {link}
                                            </Link>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className="user-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label="Abrir menu"
                        >
                            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>

                        <button className="user-navbar__log-btn">
                            <span>+ LOG</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`user-navbar__mobile-menu ${isMobileMenuOpen ? 'user-navbar__mobile-menu--open' : ''}`}>
                <form className="user-navbar__mobile-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="user-navbar__mobile-search-input"
                        placeholder="Buscar..."
                    />
                </form>

                {primaryLinks.map((item) => (
                    <Link
                        key={`mobile-${item}`}
                        to={resolveNavPathWithFallback(item)}
                        className="user-navbar__mobile-link"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {item}
                    </Link>
                ))}
            </div>
        </nav>
    );
};

export default UserNavbar;
