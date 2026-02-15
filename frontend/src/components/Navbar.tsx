import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
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
            const formattedQuery = searchQuery.trim().replace(/\s+/g, '+');
            navigate(`/search/${formattedQuery}`);
        }
    };

    return (
        <nav className="subpage-navbar">
            <div className="nav-container">
                <div className="nav-left">
                    <Link to="/" className="nav-logo">🎬 Cinevault</Link>
                    <div className="nav-menu">
                        <Link to="/films">FILMS</Link>
                        <Link to="/lists">LISTS</Link>
                        <Link to="/members">MEMBERS</Link>
                        <Link to="/journal">JOURNAL</Link>
                    </div>
                </div>

                <div className="nav-right">
                    <form className="nav-search" onSubmit={handleSearch}>
                        <button type="submit" className="nav-search-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="nav-search-input"
                            placeholder=""
                        />
                    </form>

                    <div className="user-area">
                        <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)} ref={menuRef}>
                            <img src="https://i.pravatar.cc/32?u=me" alt="User" className="nav-avatar" />
                            <span className="nav-username">USUARIO</span>
                            <span className={`nav-chevron ${showUserMenu ? 'up' : ''}`}>▼</span>

                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <Link to="/home">Home</Link>
                                    <Link to="/profile">Profile</Link>
                                    <Link to="/films">Films</Link>
                                    <Link to="/diary">Diary</Link>
                                    <Link to="/reviews">Reviews</Link>
                                    <Link to="/watchlist">Watchlist</Link>
                                    <Link to="/lists">Lists</Link>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/settings">Settings</Link>
                                    <Link to="/signout">Sign Out</Link>
                                </div>
                            )}
                        </div>
                        <button className="btn-log-green">
                            <span>+ LOG</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
