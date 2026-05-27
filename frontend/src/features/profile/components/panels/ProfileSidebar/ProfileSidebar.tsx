import { useMemo } from "react";
import { BarChart2, Film, Trophy } from "lucide-react";
import type { RecentlyWatchedItem, ReviewItem } from "../../../types";
import styles from "./ProfileSidebar.module.css";

function ActivityStats() {
  const monthData = [
    { month: "Oct", count: 8 },
    { month: "Nov", count: 14 },
    { month: "Dic", count: 11 },
    { month: "Ene", count: 6 },
    { month: "Feb", count: 19 },
    { month: "Mar", count: 12 },
  ];
  const max = Math.max(...monthData.map((m) => m.count));

  return (
    <div className={styles.sidebarBlock}>
      <div className={styles.blockTitleRow}>
        <BarChart2 size={13} className={styles.accentIcon} />
        <span className={styles.blockTitleText}>
          Actividad 2025
        </span>
      </div>
      <div className={styles.activityBarsRow}>
        {monthData.map(({ month, count }) => (
          <div key={month} className={styles.activityBarCol}>
            <div
              className={styles.activityBarFill}
              style={{
                opacity: 0.4 + (count / max) * 0.6,
                height: `${(count / max) * 48}px`,
              }}
            />
            <span className={styles.activityBarMonth}>
              {month}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.activitySummary}>
        <span className={styles.textWhite}>70</span> películas este año · mejor
        mes: <span className={styles.textWhite}>Febrero</span>
      </div>
    </div>
  );
}

function GenreSidebar({
  recentlyWatched,
  reviewItems,
}: {
  recentlyWatched: RecentlyWatchedItem[];
  reviewItems: ReviewItem[];
}) {
  const radar = useMemo(() => {
    const total = Math.max(1, recentlyWatched.length);
    const highRated = recentlyWatched.filter((film) => film.rating >= 4).length;
    const classics = recentlyWatched.filter(
      (film) => film.year !== null && film.year < 2000,
    ).length;
    const oldCinema = recentlyWatched.filter(
      (film) => film.year !== null && film.year < 1985,
    ).length;
    const reviewWeight = Math.min(1, reviewItems.length / 10);

    const clamp = (value: number) => Math.max(0.2, Math.min(0.95, value));

    return [
      {
        label: "Autor",
        short: "Autor",
        value: clamp(0.35 + (classics / total) * 0.5),
      },
      {
        label: "Drama",
        short: "Drama",
        value: clamp(0.4 + reviewWeight * 0.45),
      },
      {
        label: "Contemplativo",
        short: "Cont.",
        value: clamp(0.3 + (highRated / total) * 0.55),
      },
      {
        label: "Noir",
        short: "Noir",
        value: clamp(0.2 + (oldCinema / total) * 0.45),
      },
      {
        label: "Sci-fi",
        short: "Sci-fi",
        value: clamp(0.25 + ((total % 5) / 5) * 0.35),
      },
      {
        label: "Riesgo",
        short: "Riesgo",
        value: clamp(0.28 + Math.min(1, total / 12) * 0.42),
      },
    ];
  }, [recentlyWatched, reviewItems]);

  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = 68;
  const n = radar.length;

  const getCoords = (i: number, val: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxR * val,
      y: cy + Math.sin(angle) * maxR * val,
    };
  };

  const getLabelCoords = (i: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * (maxR + 20),
      y: cy + Math.sin(angle) * (maxR + 20),
    };
  };

  const textAnchor = (i: number): "middle" | "start" | "end" => {
    const cos = Math.cos((i / n) * 2 * Math.PI - Math.PI / 2);
    if (Math.abs(cos) < 0.15) return "middle";
    return cos > 0 ? "start" : "end";
  };

  const polygonPoints = radar
    .map((g, i) => {
      const p = getCoords(i, g.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className={styles.sidebarBlock}>
      <div className={styles.blockTitleRow}>
        <Film size={11} className={styles.accentIcon} />
        <span className={styles.blockTitleText}>Radar competitivo</span>
      </div>
      <div className={styles.radarSubtitle}>
        Tu huella cinematográfica en esta temporada
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={styles.radarSvg}
      >
        {gridLevels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = getCoords(i, level);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={level === 1.0 ? 0.8 : 0.5}
              strokeDasharray={level < 1 ? "2,3" : undefined}
              className={styles.radarGridPolygon}
              style={{ opacity: level === 1.0 ? 0.6 : 0.3 }}
            />
          );
        })}

        {radar.map((_, i) => {
          const end = getCoords(i, 1.0);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--color-border)"
              strokeWidth="0.7"
              style={{ opacity: 0.5 }}
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="var(--color-accent-glow)"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {radar.map((g, i) => {
          const p = getCoords(i, g.value);
          return (
            <circle
              key={g.label}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="var(--color-accent)"
            >
              <title>
                {g.label}: {Math.round(g.value * 100)}%
              </title>
            </circle>
          );
        })}

        {radar.map((g, i) => {
          const lp = getLabelCoords(i);
          return (
            <text
              key={g.label}
              x={lp.x}
              y={lp.y}
              textAnchor={textAnchor(i)}
              dominantBaseline="middle"
              className={styles.radarLabelText}
            >
              {g.short}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function AchievementsSidebar({ userBadges = [] }: { userBadges?: any[] }) {
  if (!userBadges || userBadges.length === 0) return null;

  return (
    <div className={styles.sidebarBlock}>
      <div className={styles.blockTitleRow}>
        <Trophy size={12} className={styles.goldIcon} />
        <span className={styles.blockTitleText}>Logros recientes</span>
      </div>
      {userBadges.slice(0, 5).map((ub) => {
        const badge = ub.badges;
        return (
          <div key={ub.id} className={styles.achievementRow}>
            <div className={styles.achievementIconWrapper}>
              {badge.icon_url?.startsWith("http") ? (
                <img
                  src={badge.icon_url}
                  alt=""
                  className={styles.achievementIconImg}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerText = "🏆";
                    }
                  }}
                />
              ) : (
                <span className={styles.achievementEmoji}>
                  {badge.icon_url || "🏆"}
                </span>
              )}
            </div>
            <div className={styles.achievementInfo}>
              <div className={styles.achievementName}>
                {badge.name}
              </div>
              <div className={styles.achievementDesc}>
                {badge.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ProfileSidebarProps {
  recentlyWatched: RecentlyWatchedItem[];
  reviewItems: ReviewItem[];
  userBadges?: any[];
}

export function ProfileSidebar({
  recentlyWatched,
  reviewItems,
  userBadges = [],
}: ProfileSidebarProps) {
  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.stickyContent}>
        <ActivityStats />
        <GenreSidebar
          recentlyWatched={recentlyWatched}
          reviewItems={reviewItems}
        />
        <AchievementsSidebar userBadges={userBadges} />
      </div>
    </aside>
  );
}
