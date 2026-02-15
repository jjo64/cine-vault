import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MovieDetail: React.FC = () => {
    const { slugOrId } = useParams<{ slugOrId: string }>();
    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cast');

    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/movies/${slugOrId}`)
            .then(res => res.json())
            .then(data => {
                setMovie(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching movie details:", err);
                setLoading(false);
            });
    }, [slugOrId]);

    if (loading) return <div className="letterboxd-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    if (!movie) return <div className="letterboxd-layout">Película no encontrada</div>;

    const director = movie.credits?.crew?.find((person: any) => person.job === 'Director')?.name;
    const providers = movie.watch_providers?.ES?.flatrate || [];
    const mainCast = movie.credits?.cast?.slice(0, 15) || [];
    const mainCrew = movie.credits?.crew?.slice(0, 15) || [];

    // Seleccionar mejor backdrop (fondo alternativo)
    const alternativeBackdrop = movie.images?.backdrops?.[0]?.file_path || movie.backdrop_path;
    const movieLogo = movie.images?.logos?.find((l: any) => l.iso_639_1 === 'en' || l.iso_639_1 === 'es' || !l.iso_639_1)?.file_path;

    return (
        <div className="letterboxd-layout">
            <Navbar />

            <div
                className="movie-hero"
                style={{ backgroundImage: alternativeBackdrop ? `url(https://image.tmdb.org/t/p/original${alternativeBackdrop})` : 'none' }}
            >
                <div className="backdrop-overlay"></div>
                {movieLogo && (
                    <div className="movie-logo-container">
                        <img src={`https://image.tmdb.org/t/p/original${movieLogo}`} alt={movie.title} className="movie-hero-logo" />
                    </div>
                )}
            </div>

            <main className="main-content">
                <section className="results-section">
                    <div className="movie-meta-header">
                        <div className="main-info">
                            {!movieLogo && (
                                <h1 className="movie-title-large" style={{ fontSize: '40px' }}>
                                    {movie.title}
                                    {movie.release_date && <span className="movie-year" style={{ fontSize: '30px' }}>{movie.release_date.split('-')[0]}</span>}
                                </h1>
                            )}
                            <p className="movie-director" style={{ fontSize: '18px', marginTop: movieLogo ? '0' : '12px' }}>
                                <span>Dirigida por</span> {director || 'Desconocido'}
                            </p>
                            {movie.tagline && <p className="movie-tagline" style={{ marginTop: '20px' }}>{movie.tagline}</p>}
                            <p className="movie-overview-large">{movie.overview}</p>
                        </div>
                    </div>

                    <div className="detail-tabs">
                        <button className={`tab-btn ${activeTab === 'cast' ? 'active' : ''}`} onClick={() => setActiveTab('cast')}>Reparto</button>
                        <button className={`tab-btn ${activeTab === 'crew' ? 'active' : ''}`} onClick={() => setActiveTab('crew')}>Equipo</button>
                        <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Detalles</button>
                        <button className={`tab-btn ${activeTab === 'genres' ? 'active' : ''}`} onClick={() => setActiveTab('genres')}>Géneros</button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'cast' && (
                            <div className="cast-grid">
                                {mainCast.map((person: any) => (
                                    <span key={person.id} className="cast-tag">{person.name}</span>
                                ))}
                            </div>
                        )}
                        {activeTab === 'crew' && (
                            <div className="cast-grid">
                                {mainCrew.map((person: any) => (
                                    <span key={person.id} className="cast-tag">{person.name} ({person.job})</span>
                                ))}
                            </div>
                        )}
                        {activeTab === 'details' && (
                            <div className="details-text" style={{ marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                                <p>Título Original: <span style={{ color: 'var(--text-white)' }}>{movie.original_title}</span></p>
                                <p>Duración: <span style={{ color: 'var(--text-white)' }}>{movie.runtime} mins</span></p>
                                <p>Estado: <span style={{ color: 'var(--text-white)' }}>{movie.status}</span></p>
                                <p>Productoras: <span style={{ color: 'var(--text-white)' }}>{movie.production_companies?.map((c: any) => c.name).join(', ')}</span></p>

                                {movie.alternative_titles && movie.alternative_titles.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <p style={{ fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '12px' }}>Títulos Alternativos</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                            {movie.alternative_titles.map((t: any, idx: number) => (
                                                <span key={idx} style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '3px' }}>{t.title}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'genres' && (
                            <div className="cast-grid">
                                {movie.genres?.map((g: any) => (
                                    <span key={g.id} className="cast-tag">{g.name}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="activity-section">
                        <h2 className="section-title">ACTIVIDAD DE AMIGOS</h2>
                        <div className="friends-list">
                            <img src="https://i.pravatar.cc/40?u=1" className="friend-avatar" alt="Friend" />
                            <img src="https://i.pravatar.cc/40?u=2" className="friend-avatar" alt="Friend" />
                            <img src="https://i.pravatar.cc/40?u=3" className="friend-avatar" alt="Friend" />
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>1 vista • 2 quieren verla</span>
                        </div>
                    </div>

                    <div className="activity-section" style={{ borderTop: 'none', marginTop: '40px' }}>
                        <h2 className="section-title">RESEÑAS POPULARES</h2>
                        <div className="review-card">
                            <div className="review-header">
                                <img src="https://i.pravatar.cc/30?u=lily" className="friend-avatar" style={{ width: '24px', height: '24px' }} alt="Author" />
                                <span className="review-author">Lily Schmidt</span>
                                <span className="review-rating">★★★★★</span>
                            </div>
                            <p className="review-content">"Dile que te detendrás si ella puede contener las lágrimas." Dios mío.</p>
                            <div className="review-meta">
                                <span>❤ Me gusta</span>
                                <span>4.729 me gusta</span>
                            </div>
                        </div>
                        <div className="review-card">
                            <div className="review-header">
                                <img src="https://i.pravatar.cc/30?u=kayla" className="friend-avatar" style={{ width: '24px', height: '24px' }} alt="Author" />
                                <span className="review-author">kayla</span>
                                <span className="review-rating">★★★★½</span>
                            </div>
                            <p className="review-content">No me importa lo que diga la pestaña de equipo, estoy convencida de que la misma persona que hace las cámaras de The Office también trabaja para Lars a veces.</p>
                            <div className="review-meta">
                                <span>❤ Me gusta</span>
                                <span>2.971 me gusta</span>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="sidebar-section">
                    <div className="sticky-sidebar">
                        <div className="sidebar-poster" style={{ marginTop: '-150px', position: 'relative', zIndex: 10 }}>
                            <img
                                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/230x345?text=No+Poster'}
                                alt={movie.title}
                                style={{ width: '100%', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                            />
                        </div>

                        <div className="where-to-watch">
                            <div className="watch-header">
                                <span>Dónde ver</span>
                            </div>
                            <div className="providers-list">
                                {providers.length > 0 ? (
                                    providers.map((p: any) => (
                                        <img
                                            key={p.provider_id}
                                            src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                            alt={p.provider_name}
                                            className="provider-logo"
                                            title={p.provider_name}
                                        />
                                    ))
                                ) : (
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>No disponible en streaming en ES.</p>
                                )}
                            </div>
                        </div>

                        <div className="ratings-chart">
                            <div className="watch-header"><span>Valoraciones</span></div>
                            <div className="rating-avg">★ {movie.vote_average?.toFixed(1)}</div>
                            <div className="rating-stars" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Basado en {movie.vote_count} votos</div>
                        </div>
                    </div>
                </aside>
            </main>

            <Footer />
        </div>
    );
};

export default MovieDetail;
