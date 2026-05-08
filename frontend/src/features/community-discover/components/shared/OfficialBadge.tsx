import { SANS, C } from "../../constants";

export function OfficialBadge({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isLg ? 6 : 5,
        padding: isLg ? "5px 12px" : "3px 9px",
        background: "rgba(212,175,122,0.12)",
        border: `1px solid rgba(212,175,122,0.35)`,
        backdropFilter: "blur(8px)",
      }}
    >
      <svg
        width={isLg ? 11 : 9}
        height={isLg ? 13 : 11}
        viewBox="0 0 11 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.5 0L6.8 3.5H10.5L7.6 5.7L8.6 9.2L5.5 7L2.4 9.2L3.4 5.7L0.5 3.5H4.2L5.5 0Z"
          fill={C.official}
        />
        <rect
          x="2"
          y="11"
          width="7"
          height="1"
          rx="0.5"
          fill={C.official}
          opacity="0.6"
        />
        <rect
          x="3.5"
          y="12.2"
          width="4"
          height="0.8"
          rx="0.4"
          fill={C.official}
          opacity="0.4"
        />
      </svg>
      <span
        style={{
          fontFamily: SANS,
          fontSize: isLg ? 9 : 8,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: C.official,
        }}
      >
        CineVault Official
      </span>
    </div>
  );
}
