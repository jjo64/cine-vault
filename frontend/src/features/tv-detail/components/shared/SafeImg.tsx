import { useState } from "react";
import { C } from "../../constants";

export function SafeImg({
  src,
  alt,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div style={{ ...style, background: C.elevated }} />;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}
