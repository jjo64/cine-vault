import { useMemo } from "react";
import { BarChart2, Film, Trophy } from "lucide-react";
import type { RecentlyWatchedItem, ReviewItem } from "../../../types";
import styles from "./ProfileSidebar.module.css";

function ActivityStats({ allDiaryFilms = [] }: { allDiaryFilms?: RecentlyWatchedItem[] }) {
  const currentYear = new Date().getFullYear();

  // 1. Calculate movies watched in the current year
  const filmsThisYear = allDiaryFilms.filter((film) => {
    if (!film.watchedDate) return false;
    const date = new Date(film.watchedDate);
    return date.getFullYear() === currentYear;
  });

  const countThisYear = filmsThisYear.length;

  // 2. Find best month of the current year
  const monthsSpanish = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const monthlyCountsThisYear = Array(12).fill(0);
  filmsThisYear.forEach((film) => {
    if (film.watchedDate) {
      const month = new Date(film.watchedDate).getMonth();
      monthlyCountsThisYear[month]++;
    }
  });

  let bestMonthIndex = -1;
  let maxMonthCount = 0;
  for (let i = 0; i < 12; i++) {
    if (monthlyCountsThisYear[i] > maxMonthCount) {
      maxMonthCount = monthlyCountsThisYear[i];
      bestMonthIndex = i;
    }
  }

  const bestMonthLabel =
    bestMonthIndex !== -1 ? monthsSpanish[bestMonthIndex] : "Ninguno";

  // 3. Generate last 6 months data
  const monthsShort = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const today = new Date();
  const monthData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mIndex = d.getMonth();
    const yVal = d.getFullYear();

    // Count films in this month and year
    const count = allDiaryFilms.filter((film) => {
      if (!film.watchedDate) return false;
      const date = new Date(film.watchedDate);
      return date.getMonth() === mIndex && date.getFullYear() === yVal;
    }).length;

    monthData.push({
      month: monthsShort[mIndex],
      count,
    });
  }

  const max = Math.max(...monthData.map((m) => m.count), 1); // Avoid division by zero

  return (
    <div className={styles.sidebarBlock}>
      <div className={styles.blockTitleRow}>
        <BarChart2 size={13} className={styles.accentIcon} />
        <span className={styles.blockTitleText}>
          Actividad {currentYear}
        </span>
      </div>
      <div className={styles.activityBarsRow}>
        {monthData.map(({ month, count }) => (
          <div key={month} className={styles.activityBarCol}>
            <div
              className={styles.activityBarFill}
              style={{
                opacity: count > 0 ? 0.4 + (count / max) * 0.6 : 0.1,
                height: `${(count / max) * 48}px`,
                minHeight: count > 0 ? "2px" : "0px",
              }}
            />
            <span className={styles.activityBarMonth}>
              {month}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.activitySummary}>
        <span className={styles.textWhite}>{countThisYear}</span> película{countThisYear !== 1 ? "s" : ""} este año · mejor
        mes: <span className={styles.textWhite}>{bestMonthLabel}</span>
      </div>
    </div>
  );
}

function GenreSidebar({
  allDiaryFilms = [],
  reviewItems,
}: {
  allDiaryFilms?: RecentlyWatchedItem[];
  reviewItems: ReviewItem[];
}) {
  const radar = useMemo(() => {
    const total = Math.max(1, allDiaryFilms.length);

    // 1. Autor: classic films (year < 2000)
    const classics = allDiaryFilms.filter(
      (film) => film.year !== null && film.year < 2000,
    ).length;
    const autorRatio = classics / total;

    // 2. Drama: drama-related genres
    const dramaCount = allDiaryFilms.filter((film) => {
      const g = film.primaryGenre?.toLowerCase() || "";
      return (
        g.includes("drama") ||
        g.includes("historia") ||
        g.includes("romance")
      );
    }).length;
    const dramaRatio = dramaCount / total;

    // 3. Contemplativo: high ratings (>= 4) or slow paced/long (> 120m)
    const contemplativoCount = allDiaryFilms.filter(
      (film) =>
        film.rating >= 4 ||
        (film.runtimeMinutes && film.runtimeMinutes > 120),
    ).length;
    const contemplativoRatio = contemplativoCount / total;

    // 4. Noir: thriller, crime, mystery or retro (year < 1985)
    const noirCount = allDiaryFilms.filter((film) => {
      const g = film.primaryGenre?.toLowerCase() || "";
      const isRetro = film.year !== null && film.year < 1985;
      const isNoirGenre =
        g.includes("crimen") ||
        g.includes("misterio") ||
        g.includes("suspenso") ||
        g.includes("thriller") ||
        g.includes("terror");
      return isRetro || isNoirGenre;
    }).length;
    const noirRatio = noirCount / total;

    // 5. Sci-fi / Fantasy / Adventure / Action
    const scifiCount = allDiaryFilms.filter((film) => {
      const g = film.primaryGenre?.toLowerCase() || "";
      return (
        g.includes("ciencia") ||
        g.includes("sci-fi") ||
        g.includes("fantas") ||
        g.includes("aventura") ||
        g.includes("acci")
      );
    }).length;
    const scifiRatio = scifiCount / total;

    // 6. Riesgo: genre diversity (unique genres / total) or reviews weight
    const uniqueGenres = new Set(
      allDiaryFilms.map((film) => film.primaryGenre).filter(Boolean),
    );
    const genreDiversity =
      uniqueGenres.size / Math.max(1, allDiaryFilms.length);
    const reviewRatio = Math.min(1, reviewItems.length / Math.max(1, total));
    const riesgoRatio = (genreDiversity + reviewRatio) / 2;

    const clamp = (value: number) => Math.max(0.15, Math.min(0.95, value));

    const hasFilms = allDiaryFilms.length > 0;

    return [
      {
        label: "Autor",
        short: "Autor",
        value: clamp(hasFilms ? 0.2 + autorRatio * 0.75 : 0.45),
      },
      {
        label: "Drama",
        short: "Drama",
        value: clamp(hasFilms ? 0.2 + dramaRatio * 0.75 : 0.65),
      },
      {
        label: "Contemplativo",
        short: "Cont.",
        value: clamp(hasFilms ? 0.2 + contemplativoRatio * 0.75 : 0.5),
      },
      {
        label: "Noir",
        short: "Noir",
        value: clamp(hasFilms ? 0.2 + noirRatio * 0.75 : 0.35),
      },
      {
        label: "Sci-fi",
        short: "Sci-fi",
        value: clamp(hasFilms ? 0.2 + scifiRatio * 0.75 : 0.4),
      },
      {
        label: "Riesgo",
        short: "Riesgo",
        value: clamp(hasFilms ? 0.2 + riesgoRatio * 0.75 : 0.3),
      },
    ];
  }, [allDiaryFilms, reviewItems]);

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
              {badge.icon_url?.startsWith("http") || badge.icon_url?.startsWith("/") ? (
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
  allDiaryFilms?: RecentlyWatchedItem[];
}

export function ProfileSidebar({
  recentlyWatched: _recentlyWatched,
  reviewItems,
  userBadges = [],
  allDiaryFilms = [],
}: ProfileSidebarProps) {
  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.stickyContent}>
        <ActivityStats allDiaryFilms={allDiaryFilms} />
        <GenreSidebar
          allDiaryFilms={allDiaryFilms}
          reviewItems={reviewItems}
        />
        <AchievementsSidebar userBadges={userBadges} />
      </div>
    </aside>
  );
}
