import React, { useState } from 'react';

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function Img({ src, alt, style, className, fallbackClassName = 'md-img-error-fallback', ...rest }: ImgProps) {
  const [err, setErr] = useState(false);

  if (err) {
    return <div style={style} className={`${className} ${fallbackClassName}`} />;
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
