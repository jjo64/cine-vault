import { useState } from 'react';
import { 
    useFeedData, 
    useFeedActions, 
    Grain, 
    FeedNavbar, 
    FeedCard, 
    ProgressDots, 
    NavArrows 
} from '../features/feed';

/**
 * CineVault — Feed Page (/feed)
 * Refactored Orchestrator
 * TikTok-style vertical snap scroll — Reseñas, Vault, Descubrimientos
 */
export default function Feed() {
    const [activeTab, setActiveTab] = useState('Para ti');

    const {
        feed,
        activeIdx,
        containerRef,
        goToCard,
        canUp,
        canDown
    } = useFeedData();

    const {
        liked,
        bookmarked,
        animating,
        toggleLike,
        toggleBookmark
    } = useFeedActions();

    return (
        <div style={{ background: 'var(--color-bg)', height: '100vh', overflow: 'hidden' }}>
            <Grain />

            <FeedNavbar
                activeTab={activeTab}
                onTab={setActiveTab}
            />

            <div
                ref={containerRef}
                style={{
                    height: '100vh',
                    overflowY: 'auto',
                    scrollSnapType: 'y mandatory',
                    scrollBehavior: 'smooth',
                    // Hide scrollbar
                    scrollbarWidth: 'none',
                }}
                className="feed-container"
            >
                {feed.map((item, idx) => (
                    <FeedCard
                        key={item.id}
                        item={item}
                        idx={idx}
                        active={activeIdx === idx}
                        liked={liked.has(item.id)}
                        bookmarked={bookmarked.has(item.id)}
                        likeAnimating={animating === item.id}
                        onLike={() => toggleLike(item.id)}
                        onBookmark={() => toggleBookmark(item.id)}
                    />
                ))}
            </div>

            <ProgressDots
                total={feed.length}
                active={activeIdx}
                onGo={goToCard}
            />

            <NavArrows
                onUp={() => goToCard(activeIdx - 1)}
                onDown={() => goToCard(activeIdx + 1)}
                canUp={canUp}
                canDown={canDown}
            />
        </div>
    );
}
