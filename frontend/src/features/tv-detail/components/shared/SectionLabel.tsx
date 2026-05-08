import { C, SANS } from "../../constants";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: C.accent,
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: SANS,
      }}
    >
      {children}
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${C.border}, transparent)`,
        }}
      />
    </div>
  );
}
