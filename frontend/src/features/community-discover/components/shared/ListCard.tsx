import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, Bookmark, Lock, Film } from "lucide-react";
import { C, SERIF, SANS, TMDB_BASE } from "../../constants";
import { fmtCount } from "../../utils";
import { Img } from "../../../../components/shared/Img";
import { OfficialBadge } from "./OfficialBadge";
import { CoverCollage } from "./CoverCollage";
import type { UserListSummary } from "../../types";

const item_likes_count_mock_placeholder = 0;

export function ListCard({ list, index }: { list: UserListSummary; index: number }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hov, setHov] = useState(false);

  const postersWithBase = (list.posters || []).map((p) =>
    p ? `${TMDB_BASE}w500${p}` : "",
  );
  const glowColor = list.glow_color || "212,175,122";

  return (
    <motion.div
      onClick={() => navigate(`/lists/${list.id}`)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.055 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.3s, box-shadow 0.4s, transform 0.35s",
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov
          ? `0 12px 40px rgba(${glowColor}, 0.18), 0 0 0 1px rgba(${glowColor}, 0.08)`
          : "0 4px 16px rgba(0,0,0,0.4)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, rgba(${glowColor}, ${hov ? 0.07 : 0.03}) 0%, transparent 60%)`,
          transition: "opacity 0.5s",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <CoverCollage
          posters={postersWithBase}
          customCover={list.custom_cover || undefined}
          premium={list.is_premium}
          glowColor={glowColor}
        />

        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {list.is_official && <OfficialBadge />}
          {!list.is_public && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                background: "rgba(8,8,8,0.7)",
                border: `1px solid ${C.border}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <Lock size={8} color={C.textSoft} />
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  color: C.textSoft,
                  letterSpacing: "0.18em",
                }}
              >
                PRIVADA
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            opacity: hov ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked((v) => !v);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(8,8,8,0.75)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${liked ? C.accentDim : "rgba(255,255,255,0.15)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: liked ? C.accent : "rgba(255,255,255,0.8)",
              transition: "all 0.2s",
            }}
          >
            <Heart
              size={11}
              fill={liked ? C.accent : "none"}
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSaved((v) => !v);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(8,8,8,0.75)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${saved ? C.accentDim : "rgba(255,255,255,0.15)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: saved ? C.accent : "rgba(255,255,255,0.8)",
              transition: "all 0.2s",
            }}
          >
            <Bookmark
              size={11}
              fill={saved ? C.accent : "none"}
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div style={{ padding: "14px 16px 16px" }}>
          <h3
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 18,
              color: C.text,
              margin: "0 0 5px",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
              margin: "0 0 12px",
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
              gap: 5,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {(list.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                  border: `1px solid ${C.border}`,
                  padding: "2px 7px",
                  fontFamily: SANS,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 11,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: list.is_official
                    ? "rgba(212,175,122,0.15)"
                    : "rgba(255,255,255,0.06)",
                  border: `1px solid ${list.is_official ? "rgba(212,175,122,0.3)" : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 11,
                  color: list.is_official ? C.accent : C.textSoft,
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {list.owner?.avatar_url ? (
                  <Img
                    src={list.owner.avatar_url}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  list.owner?.username?.slice(0, 1).toUpperCase() || "U"
                )}
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  color: C.textSoft,
                  letterSpacing: "0.04em",
                }}
              >
                {list.owner?.username || "Anónimo"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                <Film size={9} />
                <span>{list.items_count}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: liked ? C.accent : C.textMuted,
                  fontFamily: SANS,
                  fontSize: 10,
                  transition: "color 0.2s",
                }}
              >
                <Heart
                  size={9}
                  fill={liked ? C.accent : "none"}
                  strokeWidth={liked ? 0 : 1.5}
                />
                <span>{fmtCount(item_likes_count_mock_placeholder)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
