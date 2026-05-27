import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./ImageCard.module.css";

interface ImageCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function ImageCard({ entry, avatar }: ImageCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <SafeImg
          src={entry.img}
          alt={entry.title}
          className={styles.image}
        />
        <div className={styles.overlay}>
          <div className={styles.title}>
            {entry.title}
          </div>
          {entry.film && (
            <div className={styles.film}>
              {entry.film}
            </div>
          )}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}
