import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, User, Settings, LogOut } from "lucide-react";
import { initials } from "../../utils/stringUtils";
import { logoutCurrentUser, type AuthUser } from "../../services/authServices";
import { useSocket } from "../../context/SocketContext";

const C = {
  bg: "#080808",
  border: "#232323",
  accent: "#D4AF7A",
  text: "#E2E2E2",
  textSoft: "#727272",
};

const SANS = "'Syne', sans-serif";

interface NavbarProps {
  user: AuthUser | null;
}

export const ModernNavbar: React.FC<NavbarProps> = ({ user }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { noLeidas } = useSocket();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleLogout = async () => {
    await logoutCurrentUser();
    navigate("/");
  };

  const navLinks = user 
    ? [
        { label: "Diario", path: "/diary" },
        { label: "Esta noche", path: "/for-you" },
        { label: "Películas", path: "/films" },
        { label: "Feed", path: "/feed" },
      ]
    : [
        { label: "Películas", path: "/films" },
        { label: "Listas", path: "/lists" },
        { label: "Miembros", path: "/members" },
      ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(8,8,8,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        zIndex: 1000,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.02em",
            color: C.text,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
          CINEVAULT
        </Link>

        <div style={{ display: "flex", gap: 32 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? C.accent : C.textSoft,
                  transition: "color 0.2s",
                  position: "relative",
                }}
              >
                {link.label}
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    style={{
                      position: "absolute",
                      bottom: -6,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: C.accent,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", color: C.textSoft }}>
          <Search size={18} style={{ cursor: "pointer" }} />
        </div>

        {user && (
          <div style={{ position: "relative", color: C.textSoft }}>
            <Bell size={18} style={{ cursor: "pointer" }} />
            {noLeidas > 0 && (
              <span style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 12,
                height: 12,
                background: C.accent,
                borderRadius: "50%",
                fontSize: 8,
                color: "#000",
                display: "grid",
                placeItems: "center",
                fontWeight: 800
              }}>
                {noLeidas}
              </span>
            )}
          </div>
        )}

        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                border: `1px solid ${showUserMenu ? C.accent : C.border}`,
                background: C.bg,
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s"
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              ) : (
                <span style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
                  {initials(user.username)}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: "absolute",
                    top: 48,
                    right: 0,
                    width: 180,
                    background: "#0F0F0F",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 8,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                  }}
                >
                  <Link to={`/${user.username}`} style={dropdownItemStyle} onClick={() => setShowUserMenu(false)}>
                    <User size={14} /> Perfil
                  </Link>
                  <Link to="/settings" style={dropdownItemStyle} onClick={() => setShowUserMenu(false)}>
                    <Settings size={14} /> Ajustes
                  </Link>
                  <div style={{ height: 1, background: C.border, margin: "4px 8px" }} />
                  <button onClick={handleLogout} style={{ ...dropdownItemStyle, color: "#ff4444", border: "none", width: "100%", background: "none", cursor: "pointer" }}>
                    <LogOut size={14} /> Salir
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }))}
            style={{
              background: C.accent,
              border: "none",
              padding: "8px 20px",
              color: "#000",
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              borderRadius: 4
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

const dropdownItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 12px",
  color: "#AAA",
  textDecoration: "none",
  fontFamily: SANS,
  fontSize: 12,
  borderRadius: 4,
  transition: "all 0.2s"
};
