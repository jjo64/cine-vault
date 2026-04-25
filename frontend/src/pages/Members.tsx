/**
 * CineVault — Members / Community · /members
 * "CineVault Society" — Directorio de la comunidad cinéfila
 * Palette: #080808 bg · #111111 card · #D4AF7A accent
 * Typography: Cormorant Garamond (serif) · Syne (sans)
 *
 * Data: backend real via /api/users (GET)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  UserPlus,
  Check,
  Users,
  Film,
  List,
  Pen,
  Crown,
  Sparkles,
  Loader,
} from "lucide-react";
import {
  fetchAllMembers,
  fetchMemberProfile,
  followMember,
  unfollowMember,
  type MemberSummary,
  type MemberProfile,
} from "../services/membersServices";
import { getStoredAccessToken } from "../services/authServices";

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#171717",
  border: "#222222",
  borderHover: "#383838",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.09)",
  accentGlowMid: "rgba(212,175,122,0.16)",
  accentGlowStrong: "rgba(212,175,122,0.26)",
  text: "#E2E2E2",
  textSoft: "#6E6E6E",
  textMuted: "#383838",
  gold: "#C8A96E",
  adminBorder: "rgba(212,175,122,0.50)",
  editorBorder: "rgba(180,150,90,0.35)",
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

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** Glow colours per role to stay visually similar to the mock data */
const ROLE_GLOW: Record<string, string> = {
  admin: "80,70,30",
  editor: "60,80,120",
  member: "60,60,90",
};

// ─── DERIVED TYPE — enriched member for internal use ─────────
type Member = {
  id: string;
  name: string; // === username
  handle: string; // @username
  avatar: string;
  role: "admin" | "editor" | "member";
  bio: string;
  filmsLogged: number;
  followers: number;
  following: number;
  listsCreated: number;
  glowRgb: string;
};

function summaryToMember(s: MemberSummary): Member {
  const role = (s.role as Member["role"]) ?? "member";
  return {
    id: String(s.id),
    name: s.username,
    handle: `@${s.username}`,
    avatar: s.avatar_url ?? "",
    role,
    bio: "",
    filmsLogged: 0,
    followers: 0,
    following: 0,
    listsCreated: 0,
    glowRgb: ROLE_GLOW[role] ?? ROLE_GLOW.member,
  };
}

function profileToMember(p: MemberProfile, base: Member): Member {
  return {
    ...base,
    bio: p.bio ?? "",
    filmsLogged: p._count?.diary_entries ?? 0,
    followers: p._count?.follows_follows_following_idTousers ?? 0,
    following: p._count?.follows_follows_follower_idTousers ?? 0,
    listsCreated: 0,
  };
}

// ─── ROLE BADGE ──────────────────────────────────────────────
function RoleBadge({
  role,
  size = "sm",
}: {
  role: Member["role"];
  size?: "sm" | "lg";
}) {
  if (role === "member") return null;
  const lg = size === "lg";
  const isAdmin = role === "admin";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: lg ? 6 : 5,
        padding: lg ? "5px 11px" : "3px 8px",
        background: isAdmin
          ? "rgba(212,175,122,0.14)"
          : "rgba(180,150,90,0.10)",
        border: `1px solid ${isAdmin ? "rgba(212,175,122,0.45)" : "rgba(180,150,90,0.30)"}`,
      }}
    >
      {isAdmin ? (
        <Crown size={lg ? 11 : 9} color={C.gold} />
      ) : (
        <Pen size={lg ? 10 : 8} color={C.accentDim} />
      )}
      <span
        style={{
          fontFamily: SANS,
          fontSize: lg ? 9 : 8,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: isAdmin ? C.gold : C.accentDim,
        }}
      >
        {isAdmin ? "Admin" : "Editor"}
      </span>
    </div>
  );
}

// ─── FEATURED CARD (Admin / Editor) ─────────────────────────
function FeaturedCard({
  member,
  isFollowed,
  onFollow,
}: {
  member: Member;
  isFollowed: boolean;
  onFollow: () => void;
}) {
  const [hov, setHov] = useState(false);
  const isAdmin = member.role === "admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: C.surface,
        border: `1px solid ${hov ? (isAdmin ? "rgba(212,175,122,0.5)" : "rgba(180,150,90,0.4)") : isAdmin ? C.adminBorder : C.editorBorder}`,
        transition: "border-color 0.3s, box-shadow 0.4s, transform 0.3s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? `0 16px 48px rgba(${member.glowRgb},0.20), 0 0 0 1px rgba(212,175,122,0.06)`
          : `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,122,0.03)`,
      }}
    >
      {/* Ambient glow backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse at 0% 100%, rgba(${member.glowRgb},${hov ? 0.12 : 0.05}) 0%, transparent 55%)`,
          transition: "opacity 0.5s",
        }}
      />
      {isAdmin && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 80,
            height: 80,
            background: `radial-gradient(circle at 0% 0%, rgba(212,175,122,0.12) 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <div
        style={{ position: "relative", zIndex: 1, padding: "22px 22px 20px" }}
      >
        {/* Header row: avatar + info + follow */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 18,
          }}
        >
          {/* Avatar */}
          <Link
            to={`/${member.name}`}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              cursor: "pointer",
              border: `2px solid ${isAdmin ? "rgba(212,175,122,0.5)" : "rgba(180,150,90,0.35)"}`,
              boxShadow: `0 0 20px rgba(${member.glowRgb},0.22)`,
              transition: "box-shadow 0.3s, border-color 0.3s",
              display: "block",
            }}
          >
            {member.avatar ? (
              <Img
                src={member.avatar}
                alt={member.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "saturate(0.7) brightness(0.85)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `rgba(${member.glowRgb},0.3)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 26,
                  color: C.accent,
                }}
              >
                {member.name[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 5,
              }}
            >
              <RoleBadge role={member.role} size="sm" />
            </div>
            <Link to={`/${member.name}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 20,
                  color: C.text,
                  lineHeight: 1.15,
                  marginBottom: 2,
                }}
              >
                {member.name}
              </div>
            </Link>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10,
                color: C.accentDim,
                letterSpacing: "0.06em",
                marginBottom: 7,
              }}
            >
              {member.handle}
            </div>
            {member.bio && (
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: C.textSoft,
                  margin: 0,
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {member.bio}
              </p>
            )}
          </div>

          {/* Follow button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFollow}
            style={{
              flexShrink: 0,
              padding: "9px 16px",
              cursor: "pointer",
              background: isFollowed
                ? "transparent"
                : isAdmin
                  ? C.accent
                  : "rgba(212,175,122,0.12)",
              border: `1px solid ${isFollowed ? C.accentDim : C.accent}`,
              color: isFollowed ? C.accent : isAdmin ? "#080808" : C.accent,
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            {isFollowed ? (
              <>
                <Check size={10} /> Siguiendo
              </>
            ) : (
              <>
                <UserPlus size={10} /> Seguir
              </>
            )}
          </motion.button>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 0,
            paddingTop: 16,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {[
            {
              label: "Films",
              val: fmtCount(member.filmsLogged),
              icon: <Film size={10} />,
            },
            {
              label: "Listas",
              val: String(member.listsCreated),
              icon: <List size={10} />,
            },
            {
              label: "Seguidores",
              val: fmtCount(member.followers),
              icon: <Users size={10} />,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ color: C.textMuted }}>{s.icon}</span>
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.text,
                }}
              >
                {s.val}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  color: C.textMuted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── COMMUNITY CARD ──────────────────────────────────────────
function CommunityCard({
  member,
  isFollowed,
  onFollow,
  index,
}: {
  member: Member;
  isFollowed: boolean;
  onFollow: () => void;
  index: number;
}) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        background: C.surface,
        border: `1px solid ${hov ? C.borderHover : C.border}`,
        transition: "border-color 0.3s, box-shadow 0.35s, transform 0.3s",
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov
          ? `0 12px 36px rgba(${member.glowRgb},0.18)`
          : "0 3px 12px rgba(0,0,0,0.4)",
        cursor: "pointer",
        padding: "20px 18px 18px",
      }}
    >
      {/* Background colour absorption */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse at 30% 100%, rgba(${member.glowRgb},${hov ? 0.18 : 0.08}) 0%, transparent 60%)`,
          transition: "opacity 0.5s",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse at 50% 0%, rgba(${member.glowRgb},${hov ? 0.06 : 0.02}) 0%, transparent 70%)`,
          transition: "opacity 0.5s",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Avatar + follow */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <Link
            to={`/${member.name}`}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: `1.5px solid ${hov ? "rgba(212,175,122,0.35)" : C.border}`,
              boxShadow: hov ? `0 0 18px rgba(${member.glowRgb},0.3)` : "none",
              transition: "all 0.3s",
              cursor: "pointer",
              display: "block",
            }}
          >
            {member.avatar ? (
              <Img
                src={member.avatar}
                alt={member.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "saturate(0.65) brightness(0.85)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `rgba(${member.glowRgb},0.3)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 20,
                  color: C.accent,
                }}
              >
                {member.name[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onFollow();
            }}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              background: isFollowed ? "transparent" : C.accentGlow,
              border: `1px solid ${isFollowed ? C.border : C.accentDim}`,
              color: isFollowed ? C.textSoft : C.accent,
              fontFamily: SANS,
              fontSize: 8,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.2s",
            }}
          >
            {isFollowed ? (
              <>
                <Check size={8} /> Siguiendo
              </>
            ) : (
              <>
                <UserPlus size={8} /> Seguir
              </>
            )}
          </motion.button>
        </div>

        {/* Name / handle */}
        <div style={{ marginBottom: 10 }}>
          <Link to={`/${member.name}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 17,
                color: C.text,
                lineHeight: 1.2,
                marginBottom: 2,
              }}
            >
              {member.name}
            </div>
          </Link>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9,
              color: C.accentDim,
              letterSpacing: "0.06em",
            }}
          >
            {member.handle}
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 12.5,
              color: C.textSoft,
              lineHeight: 1.6,
              margin: "0 0 12px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {member.bio}
          </p>
        )}

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: C.textMuted,
            }}
          >
            <Film size={9} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.06em",
                color: C.textSoft,
              }}
            >
              {fmtCount(member.filmsLogged)}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 8,
                color: C.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              films
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: C.textMuted,
            }}
          >
            <Users size={9} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.06em",
                color: C.textSoft,
              }}
            >
              {fmtCount(member.followers)}
            </span>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 8,
                color: C.textMuted,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              seguidores
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── EMPTY STATE BANNER ──────────────────────────────────────
function EmptyStateBanner({
  suggestions,
  followed,
  onFollow,
}: {
  suggestions: Member[];
  followed: Set<string>;
  onFollow: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: C.surface,
        marginBottom: 48,
      }}
    >
      {/* Gold top accent */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(to right, transparent 5%, ${C.accent} 30%, ${C.accentDim} 70%, transparent 95%)`,
          opacity: 0.5,
        }}
      />

      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(212,175,122,0.06) 0%, transparent 65%)",
        }}
      />
      {/* Ornamental film-frame grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.012) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.008) 40px)`,
        }}
      />

      <div
        style={{ position: "relative", zIndex: 1, padding: "36px 40px 40px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Sparkles size={16} color={C.accent} />
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: C.accent,
            }}
          >
            Tu feed está vacío
          </div>
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 32,
            color: C.text,
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          Encontrá tu círculo cinéfilo
        </h2>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 16,
            color: C.textSoft,
            margin: "0 0 32px",
            lineHeight: 1.6,
            maxWidth: 520,
          }}
        >
          Seguí a editores y miembros activos para poblar tu feed con críticas,
          listas y descubrimientos cinematográficos.
        </p>

        {/* Suggested editors row */}
        {suggestions.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(suggestions.length, 5)}, 1fr)`,
              gap: 14,
            }}
          >
            {suggestions.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                style={{
                  background: C.elevated,
                  border: `1px solid ${m.role !== "member" ? "rgba(212,175,122,0.25)" : C.border}`,
                  padding: "16px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(ellipse at 50% 100%, rgba(${m.glowRgb},0.12) 0%, transparent 60%)`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `1.5px solid ${m.role !== "member" ? "rgba(212,175,122,0.4)" : C.border}`,
                      boxShadow: `0 0 14px rgba(${m.glowRgb},0.2)`,
                    }}
                  >
                    {m.avatar ? (
                      <Img
                        src={m.avatar}
                        alt={m.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "saturate(0.65) brightness(0.85)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: `rgba(${m.glowRgb},0.3)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: SERIF,
                          fontSize: 20,
                          color: C.accent,
                        }}
                      >
                        {m.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <RoleBadge role={m.role} size="sm" />
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontSize: 14,
                        color: C.text,
                        marginTop: 5,
                        lineHeight: 1.2,
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 9,
                        color: C.accentDim,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {m.handle}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 8,
                      color: C.textMuted,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {fmtCount(m.filmsLogged)} films
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onFollow(m.id)}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      cursor: "pointer",
                      background: followed.has(m.id)
                        ? "transparent"
                        : C.accentGlow,
                      border: `1px solid ${followed.has(m.id) ? C.border : C.accentDim}`,
                      color: followed.has(m.id) ? C.textSoft : C.accent,
                      fontFamily: SANS,
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      transition: "all 0.2s",
                    }}
                  >
                    {followed.has(m.id) ? (
                      <>
                        <Check size={8} /> Siguiendo
                      </>
                    ) : (
                      <>
                        <UserPlus size={8} /> Seguir
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── LOADING STATE ───────────────────────────────────────────
function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: 16,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader size={28} color={C.accentDim} />
      </motion.div>
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 15,
          color: C.textSoft,
          margin: 0,
        }}
      >
        Cargando la sociedad cinéfila…
      </p>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar() {
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
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.80)",
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
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { l: "Para vos", h: "/for-you" },
          { l: "Películas", h: "/films" },
          { l: "Listas", h: "/lists" },
          { l: "Sociedad", h: "/members", a: true },
        ].map((it) => (
          <Link
            key={it.h}
            to={it.h}
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: (it as { a?: boolean }).a ? C.accent : C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              borderBottom: (it as { a?: boolean }).a
                ? `1px solid ${C.accentDim}`
                : "1px solid transparent",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!(it as { a?: boolean }).a)
                e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (!(it as { a?: boolean }).a)
                e.currentTarget.style.color = C.textSoft;
            }}
          >
            {it.l}
          </Link>
        ))}
      </div>
      <Link to="/profile">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
            border: `1.5px solid ${C.accentDim}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontSize: 14,
            color: C.accent,
          }}
        >
          M
        </div>
      </Link>
    </nav>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export function Members() {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  // Data states
  const [enriched, setEnriched] = useState<Map<string, Member>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrichQueue = useRef<Set<string>>(new Set());

  // ── Fetch all users on mount ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const summaries = await fetchAllMembers();
        if (cancelled) return;

        // Build initial member list from summaries (no profile details yet)
        const map = new Map<string, Member>();
        summaries.forEach((s) => map.set(String(s.id), summaryToMember(s)));
        setEnriched(map);
      } catch (e) {
        if (!cancelled) setError("No se pudo cargar la lista de miembros.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Lazy-enrich visible members with profile data ─────────
  const enrichMember = useCallback(async (id: string) => {
    if (enrichQueue.current.has(id)) return;
    enrichQueue.current.add(id);
    const profile = await fetchMemberProfile(Number(id));
    if (!profile) return;
    setEnriched((prev) => {
      const base = prev.get(id);
      if (!base) return prev;
      const next = new Map(prev);
      next.set(id, profileToMember(profile, base));
      return next;
    });
  }, []);

  // ── Follow / unfollow ─────────────────────────────────────
  async function toggleFollow(id: string) {
    const token = getStoredAccessToken();
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
      return;
    }
    const wasFollowed = followed.has(id);
    // Optimistic update
    setFollowed((prev) => {
      const next = new Set(prev);
      wasFollowed ? next.delete(id) : next.add(id);
      return next;
    });
    const ok = wasFollowed
      ? await unfollowMember(Number(id))
      : await followMember(Number(id));
    if (!ok) {
      // Revert on failure
      setFollowed((prev) => {
        const next = new Set(prev);
        wasFollowed ? next.add(id) : next.delete(id);
        return next;
      });
    }
  }

  // ── Derived lists ─────────────────────────────────────────
  const membersArray: Member[] = Array.from(enriched.values());

  const admins = membersArray.filter((m) => m.role === "admin");
  const editors = membersArray.filter((m) => m.role === "editor");
  const community = membersArray.filter((m) => m.role === "member");

  function filteredBy(list: Member[]): Member[] {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q),
    );
  }

  const filteredAdmins = filteredBy(admins);
  const filteredEditors = filteredBy(editors);
  const filteredCommunity = filteredBy(community);

  const showEmpty = followed.size === 0 && !loading;
  // Suggestions: first 3 editors + 2 admins (or whatever exists)
  const suggestions = [...editors.slice(0, 3), ...admins.slice(0, 2)];

  const noResults =
    !loading &&
    query.trim() &&
    filteredAdmins.length === 0 &&
    filteredEditors.length === 0 &&
    filteredCommunity.length === 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar />

      <div style={{ paddingTop: 60 }}>
        {/* ── PAGE HEADER ── */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "48px 40px 0",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.013) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.008) 40px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
              background:
                "radial-gradient(ellipse at 70% 100%, rgba(212,175,122,0.07) 0%, transparent 55%)",
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
                gap: 40,
                paddingBottom: 36,
              }}
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    fontFamily: SANS,
                    fontSize: 9,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: C.accent,
                    marginBottom: 12,
                  }}
                >
                  La Vitrina · Comunidad
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.08 }}
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 300,
                    fontSize: "clamp(38px, 5vw, 58px)",
                    color: C.text,
                    margin: "0 0 10px",
                    lineHeight: 1.0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  CineVault Society
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 16,
                    color: C.textSoft,
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  {loading
                    ? "Cargando la comunidad…"
                    : `${membersArray.length} cinéfilos. ${admins.length + editors.length} editores. Una sola obsesión.`}
                </motion.p>
              </div>

              {/* Search bar */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                style={{ position: "relative", width: 280, flexShrink: 0 }}
              >
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: searchFocused ? C.accent : C.textSoft,
                    pointerEvents: "none",
                    transition: "color 0.2s",
                  }}
                />
                <input
                  id="members-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Buscar miembros…"
                  style={{
                    width: "100%",
                    padding: "12px 36px 12px 38px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${searchFocused ? C.accentDim : C.border}`,
                    color: C.text,
                    fontFamily: SANS,
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    boxShadow: searchFocused
                      ? `0 0 0 3px ${C.accentGlow}`
                      : "none",
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.textSoft,
                      display: "flex",
                      padding: 2,
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Tab stats */}
            <div
              style={{
                display: "flex",
                gap: 0,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              {[
                { label: "Todos", count: membersArray.length },
                { label: "Admins", count: admins.length },
                { label: "Editores", count: editors.length },
                { label: "Comunidad", count: community.length },
              ].map((tab, i) => (
                <div
                  key={tab.label}
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 18,
                      color: i === 0 ? C.accent : C.text,
                    }}
                  >
                    {tab.count}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      color: C.textMuted,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "40px 40px 80px",
          }}
        >
          {/* Loading state */}
          {loading && <LoadingState />}

          {/* Error state */}
          {!loading && error && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 20,
                  color: C.textSoft,
                  marginBottom: 12,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Empty state banner (no following yet) */}
          {!loading && !error && (
            <AnimatePresence>
              {showEmpty && (
                <motion.div
                  key="empty-banner"
                  initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                  animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.5 }}
                >
                  <EmptyStateBanner
                    suggestions={suggestions}
                    followed={followed}
                    onFollow={toggleFollow}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* No search results */}
          {noResults && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 20,
                  color: C.textSoft,
                  marginBottom: 12,
                }}
              >
                Ningún miembro coincide con &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={() => setQuery("")}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  border: `1px solid ${C.accentDim}`,
                  color: C.accent,
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {/* ── ADMINS SECTION ── */}
          {!loading && !error && filteredAdmins.length > 0 && (
            <section style={{ marginBottom: 52 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 22,
                    background: `linear-gradient(to bottom, ${C.accent}, ${C.accentDim})`,
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: 28,
                      color: C.text,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    Fundadores
                  </h2>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: C.textSoft,
                      margin: "3px 0 0",
                    }}
                  >
                    Los que construyeron CineVault desde cero
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {filteredAdmins.map((m) => (
                  <FeaturedCard
                    key={m.id}
                    member={m}
                    isFollowed={followed.has(m.id)}
                    onFollow={() => {
                      void enrichMember(m.id);
                      void toggleFollow(m.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── EDITORS SECTION ── */}
          {!loading && !error && filteredEditors.length > 0 && (
            <section style={{ marginBottom: 52 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 22,
                    background: `linear-gradient(to bottom, ${C.accentDim}, rgba(180,150,90,0.4))`,
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: 28,
                      color: C.text,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    Editores
                  </h2>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: C.textSoft,
                      margin: "3px 0 0",
                    }}
                  >
                    Curadores de contenido editorial e imprescindibles del feed
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to right, ${C.border}, transparent)`,
                    marginLeft: 8,
                  }}
                />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 9,
                    color: C.textMuted,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {filteredEditors.length} editores
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                }}
              >
                {filteredEditors.map((m) => (
                  <FeaturedCard
                    key={m.id}
                    member={m}
                    isFollowed={followed.has(m.id)}
                    onFollow={() => {
                      void enrichMember(m.id);
                      void toggleFollow(m.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── COMMUNITY GRID ── */}
          {!loading && !error && filteredCommunity.length > 0 && (
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 22,
                    background: `linear-gradient(to bottom, ${C.textSoft}, ${C.textMuted})`,
                  }}
                />
                <div>
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: 28,
                      color: C.text,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    Comunidad
                  </h2>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: C.textSoft,
                      margin: "3px 0 0",
                    }}
                  >
                    La sociedad de cinéfilos que construye CineVault cada día
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: `linear-gradient(to right, ${C.border}, transparent)`,
                    marginLeft: 8,
                  }}
                />
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 9,
                    color: C.textMuted,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {filteredCommunity.length} miembros
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                }}
              >
                {filteredCommunity.map((m, i) => (
                  <CommunityCard
                    key={m.id}
                    member={m}
                    index={i}
                    isFollowed={followed.has(m.id)}
                    onFollow={() => {
                      void enrichMember(m.id);
                      void toggleFollow(m.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
