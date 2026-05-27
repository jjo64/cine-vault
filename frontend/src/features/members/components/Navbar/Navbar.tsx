import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import styles from "./Navbar.module.css";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navClass = `${styles.nav} ${scrolled ? styles.navScrolled : ""}`;

  return (
    <nav className={navClass}>
      <Link to="/" className={styles.logo}>
        Cine<span className={styles.logoAccent}>Vault</span>
      </Link>
      <div className={styles.links}>
        {[
          { l: "Para vos", h: "/for-you" },
          { l: "Películas", h: "/films" },
          { l: "Listas", h: "/lists" },
          { l: "Sociedad", h: "/members", a: true },
        ].map((it) => {
          const linkClass = `${styles.link} ${it.a ? styles.linkActive : ""}`;
          return (
            <Link key={it.h} to={it.h} className={linkClass}>
              {it.l}
            </Link>
          );
        })}
      </div>
      <Link to="/profile" className={styles.profileCircle}>
        M
      </Link>
    </nav>
  );
};
