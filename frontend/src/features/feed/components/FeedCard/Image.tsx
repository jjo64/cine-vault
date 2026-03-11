import { useState } from 'react';

export function Image({ src, alt, style, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) {
    const [err, setErr] = useState(false);
    if (err) return <div style={{ ...style, background: 'var(--color-elevated)' }} />;
    return <img src={src} alt={alt} style={style} onError={() => setErr(true)} {...rest} />;
}
