import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, SANS } from "../constants";

export function FeedHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.accent, fontFamily: SANS }}>Actividad de tu red</div>
        <div style={{ height: 1, width: 40, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link to="/feed" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textSoft, textDecoration: "none", fontFamily: SANS, display: "flex", alignItems: "center", gap: 4 }}>
          Feed completo <ArrowRight size={9} />
        </Link>
      </div>
    </div>
  );
}
