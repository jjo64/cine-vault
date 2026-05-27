import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { VaultEntry, EntryType } from "../../../types";
import { SafeImg } from "../SafeImg/SafeImg";
import styles from "./CardFooter.module.css";

interface CardFooterProps {
  entry: VaultEntry;
  avatar: string;
}

const typeLabel: Record<EntryType, string> = {
  image: "Imagen",
  video: "Video",
  audio: "Audio",
  moodboard: "Mood Board",
  list: "Lista",
  review: "Reseña",
};

export function CardFooter({ entry, avatar }: CardFooterProps) {
  const [liked, setLiked] = useState(false);

  return (
    <div className={styles.footer}>
      <div className={styles.avatarWrapper}>
        <SafeImg
          src={avatar}
          alt=""
          className={styles.avatar}
        />
      </div>
      {entry.film && (
        <span className={styles.filmName}>
          {entry.film}
        </span>
      )}
      <span className={styles.typeBadge}>
        {typeLabel[entry.type]}
      </span>
      <div className={styles.actions}>
        <button
          onClick={() => setLiked((v) => !v)}
          className={`${styles.actionBtn} ${liked ? styles.liked : ""}`}
        >
          <Heart size={11} fill={liked ? "var(--color-accent)" : "none"} />
          <span className={styles.actionBtnText}>
            {entry.likes + (liked ? 1 : 0)}
          </span>
        </button>
        <button className={styles.actionBtn}>
          <MessageCircle size={11} />
          <span className={styles.actionBtnText}>
            {entry.comments}
          </span>
        </button>
      </div>
    </div>
  );
}
