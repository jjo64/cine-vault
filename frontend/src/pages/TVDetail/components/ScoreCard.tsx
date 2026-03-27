import { motion } from 'motion/react'
import { type TVDetailApi } from '../../../services/tvDetailServices'
import { C, SANS, SERIF } from '../constants'

export default function ScoreCard({ detail }: { detail: TVDetailApi }) {
  // Convertimos base 10 de TMDB a base 5 de CineVault
  const scoreOf5 = (detail.vote_average || 0) / 2

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.7, delay: 0.4 }}
      style={{ 
        background: C.surface, 
        border: `1px solid ${C.border}`, 
        padding: '28px 24px', 
        marginBottom: 24, 
        textAlign: 'center' 
      }}
    >
      <div style={{ 
        fontSize: 9, 
        letterSpacing: '0.28em', 
        textTransform: 'uppercase', 
        color: C.textMuted, 
        fontFamily: SANS, 
        marginBottom: 16 
      }}>
        Score CineVault
      </div>
      
      <div style={{ 
        fontFamily: SERIF, 
        fontSize: 72, 
        fontWeight: 300, 
        color: C.accent, // Usamos accent del theme
        lineHeight: 1, 
        marginBottom: 4 
      }}>
        {scoreOf5.toFixed(1)}
      </div>

      {detail.vote_count != null && (
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS, marginBottom: 20 }}>
          {detail.vote_count.toLocaleString('es-ES')} valoraciones
        </div>
      )}

      {/* Mini gráfico decorativo de barras */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 36, marginBottom: 8 }}>
        {[4, 8, 14, 28, 46].map((h, i) => (
          <div 
            key={i} 
            style={{ 
              flex: 1, 
              height: `${h}px`, 
              background: i === 4 ? C.accent : C.border, // Resaltamos la última barra
              borderRadius: 1 
            }} 
          />
        ))}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: 9, 
        color: C.textMuted, 
        fontFamily: SANS 
      }}>
        <span>1★</span><span>5★</span>
      </div>
    </motion.div>
  )
}