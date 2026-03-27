import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import type { TVDetailApi } from '../services/tvDetailServices'
import { C, SANS, SERIF } from '../constants'

type CrewMember = { 
  id: number; 
  name: string; 
  job?: string; 
  department?: string; 
  profile_path?: string | null 
}

// interface CrewGroup {
//   dept: string;
//   members: CrewMember[];
// }

// Reutilizamos el SectionLabel que tienes en TVDetail (o lo definimos aquí si prefieres)
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    fontSize: 10, 
    letterSpacing: '0.25em', 
    textTransform: 'uppercase', 
    color: C.accent, 
    fontFamily: SANS, 
    marginBottom: 24, 
    fontWeight: 600 
  }}>
    {children}
  </div>
)

export default function CrewSection({ detail }: { detail: TVDetailApi }) {
  // 1. Lógica de transformación de datos (Agrupación por departamento)
  const crewGroups = useMemo(() => {
    const rawCrew = (detail.credits?.crew as CrewMember[]) || []
    if (rawCrew.length === 0) return []

    const map = new Map<string, CrewMember[]>()
    
    rawCrew.forEach(p => {
      const key = p.department || p.job || 'Crew'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })

    // Retornamos los primeros 5 departamentos con máximo 8 miembros cada uno
    return Array.from(map.entries())
      .slice(0, 5)
      .map(([dept, members]) => ({ 
        dept, 
        members: members.slice(0, 8) 
      }))
  }, [detail.credits?.crew])

  if (crewGroups.length === 0) return null

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Equipo creativo</SectionLabel>

      {crewGroups.map(({ dept, members }) => (
        <div key={dept} style={{ marginBottom: 32 }}>
          {/* Nombre del Departamento */}
          <h4 style={{ 
            fontSize: 9, 
            letterSpacing: '0.22em', 
            textTransform: 'uppercase', 
            color: C.textMuted, 
            fontFamily: SANS, 
            marginBottom: 12,
            borderLeft: `2px solid ${C.accentGlow}`,
            paddingLeft: 10
          }}>
            {dept}
          </h4>

          {/* Grid de Miembros */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: 12 
          }}>
            {members.map(m => (
              <div 
                key={`${dept}-${m.id}`} 
                style={{ 
                  padding: '14px 18px', 
                  background: C.surface, 
                  border: `1px solid ${C.border}`,
                  transition: 'border-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = C.accentDim}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ 
                  fontFamily: SERIF, 
                  fontSize: 16, 
                  color: C.text, 
                  marginBottom: 4 
                }}>
                  {m.name}
                </div>
                <div style={{ 
                  fontSize: 10, 
                  letterSpacing: '0.14em', 
                  textTransform: 'uppercase', 
                  color: C.textSoft, 
                  fontFamily: SANS 
                }}>
                  {m.job || dept}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.section>
  )
}