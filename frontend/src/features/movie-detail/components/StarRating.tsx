import React, { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (n: number) => void;
}

const LABELS: Record<string, string> = {
  '0.5': 'Muy mala, pero viste algo rescatable',
  '1': 'Muy floja',
  '1.5': 'Floja, apenas se deja ver',
  '2': 'Regular tirando a floja',
  '2.5': 'Pasable',
  '3': 'Buena',
  '3.5': 'Muy buena',
  '4': 'Gran película',
  '4.5': 'Excelente, casi obra maestra',
  '5': 'Obra maestra',
};

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const activeRaw = hover ?? value;
  const active =
    typeof activeRaw === 'number'
      ? (Number.isFinite(activeRaw) ? activeRaw : 0)
      : Number(activeRaw) || 0;

  const getFill = (starIndex: number) => {
    const raw = active - starIndex;
    return Math.max(0, Math.min(1, raw));
  };

  const handleHalf = (starIndex: number, half: 0.5 | 1) => {
    const next = starIndex + half;
    setHover(next);
  };

  const labelKey = Number.isInteger(active) ? String(active) : active.toFixed(1);
  const activeLabel = active > 0 ? LABELS[labelKey] || 'Tu rating' : 'Tu rating';

  return (
    <div className="md-star-rating-container">
      <div className="md-stars-wrapper" onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fill = getFill(starIndex);
          return (
            <div key={starIndex} className="md-star-item">
              <span aria-hidden className="md-star-base">★</span>

              <div className="md-star-fill-wrapper" style={{ width: `${fill * 100}%` }}>
                <span aria-hidden className="md-star-fill">★</span>
              </div>

              <button
                aria-label={`Rate ${starIndex + 0.5}`}
                onMouseEnter={() => handleHalf(starIndex, 0.5)}
                onFocus={() => handleHalf(starIndex, 0.5)}
                onClick={() => onChange(starIndex + 0.5)}
                className="md-star-btn-half"
              />
              <button
                aria-label={`Rate ${starIndex + 1}`}
                onMouseEnter={() => handleHalf(starIndex, 1)}
                onFocus={() => handleHalf(starIndex, 1)}
                onClick={() => onChange(starIndex + 1)}
                className="md-star-btn-full"
              />
            </div>
          );
        })}
      </div>
      <div className="md-star-label">
        {activeLabel}
      </div>
    </div>
  );
}
