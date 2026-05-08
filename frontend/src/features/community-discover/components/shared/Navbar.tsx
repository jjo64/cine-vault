import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Img } from "../../../../components/shared/Img";
import { C, SERIF, SANS } from "../../constants";
import type { AuthUser } from "../../types";

export function Navbar({ user }: { user: AuthUser | null }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

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
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.82)",
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
          { label: "Para vos", href: "/for-you" },
          { label: "Feed", href: "/feed" },
          { label: "Explorar", href: "/search" },
          { label: "Listas", href: "/lists", active: true },
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
          <Search size={13} />
        </button>
        <Link to="/profile">
          {user?.avatar_url ? (
            <Img
              src={user.avatar_url}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: `1.5px solid ${C.accentDim}`,
              }}
            />
          ) : (
            <div
              style={
                {
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
                  border: `1.5px solid ${C.accentDim}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontSize: 13,
                  color: C.accent,
                  textDecoration: "none",
                } as React.CSSProperties
              }
            >
              {user?.username?.slice(0, 1).toUpperCase() || "M"}
            </div>
          )}
        </Link>
      </div>
    </nav>
  );
}
