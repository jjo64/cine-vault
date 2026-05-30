export const initials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const movieHref = (
  id: number | string,
  tmdbId: number | null | undefined,
  title: string | undefined,
  mediaType?: "movie" | "tv" | string | null
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  const safeTitle = title || type;
  const slug = safeTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
  const resolvedId = tmdbId || id;
  return `/${type}/${resolvedId}-${slug}`;
};

export const relativeLabel = (dateStr: string | undefined) => {
  if (!dateStr) return "N/D";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

export const normalizeRating = (r: number | null | undefined) => {
  if (r === null || r === undefined) return 0;
  if (r <= 5) return r;
  return Math.round(r / 2);
};

export const toPoster = (path: string | null | undefined) => {
  if (!path) return "/no-poster.svg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

export const toBackdrop = (path: string | null | undefined) => {
  if (!path) return "/no-backdrop.svg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/original${path}`;
};
