import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_URL } from '../constants'
import type { CombinedCredits, PersonDetail } from '../types'

export function usePersonData() {
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [credits, setCredits] = useState<CombinedCredits>({ cast: [], crew: [] })

  const personId = useMemo(() => Number((id || '').split('-')[0]), [id])

  useEffect(() => {
    if (!personId) {
      setError('Persona no encontrada')
      setLoading(false)
      return
    }

    let alive = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [personRes, creditsRes] = await Promise.all([
          fetch(`${API_URL}/api/information/person/${personId}`),
          fetch(`${API_URL}/api/information/person/${personId}/combined_credits`),
        ])

        if (!personRes.ok || !creditsRes.ok) {
          throw new Error('No se pudo cargar la biografía')
        }

        const personData = (await personRes.json()) as PersonDetail
        const creditsData = (await creditsRes.json()) as CombinedCredits

        if (!alive) return

        setPerson(personData)
        setCredits(creditsData)
      } catch (err) {
        if (!alive) return
        setError((err as Error).message || 'No se pudo cargar la biografía')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [personId])

  return {
    loading,
    error,
    person,
    credits,
  }
}
