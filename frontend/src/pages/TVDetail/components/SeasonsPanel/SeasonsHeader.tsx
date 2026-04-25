import { C, SERIF, SANS, TMDB_POSTER, tmdbImg } from "../../constants";
import { type TVDetailApi } from "../../services/tvDetailServices";

type Season = NonNullable<TVDetailApi["season_details"]>[number];

function formatYear(d?: string) {
  return d ? d.slice(0, 4) : "—";
}

function Img({ src, alt, style }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={src || ""} alt={alt} style={style} />;
}

interface SeasonHeaderProps {
  season: Season;
  watched: number;
  pct: number;
}

export default function SeasonHeader({
  season,
  watched,
  pct,
}: SeasonHeaderProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 28,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          borderRadius: 1,
          overflow: "hidden",
          border: `1px solid ${C.border}`,
        }}
      >
        <Img
          src={tmdbImg(season.poster_path, TMDB_POSTER)}
          alt={season.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.5) brightness(0.75)",
          }}
        />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: SERIF, fontSize: 22, color: C.text }}>
            {season.name}
          </span>
          {season.air_date && (
            <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
              {formatYear(season.air_date)}
            </span>
          )}
        </div>
        {season.overview && (
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 14,
              color: C.textSoft,
              lineHeight: 1.7,
              marginBottom: 16,
              maxWidth: 480,
            }}
          >
            {season.overview}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              flex: 1,
              maxWidth: 200,
              height: 2,
              background: C.border,
              borderRadius: 1,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: C.accent,
                borderRadius: 1,
                transition: "width 0.4s",
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
            {watched}/{season.episode_count} vistos
          </span>
        </div>
      </div>
    </div>
  );
}
