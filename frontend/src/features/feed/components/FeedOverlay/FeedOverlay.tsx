import { ChevronUp, ChevronDown } from "lucide-react";

export function ProgressDots({
  total,
  active,
  onGo,
}: {
  total: number;
  active: number;
  onGo: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 6,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          onClick={() => onGo(i)}
          style={{
            width: i === active ? 3 : 2,
            height: i === active ? 20 : 8,
            borderRadius: 4,
            background:
              i === active ? "var(--color-accent)" : "rgba(255,255,255,0.2)",
            cursor: "pointer",
            transition: "all 0.3s ease",
            pointerEvents: "all",
          }}
        />
      ))}
    </div>
  );
}

export function NavArrows({
  onUp,
  onDown,
  canUp,
  canDown,
}: {
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 32,
        zIndex: 150,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <button
        onClick={onUp}
        disabled={!canUp}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(8,8,8,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${canUp ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
          color: canUp ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
          cursor: canUp ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        <ChevronUp size={16} />
      </button>
      <button
        onClick={onDown}
        disabled={!canDown}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(8,8,8,0.7)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${canDown ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}`,
          color: canDown ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
          cursor: canDown ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

export function Grain() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 900,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        opacity: 0.38,
      }}
    />
  );
}
