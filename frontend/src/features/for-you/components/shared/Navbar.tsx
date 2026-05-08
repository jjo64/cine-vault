import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search as SearchIcon } from "lucide-react";
import { C, SANS, SERIF } from "../../constants";
import { logoutCurrentUser } from "../../../../services/authServices";
import type { AuthUser } from "../../../../services/authServices";

export function Navbar({ user }: { user: AuthUser | null }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const initials = user?.username ? user.username.slice(0, 1).toUpperCase() : "C";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.8)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "all 0.4s",
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: SERIF,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: C.text,
          textDecoration: "none",
        }}
      >
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "Para vos", href: "/for-you", active: true },
          { label: "Feed", href: "/feed", active: false },
          { label: "Explorar", href: "/search", active: false },
          { label: "Mi Vault", href: "/home", active: false },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: item.active ? C.accent : C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              borderBottom: item.active
                ? `1px solid ${C.accentDim}`
                : "1px solid transparent",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => navigate("/search")}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.textSoft,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          <SearchIcon size={13} />
        </button>
        <button
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.textSoft,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <Bell size={13} />
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: C.accent,
            }}
          />
        </button>
        <Link to="/profile">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: user?.avatar_url
                ? `url(${user.avatar_url}) center/cover`
                : `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
              border: `1.5px solid ${C.accentDim}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SERIF,
              fontSize: 14,
              color: C.accent,
              overflow: "hidden",
            }}
          >
            {!user?.avatar_url && initials}
          </div>
        </Link>
        {user && (
          <button
            onClick={() => logoutCurrentUser().then(() => navigate("/login"))}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.textMuted,
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: 0,
            }}
          >
            Salir
          </button>
        )}
      </div>
    </nav>
  );
}
