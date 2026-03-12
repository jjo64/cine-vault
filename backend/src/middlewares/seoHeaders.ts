import type { NextFunction, Request, Response } from 'express'

const PUBLIC_HTML_PATHS = [/^\/$/, /^\/movie\//, /^\/film\//, /^\/discover\//, /^\/discover$/, /^\/feed$/, /^\/lists$/, /^\/news/]
const PRIVATE_PATHS = [/^\/api\//, /^\/admin(\/|$)/, /^\/dashboard(\/|$)/]
const ASSET_PATH = /\.(?:js|mjs|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|map)$/i

const isPublicHtmlPath = (pathname: string) => PUBLIC_HTML_PATHS.some((rule) => rule.test(pathname))
const isPrivatePath = (pathname: string) => PRIVATE_PATHS.some((rule) => rule.test(pathname))

export function seoHeaders(req: Request, res: Response, next: NextFunction) {
  const pathname = req.path || '/'

  if (isPrivatePath(pathname)) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  } else {
    res.setHeader('X-Robots-Tag', 'index, follow')
  }

  if (ASSET_PATH.test(pathname)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return next()
  }

  if (pathname.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store')
    return next()
  }

  if (/^\/(movie|film)\//.test(pathname)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return next()
  }

  if (isPublicHtmlPath(pathname)) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  }

  next()
}
