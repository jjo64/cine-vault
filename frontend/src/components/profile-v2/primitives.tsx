import { useState } from "react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { C, SANS, SERIF } from "./theme";

export function Img({
  src,
  alt,
  style,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        style={{
          ...style,
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          opacity="0.3"
        >
          <rect
            x="4"
            y="4"
            width="24"
            height="24"
            rx="3"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <path d="M4 22l7-8 14 14" stroke="#fff" strokeWidth="1.5" />
          <circle cx="22" cy="12" r="3" stroke="#fff" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setError(true)}
      {...rest}
    />
  );
}

export function Stars({
  rating,
  max = 5,
  size = 13,
}: {
  rating: number;
  max?: number;
  size?: number;
}) {
  const parsedRating = typeof rating === "number" ? rating : Number(rating);
  const safeRating = Number.isFinite(parsedRating)
    ? Math.max(0, Math.min(max, parsedRating))
    : 0;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, index) => {
        const fill = Math.max(0, Math.min(1, safeRating - index));
        return (
          <div
            key={index}
            style={{ position: "relative", width: size, height: size }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 12 12"
              fill={C.textMuted}
              style={{ display: "block" }}
            >
              <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z" />
            </svg>
            {fill > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${fill * 100}%`,
                  overflow: "hidden",
                }}
              >
                <svg
                  width={size}
                  height={size}
                  viewBox="0 0 12 12"
                  fill={C.gold}
                  style={{ display: "block" }}
                >
                  <path d="M6 1l1.3 2.6L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.7-.4z" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Badge({
  children,
  color = C.accent,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        fontSize: 9,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
        background: "rgba(8,8,8,0.8)",
        padding: "3px 8px",
        border: `1px solid ${C.accentDim}`,
        backdropFilter: "blur(4px)",
        fontFamily: SANS,
      }}
    >
      {children}
    </span>
  );
}

export function GrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.35,
      }}
    />
  );
}

export function SectionHeader({
  title,
  em,
  link,
  onLinkClick,
}: {
  title: string;
  em?: string;
  link: string;
  onLinkClick?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 26,
          fontWeight: 400,
          letterSpacing: "0.02em",
          color: C.text,
        }}
      >
        {title}{" "}
        {em && (
          <em style={{ color: C.textSoft, fontStyle: "italic", fontSize: 22 }}>
            {em}
          </em>
        )}
      </div>
      <button
        type="button"
        onClick={onLinkClick}
        style={{
          border: "none",
          background: "none",
          cursor: onLinkClick ? "pointer" : "default",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.accent,
          textDecoration: "none",
          fontFamily: SANS,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {link} <ChevronRight size={12} />
      </button>
    </div>
  );
}
