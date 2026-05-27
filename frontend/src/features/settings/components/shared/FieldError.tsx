import type { ReactNode } from "react";
import styles from "./FieldError.module.css";

interface FieldErrorProps {
  children?: ReactNode;
}

export function FieldError({ children }: FieldErrorProps) {
  if (!children) return null;
  return <div className={styles.error}>{children}</div>;
}
