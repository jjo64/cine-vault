import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="md-section-label">
      {children}
      <div className="md-section-label-line" />
    </div>
  );
}
