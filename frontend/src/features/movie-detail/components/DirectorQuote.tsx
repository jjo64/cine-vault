import { motion } from 'framer-motion';
import { C, SERIF, SANS } from '../constants';
import quotesData from '../../../../quotes.json';

interface DirectorQuoteProps {
  director: string;
}

export function DirectorQuote({ director }: DirectorQuoteProps) {
  const quote = quotesData.find(q => q.director.toLowerCase() === director.toLowerCase()) || {
    cita: "El tiempo es la más importante de todas las categorías del cine. Para mí, el cine es ante todo esculpir el tiempo.",
    fuente: "Esculpir el tiempo"
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      whileInView={{ opacity: 1 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.9 }} 
      className="md-quote" 
      style={{ 
        borderTop: `1px solid ${C.border}`, 
        borderBottom: `1px solid ${C.border}`, 
        background: C.surface, 
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden' 
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%,-50%)', 
          width: 400, 
          height: 200, 
          background: `radial-gradient(ellipse, ${C.accentGlow}, transparent 70%)`, 
          pointerEvents: 'none' 
        }} 
      />
      <div 
        style={{ 
          fontFamily: SERIF, 
          fontSize: 'clamp(20px, 2.5vw, 28px)', 
          fontStyle: 'italic', 
          fontWeight: 300, 
          lineHeight: 1.65, 
          color: C.textSoft, 
          maxWidth: 760, 
          margin: '0 auto 16px', 
          position: 'relative' 
        }}
      >
        <span style={{ color: C.accent, fontSize: '1.3em' }}>&quot;</span>
        {quote.cita}
        <span style={{ color: C.accent, fontSize: '1.3em' }}>&quot;</span>
      </div>
      <div 
        style={{ 
          fontSize: 12, 
          letterSpacing: '0.18em', 
          textTransform: 'uppercase', 
          color: C.textMuted, 
          fontFamily: SANS 
        }}
      >
        {director} — {quote.fuente}
      </div>
    </motion.div>
  );
}
