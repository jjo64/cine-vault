export type User = {
  name: string;
  handle: string;
  films: number;
  avatar: string;
};

export type Film = {
  title: string;
  year: number;
  director: string;
  id: string;
  duration?: string;
};

export type FeedItem =
  | { id: number; type: 'review';    user: User; film: Film; rating: number; text: string; tags: string[]; likes: number; comments: number; bg: string }
  | { id: number; type: 'vault';     user: User; vaultType: string; title: string; duration: string; description: string; views: number; likes: number; comments: number; bg: string }
  | { id: number; type: 'tonight';   film: Film; description: string; points: number; likes: number; comments: number; bg: string }
  | { id: number; type: 'discovery'; film: Film; quote: string; description: string; likes: number; comments: number; bg: string }
  | { id: number; type: 'list';      user: User; listTitle: string; description: string; count: number; films: string[]; likes: number; comments: number; bg: string }
  | { id: number; type: 'quote';     director: string; quote: string; source: string; likes: number; comments: number; bg: string };
