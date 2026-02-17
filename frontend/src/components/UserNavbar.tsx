import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UserNavbar: React.FC = () => {
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
            navigate(`/search/${searchQuery.trim()}`);
        }
    };

    return (
        <nav className="user-navbar" style={{
            background: '#14181c',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '0 20px',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 100
        }}>
            <div className="nav-container" style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <Link to="/" className="nav-logo" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>🎬</span> Cinevault
                    </Link>
                    <div className="nav-menu" style={{ display: 'flex', gap: '20px' }}>
                        {['FILMS', 'LISTS', 'MEMBERS', 'JOURNAL'].map(item => (
                            <Link key={item} to={`/${item.toLowerCase()}`} style={{ color: '#9ab', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <form className="nav-search" onSubmit={handleSearch} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: '#2c3440',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '6px 15px 6px 35px',
                                color: '#fff',
                                fontSize: '13px',
                                width: '200px'
                            }}
                            placeholder="Buscar..."
                        />
                        <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ab" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </form>

                    <div className="user-area" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)} ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #456' }} />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>JJO64</span>
                            <span style={{ fontSize: '10px', color: '#678' }}>▼</span>

                            {showUserMenu && (
                                <div className="user-dropdown" style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    background: '#2c3440',
                                    borderRadius: '4px',
                                    padding: '10px 0',
                                    width: '150px',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                                    zIndex: 1000
                                }}>
                                    {['Home', 'Profile', 'Films', 'Diary', 'Reviews', 'Watchlist', 'Lists', 'Settings', 'Sign Out'].map(link => (
                                        <Link key={link} to={`/${link.toLowerCase().replace(' ', '')}`} style={{ display: 'block', padding: '8px 15px', color: '#9ab', textDecoration: 'none', fontSize: '13px' }}>
                                            {link}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button style={{
                            background: '#00b020',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '6px 15px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            <span>+ LOG</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default UserNavbar;
