import { motion } from "motion/react";

interface SkeletonPillProps {
  width?: number | string;
}

export function SkeletonPill({ width = 64 }: SkeletonPillProps) {
  return (
    <motion.span
      animate={{ opacity: [0.28, 0.7, 0.28] }}
      transition={{
        duration: 1.05,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      style={{
        display: "inline-block",
        width,
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.12)",
      }}
    />
  );
}
export default SkeletonPill;
