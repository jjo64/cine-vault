import React, { useState } from "react";
import styles from "./SafeImg.module.css";

type SafeImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

export function SafeImg({ src, alt, style, className, ...rest }: SafeImgProps) {
  const [err, setErr] = useState(false);

  if (err || !src) {
    return (
      <div
        className={`${styles.fallback} ${className || ""}`}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}
