/**
 * @file seo.services.ts
 * @description Capa de servicios para SEO y visibilidad en CineVault.
 * Implementa la generación de Sitemaps XML, Robots.txt y lógica de slugs.
 */

import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { generateSlug } from "../helpers/generateSlug.js"

const SITE_URL = (
  process.env.PUBLIC_SITE_URL || "https://cinevault.art"
).replace(/\/$/, "")

/**
 * ---------------------------------------------------------------------------
 * HELPERS DE XML Y FORMATO
 * ---------------------------------------------------------------------------
 */

export const toIsoDate = (value: Date | string | null | undefined) => {
  if (!value) return new Date().toISOString().slice(0, 10)
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;")

export type SitemapEntry = { loc: string; lastmod: string }

export const buildUrlSetXml = (entries: SitemapEntry[]) => {
  const body = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`
    )
    .join("\n")
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</urlset>",
  ].join("\n")
}

export const buildSitemapIndexXml = (locs: string[]) => {
  const body = locs
    .map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`)
    .join("\n")
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    "</sitemapindex>",
  ].join("\n")
}

const buildMoviePath = (tmdbId: number, slug: string | null, mediaType: string | null) => {
  const type = mediaType === "tv" ? "tv" : "movie"
  if (!slug) return `/${type}/${tmdbId}`
  const normalizedSlug = slug.trim().replace(/^\/+/, "")
  if (!normalizedSlug) return `/${type}/${tmdbId}`
  return normalizedSlug.startsWith(`${tmdbId}-`)
    ? `/${type}/${normalizedSlug}`
    : `/${type}/${tmdbId}-${normalizedSlug}`
}

/**
 * ---------------------------------------------------------------------------
 * LÓGICA DE DATOS SEO
 * ---------------------------------------------------------------------------
 */

/**
 * Recupera todas las entidades configuradas para aparecer en los buscadores.
 */
export const getSitemapData = async () => {
  const [movies, users, news] = await Promise.all([
    prisma.movies_ref.findMany({
      where: { is_public: true },
      select: { tmdb_id: true, slug: true, media_type: true, updated_at: true },
      orderBy: { updated_at: "desc" },
    }),
    prisma.users.findMany({
      where: { is_verified: true, is_public: true },
      select: { username: true, updated_at: true },
      orderBy: { updated_at: "desc" },
    }),
    prisma.news.findMany({
      select: { id: true, created_at: true },
      orderBy: { created_at: "desc" },
    }),
  ])

  const nowIso = toIsoDate(new Date())

  return {
    staticEntries: [
      { loc: `${SITE_URL}/`, lastmod: nowIso },
      { loc: `${SITE_URL}/discover`, lastmod: nowIso },
      { loc: `${SITE_URL}/lists`, lastmod: nowIso },
      { loc: `${SITE_URL}/search`, lastmod: nowIso },
      { loc: `${SITE_URL}/news`, lastmod: toIsoDate(news[0]?.created_at) },
    ],
    movieEntries: movies.map((m) => ({
      loc: `${SITE_URL}${buildMoviePath(m.tmdb_id, m.slug, m.media_type)}`,
      lastmod: toIsoDate(m.updated_at),
    })),
    profileEntries: users.map((u) => ({
      loc: `${SITE_URL}/${encodeURIComponent(u.username)}`,
      lastmod: toIsoDate(u.updated_at),
    })),
    newsEntries: news.map((n) => ({
      loc: `${SITE_URL}/news/${n.id}`,
      lastmod: toIsoDate(n.created_at),
    })),
  }
}

/**
 * Genera el contenido textual de robots.txt.
 */
export const getRobotsContent = () => {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /settings",
    "Disallow: /admin",
    "Disallow: /profile",
    "Disallow: /reset-password",
    "Disallow: /api/",
    "",
    "Content-Signal: search=yes,ai-train=no",
    "",
    "User-agent: ClaudeBot",
    "Disallow: /",
    "",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join("\n")
}

/**
 * Resuelve el slug correcto para una película basándose en su título actual.
 */
export const getMovieRedirectSlug = async (tmdbId: number) => {
  const detail = (await consultarTMDB(`movie/${tmdbId}`)) as {
    title?: string
    release_date?: string
  }
  if (!detail?.title) return null

  const year = detail.release_date
    ? new Date(detail.release_date).getFullYear()
    : new Date().getFullYear()
  return generateSlug(detail.title, year)
}
