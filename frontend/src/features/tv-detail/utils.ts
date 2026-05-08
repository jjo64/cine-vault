import { TMDB_BASE, SIZES } from "./constants";

export function getTmdbImg(path?: string | null, size = SIZES.BACKDROP) {
  return path ? `${TMDB_BASE}${size}${path}` : "";
}

export function slugify(id: number, name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${id}-${slug}`;
}

export function formatYear(d?: string) {
  return d ? d.slice(0, 4) : "—";
}
