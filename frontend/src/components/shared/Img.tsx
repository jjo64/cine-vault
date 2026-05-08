import React, { useState } from "react";

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackColor?: string;
}

export const Img: React.FC<ImgProps> = ({
  src,
  alt,
  style,
  fallbackColor = "#111",
  ...rest
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        style={{
          ...(style as React.CSSProperties),
          backgroundColor: fallbackColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
          fontSize: "10px",
          fontFamily: "sans-serif",
        }}
      >
        {alt || "Image not found"}
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
};
