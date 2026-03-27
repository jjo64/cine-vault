import { useState } from 'react';
import { motion } from 'framer-motion';
import { C, SANS } from '../constants';
import { SectionLabel } from './SectionLabel';
import { Img } from './Img';

interface StillsProps {
  stills: string[];
}

export function Stills({ stills }: StillsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Imágenes de la película</SectionLabel>
      <div className="md-stills-grid" style={{ gap: 4 }}>
        {stills.map((still, i) => (
          <div 
            key={still + i} 
            className={i === 0 ? 'md-stills-item-1' : ''} 
            onMouseEnter={() => setHoveredIdx(i)} 
            onMouseLeave={() => setHoveredIdx(null)} 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              cursor: 'pointer', 
              background: C.elevated 
            }}
          >
            <Img 
              src={still} 
              alt={`Still ${i + 1}`} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                filter: hoveredIdx === i ? 'saturate(0.85) brightness(0.85)' : 'saturate(0.35) brightness(0.65)', 
                transform: hoveredIdx === i ? 'scale(1.03)' : 'scale(1)', 
                transition: 'filter 0.4s, transform 0.4s' 
              }} 
            />
            <div 
              style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'rgba(8,8,8,0.35)', 
                opacity: hoveredIdx === i ? 1 : 0, 
                transition: 'opacity 0.3s', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <span 
                style={{ 
                  fontSize: 10, 
                  letterSpacing: '0.2em', 
                  textTransform: 'uppercase', 
                  color: 'rgba(255,255,255,0.8)', 
                  fontFamily: SANS 
                }}
              >
                Still {i + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
