import { useState, useEffect, useRef } from 'react';
import type { FeedItem } from '../types';


// Temporarily keeping the mock data here as in the original file
const FEED_MOCK: FeedItem[] = [
  {
    id: 1, type: 'review',
    user: { name: 'Martina Reyes', handle: '@martinareyes', films: 347, avatar: 'M' },
    film: { title: 'Stalker', year: 1979, director: 'Tarkovsky', id: 'stalker' },
    rating: 5,
    text: 'Hay películas que ves y películas que te ven. Stalker es de las segundas. Tarkovsky construye un espacio donde no importa si la Zona existe o no — lo que importa es lo que cada personaje está dispuesto a confesar frente a ella. Ver esto en 2026 es entender que el mundo no cambió tanto.',
    tags: ['Existencialismo', 'Slow cinema', 'URSS'],
    likes: 284, comments: 47,
    bg: 'https://images.unsplash.com/photo-1648256289719-9ebbd79faaa5?w=1200&q=85',
  },
  {
    id: 2, type: 'vault',
    user: { name: 'Martina Reyes', handle: '@martinareyes', films: 347, avatar: 'M' },
    vaultType: 'Reflexión', title: 'Por qué Tarkovsky te cambia la vida',
    duration: '12 min', views: 4821,
    description: 'Una mirada a la filosofía detrás del tiempo como lenguaje cinematográfico. De Stalker a El espejo, cómo un director soviético redefinió lo que el cine puede hacer con el tiempo.',
    likes: 1203, comments: 89,
    bg: 'https://images.unsplash.com/photo-1768622943509-24488766e94b?w=1200&q=85',
  },
  {
    id: 3, type: 'tonight',
    film: { title: 'Andrei Rublev', year: 1966, director: 'Tarkovsky', id: 'andrei-rublev', duration: '3h 25m' },
    description: 'Un monje medieval. El arte como resistencia. El alma humana bajo el yugo. 205 minutos que se sienten como un sueño que no querés que termine.',
    points: 40, likes: 891, comments: 134,
    bg: 'https://images.unsplash.com/photo-1680479610863-13c6224a78d0?w=1200&q=85',
  },
  {
    id: 4, type: 'review',
    user: { name: 'Diego Pereyra', handle: '@diegop', films: 512, avatar: 'D' },
    film: { title: 'Mulholland Dr.', year: 2001, director: 'Lynch', id: 'mulholland' },
    rating: 5,
    text: 'Lynch no dirige películas, construye sueños con arquitectura propia. La primera vez la odié. La quinta entendí que es la única película que honestamente representa cómo funciona la mente cuando la realidad se desintegra. Hollywood como pesadilla y como deseo.',
    tags: ['Lynch', 'Neo-noir', 'Surrealismo', 'Hollywood'],
    likes: 437, comments: 63,
    bg: 'https://images.unsplash.com/photo-1770896689026-f5421714f6a5?w=1200&q=85',
  },
  {
    id: 5, type: 'discovery',
    film: { title: 'Jeanne Dielman', year: 1975, director: 'Chantal Akerman', id: 'jeanne-dielman', duration: '3h 28m' },
    quote: 'El minimalismo más devastador del siglo XX.',
    description: 'Akerman filmó tres horas y media de rutina doméstica que explotan sin que lo veas venir. El tiempo real como arma política. Una de las películas más importantes jamás hechas.',
    likes: 672, comments: 91,
    bg: 'https://images.unsplash.com/photo-1769650795757-c901425aefbb?w=1200&q=85',
  },
  {
    id: 6, type: 'vault',
    user: { name: 'Cinéfilo Sur', handle: '@cinefilosur', films: 189, avatar: 'C' },
    vaultType: 'Edit', title: 'Planos que detienen el tiempo',
    duration: '6 min', views: 12400,
    description: 'Una selección de planos secuencia, silencios y miradas que hacen que el corazón se pause. Tarkovsky, Angelopoulos, Hou Hsiao-hsien, Kiarostami.',
    likes: 2847, comments: 203,
    bg: 'https://images.unsplash.com/photo-1760346738721-235e811f573d?w=1200&q=85',
  },
  {
    id: 7, type: 'list',
    user: { name: 'Nocturnal Viewer', handle: '@nocturnal', films: 920, avatar: 'N' },
    listTitle: 'Para ver a las 3 AM',
    description: 'No para dormir. Para entrar en un estado otro. Ocho películas que cambian tu frecuencia.',
    count: 8,
    films: ['Inland Empire', 'Enter the Void', 'Sátántangó', 'The Holy Mountain'],
    likes: 1891, comments: 156,
    bg: 'https://images.unsplash.com/photo-1656914871811-148cfdbb6ef4?w=1200&q=85',
  },
  {
    id: 8, type: 'review',
    user: { name: 'Laura Montes', handle: '@lauramontes', films: 512, avatar: 'L' },
    film: { title: 'In the Mood for Love', year: 2000, director: 'Wong Kar-wai', id: 'in-the-mood' },
    rating: 5,
    text: 'Una película sobre lo que no sucede. Wong Kar-wai filma el deseo como niebla — presente en todas partes, tocable en ninguna. Los trajes de Maggie Cheung son el único personaje que realmente se mueve.',
    tags: ['Hong Kong', 'Deseo', 'Lento', 'Banda sonora perfecta'],
    likes: 1204, comments: 88,
    bg: 'https://images.unsplash.com/photo-1750658659043-76407ff8d677?w=1200&q=85',
  },
  {
    id: 9, type: 'quote',
    director: 'Ingmar Bergman',
    quote: 'No hay arte que pase por los sentidos humanos de manera tan directa y convincente como el cine, que actúa directamente sobre los sentimientos.',
    source: 'Linterna Mágica, 1987',
    likes: 3241, comments: 189,
    bg: 'https://images.unsplash.com/photo-1762948050110-76e67d7aae29?w=1200&q=85',
  },
  {
    id: 10, type: 'discovery',
    film: { title: 'La Dolce Vita', year: 1960, director: 'Fellini', id: 'la-dolce-vita', duration: '2h 54m' },
    quote: 'El vacío más elegante que jamás se filmó.',
    description: 'Fellini retrató el hedonismo romano de los años 60 como una trampa dorada. Marcello busca algo — nunca sabe qué. Vos sí.',
    likes: 891, comments: 102,
    bg: 'https://images.unsplash.com/photo-1686511474427-40a3154453a1?w=1200&q=85',
  },
];

export function useFeedData() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    feed: FEED_MOCK,
    activeIdx,
    containerRef,
    goToCard,
    canUp: activeIdx > 0,
    canDown: activeIdx < FEED_MOCK.length - 1,
  };
}
