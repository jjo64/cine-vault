import React from "react";
import { Crown, Pen } from "lucide-react";
import type { Member } from "../../types";
import { C } from "../../constants";
import styles from "./RoleBadge.module.css";

interface RoleBadgeProps {
  role: Member["role"];
  size?: "sm" | "lg";
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "sm" }) => {
  if (role === "member") return null;
  const lg = size === "lg";
  const isAdmin = role === "admin";

  const badgeClass = `${styles.badge} ${lg ? styles.badgeLg : ""} ${isAdmin ? styles.badgeAdmin : styles.badgeEditor}`;
  const labelClass = `${styles.label} ${isAdmin ? styles.labelAdmin : styles.labelEditor}`;

  return (
    <div className={badgeClass}>
      {isAdmin ? (
        <Crown size={lg ? 11 : 9} color={C.gold} />
      ) : (
        <Pen size={lg ? 10 : 8} color={C.accentDim} />
      )}
      <span className={labelClass}>
        {isAdmin ? "Admin" : "Editor"}
      </span>
    </div>
  );
};
