/**
 * @file seo.routes.ts
 * @description Rutas para la gestión de SEO y visibilidad en motores de búsqueda.
 * Responsable de generar dinámicamente el Sitemap XML y el archivo Robots.txt.
 * Incluye lógica de redirección para normalizar URLs de películas con slugs.
 * 
 * @note Este archivo contiene lógica de generación síncrona/asíncrona masiva
 * que será extraída a SeoController y SeoService en la Fase 5.
 */

import { Router } from "express"
import { getOSet } from "../config/redis.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { generateSlug } from "../helpers/generateSlug.js"
import { prisma } from "../lib/prisma.js"

const router = Router()

/**
 * Configuración de tiempos de vida y límites.
 */
const SITEMAP_TTL_SECONDS = 60 * 60
const ROBOTS_TTL_SECONDS = 60 * 60 * 6
const SITEMAP_MAX_URLS = 50_000

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://cinevault.art").replace(/\/$/, "")

/**
 * ---------------------------------------------------------------------------
 * HELPERS DE GENERACIÓN XML (Serán movidos a un Service en Fase 5)
 * ---------------------------------------------------------------------------
 */

const toIsoDate = (value: Date | string | null | undefined) => {
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

type SitemapEntry = { loc: string; lastmod: string }

const buildUrlEntry = ({ loc, lastmod }: SitemapEntry) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`

const buildUrlSetXml = (entries: SitemapEntry[]) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => buildUrlEntry(entry)),
    "</urlset>",
  ].join("\n")
}

const buildSitemapIndexXml = (locs: string[]) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`),
    "</sitemapindex>",
  ].join("\n")
}

const buildMoviePath = (tmdbId: number, slug: string | null) => {
  if (!slug) return `/movie/${tmdbId}`
  const normalizedSlug = slug.trim().replace(/^\/+/, "")
  if (!normalizedSlug) return `/movie/${tmdbId}`
  return normalizedSlug.startsWith(`${tmdbId}-`)
    ? `/movie/${normalizedSlug}`
    : `/movie/${tmdbId}-${normalizedSlug}`
}

/**
 * Recupera todas las entidades públicas de la plataforma.
 */
const getSitemapEntries = async () => {
  const [movies, users, news] = await Promise.all([
    prisma.movies_ref.findMany({
      where: { is_public: true },
      select: { tmdb_id: true, slug: true, updated_at: true },
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
    movieEntries: movies.map((movie) => ({
      loc: `${SITE_URL}${buildMoviePath(movie.tmdb_id, movie.slug)}`,
      lastmod: toIsoDate(movie.updated_at),
    })),
    profileEntries: users.map((user) => ({
      loc: `${SITE_URL}/${encodeURIComponent(user.username)}`,
      lastmod: toIsoDate(user.updated_at),
    })),
    newsEntries: news.map((item) => ({
      loc: `${SITE_URL}/news/${item.id}`,
      lastmod: toIsoDate(item.created_at),
    })),
  }
}

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GENERACIÓN DE SITEMAPS
 * ---------------------------------------------------------------------------
 */

/**
 * Sitemap principal e índice.
 */
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const xml = await getOSet(
      "seo:sitemap:xml",
      async () => {
        const { staticEntries, movieEntries, profileEntries, newsEntries } = await getSitemapEntries()
        const allEntries = [...staticEntries, ...movieEntries, ...profileEntries, ...newsEntries]

        if (allEntries.length <= SITEMAP_MAX_URLS) {
          return buildUrlSetXml(allEntries)
        }

        return buildSitemapIndexXml([
          `${SITE_URL}/sitemaps/pages.xml`,
          `${SITE_URL}/sitemaps/movies.xml`,
          `${SITE_URL}/sitemaps/profiles.xml`,
          `${SITE_URL}/sitemaps/news.xml`,
        ])
      },
      SITEMAP_TTL_SECONDS
    )
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (error) {
    console.error("Error generating sitemap.xml", error)
    res.status(500).json({ message: "Error interno en generación SEO" })
  }
})

/**
 * Sitemaps específicos por categoría.
 */
router.get("/sitemaps/:type.xml", async (req, res) => {
  try {
    const type = req.params.type as "pages" | "movies" | "profiles" | "news"
    if (!["pages", "movies", "profiles", "news"].includes(type)) {
      return res.status(404).json({ message: "Sitemap no encontrada" })
    }

    const xml = await getOSet(
      `seo:sitemap:${type}:xml`,
      async () => {
        const entries = await getSitemapEntries()
        const sourceMap = {
          pages: entries.staticEntries,
          movies: entries.movieEntries,
          profiles: entries.profileEntries,
          news: entries.newsEntries,
        }
        return buildUrlSetXml(sourceMap[type])
      },
      SITEMAP_TTL_SECONDS
    )
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.status(200).send(xml)
  } catch (error) {
    res.status(500).json({ message: "Error en sitemap hija" })
  }
})

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONFIGURACIÓN ROBOTS Y REDIRECCIONES
 * ---------------------------------------------------------------------------
 */

/**
 * robots.txt estandarizado.
 */
router.get("/robots.txt", async (_req, res) => {
  try {
    const text = await getOSet(
      "seo:robots:txt",
      async () => [
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
      ].join("\n"),
      ROBOTS_TTL_SECONDS
    )
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.status(200).send(text)
  } catch (error) {
    res.status(500).send("Error generating robots.txt")
  }
})

/**
 * Normalización de URLs de películas (Redirección 301).
 */
router.get(["/film/:id", "/movie/:id"], async (req, res, next) => {
  try {
    const movieId = Number(req.params.id)
    if (!Number.isInteger(movieId) || movieId <= 0) return next()

    const detail = (await getOSet(
      `tmdb:movie:slug:${movieId}`,
      () => consultarTMDB(`movie/${movieId}`),
      SITEMAP_TTL_SECONDS
    )) as { title?: string; release_date?: string }

    if (!detail?.title) return next()

    const year = detail.release_date ? new Date(detail.release_date).getFullYear() : new Date().getFullYear()
    const slug = generateSlug(detail.title, year)
    const target = req.path.startsWith("/film/") ? `/film/${slug}` : `/movie/${movieId}-${slug}`
    
    res.redirect(301, target)
  } catch (error) {
    next(error)
  }
})

export default router
