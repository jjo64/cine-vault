import React from "react";
import { motion } from "motion/react";
import { Sparkles, Check, UserPlus } from "lucide-react";
import type { Member } from "../../types";
import { Img } from "../../../../components/shared/Img";
import { RoleBadge } from "../RoleBadge/RoleBadge";
import { fmtCount } from "../../utils";
import styles from "./EmptyStateBanner.module.css";

interface EmptyStateBannerProps {
  suggestions: Member[];
  followed: Set<string>;
  onFollow: (id: string) => void;
}

export const EmptyStateBanner: React.FC<EmptyStateBannerProps> = ({
  suggestions,
  followed,
  onFollow,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className={styles.banner}
    >
      {/* Gold top accent */}
      <div className={styles.accentBar} />

      {/* Subtle radial glow */}
      <div className={styles.radialGlow} />

      {/* Ornamental film-frame grid */}
      <div className={styles.gridOverlay} />

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.headerRow}>
          <Sparkles size={16} color="var(--cv-accent)" />
          <div className={styles.tag}>Tu feed está vacío</div>
        </div>
        <h2 className={styles.title}>Encontrá tu círculo cinéfilo</h2>
        <p className={styles.description}>
          Seguí a editores y miembros activos para poblar tu feed con críticas,
          listas y descubrimientos cinematográficos.
        </p>

        {/* Suggested editors row */}
        {suggestions.length > 0 && (
          <div
            className={styles.suggestionsGrid}
            style={{
              gridTemplateColumns: `repeat(${Math.min(suggestions.length, 5)}, 1fr)`,
            }}
          >
            {suggestions.map((m, i) => {
              const isFollowed = followed.has(m.id);
              const notMember = m.role !== "member";
              const cardClass = `${styles.suggestionCard} ${notMember ? styles.suggestionCardNotMember : ""}`;
              const avatarClass = `${styles.avatarWrapper} ${notMember ? styles.avatarWrapperNotMember : ""}`;
              const btnClass = `${styles.followBtn} ${isFollowed ? styles.followBtnActive : ""}`;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={cardClass}
                >
                  <div
                    className={styles.suggestionGlow}
                    style={{
                      background: `radial-gradient(ellipse at 50% 100%, rgba(${m.glowRgb},0.12) 0%, transparent 60%)`,
                    }}
                  />
                  <div className={styles.cardContent}>
                    <div
                      className={avatarClass}
                      style={{
                        boxShadow: `0 0 14px rgba(${m.glowRgb},0.2)`,
                      }}
                    >
                      {m.avatar ? (
                        <Img
                          src={m.avatar}
                          alt={m.name}
                          fallbackColor="var(--cv-elevated)"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "saturate(0.65) brightness(0.85)",
                          }}
                        />
                      ) : (
                        <div
                          className={styles.avatarPlaceholder}
                          style={{
                            background: `rgba(${m.glowRgb},0.3)`,
                          }}
                        >
                          {m.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <RoleBadge role={m.role} size="sm" />
                      <div className={styles.name}>{m.name}</div>
                      <div className={styles.handle}>{m.handle}</div>
                    </div>
                    <div className={styles.filmsCount}>
                      {fmtCount(m.filmsLogged)} films
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onFollow(m.id)}
                      className={btnClass}
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
