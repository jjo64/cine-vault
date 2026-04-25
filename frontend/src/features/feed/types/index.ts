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
  mediaType?: "movie" | "tv";
  posterPath?: string | null;
};

export type FeedTab = "Para ti" | "Siguiendo";

type FeedItemMeta = {
  itemRef: string;
  backendType:
    | "review"
    | "vault"
    | "watchlist"
    | "discovery"
    | "tonight"
    | "list"
    | "quote";
  sourceTab: FeedTab;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  bookmarked: boolean;
  canLike: boolean;
  canComment: boolean;
  canBookmark: boolean;
  canShare: boolean;
  canHide: boolean;
  canReport: boolean;
  reviewId?: number;
  recommendationMediaId?: number;
};

export type FeedItem =
  | ({
      id: number;
      type: "review";
      user: User;
      film: Film;
      rating: number;
      text: string;
      tags: string[];
      bg: string;
    } & FeedItemMeta)
  | ({
      id: number;
      type: "vault";
      user: User;
      vaultType: string;
      title: string;
      duration: string;
      description: string;
      views: number;
      bg: string;
    } & FeedItemMeta)
  | ({
      id: number;
      type: "tonight";
      film: Film;
      description: string;
      points: number;
      bg: string;
    } & FeedItemMeta)
  | ({
      id: number;
      type: "discovery";
      film: Film;
      quote: string;
      description: string;
      bg: string;
    } & FeedItemMeta)
  | ({
      id: number;
      type: "list";
      user: User;
      listTitle: string;
      description: string;
      count: number;
      films: string[];
      bg: string;
    } & FeedItemMeta)
  | ({
      id: number;
      type: "quote";
      director: string;
      quote: string;
      source: string;
      bg: string;
    } & FeedItemMeta);
