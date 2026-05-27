import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { UserResult } from "../types";
import styles from "./UserResultItem.module.css";

interface UserResultItemProps {
  item: UserResult;
  delay: number;
}

export function UserResultItem({ item, delay }: UserResultItemProps) {
  return (
    <motion.div
      className={styles.layout}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link
        to={`/${encodeURIComponent(item.username)}`}
        className={styles.link}
      >
        <div className={styles.avatar}>{item.avatar}</div>
      </Link>
      <div>
        <div className={styles.headerRow}>
          <Link
            to={`/${encodeURIComponent(item.username)}`}
            className={styles.usernameLink}
          >
            {item.username}
          </Link>
          <span className={styles.handleText}>{item.handle}</span>
          <span className={styles.badge}>Usuario</span>
        </div>
        <div className={styles.bioText}>{item.bio}</div>
        <div className={styles.filmsText}>{item.films} películas vistas</div>
      </div>
    </motion.div>
  );
}
export default UserResultItem;
