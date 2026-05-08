import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { C, SERIF, SANS, SIZES, tmdbImg } from "../../constants";
import { type TVDetailApi } from "../../../../services/tvDetailServices";

type Episode = NonNullable<
  NonNullable<TVDetailApi["season_details"]>[number]["episodes"]
>[number];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface EpisodeRowProps {
  ep: Episode;
  watched: boolean;
  canToggle: boolean;
  onToggle: () => void;
}

export default function EpisodeRow({
  ep,
  watched,
  canToggle,
  onToggle,
}: EpisodeRowProps) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const numStr = `E${String(ep.episode_number ?? 0).padStart(2, "0")}`;
  const stillSrc =
    !imgErr && ep.still_path ? tmdbImg(ep.still_path, SIZES.STILL) : "";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: `1px solid ${C.border}`,
        background: watched ? "rgba(255,255,255,0.01)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px minmax(110px, 150px) 1fr auto",
          gap: 16,
          padding: "16px 0",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 22,
            color: hov ? C.accentDim : C.textMuted,
            lineHeight: 1,
            paddingTop: 2,
            transition: "color 0.2s",
          }}
        >
          {numStr}
        </div>

        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            background: C.elevated,
            flexShrink: 0,
          }}
        >
          {stillSrc ? (
            <img
              src={stillSrc}
              alt={`Still ${ep.name}`}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: watched
                  ? "saturate(0.55) brightness(0.8)"
                  : "saturate(0.65) brightness(0.9)",
              }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.textMuted,
                fontFamily: SANS,
              }}
            >
              Sin imagen
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              color: watched ? C.textSoft : C.text,
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {ep.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {ep.runtime != null && (
              <span
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  fontFamily: SANS,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={9} color={C.textMuted} /> {ep.runtime} min
              </span>
            )}
            {ep.air_date && (
              <span
                style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}
              >
                {formatDate(ep.air_date)}
              </span>
            )}
            {ep.vote_average != null && ep.vote_average > 0 && (
              <span
                style={{ fontSize: 10, color: C.textMuted, fontFamily: SANS }}
              >
                ★ {(ep.vote_average / 2).toFixed(1)}
              </span>
            )}
          </div>
          {ep.overview && (
            <div
              style={{
                marginTop: 8,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 13,
                color: C.textMuted,
                lineHeight: 1.6,
                maxWidth: 520,
              }}
            >
              {ep.overview.slice(0, 180)}
              {ep.overview.length > 180 ? "…" : ""}
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          disabled={!canToggle}
          title={
            canToggle
              ? "Marcar episodio como visto"
              : "Inicia sesión para marcar episodios como vistos"
          }
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: watched ? C.accentGlow : "none",
            border: `1px solid ${watched ? C.accentDim : canToggle ? C.border : C.textMuted}`,
            color: watched ? C.accent : canToggle ? C.textSoft : C.textMuted,
            cursor: canToggle ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            opacity: canToggle ? (hov || watched ? 1 : 0.4) : 0.5,
            flexShrink: 0,
          }}
        >
          <Check size={12} />
        </button>
      </div>
    </div>
  );
}
