import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./MoodboardCard.module.css";

interface MoodboardCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function MoodboardCard({ entry, avatar }: MoodboardCardProps) {
  const imgs = entry.imgs ?? [];

  return (
    <div className={styles.card}>
      <div className={styles.grid}>
        {imgs.slice(0, 6).map((src: string, i: number) => (
          <div key={i} className={styles.imageItem}>
            <SafeImg
              src={src}
              alt=""
              className={styles.image}
            />
          </div>
        ))}
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
