import { useState } from "react";
import { C } from "../../constants";

export function GlowCard({
  children,
  dominantColor,
  style,
  className,
}: {
  children: React.ReactNode;
  dominantColor?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [hov, setHov] = useState(false);
  const glow = dominantColor
    ? `rgba(${dominantColor}, ${hov ? 0.18 : 0.08})`
    : C.accentGlow;

  return (
    <div
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.accentDim : C.border}`,
        transition: "border-color 0.3s, box-shadow 0.4s, transform 0.3s",
        boxShadow: hov
          ? `0 0 0 1px rgba(${dominantColor || "212,175,122"}, 0.12), 0 8px 40px rgba(${dominantColor || "212,175,122"}, 0.15), inset 0 0 60px rgba(${dominantColor || "212,175,122"}, 0.03)`
          : `0 0 0 0px transparent`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse at 30% 70%, ${glow} 0%, transparent 65%)`,
          transition: "opacity 0.4s",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
