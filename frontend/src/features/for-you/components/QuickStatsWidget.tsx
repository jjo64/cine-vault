import { motion } from "motion/react";
import { BookOpen, Star, Heart, Users } from "lucide-react";
import { C, SANS, SERIF } from "../constants";
import type { ProfileUser } from "../../../services/profileServices";

export function QuickStatsWidget({ user }: { user: ProfileUser | null }) {
  if (!user) return null;

  const stats = [
    { label: "Vistas", value: user._count?.diary_entries || 0, icon: <BookOpen size={13} />, sub: "películas" },
    { label: "Rating", value: user._count?.reviews || 0, icon: <Star size={13} />, sub: "reseñas" },
    { label: "Favoritos", value: user._count?.watchlist || 0, icon: <Heart size={13} />, sub: "títulos" },
    { label: "Red", value: user._count?.follows_follows_following_idTousers || 0, icon: <Users size={13} />, sub: "seguidores" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "20px" }}>
        <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.accent, marginBottom: 16 }}>
          Tu actividad
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, transition: "border-color 0.2s" }}>
              <div style={{ marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: C.text, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontFamily: SANS, fontSize: 9, color: C.textSoft, letterSpacing: "0.08em", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
