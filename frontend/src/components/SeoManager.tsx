import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BASE_URL = 'https://cinevault.art'
const DEFAULT_IMAGE = `${BASE_URL}/whiplash2.jpg`

type SeoConfig = {
  title: string
  description: string
}

const RESERVED_PATHS = new Set(['movie', 'search-results', 'search', 'profile'])

function getSeoConfig(pathname: string): SeoConfig {
  if (pathname === '/') {
    return {
      title: 'Cinevault | Red social de cine',
      description:
        'Cinevault es una red social para descubrir peliculas, registrar lo que ves, escribir resenas y compartir recomendaciones con amigos.',
    }
  }

  if (pathname.startsWith('/movie/')) {
    return {
      title: 'Pelicula | Cinevault',
      description:
        'Consulta la ficha de la pelicula, puntua, guarda en tu watchlist y comparte tu opinion en Cinevault.',
    }
  }

  if (pathname === '/search-results' || pathname.startsWith('/search/')) {
    return {
      title: 'Buscar peliculas | Cinevault',
      description:
        'Explora peliculas, encuentra titulos y descubre nuevas recomendaciones segun tus gustos en Cinevault.',
    }
  }

  if (pathname === '/profile') {
    return {
      title: 'Tu perfil | Cinevault',
      description:
        'Gestiona tu perfil, tu actividad y tu historial de peliculas dentro de Cinevault.',
    }
  }

  const maybeUsername = pathname.slice(1)
  if (maybeUsername.length > 0 && !maybeUsername.includes('/') && !RESERVED_PATHS.has(maybeUsername.toLowerCase())) {
    return {
      title: `${maybeUsername} | Cinevault`,
      description: `Descubre la actividad, resenas y listas de ${maybeUsername} en Cinevault.`,
    }
  }

  return {
    title: 'Cinevault',
    description:
      'Cinevault es una red social para descubrir peliculas, registrar lo que ves, escribir resenas y compartir recomendaciones con amigos.',
  }
}

function setMetaByName(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url: string) {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

export default function SeoManager() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const { title, description } = getSeoConfig(pathname)
    const canonicalUrl = `${BASE_URL}${pathname}${search}`

    document.title = title

    setMetaByName('description', description)
    setMetaByName('twitter:title', title)
    setMetaByName('twitter:description', description)
    setMetaByName('twitter:image', DEFAULT_IMAGE)

    setMetaByProperty('og:title', title)
    setMetaByProperty('og:description', description)
    setMetaByProperty('og:url', canonicalUrl)
    setMetaByProperty('og:image', DEFAULT_IMAGE)

    setCanonical(canonicalUrl)
  }, [pathname, search])

  return null
}
