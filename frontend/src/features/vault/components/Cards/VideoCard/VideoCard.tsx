import { Play } from "lucide-react";
import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./VideoCard.module.css";

interface VideoCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function VideoCard({ entry, avatar }: VideoCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.videoWrapper}>
        <SafeImg
          src={entry.img}
          alt={entry.title}
          className={styles.image}
        />
        <div className={styles.playOverlay}>
          <div className={styles.playBtn}>
            <Play
              size={14}
              fill="white"
              color="white"
              className={styles.playIcon}
            />
          </div>
        </div>
        {entry.duration && (
          <div className={styles.duration}>
            {entry.duration}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          {entry.title}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}
