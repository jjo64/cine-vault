import React from "react";
import { motion } from "motion/react";
import { TonightFilm } from "./TonightFilm";
import { ForYouCarousel } from "./ForYouCarousel";
import { FastFeed } from "./FastFeed";
import type { MovieMeta, DiaryEntry } from "../../../types";

interface EntradaZoneProps {
  tonightFilm: MovieMeta | null;
  forYouMovies: any[];
  diary: DiaryEntry[];
  followingReviews: any[];
  likedFeedIds: Set<number>;
  likeBusyIds: Set<number>;
  handleToggleFeedLike: (id: number) => void;
  watchedTonight: boolean;
  setWatchedTonight: React.Dispatch<React.SetStateAction<boolean>>;
}

export const EntradaZone: React.FC<EntradaZoneProps> = ({
  tonightFilm,
  forYouMovies,
  diary,
  followingReviews,
  likedFeedIds,
  likeBusyIds,
  handleToggleFeedLike,
  watchedTonight,
  setWatchedTonight,
}) => {
  return (
    <motion.div
      key="entrada"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <TonightFilm 
        tonightFilm={tonightFilm} 
        watchedTonight={watchedTonight} 
        setWatchedTonight={setWatchedTonight} 
      />
      <ForYouCarousel 
        forYouMovies={forYouMovies} 
        lastMovieTitle={diary[0]?.movie_info?.title} 
      />
      <FastFeed 
        followingReviews={followingReviews}
        likedFeedIds={likedFeedIds}
        likeBusyIds={likeBusyIds}
        handleToggleFeedLike={handleToggleFeedLike}
      />
    </motion.div>
  );
};
