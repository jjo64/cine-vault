import { Link } from "react-router-dom";

const C = {
  bg: "#080808",
  surface: "#111111",
  border: "#252525",
  accent: "#D4AF7A",
  text: "#E2E2E2",
  textSoft: "#7A7A7A",
} as const;

const SERIF = "'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 30% 20%, rgba(212,175,122,0.12), transparent 45%), ${C.bg}`,
        color: C.text,
        fontFamily: SANS,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <main
        style={{
          width: "min(860px, 100%)",
          border: `1px solid ${C.border}`,
          background: C.surface,
          padding: "32px clamp(18px, 4vw, 50px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: C.accent,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            fontSize: 10,
            marginBottom: 8,
          }}
        >
          Ruta no encontrada
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: "clamp(58px, 13vw, 140px)",
            lineHeight: 0.9,
          }}
        >
          404
        </h1>
        <p
          style={{
            margin: "12px auto 0",
            maxWidth: 520,
            color: C.textSoft,
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 21,
          }}
        >
          No existe esta ruta en CineVault. Si buscas un perfil publico, usa{" "}
          <code>/nombre_usuario</code>.
        </p>

        <div
          style={{
            marginTop: 26,
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              border: `1px solid ${C.border}`,
              color: C.text,
              padding: "10px 14px",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Volver al inicio
          </Link>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-auth-modal", {
                  detail: { mode: "login" },
                }),
              )
            }
            style={{
              border: `1px solid ${C.accent}`,
              background: "transparent",
              color: C.accent,
              padding: "10px 14px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </main>
    </div>
  );
}
