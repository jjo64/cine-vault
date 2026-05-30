import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Check, UserPlus, Film, Users } from "lucide-react";
import type { Member } from "../../types";
import { Img } from "../../../../components/shared/Img";
import { fmtCount } from "../../utils";
import styles from "./CommunityCard.module.css";

interface CommunityCardProps {
  member: Member;
  isFollowed: boolean;
  onFollow: () => void;
  index: number;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  member,
  isFollowed,
  onFollow,
  index,
}) => {
  const [hov, setHov] = useState(false);

  const followBtnClass = `${styles.followBtn} ${isFollowed ? styles.followBtnActive : styles.followBtnNormal}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={styles.card}
      style={{
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov
          ? `0 12px 36px rgba(${member.glowRgb},0.18)`
          : "0 3px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Background colour absorption */}
      <div
        className={styles.glowBg1}
        style={{
          background: `radial-gradient(ellipse at 30% 100%, rgba(${member.glowRgb},${hov ? 0.18 : 0.08}) 0%, transparent 60%)`,
        }}
      />
      <div
        className={styles.glowBg2}
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(${member.glowRgb},${hov ? 0.06 : 0.02}) 0%, transparent 70%)`,
        }}
      />

      <div className={styles.innerContent}>
        {/* Avatar + follow */}
        <div className={styles.headerRow}>
          <Link
            to={`/${member.name}`}
            className={styles.avatarLink}
            style={{
              boxShadow: hov ? `0 0 18px rgba(${member.glowRgb},0.3)` : "none",
            }}
          >
            {member.avatar ? (
              <Img
                src={member.avatar}
                alt={member.name}
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
                  background: `rgba(${member.glowRgb},0.3)`,
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
            className={followBtnClass}
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
        <div className={styles.infoWrapper}>
          <Link to={`/${member.name}`} className={styles.nameLink}>
            <div className={styles.name}>{member.name}</div>
          </Link>
          <div className={styles.handle}>{member.handle}</div>
        </div>

        {/* Bio */}
        {member.bio && <p className={styles.bio}>{member.bio}</p>}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Film size={9} />
            <span className={styles.statVal}>{fmtCount(member.filmsLogged)}</span>
            <span className={styles.statLabel}>films</span>
          </div>
          <div className={styles.statItem}>
            <Users size={9} />
            <span className={styles.statVal}>{fmtCount(member.followers)}</span>
            <span className={styles.statLabel}>seguidores</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
