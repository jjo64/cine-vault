import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { getOSet } from "../config/redis.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { generateSlug } from "../helpers/generateSlug.js"

const router = Router()

const SITEMAP_TTL_SECONDS = 60 * 60
const ROBOTS_TTL_SECONDS = 60 * 60 * 6
const SITEMAP_MAX_URLS = 50_000

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://cinevault.art").replace(/\/$/, "")

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

type SitemapEntry = {
  loc: string
  lastmod: string
}

const buildUrlEntry = ({ loc, lastmod }: SitemapEntry) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`

const buildUrlSetXml = (entries: SitemapEntry[]) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => buildUrlEntry(entry)),
    '</urlset>',
  ].join("\n")
}

const buildSitemapIndexXml = (locs: string[]) => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map((loc) => `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`),
    '</sitemapindex>',
  ].join("\n")
}

const getSitemapEntries = async () => {
  const [movies, users, news] = await Promise.all([
    prisma.movies_ref.findMany({
      where: { is_public: true },
      select: {
        tmdb_id: true,
        slug: true,
        updated_at: true,
      },
      orderBy: { updated_at: "desc" },
    }),
    prisma.users.findMany({
      where: { is_verified: true, is_public: true },
      select: {
        username: true,
        updated_at: true,
      },
      orderBy: { updated_at: "desc" },
    }),
    prisma.news.findMany({
      select: {
        id: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    }),
  ])

  const nowIso = toIsoDate(new Date())

  const staticEntries: SitemapEntry[] = [
    {
      loc: `${SITE_URL}/`,
      lastmod: nowIso,
    },
    {
      loc: `${SITE_URL}/discover`,
      lastmod: nowIso,
    },
    {
      loc: `${SITE_URL}/feed`,
      lastmod: nowIso,
    },
    {
      loc: `${SITE_URL}/lists`,
      lastmod: nowIso,
    },
    {
      loc: `${SITE_URL}/search`,
      lastmod: nowIso,
    },
    {
      loc: `${SITE_URL}/news`,
      lastmod: toIsoDate(news[0]?.created_at),
    },
  ]

  const movieEntries: SitemapEntry[] = movies.map((movie) => ({
      loc: movie.slug ? `${SITE_URL}/movie/${movie.slug}` : `${SITE_URL}/movie/${movie.tmdb_id}`,
      lastmod: toIsoDate(movie.updated_at),
    }))

  const profileEntries: SitemapEntry[] = users.map((user) => ({
      loc: `${SITE_URL}/${encodeURIComponent(user.username)}`,
      lastmod: toIsoDate(user.updated_at),
    }))

  const newsEntries: SitemapEntry[] = news.map((item) => ({
      loc: `${SITE_URL}/news/${item.id}`,
      lastmod: toIsoDate(item.created_at),
    }))

  return {
    staticEntries,
    movieEntries,
    profileEntries,
    newsEntries,
  }
}

const chunkEntries = (entries: SitemapEntry[], size: number) => {
  const chunks: SitemapEntry[][] = []
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(entries.slice(i, i + size))
  }
  return chunks
}

const buildRootSitemapXml = async () => {
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
}

const buildChildSitemapXml = async (
  type: "pages" | "movies" | "profiles" | "news"
) => {
  const { staticEntries, movieEntries, profileEntries, newsEntries } = await getSitemapEntries()

  const sourceMap = {
    pages: staticEntries,
    movies: movieEntries,
    profiles: profileEntries,
    news: newsEntries,
  }

  const source = sourceMap[type]
  if (source.length <= SITEMAP_MAX_URLS) {
    return buildUrlSetXml(source)
  }

  const chunks = chunkEntries(source, SITEMAP_MAX_URLS)
  const childLocs = chunks.map((_, index) => `${SITE_URL}/sitemaps/${type}-${index + 1}.xml`)

  return buildSitemapIndexXml(childLocs)
}

const buildChildChunkSitemapXml = async (
  type: "movies" | "profiles" | "news" | "pages",
  chunkIndex: number
) => {
  const { staticEntries, movieEntries, profileEntries, newsEntries } = await getSitemapEntries()
  const sourceMap = {
    pages: staticEntries,
    movies: movieEntries,
    profiles: profileEntries,
    news: newsEntries,
  }

  const chunks = chunkEntries(sourceMap[type], SITEMAP_MAX_URLS)
  const chunk = chunks[chunkIndex]
  if (!chunk) {
    return null
  }

  return buildUrlSetXml(chunk)
}

const buildRobotsTxt = () => {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /settings",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Disallow: /profile",
    "Disallow: /verify-email",
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
    "User-agent: Google-Extended",
    "Disallow: /",
    "",
    "User-agent: Amazonbot",
    "Disallow: /",
    "",
    "User-agent: Applebot-Extended",
    "Disallow: /",
    "",
    "User-agent: Bytespider",
    "Disallow: /",
    "",
    "User-agent: CCBot",
    "Disallow: /",
    "",
    "User-agent: meta-externalagent",
    "Disallow: /",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n")
}

router.get("/sitemap.xml", async (_req, res) => {
  try {
    const xml = await getOSet("seo:sitemap:xml", () => buildRootSitemapXml(), SITEMAP_TTL_SECONDS)
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (error) {
    console.error("Error generating sitemap.xml", error)
    res.status(500).json({ message: "No se pudo generar el sitemap" })
  }
})

router.get("/sitemaps/:type.xml", async (req, res) => {
  try {
    const type = req.params.type as "pages" | "movies" | "profiles" | "news"
    if (!["pages", "movies", "profiles", "news"].includes(type)) {
      res.status(404).json({ message: "Sitemap no encontrada" })
      return
    }

    const xml = await getOSet(`seo:sitemap:${type}:xml`, () => buildChildSitemapXml(type), SITEMAP_TTL_SECONDS)
    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (error) {
    console.error("Error generating child sitemap", error)
    res.status(500).json({ message: "No se pudo generar el sitemap hijo" })
  }
})

router.get("/sitemaps/:type-:chunk.xml", async (req, res) => {
  try {
    const type = req.params.type as "pages" | "movies" | "profiles" | "news"
    const chunk = Number(req.params.chunk)
    if (!["pages", "movies", "profiles", "news"].includes(type) || !Number.isInteger(chunk) || chunk < 1) {
      res.status(404).json({ message: "Sitemap no encontrada" })
      return
    }

    const cacheKey = `seo:sitemap:${type}:${chunk}:xml`
    const xml = await getOSet(cacheKey, () => buildChildChunkSitemapXml(type, chunk - 1), SITEMAP_TTL_SECONDS)

    if (!xml) {
      res.status(404).json({ message: "Sitemap no encontrada" })
      return
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(xml)
  } catch (error) {
    console.error("Error generating paged sitemap", error)
    res.status(500).json({ message: "No se pudo generar el sitemap paginado" })
  }
})

router.get("/robots.txt", async (_req, res) => {
  try {
    const text = await getOSet("seo:robots:txt", async () => buildRobotsTxt(), ROBOTS_TTL_SECONDS)
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).send(text)
  } catch (error) {
    console.error("Error generating robots.txt", error)
    res.status(500).json({ message: "No se pudo generar robots.txt" })
  }
})

router.get(["/film/:id", "/movie/:id"], async (req, res, next) => {
  try {
    const movieId = Number(req.params.id)
    if (!Number.isInteger(movieId) || movieId <= 0) {
      next()
      return
    }

    const detail = (await getOSet(
      `tmdb:movie:slug:${movieId}`,
      async () => consultarTMDB(`movie/${movieId}`),
      SITEMAP_TTL_SECONDS
    )) as { title?: string; release_date?: string }

    if (!detail?.title) {
      next()
      return
    }

    const year = detail.release_date ? new Date(detail.release_date).getFullYear() : new Date().getFullYear()
    const slug = generateSlug(detail.title, year)
    const target = req.path.startsWith("/film/") ? `/film/${slug}` : `/movie/${movieId}-${slug}`
    res.redirect(301, target)
  } catch (error) {
    next(error)
  }
})

export default router
