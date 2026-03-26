import React from 'react'
import { motion } from 'motion/react'
import { type TVDetailApi } from '../../../services/tvDetailServices'
import { C, SANS, SERIF } from '../constants'

// Helper interno para años
const formatYear = (date?: string) => date ? date.split('-')[0] : '?'

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    fontSize: 10, 
    letterSpacing: '0.25em', 
    textTransform: 'uppercase', 
    color: C.accent, 
    fontFamily: SANS, 
    marginBottom: 16, 
    fontWeight: 600 
  }}>
    {children}
  </div>
)

export default function TechnicalSheet({ detail }: { detail: TVDetailApi }) {
  const yearStart = formatYear(detail.first_air_date)
  const yearEnd = detail.in_production === false ? formatYear(detail.last_air_date) : 'presente'
  const years = yearStart === yearEnd || !detail.last_air_date ? yearStart : `${yearStart} – ${yearEnd}`

  const rows = [
    { label: 'Creada por', value: (detail.created_by || []).map(c => c.name).join(', ') },
    { label: 'Red', value: (detail.networks || []).map(n => n.name).join(' / ') },
    { label: 'País', value: (detail.production_countries || []).map(c => c.name).join(', ') },
    { label: 'Idioma', value: (detail.spoken_languages || []).map(l => l.english_name || l.name || '').join(', ') },
    { label: 'Temporadas', value: detail.number_of_seasons ? String(detail.number_of_seasons) : '' },
    { label: 'Episodios', value: detail.number_of_episodes ? String(detail.number_of_episodes) : '' },
    { label: 'Emisión', value: years },
    { label: 'Estado', value: detail.status || '' },
  ].filter(r => r.value)

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      style={{ marginBottom: 24 }}
    >
      <SectionLabel>Ficha técnica</SectionLabel>
      
      <div style={{ 
        background: C.surface, 
        border: `1px solid ${C.border}`, 
        overflow: 'hidden' 
      }}>
        {rows.map((row, i) => (
          <div 
            key={row.label} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '110px 1fr', 
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' 
            }}
          >
            <div style={{ 
              padding: '10px 12px', 
              fontSize: 9, 
              letterSpacing: '0.16em', 
              textTransform: 'uppercase', 
              color: C.textMuted, 
              fontFamily: SANS, 
              borderRight: `1px solid ${C.border}`, 
              background: 'rgba(255,255,255,0.02)' // Reemplazo de C.elevated
            }}>
              {row.label}
            </div>
            <div style={{ 
              padding: '10px 12px', 
              fontSize: 12, 
              color: C.text, 
              fontFamily: SERIF 
            }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}