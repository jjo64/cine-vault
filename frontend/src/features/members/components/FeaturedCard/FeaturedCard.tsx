import React, { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Check, UserPlus, Film, List, Users } from "lucide-react";
import type { Member } from "../../types";
import { Img } from "../../../../components/shared/Img";
import { RoleBadge } from "../RoleBadge/RoleBadge";
import { fmtCount } from "../../utils";
import styles from "./FeaturedCard.module.css";

interface FeaturedCardProps {
  member: Member;
  isFollowed: boolean;
  onFollow: () => void;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({
  member,
  isFollowed,
  onFollow,
}) => {
  const [hov, setHov] = useState(false);
  const isAdmin = member.role === "admin";

  const cardClass = `${styles.card} ${isAdmin ? styles.cardAdmin : styles.cardEditor}`;
  const avatarLinkClass = `${styles.avatarLink} ${isAdmin ? styles.avatarLinkAdmin : styles.avatarLinkEditor}`;

  const followBtnClass = `${styles.followBtn} ${isAdmin ? styles.followBtnAdmin : styles.followBtnEditor} ${isFollowed ? styles.followBtnActive : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={cardClass}
      style={{
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov
          ? `0 16px 48px rgba(${member.glowRgb},0.20), 0 0 0 1px rgba(212,175,122,0.06)`
          : `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,122,0.03)`,
      }}
    >
      {/* Ambient glow backdrop */}
      <div
        className={styles.ambientGlow}
        style={{
          background: `radial-gradient(ellipse at 0% 100%, rgba(${member.glowRgb},${hov ? 0.12 : 0.05}) 0%, transparent 55%)`,
        }}
      />
      {isAdmin && <div className={styles.adminCorner} />}

      <div className={styles.innerContent}>
        {/* Header row: avatar + info + follow */}
        <div className={styles.headerRow}>
          {/* Avatar */}
          <Link
            to={`/${member.name}`}
            className={avatarLinkClass}
            style={{
              boxShadow: `0 0 20px rgba(${member.glowRgb},0.22)`,
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
                  filter: "saturate(0.7) brightness(0.85)",
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

          {/* Info */}
          <div className={styles.infoWrapper}>
            <div className={styles.badgeRow}>
              <RoleBadge role={member.role} size="sm" />
            </div>
            <Link to={`/${member.name}`} className={styles.nameLink}>
              <div className={styles.name}>{member.name}</div>
            </Link>
            <div className={styles.handle}>{member.handle}</div>
            {member.bio && <p className={styles.bio}>{member.bio}</p>}
          </div>

          {/* Follow button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFollow}
            className={followBtnClass}
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
        <div className={styles.statsRow}>
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
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
