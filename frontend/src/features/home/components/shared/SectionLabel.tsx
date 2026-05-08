import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C, SERIF, SANS } from "../../constants";

interface SectionLabelProps {
  children: React.ReactNode;
  link?: string;
  linkHref?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ 
  children, 
  link, 
  linkHref 
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(20px, 2.2vw, 24px)",
          fontWeight: 400,
          color: C.text,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </h2>
      {link && linkHref && (
        <Link
          to={linkHref}
          style={{
            fontFamily: SANS,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.accent,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {link} <ArrowRight size={10} />
        </Link>
      )}
    </div>
  );
};
