import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { getOSet } from "../config/redis.js"

const router = Router()

const SITEMAP_TTL_SECONDS = 60 * 60
const ROBOTS_TTL_SECONDS = 60 * 60 * 6

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

const buildUrlEntry = ({
  loc,
  lastmod,
  changefreq,
  priority,
}: {
  loc: string
  lastmod: string
  changefreq: "daily" | "weekly" | "monthly"
  priority: number
}) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`

const buildSitemapXml = async () => {
  const [movies, users, news] = await Promise.all([
    prisma.movies_ref.findMany({
      select: {
        tmdb_id: true,
      },
      orderBy: { id: "desc" },
    }),
    prisma.users.findMany({
      where: { is_verified: true },
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

  const staticEntries = [
    buildUrlEntry({
      loc: `${SITE_URL}/`,
      lastmod: toIsoDate(new Date()),
      changefreq: "daily",
      priority: 1,
    }),
    buildUrlEntry({
      loc: `${SITE_URL}/search`,
      lastmod: toIsoDate(new Date()),
      changefreq: "daily",
      priority: 0.8,
    }),
    buildUrlEntry({
      loc: `${SITE_URL}/news`,
      lastmod: toIsoDate(news[0]?.created_at),
      changefreq: "daily",
      priority: 0.7,
    }),
  ]

  const movieEntries = movies.map((movie) =>
    buildUrlEntry({
      loc: `${SITE_URL}/movie/${movie.tmdb_id}`,
      lastmod: toIsoDate(new Date()),
      changefreq: "weekly",
      priority: 0.7,
    })
  )

  const profileEntries = users.map((user) =>
    buildUrlEntry({
      loc: `${SITE_URL}/${encodeURIComponent(user.username)}`,
      lastmod: toIsoDate(user.updated_at),
      changefreq: "monthly",
      priority: 0.6,
    })
  )

  const newsEntries = news.map((item) =>
    buildUrlEntry({
      loc: `${SITE_URL}/news/${item.id}`,
      lastmod: toIsoDate(item.created_at),
      changefreq: "daily",
      priority: 0.8,
    })
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...movieEntries,
    ...profileEntries,
    ...newsEntries,
    '</urlset>',
  ].join("\n")
}

const buildRobotsTxt = () => {
  const disallowPaths = [
    "/settings",
    "/admin",
    "/dashboard",
    "/profile",
    "/verify-email",
    "/reset-password",
    "/api/auth/",
    "/api/rbac/",
    "/api/payments/",
    "/api/settings/",
    "/api/dashboard/",
    "/api/admin/",
  ]

  return [
    "User-agent: *",
    "Allow: /",
    ...disallowPaths.map((path) => `Disallow: ${path}`),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Sitemap: ${SITE_URL}/api/sitemap.xml`,
    "",
  ].join("\n")
}

router.get("/sitemap.xml", async (_req, res) => {
  const xml = await getOSet("seo:sitemap:xml", () => buildSitemapXml(), SITEMAP_TTL_SECONDS)
  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.status(200).send(xml)
})

router.get("/robots.txt", async (_req, res) => {
  const text = await getOSet("seo:robots:txt", async () => buildRobotsTxt(), ROBOTS_TTL_SECONDS)
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.status(200).send(text)
})

export default router
