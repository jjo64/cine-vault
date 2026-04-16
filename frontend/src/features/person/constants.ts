import type { CrewTab } from './types'

export const API_URL = import.meta.env.VITE_API_URL

export const DEPARTMENT_LABELS: Record<string, string> = {
  Acting: 'Actor',
  Directing: 'Director',
  Writing: 'Guionista',
  Production: 'Productor',
  'Visual Effects': 'VFX',
  Sound: 'Sonido',
  Camera: 'Fotografía',
  Editing: 'Montaje',
  Costume: 'Vestuario',
  Art: 'Arte',
  Crew: 'Equipo',
}

export const CREW_FILTERS: Array<{ key: CrewTab; label: string }> = [
  { key: 'director', label: 'Director' },
  { key: 'writer', label: 'Guionista' },
  { key: 'producer', label: 'Productor' },
]
