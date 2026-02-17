import React, { useState } from 'react';
import './MovieActionsPanel.css';

interface MovieActionsPanelProps {
    movieTitle: string;
}

const MovieActionsPanel: React.FC<MovieActionsPanelProps> = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [watched, setWatched] = useState(false);
    const [liked, setLiked] = useState(false);
    const [watchlist, setWatchlist] = useState(false);

    const handleRating = (r: number) => {
        setRating(r);
        if (r === 5) {
            // Trigger vault animation
            const vault = document.querySelector('.vault-animation') as HTMLElement;
            if (vault) {
                vault.classList.add('active');
                setTimeout(() => vault.classList.remove('active'), 2000);
            }
        }
    };

    return (
        <div className="movie-actions-panel">
            {/* Top Icons */}
            <div className="action-icons">
                <div className={`action-icon ${watched ? 'active' : ''}`} onClick={() => setWatched(!watched)}>
                    <svg viewBox="0 0 24 24" fill={watched ? "#00e054" : "none"} stroke={watched ? "#00e054" : "#9ab"}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Watch</span>
                </div>
                <div className={`action-icon ${liked ? 'active' : ''}`} onClick={() => setLiked(!liked)}>
                    <svg viewBox="0 0 24 24" fill={liked ? "#ff8000" : "none"} stroke={liked ? "#ff8000" : "#9ab"}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Like</span>
                </div>
                <div className={`action-icon ${watchlist ? 'active' : ''}`} onClick={() => setWatchlist(!watchlist)}>
                    <svg viewBox="0 0 24 24" fill={watchlist ? "#00b020" : "none"} stroke={watchlist ? "#00b020" : "#9ab"}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Watchlist</span>
                </div>
            </div>

            <div className="panel-divider"></div>

            {/* Rating Section */}
            <div className="rating-section">
                <span className="rating-label">Rate</span>
                <div className="stars-container" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''} ${star === 5 && (hoverRating === 5 || rating === 5) ? 'vault-trigger' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => handleRating(star)}
                        >
                            ★
                        </span>
                    ))}
                    {/* Vault Animation Container */}
                    <div className="vault-animation">
                        <div className="vault-lock">🔒</div>
                        <div className="vault-glow"></div>
                    </div>
                </div>
            </div>

            <div className="panel-divider"></div>

            {/* Menu Links */}
            <ul className="action-menu">
                <li><a href="#">Show your activity</a></li>
                <li><a href="#">Review or log...</a></li>
                <li><a href="#">Add to lists...</a></li>
            </ul>

            <div className="panel-divider"></div>

            <div className="promo-link">
                Go <span className="badge-patron">PATRON</span> to change images
            </div>

            <div className="panel-divider"></div>

            <div className="share-btn">Share</div>
        </div>
    );
};

export default MovieActionsPanel;
