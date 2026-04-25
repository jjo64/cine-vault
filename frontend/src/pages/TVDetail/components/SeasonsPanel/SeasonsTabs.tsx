import { C, SANS } from "../../constants";
import { type TVDetailApi } from "../../services/tvDetailServices";

type Season = NonNullable<TVDetailApi["season_details"]>[number];

interface SeasonTabsProps {
  seasons: Season[];
  activeSeason: number;
  onSelect: (seasonNumber: number) => void;
}

export default function SeasonTabs({
  seasons,
  activeSeason,
  onSelect,
}: SeasonTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        marginBottom: 32,
        borderBottom: `1px solid ${C.border}`,
        overflowX: "auto",
      }}
    >
      {seasons.map((s) => {
        const isActive = s.season_number === activeSeason;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.season_number)}
            style={{
              padding: "12px 22px",
              background: "none",
              border: "none",
              borderBottom: isActive
                ? `2px solid ${C.accent}`
                : "2px solid transparent",
              color: isActive ? C.text : C.textSoft,
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            T{s.season_number}
            <span
              style={{
                marginLeft: 8,
                fontSize: 9,
                color: isActive ? C.accentDim : C.textMuted,
              }}
            >
              ({s.episode_count} ep.)
            </span>
          </button>
        );
      })}
    </div>
  );
}
