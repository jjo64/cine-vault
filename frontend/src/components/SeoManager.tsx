import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { SeoHead } from './SeoHead'

const BASE_URL = 'https://cinevault.art'

type RouteSeoConfig = {
  title: string
  description: string
  canonical: string
}

// Rutas que no son usernames
const RESERVED_PATHS = new Set([
  'movie', 'tv', 'search-results', 'search', 'profile', 'settings',
  'person', 'feed', 'discover', 'lists', 'news', 'members', 'journal',
  'verify-email', 'auth', 'coming-soon', 'films', 'admin', 'dashboard',
])

function getSeoConfig(pathname: string, search: string): RouteSeoConfig {
  // HOME
  if (pathname === '/') {
    return {
      title: 'CineVault — El diario cinematográfico que te define',
      description: 'Guardá películas en tu vault, escribí reseñas, llevá tu diario de cine y recibí una recomendación irrechazable cada noche.',
      canonical: `${BASE_URL}/`,
    }
  }

  // FEED / DISCOVER
  if (pathname === '/feed' || pathname === '/discover') {
    return {
      title: 'Descubrir películas — CineVault',
      description: 'Explorá películas populares, últimos estrenos, las más valoradas y descubrí tu próxima obsesión cinematográfica.',
      canonical: `${BASE_URL}/discover`,
    }
  }

  // MOVIE — título genérico de fallback mientras carga
  // (MovieDetail.tsx sobreescribe esto con datos reales de TMDB)
  if (pathname.startsWith('/movie/')) {
    const slug = pathname.replace('/movie/', '')
    // Intentar extraer nombre legible del slug (ej: "238-el-padrino-1972" → "El Padrino 1972")
    const readable = slug
      .replace(/^\d+-/, '')       // quitar el ID numérico del inicio
      .replace(/-/g, ' ')          // guiones → espacios
      .replace(/\b\w/g, (c) => c.toUpperCase()) // capitalizar
      .trim()

    return {
      title: readable ? `${readable} — CineVault` : 'Película — CineVault',
      description: readable
        ? `Ficha, reseñas, reparto y plataformas de ${readable} en CineVault.`
        : 'Consulta ficha completa, reparto, plataformas y reseñas de la comunidad en CineVault.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  // TV SHOW — igual, TVDetail.tsx lo sobreescribe con datos reales
  if (pathname.startsWith('/tv/')) {
    return {
      title: 'Serie de televisión — CineVault',
      description: 'Consulta reparto, temporadas, plataformas y valoraciones de esta serie en CineVault.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  // PERSON — PersonPage.tsx debería sobreescribir con nombre real
  if (pathname.startsWith('/person/')) {
    return {
      title: 'Ficha de persona — CineVault',
      description: 'Descubrí la biografía y filmografía completa de este actor, director o miembro del equipo técnico.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  // SEARCH
  if (pathname === '/search' || pathname === '/search-results' || pathname.startsWith('/search/')) {
    const query = new URLSearchParams(search).get('q')
    return {
      title: query ? `Resultados para "${query}" — CineVault` : 'Buscar películas — CineVault',
      description: 'Buscá películas, series, directores y actores en la base de datos de CineVault.',
      canonical: `${BASE_URL}/search`,
    }
  }

  // LISTS
  if (pathname === '/lists') {
    return {
      title: 'Listas cinematográficas — CineVault',
      description: 'Creá, organizá y compartí listas de películas con tu propio criterio cinéfilo.',
      canonical: `${BASE_URL}/lists`,
    }
  }

  // NEWS
  if (pathname.startsWith('/news')) {
    return {
      title: 'Novedades de cine — CineVault',
      description: 'Leé las últimas novedades, estrenos y tendencias del universo cinematográfico.',
      canonical: `${BASE_URL}${pathname}`,
    }
  }

  // SETTINGS (noindex — se gestiona abajo)
  if (pathname === '/settings') {
    return {
      title: 'Configuración — CineVault',
      description: 'Configuración de tu cuenta en CineVault.',
      canonical: `${BASE_URL}/settings`,
    }
  }

  // VERIFY EMAIL (noindex)
  if (pathname === '/verify-email') {
    return {
      title: 'Verificar email — CineVault',
      description: 'Verificá tu cuenta de CineVault.',
      canonical: `${BASE_URL}/verify-email`,
    }
  }

  // PROFILE (/:username) — Profile.tsx lo sobreescribe con datos reales del usuario
  const maybeUsername = pathname.slice(1)
  if (
    maybeUsername.length > 0 &&
    !maybeUsername.includes('/') &&
    !RESERVED_PATHS.has(maybeUsername.toLowerCase())
  ) {
    return {
      title: `${maybeUsername} — Vault cinematográfico · CineVault`,
      description: `Explorá el vault, reseñas y diario de cine de ${maybeUsername} en CineVault.`,
      canonical: `${BASE_URL}/${encodeURIComponent(maybeUsername)}`,
    }
  }

  // FALLBACK
  return {
    title: 'CineVault — Tu diario de cine',
    description: 'La plataforma cinematográfica para cinéfilos. Guardá películas, escribí reseñas y descubrí cine.',
    canonical: `${BASE_URL}${pathname}`,
  }
}

// Rutas que deben ser noindex
const NO_INDEX_ROUTES = [
  '/settings',
  '/profile',
  '/verify-email',
  '/auth/callback',
  '/auth',
  '/admin',
  '/dashboard',
  '/feed',
]

export default function SeoManager() {
  const { pathname, search } = useLocation()

  const config = useMemo(() => getSeoConfig(pathname, search), [pathname, search])

  const shouldNoIndex = NO_INDEX_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (shouldNoIndex) {
    return (
      <SeoHead.NoIndex
        title={config.title}
        description={config.description}
        canonical={config.canonical}
      />
    )
  }

  return (
    <SeoHead.Page
      title={config.title}
      description={config.description}
      canonical={config.canonical}
    />
  )
}