import { Globe, Lock, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import type { UserListSummaryItem } from "../../../types";
import styles from "./ListsPanel.module.css";

interface ListsPanelProps {
  userLists: UserListSummaryItem[];
}

export function ListsPanel({ userLists }: ListsPanelProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.panelHeader}>
          Listas{" "}
          <em className={styles.panelHeaderEm}>
            — {userLists.length} creadas
          </em>
        </div>
        <button
          onClick={() => navigate("/lists")}
          className={styles.btnNewList}
        >
          <Plus size={11} /> Nueva lista
        </button>
      </div>

      {userLists.length === 0 && (
        <div className={styles.emptyText}>
          Todavía no tienes listas creadas.
        </div>
      )}

      <div className={styles.grid}>
        {userLists.map((list, index) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={styles.listCard}
            whileHover={{ y: -3 }}
            onClick={() => navigate("/lists")}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardHeaderTag}>
                Lista personalizada
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.titleRow}>
                <div className={styles.listName}>
                  {list.name}
                </div>
                <div className={styles.listMeta}>
                  {list.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                  <span className={styles.itemsCount}>
                    {list.itemsCount} films
                  </span>
                </div>
              </div>
              <div className={styles.description}>
                {list.description || "Sin descripción"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
