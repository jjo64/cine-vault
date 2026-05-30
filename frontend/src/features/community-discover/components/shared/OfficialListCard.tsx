import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bookmark, Film, Heart, Users } from "lucide-react";
import { C, SERIF, SANS, TMDB_BASE } from "../../constants";
import { fmtCount } from "../../utils";
import { Img } from "../../../../components/shared/Img";
import { OfficialBadge } from "./OfficialBadge";
import type { UserListSummary } from "../../types";

export function OfficialListCard({
  list,
  index,
}: {
  list: UserListSummary;
  index: number;
}) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [saved, setSaved] = useState(false);
  const glowColor = list.glow_color || "212,175,122";

  return (
    <motion.div
      onClick={() => navigate(`/lists/${list.id}`)}
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.07 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0,
        width: 300,
        background: C.surface,
        border: `1px solid ${hov ? "rgba(212,175,122,0.3)" : C.border}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.3s, box-shadow 0.4s, transform 0.35s",
        transform: hov ? "translateY(-5px)" : "none",
        boxShadow: hov
          ? `0 16px 48px rgba(${glowColor}, 0.22), 0 0 0 1px rgba(212,175,122,0.06)`
          : "0 4px 20px rgba(0,0,0,0.5)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, rgba(${glowColor}, ${hov ? 0.1 : 0.04}) 0%, transparent 65%)`,
          transition: "opacity 0.5s",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
          <Img
            src={
              list.custom_cover ||
              (list.posters && list.posters[0]
                ? `${TMDB_BASE}w780${list.posters[0]}`
                : "")
            }
            alt={list.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `saturate(0.5) brightness(${hov ? 0.75 : 0.55})`,
              transition: "filter 0.45s, transform 0.5s",
              transform: hov ? "scale(1.05)" : "scale(1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.1) 40%, rgba(8,8,8,0.75) 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `radial-gradient(ellipse at 50% 100%, rgba(${glowColor}, ${hov ? 0.3 : 0.12}) 0%, transparent 65%)`,
              transition: "opacity 0.5s",
            }}
          />
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <OfficialBadge />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSaved((v) => !v);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(8,8,8,0.75)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${saved ? C.accentDim : "rgba(255,255,255,0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: saved ? C.accent : "rgba(255,255,255,0.8)",
              opacity: hov ? 1 : 0,
              transition: "opacity 0.2s, border-color 0.2s, color 0.2s",
            }}
          >
            <Bookmark
              size={11}
              fill={saved ? C.accent : "none"}
              strokeWidth={1.5}
            />
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Film size={10} color={C.textSoft} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 9,
                color: C.textSoft,
                letterSpacing: "0.12em",
              }}
            >
              {list.items_count} películas
            </span>
          </div>
        </div>

        <div style={{ padding: "14px 16px 16px" }}>
          <h3
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 19,
              color: C.text,
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}
          >
            {list.name}
          </h3>
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 13,
              color: C.textSoft,
              margin: "0 0 14px",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {list.description}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingTop: 10,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: C.textMuted,
                fontFamily: SANS,
                fontSize: 10,
              }}
            >
              <Heart size={9} />
              <span>{fmtCount(0)}</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: C.textMuted,
                fontFamily: SANS,
                fontSize: 10,
              }}
            >
              <Users size={9} />
              <span>{fmtCount(0)} siguiendo</span>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: C.textMuted,
                fontFamily: SANS,
                fontSize: 10,
              }}
            >
              <span>Actualizada reciente</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
