import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useSettingsStore } from "../../store/useSettingsStore";
import styles from "./LeaveModal.module.css";

export function LeaveModal() {
  const navigate = useNavigate();
  const showLeaveModal = useSettingsStore((s) => s.showLeaveModal);
  const setShowLeaveModal = useSettingsStore((s) => s.setShowLeaveModal);

  return (
    <AnimatePresence>
      {showLeaveModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.34 }}
          className={styles.overlay}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.34 }}
            className={styles.modal}
          >
            <h3 className={styles.title}>Cambios sin guardar</h3>
            <p className={styles.message}>
              Tienes cambios sin guardar. ¿Seguro que quieres salir?
            </p>
            <div className={styles.actions}>
              <button
                onClick={() => setShowLeaveModal(false)}
                className={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={() => navigate(-1)}
                className={styles.leaveBtn}
              >
                Salir igual
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default LeaveModal;
