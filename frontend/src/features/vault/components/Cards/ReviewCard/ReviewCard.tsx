import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./ReviewCard.module.css";

interface ReviewCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function ReviewCard({ entry, avatar }: ReviewCardProps) {
  return (
    <div className={styles.card}>
      {entry.img && (
        <div className={styles.imageHeader}>
          <SafeImg
            src={entry.img}
            alt=""
            className={styles.image}
          />
          {entry.film && (
            <div className={styles.filmName}>
              {entry.film}
            </div>
          )}
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.title}>
          {entry.title}
        </div>
        <div className={styles.text}>
          {entry.text}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}
