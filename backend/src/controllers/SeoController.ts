/**
 * @file SeoController.ts
 * @description Controlador para la gestión de visibilidad y SEO de CineVault.
 * Gestiona la entrega de sitemaps segmentados y robots.txt con soporte de caché.
 */

import { Request, Response, NextFunction } from "express"
import { getOSet } from "../config/redis.js"
import * as SeoService from "../services/seo.services.js"

const SITEMAP_TTL = 3600 // 1 hora
const ROBOTS_TTL = 21600 // 6 horas
const SITEMAP_MAX_URLS = 50000

/**
 * Entrega el sitemap XML principal o un índice de sitemaps si se supera el límite.
 */
export const getSitemap = async (_req: Request, res: Response) => {
  const xml = await getOSet(
    "seo:sitemap:xml",
    async () => {
      const data = await SeoService.getSitemapData()
      const allEntries = [
        ...data.staticEntries,
        ...data.movieEntries,
        ...data.profileEntries,
        ...data.newsEntries,
      ]

      if (allEntries.length <= SITEMAP_MAX_URLS) {
        return SeoService.buildUrlSetXml(allEntries)
      }

      const SITE_URL = (
        process.env.PUBLIC_SITE_URL || "https://cinevault.art"
      ).replace(/\/$/, "")
      return SeoService.buildSitemapIndexXml([
        `${SITE_URL}/sitemaps/pages.xml`,
        `${SITE_URL}/sitemaps/movies.xml`,
        `${SITE_URL}/sitemaps/profiles.xml`,
        `${SITE_URL}/sitemaps/news.xml`,
      ])
    },
    SITEMAP_TTL
  )

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.send(xml)
}

/**
 * Entrega sitemaps XML segmentados por categoría (pages, movies, profiles, news).
 */
export const getSitemapByCategory = async (req: Request, res: Response) => {
  const type = req.params.type as "pages" | "movies" | "profiles" | "news"
  const validTypes = ["pages", "movies", "profiles", "news"]

  if (!validTypes.includes(type)) {
    return res.status(404).json({ message: "Sitemap no encontrada" })
  }

  const xml = await getOSet(
    `seo:sitemap:${type}:xml`,
    async () => {
      const data = await SeoService.getSitemapData()
      const sourceMap = {
        pages: data.staticEntries,
        movies: data.movieEntries,
        profiles: data.profileEntries,
        news: data.newsEntries,
      }
      return SeoService.buildUrlSetXml(sourceMap[type])
    },
    SITEMAP_TTL
  )

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.send(xml)
}

/**
 * Entrega el archivo robots.txt.
 */
export const getRobots = async (_req: Request, res: Response) => {
  const text = await getOSet(
    "seo:robots:txt",
    async () => SeoService.getRobotsContent(),
    ROBOTS_TTL
  )
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.send(text)
}

/**
 * Redirige URLs antiguas o sin slug a las URLs normalizadas de CineVault.
 */
export const redirectMovieToSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tmdbId = Number(req.params.id)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return next()

  const slug = await getOSet(
    `tmdb:movie:slug:${tmdbId}`,
    () => SeoService.getMovieRedirectSlug(tmdbId),
    SITEMAP_TTL
  )

  if (!slug) return next()

  const target = req.path.startsWith("/film/")
    ? `/film/${slug}`
    : `/movie/${tmdbId}-${slug}`

  res.redirect(301, target)
}
