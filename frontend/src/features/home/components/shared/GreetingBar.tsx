import React from "react";
import { Flame, Trophy, Star } from "lucide-react";
import { C, SERIF } from "../../constants";
import styles from "../HomeLogged.module.css";

interface GreetingBarProps {
  greetingName: string;
  diaryLength: number;
  reviewsLength: number;
  watchlistLength: number;
}

export const GreetingBar: React.FC<GreetingBarProps> = ({
  greetingName,
  diaryLength,
  reviewsLength,
  watchlistLength,
}) => {
  return (
    <div className={styles.greetingBar}>
      <div>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            color: C.textSoft,
          }}
        >
          Bienvenido de vuelta,{" "}
        </span>
        <span style={{ fontFamily: SERIF, fontSize: 17, color: C.text }}>
          {greetingName}.
        </span>
      </div>
      <div className={styles.greetingStats}>
        <div className={styles.statItem}>
          <Flame size={12} color={C.accent} />{" "}
          <span style={{ color: C.text }}>
            {Math.min(9, Math.max(1, diaryLength))}
          </span>{" "}
          <span className={styles.statLabel}>dias de racha</span>
        </div>
        <div className={styles.statItem}>
          <Trophy size={12} color={C.gold} />{" "}
          <span style={{ color: C.text }}>
            {reviewsLength * 40 + diaryLength * 15}
          </span>{" "}
          <span className={styles.statLabel}>puntos</span>
        </div>
        <div className={styles.statItem}>
          <Star size={12} color={C.gold} />{" "}
          <span style={{ color: C.text }}>
            {Math.min(
              7,
              Math.max(
                1,
                Math.floor((reviewsLength + watchlistLength) / 3),
              ),
            )}
          </span>{" "}
          <span className={styles.statLabel}>insignias</span>
        </div>
      </div>
    </div>
  );
};
