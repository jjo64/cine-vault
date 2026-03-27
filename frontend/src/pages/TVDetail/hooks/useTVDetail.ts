import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTVDetail, type TVDetailApi } from '../services/tvDetailServices'

function slugify(id: number, name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${id}-${slug}`
}

function parseSlugId(slugOrId: string): string {
  return slugOrId.split('-')[0]
}

export function useTVDetail(slugOrId: string | undefined) {
  const navigate = useNavigate()
  const numericId = useMemo(
    () => (slugOrId ? parseSlugId(slugOrId) : ''),
    [slugOrId]
  )

  const [detail, setDetail] = useState<TVDetailApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!numericId) return
    let alive = true
    setLoading(true)
    fetchTVDetail(numericId)
      .then(data => {
        if (!alive) return
        setDetail(data)
        if (slugOrId && !/[a-z]/.test(slugOrId) && data.name) {
          navigate(`/tv/${slugify(data.id, data.name)}`, { replace: true })
        }
      })
      .catch(err => {
        if (alive) setError((err as Error).message || 'Error')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [numericId])

  return { detail, loading, error, numericId }
}