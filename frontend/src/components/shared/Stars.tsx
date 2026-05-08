import React from "react";
import { Star } from "lucide-react";

interface StarsProps {
  rating: number; // 0 to 5
  size?: number;
  color?: string;
  fillColor?: string;
}

export const Stars: React.FC<StarsProps> = ({
  rating,
  size = 10,
  color = "#D4AF7A",
  fillColor = "#D4AF7A",
}) => {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={color}
          fill={i <= Math.round(rating) ? fillColor : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
};
