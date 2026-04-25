/**
 * @file seoHeaders.ts
 * @description Inyector de cabeceras HTTP optimizadas para SEO y Control de Caché.
 * Aplica directivas de indexación selectiva (X-Robots-Tag) para proteger áreas privadas
 * y configura políticas de caché agresivas o conservadoras según el tipo de recurso
 * solicitado (estáticos, API, o páginas de catálogo).
 */

import type { NextFunction, Request, Response } from "express"

/** Rutas públicas que deben ser indexadas y seguidas por buscadores */
const PUBLIC_HTML_PATHS = [
  /^\/$/,
  /^\/movie\//,
  /^\/film\//,
  /^\/discover\//,
  /^\/discover$/,
  /^\/feed$/,
  /^\/lists$/,
  /^\/news/,
]

/** Áreas privadas o exclusivas de datos que no deben aparecer en buscadores */
const PRIVATE_PATHS = [/^\/api\//, /^\/admin(\/|$)/, /^\/dashboard(\/|$)/]

/** Patrón para activos estáticos con nombre de archivo inmutable */
const ASSET_PATH =
  /\.(?:js|mjs|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|map)$/i

const isPublicHtmlPath = (pathname: string) =>
  PUBLIC_HTML_PATHS.some((rule) => rule.test(pathname))
const isPrivatePath = (pathname: string) =>
  PRIVATE_PATHS.some((rule) => rule.test(pathname))

/**
 * Middleware para la orquestación de cabeceras de visibilidad y rendimiento.
 *
 * @param req - Objeto de petición.
 * @param res - Objeto de respuesta donde se inyectan los headers.
 * @param next - Continuación de la cadena.
 */
export function seoHeaders(req: Request, res: Response, next: NextFunction) {
  const pathname = req.path || "/"

  /**
   * 1. Directivas de Indexación (SEO)
   * Se prohíbe el rastreo en la API y paneles administrativos mediante X-Robots-Tag.
   */
  if (isPrivatePath(pathname)) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow")
  } else {
    res.setHeader("X-Robots-Tag", "index, follow")
  }

  /**
   * 2. Estrategia de Caché de Navegador (Rendimiento)
   */

  // Caso A: Activos inmutables (JS, CSS, Imágenes) -> Caché de larga duración (1 año)
  if (ASSET_PATH.test(pathname)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    return next()
  }

  // Caso B: Punto final de la API -> Prohibición terminante de caché (datos frescos siempre)
  if (pathname.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store")
    return next()
  }

  // Caso C: Fichas de Películas -> Caché moderada con revalidación en segundo plano (SWR)
  if (/^\/(movie|film)\//.test(pathname)) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    )
    return next()
  }

  // Caso D: Páginas de navegación general -> Caché corta para permitir actualizaciones rápidas
  if (isPublicHtmlPath(pathname)) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600"
    )
  }

  next()
}
