import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./ListCard.module.css";

interface ListCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function ListCard({ entry, avatar }: ListCardProps) {
  const posters = entry.posters ?? [];

  return (
    <div className={styles.card}>
      {/* Stacked poster perspective effect */}
      <div className={styles.posterStackWrapper}>
        <div className={styles.stackContainer}>
          {posters
            .slice(0, 3)
            .reverse()
            .map((src: string, i: number) => {
              const idx = 2 - i;
              return (
                <div
                  key={i}
                  className={styles.stackedPoster}
                  style={{
                    top: idx * 4,
                    left: idx * 4,
                    zIndex: idx + 1,
                    transform: `rotate(${(idx - 1) * 3}deg)`,
                  }}
                >
                  <SafeImg
                    src={src}
                    alt=""
                    className={styles.image}
                  />
                </div>
              );
            })}
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.title}>
          {entry.title}
        </div>
        <div className={styles.count}>
          {entry.posterCount} películas
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}
