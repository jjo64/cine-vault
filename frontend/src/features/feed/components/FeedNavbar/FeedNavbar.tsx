import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import type { FeedTab } from "../../types";

const TABS: FeedTab[] = ["Para ti", "Siguiendo"];

export function FeedNavbar({
  activeTab,
  onTab,
}: {
  activeTab: FeedTab;
  onTab: (t: FeedTab) => void;
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navHeight = isMobile ? 104 : 72;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        height: navHeight,
        display: "grid",
        gridTemplateRows: isMobile ? "54px 50px" : "72px",
        alignItems: "center",
        padding: isMobile ? "0 10px" : "0 16px",
        background: "rgba(8,8,8,0.86)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr auto auto" : "auto 1fr auto",
          alignItems: "center",
          gap: isMobile ? 8 : 14,
          minWidth: 0,
          height: isMobile ? 54 : 72,
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: isMobile ? 14 : 16,
            fontWeight: 500,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: "var(--color-text)",
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          Cine<span style={{ color: "var(--color-accent)" }}>Vault</span>
        </Link>

        {!isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
                padding: 4,
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTab(tab)}
                  style={{
                    padding: "8px 14px",
                    background:
                      activeTab === tab
                        ? "rgba(212,175,122,0.18)"
                        : "transparent",
                    border:
                      activeTab === tab
                        ? "1px solid rgba(212,175,122,0.45)"
                        : "1px solid transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color:
                      activeTab === tab
                        ? "var(--color-text)"
                        : "var(--color-text-soft)",
                    transition: "all 0.2s",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifySelf: "end",
          }}
        >
          <button
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              color: "var(--color-text-soft)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Search size={13} />
          </button>
          <Link
            to="/profile"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1.5px solid var(--color-accent-dim)",
              display: "block",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 13,
                color: "var(--color-accent)",
              }}
            >
              M
            </div>
          </Link>
        </div>
      </div>

      {isMobile && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              padding: 5,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onTab(tab)}
                style={{
                  padding: "9px 10px",
                  background:
                    activeTab === tab
                      ? "rgba(212,175,122,0.22)"
                      : "transparent",
                  border:
                    activeTab === tab
                      ? "1px solid rgba(212,175,122,0.46)"
                      : "1px solid transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color:
                    activeTab === tab
                      ? "var(--color-text)"
                      : "var(--color-text-soft)",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
