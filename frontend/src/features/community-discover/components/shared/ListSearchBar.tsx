import { useState } from "react";
import { Search, X } from "lucide-react";
import { C, SANS } from "../../constants";

export function ListSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <Search
        size={13}
        color={focused ? C.accent : C.textSoft}
        style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          transition: "color 0.2s",
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar listas…"
        style={{
          width: 220,
          padding: "9px 12px 9px 34px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? C.accentDim : C.border}`,
          color: C.text,
          fontFamily: SANS,
          fontSize: 11,
          outline: "none",
          letterSpacing: "0.04em",
          transition: "border-color 0.2s",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.textSoft,
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
