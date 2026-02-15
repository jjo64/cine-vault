import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const createSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState(''); // Estado para el valor del input
    const [debouncedQuery, setDebouncedQuery] = useState(''); // Estado para el valor con debounce
    const [searchResults, setSearchResults] = useState([]); // Estado para los resultados de la búsqueda

    // Esta función se ejecuta cada vez que el usuario escribe
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);  // Actualizamos el estado de la búsqueda
    };

    // Manejar la tecla Enter para navegar a resultados completos
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && searchQuery.trim()) {
            const formattedQuery = searchQuery.trim().replace(/\s+/g, '+');
            navigate(`/search/${formattedQuery}`);
        }
    };

    // useEffect para el debounce: se ejecuta cuando el `searchQuery` cambia
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);  // Actualizamos el término de búsqueda con un retraso
        }, 500); // Espera 500ms después de que el usuario deje de escribir

        // Limpiamos el timeout si el `searchQuery` cambia antes de que el timer se ejecute
        return () => clearTimeout(timer);
    }, [searchQuery]); // Dependencia en `searchQuery`

    // Limpieza inmediata si el usuario borra todo el texto
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
        }
    }, [searchQuery]);

    // useEffect para hacer la búsqueda cada vez que el término con debounce cambia
    useEffect(() => {
        if (debouncedQuery.trim()) {
            // Realizamos la búsqueda cuando `debouncedQuery` cambia
            console.log('Buscando:', debouncedQuery);
            fetch(`http://localhost:4000/api/search?q=${encodeURIComponent(debouncedQuery)}`)
                .then(response => response.json())
                .then(data => {
                    setSearchResults(data.results || []);
                })
                .catch(error => console.error('Error al realizar la búsqueda:', error));
        } else {
            setSearchResults([]);
        }
    }, [debouncedQuery]); // Se ejecuta cada vez que `debouncedQuery` cambia

    return (
        <section className="home">
            <nav id="nav-home">
                <h1 className="site-logo">🎬 Cinevault</h1>
                <div className="nav-links">
                    <a href="">Sign in</a>
                    <a href="">Create Account</a>
                    <a href="">Films</a>
                    <a href="">Lists</a>
                    <a href="">Members</a>
                    <a href="">Journal</a>
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            value={searchQuery}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                        />
                        <svg
                            className="search-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <div className="search-results">
                            {searchResults.length > 0 ? (
                                searchResults.slice(0, 10).map((movie: any) => (
                                    <Link
                                        key={movie.id}
                                        to={`/movie/${createSlug(movie.title)}`}
                                        className="search-result-item"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <img
                                            className="search-result-poster"
                                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Poster'}
                                            alt={movie.title}
                                        />
                                        <div className="search-result-info">
                                            <p className="search-result-title">{movie.title}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : searchQuery.length > 0 ? (
                                <div className="search-no-results">No results found for "{searchQuery}"</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </nav>
            <div className="hero-content">
                <button className="cta-button">Empezar ahora</button>
            </div>
        </section>
    );
};

export default Landing;
