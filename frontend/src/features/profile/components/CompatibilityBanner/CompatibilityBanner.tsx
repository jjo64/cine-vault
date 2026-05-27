import styles from "./CompatibilityBanner.module.css";

interface CompatibilityBannerProps {
  reviewsCount: number;
  followersCount: number;
}

export function CompatibilityBanner({
  reviewsCount,
  followersCount,
}: CompatibilityBannerProps) {
  const score = Math.max(
    61,
    Math.min(
      96,
      65 + Math.min(reviewsCount, 20) + Math.min(followersCount, 11),
    ),
  );

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerContent}>
        <div className={styles.affinityText}>
          Compatibilidad cinematográfica:{" "}
          <strong className={styles.score}>{score}%</strong>
        </div>
        <div className={styles.subtitle}>
          Basado en reseñas, ritmo y actividad pública.
        </div>
      </div>
    </div>
  );
}
