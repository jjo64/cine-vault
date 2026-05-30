import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import type { VaultEntry } from "../../../types";
import { SafeImg } from "../../shared/SafeImg/SafeImg";
import { CardFooter } from "../../shared/CardFooter/CardFooter";
import styles from "./AudioCard.module.css";

interface AudioCardProps {
  entry: VaultEntry;
  avatar: string;
}

export function AudioCard({ entry, avatar }: AudioCardProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggle = () => {
    if (playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPlaying(false);
    } else {
      setPlaying(true);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setPlaying(false);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    }
  };

  // Limpiar el interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.card}>
      <SafeImg
        src={entry.img}
        alt=""
        className={styles.bgImage}
      />
      <div className={styles.content}>
        <div className={styles.playerRow}>
          <button onClick={toggle} className={styles.playBtn}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--color-accent)">
                <rect x="2" y="2" width="3" height="8" rx="0.5" />
                <rect x="7" y="2" width="3" height="8" rx="0.5" />
              </svg>
            ) : (
              <Play size={12} fill="var(--color-accent)" style={{ marginLeft: 1 }} />
            )}
          </button>

          {/* Waveform bars */}
          <div className={styles.waveform}>
            {Array.from({ length: 28 }).map((_, i) => {
              const h = 4 + Math.abs(Math.sin(i * 0.9)) * 20;
              const filled = (i / 28) * 100 < progress;
              return (
                <div
                  key={i}
                  className={styles.waveBar}
                  style={{
                    height: `${h}px`,
                    background: filled ? "var(--color-accent)" : "var(--color-text-muted)",
                    opacity: filled ? 1 : 0.5,
                  }}
                />
              );
            })}
          </div>

          {entry.duration && (
            <span className={styles.duration}>
              {entry.duration}
            </span>
          )}
        </div>
        <div className={styles.title}>
          {entry.title}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}
