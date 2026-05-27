import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Img } from "../../../components/shared/Img";
import type { PersonResult } from "../types";
import styles from "./PersonResultItem.module.css";

interface PersonResultItemProps {
  item: PersonResult;
  delay: number;
}

export function PersonResultItem({ item, delay }: PersonResultItemProps) {
  const [following, setFollowing] = useState(false);

  return (
    <motion.div
      className={styles.layout}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link
        to={`/person/${item.id}`}
        className={styles.link}
      >
        <div className={styles.avatarContainer}>
          <Img
            src={item.img}
            alt={item.name}
            className={styles.avatarImg}
          />
        </div>
      </Link>

      <div>
        <div className={styles.headerRow}>
          <Link to={`/person/${item.id}`} className={styles.nameLink}>
            <span className={styles.nameText}>{item.name}</span>
          </Link>
          <span className={styles.badge}>Persona</span>
        </div>

        <div className={styles.roleText}>{item.role}</div>

        <div className={styles.notableRow}>
          <span className={styles.notableLabel}>Conocido por:</span>
          {item.notable.map((entry, index) => (
            <span
              key={`${entry}-${index}`}
              className={styles.notableItem}
            >
              {entry}
            </span>
          ))}

          <button
            onClick={() => setFollowing((v) => !v)}
            className={`${styles.followBtn} ${following ? styles.active : ""}`}
          >
            {following ? "✓ Siguiendo" : "+ Seguir"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
export default PersonResultItem;
