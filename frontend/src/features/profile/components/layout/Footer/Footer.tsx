import styles from "./Footer.module.css";

export function Footer() {
  return (
    <div className={styles.footer}>
      <div className={styles.brand}>
        Cine<span className={styles.accent}>Vault</span>
      </div>
      <div className={styles.quote}>
        "Toda gran colección empieza con una."
      </div>
    </div>
  );
}
