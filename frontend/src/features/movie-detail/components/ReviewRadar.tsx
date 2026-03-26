import React from 'react';

interface ReviewRadarProps {
  values: {
    direccion: number | null;
    guion: number | null;
    fotografia: number | null;
    actuaciones: number | null;
    bandaSonora: number | null;
  };
}

export function ReviewRadar({ values }: ReviewRadarProps) {
  const ordered = [
    values.direccion,
    values.guion,
    values.fotografia,
    values.actuaciones,
    values.bandaSonora,
  ];
  
  const hasData = ordered.some((value) => typeof value === 'number' && value > 0);
  if (!hasData) return null;

  const center = 44;
  const radius = 32;
  const points = ordered.map((raw, index) => {
    const value = Math.max(0, Math.min(5, Number(raw || 0)));
    const ratio = value / 5;
    const angle = (Math.PI * 2 * index) / ordered.length - Math.PI / 2;
    const r = radius * ratio;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-label="Radar de dimensiones" className="md-review-radar">
      <circle cx="44" cy="44" r="32" className="md-radar-circle" />
      <circle cx="44" cy="44" r="20" className="md-radar-circle" />
      <polygon points={points.join(' ')} className="md-radar-polygon" />
    </svg>
  );
}
