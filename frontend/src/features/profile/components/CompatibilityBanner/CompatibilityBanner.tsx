import styles from "./CompatibilityBanner.module.css";

interface CompatibilityBannerProps {
  score?: number | null;
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Almas gemelas cinematográficas";
  if (score >= 70) return "Alta afinidad de gusto";
  if (score >= 50) return "Visiones complementarias";
  if (score >= 30) return "Perspectivas distintas";
  return "Universos cinematográficos opuestos";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#D4AF7A";
  if (score >= 60) return "#A89060";
  if (score >= 40) return "#7A6840";
  return "#5A5040";
}

export function CompatibilityBanner({ score }: CompatibilityBannerProps) {
  // Don't render at all when there's no meaningful score
  if (score == null) return null;

  const label = getScoreLabel(score);
  const color = getScoreColor(score);

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerContent}>
        <div className={styles.left}>
          <div className={styles.eyebrow}>Compatibilidad cinematográfica</div>
          <div className={styles.label}>{label}</div>
        </div>

        <div className={styles.right}>
          <div className={styles.scoreDisplay} style={{ color }}>
            {score}<span className={styles.pct}>%</span>
          </div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, ${color}66, ${color})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
