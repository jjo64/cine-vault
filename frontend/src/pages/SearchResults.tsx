import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const createSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const SearchResults: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { query: urlQuery } = useParams<{ query: string }>();

    // Prioridad a la query de la URL si existe, reemplazando + por espacio
    const queryFromParams = searchParams.get('q') || '';
    const query = (urlQuery ? decodeURIComponent(urlQuery).replace(/\+/g, ' ') : queryFromParams) || '';

    const [results, setResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    useEffect(() => {
        if (query) {
            fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(query)}&page=${currentPage}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data.results || []);
                    setTotalPages(data.total_pages || 1);
                    setTotalResults(data.total_results || 0);
                })
                .catch(err => {
                    console.error("Error al buscar películas:", err);
                });
        }
    }, [query, currentPage]);

    return (
        <div className="letterboxd-layout">
            <Navbar />

            <main className="main-content">
                <section className="results-section">
                    <h2 className="section-title">Encontradas {totalResults} coincidencias para "{query}"</h2>

                    <div className="movie-list-container">
                        {results.map((movie: any) => (
                            <Link key={movie.id} 
                                // ✅ ID + título
                                to={`/movie/${movie.id}-${createSlug(movie.title)}`} className="movie-list-item">
                                <img
                                    className="movie-poster-large"
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : 'https://via.placeholder.com/185x278?text=No+Poster'}
                                    alt={movie.title}
                                />
                                <div className="movie-info-large">
                                    <h3 className="movie-title-large">
                                        {movie.title}
                                        {movie.release_date && <span className="movie-year">{movie.release_date.split('-')[0]}</span>}
                                    </h3>
                                    {movie.original_title !== movie.title && (
                                        <p className="movie-alt-titles">Título original: {movie.original_title}</p>
                                    )}
                                    {movie.alternative_titles && movie.alternative_titles.length > 0 && (
                                        <p className="movie-alt-titles" style={{ opacity: 0.6, fontSize: '12px' }}>
                                            Títulos Alternativos: {movie.alternative_titles.slice(0, 5).map((t: any) => t.title).join(', ')}
                                            {movie.alternative_titles.length > 5 && '...'}
                                        </p>
                                    )}
                                    <p className="movie-director"><span>Dirigida por</span> {movie.director || 'Desconocido'}</p>
                                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '12px' }}>
                                        {movie.overview ? (movie.overview.substring(0, 200) + '...') : 'Sin descripción disponible.'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="pagination" style={{ marginTop: '3rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    backgroundColor: currentPage === page ? 'var(--bg-navy)' : 'transparent',
                                    border: '1px solid var(--border-muted)',
                                    color: currentPage === page ? 'var(--accent-gold)' : 'var(--text-alabaster)',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontWeight: '700'
                                }}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </section>

                <aside className="sidebar-section">
                    <h2 className="section-title">MOSTRAR RESULTADOS PARA</h2>
                    <ul className="sidebar-list">
                        <li className="sidebar-item active">Todos</li>
                        <li className="sidebar-item">Películas</li>
                        <li className="sidebar-item">Listas</li>
                        <li className="sidebar-item">Miembros</li>
                        <li className="sidebar-item">Artículos</li>
                    </ul>

                    <div style={{ marginTop: '40px' }}>
                        <h2 className="section-title">AYUDA DE BÚSQUEDA</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
                            Puedes buscar por título original o traducido. Cinevault utiliza TMDB para proporcionarte la mejor información de cine.
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default SearchResults;
