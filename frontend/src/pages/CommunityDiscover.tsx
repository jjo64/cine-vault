/**
 * CineVault — Lists Directory · /lists
 * "Listas Curadas" — directorio editorial de listas cinematográficas
 * Palette: #080808 bg · #111111 card · #D4AF7A accent
 * Typography: Cormorant Garamond (serif) + Syne (sans-serif)
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Heart,
  Film,
  Lock,
  Globe,
  X,
  Check,
  Bookmark,
  Users,
  ArrowUpDown,
} from "lucide-react";

import {
  getMyLists,
  getPublicLists,
  createList,
  type UserListSummary,
} from "../services/listsServices";
import {
  getCurrentUser,
  getStoredAccessToken,
  type AuthUser,
} from "../services/authServices";
import { TMDB_BASE } from "../services/searchServices";

type TabId = "all" | "official" | "friends" | "mine";
type SortId = "popular" | "recent" | "alphabetical";

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#181818",
  border: "#232323",
  borderHover: "#383838",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.10)",
  accentGlowStrong: "rgba(212,175,122,0.20)",
  text: "#E2E2E2",
  textSoft: "#727272",
  textMuted: "#3C3C3C",
  gold: "#C8A96E",
  official: "#E8C98D",
} as const;

const SERIF = "'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

// ─── HELPERS ─────────────────────────────────────────────────
function Img({
  src,
  alt,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ ...style, background: C.elevated }} />;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}

function Grain() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 900,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        opacity: 0.36,
      }}
    />
  );
}

function fmtCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar({ user }: { user: AuthUser | null }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.82)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "all 0.4s",
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: SERIF,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: C.text,
          textDecoration: "none",
        }}
      >
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "Para vos", href: "/for-you" },
          { label: "Feed", href: "/feed" },
          { label: "Explorar", href: "/search" },
          { label: "Listas", href: "/lists", active: true },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: (item as any).active ? C.accent : C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              borderBottom: (item as any).active
                ? `1px solid ${C.accentDim}`
                : "1px solid transparent",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!(item as any).active) e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (!(item as any).active)
                e.currentTarget.style.color = C.textSoft;
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => navigate("/search")}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.textSoft,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.accentDim;
            (e.currentTarget as HTMLElement).style.color = C.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.color = C.textSoft;
          }}
        >
          <Search size={13} />
        </button>
        <Link to="/profile">
          {user?.avatar_url ? (
            <Img
              src={user.avatar_url}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1.5px solid ${C.accentDim}`,
              }}
            />
          ) : (
            <div
              style={
                {
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
                  border: `1.5px solid ${C.accentDim}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 13,
                  color: C.accent,
                  textDecoration: "none",
                } as React.CSSProperties
              }
            >
              {user?.username?.slice(0, 1).toUpperCase() || "M"}
            </div>
          )}
        </Link>
      </div>
    </nav>
  );
}

// ─── OFFICIAL BADGE ──────────────────────────────────────────
function OfficialBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isLg ? 6 : 5,
        padding: isLg ? "5px 12px" : "3px 9px",
        background: "rgba(212,175,122,0.12)",
        border: `1px solid rgba(212,175,122,0.35)`,
        backdropFilter: "blur(8px)",
      }}
    >
      <svg
        width={isLg ? 11 : 9}
        height={isLg ? 13 : 11}
        viewBox="0 0 11 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.5 0L6.8 3.5H10.5L7.6 5.7L8.6 9.2L5.5 7L2.4 9.2L3.4 5.7L0.5 3.5H4.2L5.5 0Z"
          fill={C.official}
        />
        <rect
          x="2"
          y="11"
          width="7"
          height="1"
          rx="0.5"
          fill={C.official}
          opacity="0.6"
        />
        <rect
          x="3.5"
          y="12.2"
          width="4"
          height="0.8"
          rx="0.4"
          fill={C.official}
          opacity="0.4"
        />
      </svg>
      <span
        style={{
          fontFamily: SANS,
          fontSize: isLg ? 9 : 8,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: C.official,
        }}
      >
        CineVault Official
      </span>
    </div>
  );
}

// ─── COVER COLLAGE ────────────────────────────────────────────
function CoverCollage({
  posters,
  customCover,
  premium,
  glowColor,
}: {
  posters: string[];
  customCover?: string;
  premium: boolean;
  glowColor: string;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", aspectRatio: "3/2" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 110%, rgba(${glowColor}, ${hov ? 0.32 : 0.16}) 0%, transparent 70%)`,
          transition: "opacity 0.5s",
          mixBlendMode: "screen",
        }}
      />

      {premium && customCover ? (
        <Img
          src={customCover}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `saturate(0.55) brightness(${hov ? 0.8 : 0.65})`,
            transition: "filter 0.45s, transform 0.5s",
            transform: hov ? "scale(1.04)" : "scale(1)",
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            width: "100%",
            height: "100%",
            gap: 1.5,
            background: C.bg,
          }}
        >
          {posters.slice(0, 4).map((src, i) => (
            <div key={i} style={{ overflow: "hidden", position: "relative" }}>
              <Img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: `saturate(${hov ? 0.65 : 0.45}) brightness(${hov ? 0.85 : 0.7})`,
                  transition: "filter 0.45s, transform 0.5s",
                  transform: hov ? "scale(1.06)" : "scale(1)",
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          zIndex: 3,
          background:
            "linear-gradient(to bottom, rgba(8,8,8,0.55), transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          zIndex: 3,
          background: "linear-gradient(to top, rgba(8,8,8,0.72), transparent)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── LIST CARD (grid) ─────────────────────────────────────────
function ListCard({ list, index }: { list: UserListSummary; index: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hov, setHov] = useState(false);

  const postersWithBase = (list.posters || []).map((p) =>
    p ? `${TMDB_BASE}w500${p}` : "",
  );
  const glowColor = list.glow_color || "212,175,122";

  return (
    <motion.div
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
                <span>{item_likes_count_mock_placeholder || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const item_likes_count_mock_placeholder = 0;

// ─── OFFICIAL LIST CARD (horizontal hero row) ─────────────────
function OfficialListCard({
  list,
  index,
}: {
  list: UserListSummary;
  index: number;
}) {
  const [hov, setHov] = useState(false);
  const [saved, setSaved] = useState(false);
  const glowColor = list.glow_color || "212,175,122";

  return (
    <motion.div
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
              top: 12,
              right: 12,
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

// ─── EMPTY STATE (my lists) ───────────────────────────────────
function EmptyMyLists({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px",
        border: `1px solid ${C.border}`,
        background: C.surface,
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(to right, transparent, ${C.accentDim}, transparent)`,
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <svg
          width="320"
          height="320"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.04 }}
        >
          <circle cx="160" cy="160" r="140" stroke={C.accent} strokeWidth="6" />
          <circle cx="160" cy="160" r="50" stroke={C.accent} strokeWidth="6" />
          <circle cx="160" cy="60" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="241" cy="109" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="241" cy="211" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="160" cy="260" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="79" cy="211" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="79" cy="109" r="22" stroke={C.accent} strokeWidth="5" />
          <circle cx="160" cy="160" r="14" fill={C.accent} opacity="0.5" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <rect
              key={i}
              x="148"
              y="8"
              width="24"
              height="14"
              rx="3"
              fill={C.accent}
              transform={`rotate(${deg} 160 160)`}
            />
          ))}
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 440 }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 24px",
            border: `1px solid ${C.border}`,
            background: "rgba(212,175,122,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={22} color={C.accentDim} />
        </div>

        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 28,
            color: C.text,
            margin: "0 0 12px",
          }}
        >
          Todavía no curaste ninguna lista
        </h2>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 17,
            color: C.textSoft,
            lineHeight: 1.72,
            margin: "0 0 32px",
          }}
        >
          Creá tu primera colección. Puede ser un canon personal,
          <br />
          una lista para una noche específica, o lo que quieras.
        </p>

        <motion.button
          onClick={onCreateClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "14px 32px",
            background: C.accent,
            color: "#080808",
            border: "none",
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            boxShadow: `0 4px 20px ${C.accentGlow}`,
          }}
        >
          <Plus size={13} /> Crear mi primera lista
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── CREATE LIST MODAL ────────────────────────────────────────
function CreateListModal({
  open,
  onClose,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim() || loading) return;
    setLoading(true);
    try {
      await createList({
        name: title,
        description: desc,
        is_public: privacy === "public",
        tags: [],
      });
      setStep("success");
      setTimeout(() => {
        setStep("form");
        setTitle("");
        setDesc("");
        setPrivacy("public");
        setLoading(false);
        onClose();
        onRefresh();
      }, 1600);
    } catch (err) {
      console.error("Error creating list", err);
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: "rgba(8,8,8,0.94)",
              backdropFilter: "blur(12px)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(480px, 100%)",
              maxHeight: "calc(100vh - 40px)",
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,122,0.06)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: 2,
                flexShrink: 0,
                background: `linear-gradient(to right, transparent, ${C.accent}, transparent)`,
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: `radial-gradient(ellipse at 50% 0%, ${C.accentGlow} 0%, transparent 60%)`,
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ padding: "52px 40px", textAlign: "center" }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 22,
                      }}
                      style={{
                        width: 52,
                        height: 52,
                        margin: "0 auto 20px",
                        background: C.accentGlow,
                        border: `1px solid ${C.accentDim}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={22} color={C.accent} />
                    </motion.div>
                    <p
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 22,
                        color: C.text,
                        margin: "0 0 6px",
                      }}
                    >
                      Lista creada
                    </p>
                    <p
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: C.textSoft,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Ya podés añadir películas
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div
                      style={{
                        padding: "24px 28px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: C.accent,
                            marginBottom: 6,
                          }}
                        >
                          Nueva lista
                        </div>
                        <h2
                          style={{
                            fontFamily: SERIF,
                            fontWeight: 300,
                            fontSize: 24,
                            color: C.text,
                            margin: 0,
                          }}
                        >
                          Curar una colección
                        </h2>
                      </div>
                      <button
                        onClick={onClose}
                        style={{
                          background: "none",
                          border: `1px solid ${C.border}`,
                          cursor: "pointer",
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.textSoft,
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            C.accentDim;
                          (e.currentTarget as HTMLElement).style.color = C.text;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            C.border;
                          (e.currentTarget as HTMLElement).style.color =
                            C.textSoft;
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div style={{ padding: "24px 28px 28px" }}>
                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Título *
                        </label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Dale un nombre a tu colección"
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${title ? C.accentDim : C.border}`,
                            color: C.text,
                            fontFamily: SERIF,
                            fontSize: 17,
                            outline: "none",
                            boxSizing: "border-box",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = C.accentDim)
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = title
                              ? C.accentDim
                              : C.border)
                          }
                        />
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 8,
                          }}
                        >
                          Descripción
                        </label>
                        <textarea
                          value={desc}
                          onChange={(e) => setDesc(e.target.value)}
                          rows={3}
                          placeholder="¿Qué une a estas películas? (opcional)"
                          style={{
                            width: "100%",
                            padding: "11px 14px",
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            fontFamily: SERIF,
                            fontStyle: "italic",
                            fontSize: 15,
                            outline: "none",
                            resize: "none",
                            boxSizing: "border-box",
                            lineHeight: 1.6,
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = C.accentDim)
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = C.border)
                          }
                        />
                      </div>

                      <div style={{ marginBottom: 28 }}>
                        <label
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            color: C.textSoft,
                            display: "block",
                            marginBottom: 10,
                          }}
                        >
                          Visibilidad
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[
                            {
                              id: "public" as const,
                              label: "Pública",
                              icon: <Globe size={11} />,
                            },
                            {
                              id: "private" as const,
                              label: "Privada",
                              icon: <Lock size={11} />,
                            },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setPrivacy(opt.id)}
                              style={{
                                flex: 1,
                                padding: "10px 16px",
                                background:
                                  privacy === opt.id
                                    ? C.accentGlow
                                    : "transparent",
                                border: `1px solid ${privacy === opt.id ? C.accentDim : C.border}`,
                                color:
                                  privacy === opt.id ? C.accent : C.textSoft,
                                fontFamily: SANS,
                                fontSize: 10,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 7,
                                transition: "all 0.2s",
                              }}
                            >
                              {opt.icon} {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        onClick={handleCreate}
                        whileHover={title.trim() ? { scale: 1.01 } : {}}
                        whileTap={title.trim() ? { scale: 0.98 } : {}}
                        style={{
                          width: "100%",
                          padding: "14px",
                          background: title.trim()
                            ? C.accent
                            : "rgba(212,175,122,0.12)",
                          color: title.trim() ? "#080808" : C.textMuted,
                          border: "none",
                          fontFamily: SANS,
                          fontSize: 10,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          cursor: title.trim() ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "all 0.2s",
                        }}
                      >
                        <Plus size={12} />{" "}
                        {loading ? "Creando..." : "Crear lista"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────
function ListSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <Search
        size={13}
        color={focused ? C.accent : C.textSoft}
        style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          transition: "color 0.2s",
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar listas…"
        style={{
          width: 220,
          padding: "9px 12px 9px 34px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? C.accentDim : C.border}`,
          color: C.text,
          fontFamily: SANS,
          fontSize: 11,
          outline: "none",
          letterSpacing: "0.04em",
          transition: "border-color 0.2s",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.textSoft,
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export function Lists() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortId>("popular");
  const [searchQ, setSearchQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const TABS: { id: TabId; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "official", label: "Oficiales" },
    { id: "friends", label: "Amigos" },
    { id: "mine", label: "Mis listas" },
  ];

  const SORT_OPTIONS: { id: SortId; label: string }[] = [
    { id: "popular", label: "Más populares" },
    { id: "recent", label: "Más recientes" },
    { id: "alphabetical", label: "Alfabético" },
  ];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [allLists, setAllLists] = useState<UserListSummary[]>([]);
  const [myLists, setMyLists] = useState<UserListSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const [publicRes, mineRes, user] = await Promise.all([
        getPublicLists(1, 40),
        getStoredAccessToken() ? getMyLists() : Promise.resolve([]),
        getCurrentUser().catch(() => null),
      ]);
      setAllLists(publicRes.items);
      setMyLists(mineRes);
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching lists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const officials = allLists.filter((l) => l.is_official);

  let visibleLists =
    activeTab === "mine"
      ? myLists
      : activeTab === "official"
        ? officials
        : allLists;

  if (activeTab === "friends") {
    visibleLists = allLists.filter(
      (l) => !l.is_official && l.user_id !== (currentUser?.id || -1),
    );
  }

  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    visibleLists = visibleLists.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (sort === "recent") {
    visibleLists = [...visibleLists].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  } else if (sort === "alphabetical") {
    visibleLists = [...visibleLists].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } else {
    visibleLists = [...visibleLists].sort(
      (a, b) => (b.items_count || 0) - (a.items_count || 0),
    );
  }

  const showOfficialRow = activeTab === "all" || activeTab === "official";
  const showEmptyMine =
    activeTab === "mine" && myLists.length === 0 && !loading;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar user={currentUser} />
      <CreateListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRefresh={fetchLists}
      />

      <div style={{ paddingTop: 60 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "52px 40px 44px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.012) 39px, rgba(255,255,255,0.012) 40px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 180,
              background: `radial-gradient(ellipse at 20% 100%, ${C.accentGlow} 0%, transparent 55%)`,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{
                    fontFamily: SANS,
                    fontSize: 9,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: C.accent,
                    marginBottom: 14,
                  }}
                >
                  La Vitrina · Directorio
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.18 }}
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 300,
                    fontSize: "clamp(36px, 5vw, 56px)",
                    color: C.text,
                    margin: "0 0 10px",
                    lineHeight: 1.0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Listas Curadas
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.28 }}
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 17,
                    color: C.textSoft,
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Colecciones editoriales y personales.{" "}
                  <span style={{ color: C.textMuted }}>
                    {allLists.length} listas disponibles.
                  </span>
                </motion.p>
              </div>

              <motion.button
                onClick={() => setModalOpen(true)}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flexShrink: 0,
                  padding: "14px 28px",
                  background: C.accent,
                  color: "#080808",
                  border: "none",
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  boxShadow: `0 4px 24px ${C.accentGlowStrong}`,
                  whiteSpace: "nowrap",
                }}
              >
                <Plus size={13} /> Crear nueva lista
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>
        <AnimatePresence>
          {showOfficialRow && officials.length > 0 && (
            <motion.section
              key="official-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.6 }}
              style={{ paddingTop: 44, paddingBottom: 48 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <OfficialBadge size="lg" />
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to right, ${C.border}, transparent)`,
                  }}
                />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: C.textMuted,
                  }}
                >
                  {officials.length} listas
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  overflowX: "auto",
                  paddingBottom: 12,
                  scrollbarWidth: "none",
                  cursor: "grab",
                }}
              >
                {officials.map((list, i) => (
                  <OfficialListCard key={list.id} list={list} index={i} />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: showOfficialRow ? 0 : 36,
            paddingBottom: 28,
            borderTop: showOfficialRow ? `1px solid ${C.border}` : "none",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  background:
                    activeTab === tab.id
                      ? "rgba(212,175,122,0.1)"
                      : "transparent",
                  border: `1px solid ${activeTab === tab.id ? C.accentDim : C.border}`,
                  color: activeTab === tab.id ? C.accent : C.textSoft,
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
                {tab.id === "mine" && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontFamily: SANS,
                      fontSize: 9,
                      color: activeTab === "mine" ? C.accentDim : C.textMuted,
                    }}
                  >
                    {myLists.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ListSearchBar value={searchQ} onChange={setSearchQ} />

            <div ref={sortRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                style={{
                  padding: "9px 14px",
                  background: showSortMenu
                    ? "rgba(212,175,122,0.08)"
                    : "transparent",
                  border: `1px solid ${showSortMenu ? C.accentDim : C.border}`,
                  color: showSortMenu ? C.accent : C.textSoft,
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "all 0.2s",
                }}
              >
                <ArrowUpDown size={11} />
                {SORT_OPTIONS.find((s) => s.id === sort)?.label}
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: C.elevated,
                      border: `1px solid ${C.border}`,
                      minWidth: 180,
                      zIndex: 100,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSort(opt.id);
                          setShowSortMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "11px 16px",
                          background:
                            sort === opt.id
                              ? "rgba(212,175,122,0.08)"
                              : "transparent",
                          border: "none",
                          borderBottom: `1px solid ${C.border}`,
                          color: sort === opt.id ? C.accent : C.text,
                          fontFamily: SANS,
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                      >
                        {sort === opt.id && (
                          <Check size={11} color={C.accent} />
                        )}
                        {sort !== opt.id && <div style={{ width: 11 }} />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.section layout>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
            }}
          >
            <span
              style={{
                fontFamily: SANS,
                fontSize: 10,
                color: C.textMuted,
                letterSpacing: "0.1em",
              }}
            >
              {searchQ
                ? `${visibleLists.length} resultado${visibleLists.length !== 1 ? "s" : ""} para "${searchQ}"`
                : `${visibleLists.length} listas`}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {showEmptyMine ? (
              <div
                key="empty"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                }}
              >
                <EmptyMyLists onCreateClick={() => setModalOpen(true)} />
              </div>
            ) : visibleLists.length === 0 && !loading ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ padding: "60px 0", textAlign: "center" }}
              >
                <p
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 20,
                    color: C.textSoft,
                  }}
                >
                  No hay listas que coincidan con su búsqueda
                </p>
                <button
                  onClick={() => setSearchQ("")}
                  style={{
                    marginTop: 16,
                    background: "none",
                    border: `1px solid ${C.border}`,
                    color: C.accent,
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "9px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                >
                  Limpiar búsqueda
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                layout
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                  paddingBottom: 80,
                }}
              >
                {visibleLists.map((list, i) => (
                  <ListCard key={list.id} list={list} index={i} />
                ))}

                {(activeTab === "all" || activeTab === "friends") &&
                  !searchQ && (
                    <motion.div
                      onClick={() => setModalOpen(true)}
                      style={{
                        background: C.surface,
                        border: `1px dashed ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        cursor: "pointer",
                        padding: "48px 24px",
                        transition: "border-color 0.3s, background 0.2s",
                        minHeight: 260,
                      }}
                      whileHover={{
                        borderColor: C.accentDim,
                        background: "rgba(212,175,122,0.025)",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          border: `1px solid ${C.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.accentDim,
                        }}
                      >
                        <Plus size={18} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontFamily: SERIF,
                            fontSize: 17,
                            color: C.textSoft,
                            margin: "0 0 5px",
                            lineHeight: 1.4,
                          }}
                        >
                          Curar una lista
                        </p>
                        <p
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            color: C.textMuted,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            margin: 0,
                          }}
                        >
                          Crear nueva colección
                        </p>
                      </div>
                    </motion.div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}

export default Lists;
