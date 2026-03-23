import { useState, useEffect, useRef } from 'react';
import type { FeedItem } from '../types';
import { fetchGlobalFeed } from '@/services/socialServices';

const FALLBACK_BG = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&q=85';

type ApiFeedItem = {
  id: string
  type: 'review' | 'vault' | 'watchlist'
  user: {
    id: number
    username: string
  }
  movie?: {
    tmdb_id: number
  }
  review?: {
    content: string | null
    rating: number | null
    likes: number
  }
};

const mapToFeedItem = (item: ApiFeedItem, index: number): FeedItem => {
  const numericId = Number(item.id.replace(/\D/g, '')) || index + 1;
  const username = item.user.username || `usuario${item.user.id}`;

  if (item.type === 'review') {
    return {
      id: numericId,
      type: 'review',
      user: { name: username, handle: `@${username}`, films: 0, avatar: username.slice(0, 1).toUpperCase() },
      film: { title: `TMDB #${item.movie?.tmdb_id || 'N/A'}`, year: new Date().getFullYear(), director: 'Dirección desconocida', id: String(item.movie?.tmdb_id || numericId) },
      rating: Number(item.review?.rating || 0),
      text: item.review?.content || 'Reseña publicada recientemente.',
      tags: ['Comunidad'],
      likes: Number(item.review?.likes || 0),
      comments: 0,
      bg: FALLBACK_BG,
    };
  }

  if (item.type === 'vault') {
    return {
      id: numericId,
      type: 'vault',
      user: { name: username, handle: `@${username}`, films: 0, avatar: username.slice(0, 1).toUpperCase() },
      vaultType: 'Vault entry',
      title: `Nueva película en vault (${item.movie?.tmdb_id || 'N/A'})`,
      duration: '2 min',
      description: 'Actividad reciente de vault en tu red.',
      views: 0,
      likes: 0,
      comments: 0,
      bg: FALLBACK_BG,
    };
  }

  return {
    id: numericId,
    type: 'discovery',
    film: { title: `Watchlist #${item.movie?.tmdb_id || 'N/A'}`, year: new Date().getFullYear(), director: 'Curaduría CineVault', id: String(item.movie?.tmdb_id || numericId), duration: 'N/D' },
    quote: 'Guardada para ver después',
    description: `${username} añadió esta película a su watchlist.`,
    likes: 0,
    comments: 0,
    bg: FALLBACK_BG,
  };
};

export function useFeedData() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetchGlobalFeed(1, 30)
      .then((response) => {
        if (!active) return;

        const apiItems = Array.isArray((response as { items?: unknown[] })?.items)
          ? ((response as { items: ApiFeedItem[] }).items)
          : [];

        const mapped = apiItems.map((item, index) => mapToFeedItem(item, index));
        setFeed(mapped);
      })
      .catch(() => {
        if (!active) return;
        setFeed([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute('data-idx'));
            setActiveIdx(idx);
          }
        });
      },
      { threshold: [0.6], root: container }
    );

    const cards = container.querySelectorAll('.feed-card');
    cards.forEach(card => observer.observe(card));

    return () => {
      cards.forEach(card => observer.unobserve(card));
    };
  }, []);

  const goToCard = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('.feed-card');
    if (cards[idx]) {
      cards[idx].scrollIntoView({ behavior: 'smooth' });
    }
  };

  return {
    feed,
    activeIdx,
    containerRef,
    goToCard,
    canUp: activeIdx > 0,
    canDown: activeIdx < feed.length - 1,
  };
}
