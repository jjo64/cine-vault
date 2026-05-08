import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { C, SANS } from "../../constants";

interface SectionLabelProps {
  children: React.ReactNode;
  link?: string;
  linkHref?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  link,
  linkHref,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: C.accent,
          fontFamily: SANS,
        }}
      >
        {children}
      </div>
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${C.border}, transparent)`,
        }}
      />
      {link ? (
        <Link
          to={linkHref || "#"}
          style={{
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.textSoft,
            textDecoration: "none",
            fontFamily: SANS,
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
        >
          {link} <ChevronRight size={11} />
        </Link>
      ) : null}
    </div>
  );
};
