import { useState } from 'react';

export function useFeedActions() {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState<number | null>(null);

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setAnimating(id);
        setTimeout(() => setAnimating(null), 800);
      }
      return next;
    });
  };

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    liked,
    bookmarked,
    animating,
    toggleLike,
    toggleBookmark,
  };
}
