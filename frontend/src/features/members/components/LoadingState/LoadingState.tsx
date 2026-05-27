import React from "react";
import { motion } from "motion/react";
import { Loader } from "lucide-react";
import { C } from "../../constants";
import styles from "./LoadingState.module.css";

export const LoadingState: React.FC = () => {
  return (
    <div className={styles.container}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <Loader size={28} color={C.accentDim} />
      </motion.div>
      <p className={styles.text}>Cargando la sociedad cinéfila…</p>
    </div>
  );
};
