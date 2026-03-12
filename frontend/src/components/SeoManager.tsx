import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { SeoHead } from './SeoHead'

const BASE_URL = 'https://cinevault.art'

type RouteSeoConfig = {
  title: string
  description: string
  canonical: string
}

const RESERVED_PATHS = new Set(['movie', 'search-results', 'search', 'profile', 'settings', 'person'])

function getSeoConfig(pathname: string, search: string): RouteSeoConfig {
  if (pathname === '/') {
    return {
      title: 'CineVault | Tu vault cinematografico',
      description: 'Descubre peliculas, guarda tu diario y comparte resenas en CineVault.',
      canonical: `${BASE_URL}/`,
    }
  }

  if (pathname === '/feed') {
    return {
      title: 'Feed de cinefilos | CineVault',
      description: 'Explora actividad reciente, listas y resenas de la comunidad cinefila.',
      canonical: `${BASE_URL}/feed`,
    }
  }

  if (pathname === '/discover') {
    return {
      title: 'Descubrir cine | CineVault',
      description: 'Encuentra nuevas peliculas y tendencias para ampliar tu vault cinefilo.',
      canonical: `${BASE_URL}/discover`,
    }
  }

  if (pathname.startsWith('/movie/')) {
    return {
      title: 'Ficha de pelicula | CineVault',
      description: 'Consulta ficha, reparto, plataformas y reseñas de cada pelicula en CineVault.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  if (pathname.startsWith('/tv/')) {
    return {
      title: 'Ficha de serie | CineVault',
      description: 'Consulta reparto, temporadas y valoraciones de series en CineVault.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  if (pathname.startsWith('/person/')) {
    return {
      title: 'Ficha de persona | CineVault',
      description: 'Descubre biografia y filmografia de actores, directores y equipo tecnico.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  if (pathname === '/search' || pathname === '/search-results' || pathname.startsWith('/search/')) {
    const query = new URLSearchParams(search).get('q')
    const baseTitle = query ? `Buscar "${query}" | CineVault` : 'Buscar peliculas | CineVault'
    return {
      title: baseTitle,
      description: 'Explora peliculas, personas y series con resultados actualizados en CineVault.',
      canonical: `${BASE_URL}/search`,
    }
  }

  if (pathname === '/lists') {
    return {
      title: 'Listas cinefilas | CineVault',
      description: 'Crea, organiza y comparte listas de peliculas con tu propio criterio.',
      canonical: `${BASE_URL}/lists`,
    }
  }

  if (pathname.startsWith('/news')) {
    return {
      title: 'Novedades de cine | CineVault',
      description: 'Lee novedades, estrenos y tendencias del universo cinematografico.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  const maybeUsername = pathname.slice(1)
  if (maybeUsername.length > 0 && !maybeUsername.includes('/') && !RESERVED_PATHS.has(maybeUsername.toLowerCase())) {
    return {
      title: `${maybeUsername} | Perfil en CineVault`,
      description: `Explora la actividad publica y listas de ${maybeUsername} en CineVault.`,
      canonical: `${BASE_URL}/${encodeURIComponent(maybeUsername)}`,
    }
  }

  return {
    title: 'CineVault',
    description: 'Red social de cine para descubrir, valorar y guardar peliculas memorables.',
    canonical: `${BASE_URL}${pathname}`,
  }
}

export default function SeoManager() {
  const { pathname, search } = useLocation()

  const config = useMemo(() => getSeoConfig(pathname, search), [pathname, search])
  const noIndexPaths = ['/settings', '/profile', '/verify-email', '/auth/callback', '/admin', '/dashboard']
  const shouldNoIndex = noIndexPaths.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (shouldNoIndex) {
    return <SeoHead.NoIndex title={config.title} description={config.description} canonical={config.canonical} />
  }

  return <SeoHead.Page title={config.title} description={config.description} canonical={config.canonical} />
}
