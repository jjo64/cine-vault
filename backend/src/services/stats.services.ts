/**
 * @file stats.services.ts
 * @description Servicio para la compilación de estadísticas avanzadas y exportación de historiales de visionado.
 */

import { prisma } from "../lib/prisma.js";
import { getCache, setCache } from "../lib/cache.js";
import { consultarTMDB } from "../helpers/fetchTMDB.js";
import { NotFoundError, ForbiddenError } from "../errors/AppErrors.js";

const CACHE_TTL_METADATA = 60 * 60 * 24 * 7; // 7 días para metadata estática de TMDB

interface MovieMetadata {
  genres: string[];
  directors: string[];
  decade: string;
  countries: string[];
  title: string;
  release_date: string | null;
}

/**
 * Obtiene los detalles extendidos de una película o serie de TV (desde TMDB o caché de Redis).
 */
async function fetchMediaMetadata(tmdbId: number, mediaType: "movie" | "tv"): Promise<MovieMetadata | null> {
  const cacheKey = `tmdb:metadata:${mediaType}:${tmdbId}`;
  const cached = await getCache<MovieMetadata>(cacheKey);
  if (cached) return cached;

  try {
    let genres: string[] = [];
    let directors: string[] = [];
    let countries: string[] = [];
    let decade = "Desconocida";
    let title = "Sin título";
    let release_date: string | null = null;

    if (mediaType === "movie") {
      const details: any = await consultarTMDB(`movie/${tmdbId}`);
      title = details.title || details.original_title || title;
      genres = (details.genres || []).map((g: any) => g.name);
      countries = (details.production_countries || []).map((c: any) => c.name || c.iso_3166_1);
      release_date = details.release_date || null;

      if (release_date) {
        const year = new Date(release_date).getFullYear();
        if (Number.isFinite(year)) {
          decade = `${Math.floor(year / 10) * 10}s`;
        }
      }

      // Obtener director de los créditos
      try {
        const credits: any = await consultarTMDB(`movie/${tmdbId}/credits`);
        directors = (credits.crew || [])
          .filter((member: any) => member.job === "Director")
          .map((d: any) => d.name);
      } catch (err) {
        console.error(`Error al obtener créditos de película ${tmdbId}:`, err);
      }
    } else {
      const details: any = await consultarTMDB(`tv/${tmdbId}`);
      title = details.name || details.original_name || title;
      genres = (details.genres || []).map((g: any) => g.name);
      countries = details.origin_country || [];
      release_date = details.first_air_date || null;

      if (release_date) {
        const year = new Date(release_date).getFullYear();
        if (Number.isFinite(year)) {
          decade = `${Math.floor(year / 10) * 10}s`;
        }
      }

      // Directores en series: Creadores (created_by)
      directors = (details.created_by || []).map((creator: any) => creator.name);
    }

    const metadata: MovieMetadata = {
      genres,
      directors,
      decade,
      countries,
      title,
      release_date,
    };

    await setCache(cacheKey, metadata as any, CACHE_TTL_METADATA);
    return metadata;
  } catch (error) {
    console.error(`Error obteniendo metadata de TMDB para ${mediaType} ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Calcula la racha máxima de días consecutivos viendo películas.
 */
function calcularRachaCinefila(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Convertir a strings únicos YYYY-MM-DD y ordenar de forma ascendente
  const dateStrings = Array.from(
    new Set(
      dates
        .map((d) => d.toISOString().split("T")[0])
        .filter(Boolean)
    )
  ).sort();

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dateStrings) {
    const currentDate = new Date(dateStr);
    if (!prevDate) {
      currentStreak = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    prevDate = currentDate;
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }

  return maxStreak;
}

/**
 * Compila estadísticas avanzadas basadas en el historial del Diario del usuario.
 */
export async function getAdvancedStatsService(
  userId: number,
  filters: { from?: string; to?: string; media_type?: "movie" | "tv" }
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  });

  if (!user) throw new NotFoundError("Usuario no encontrado");

  // Validar nivel de membresía
  if (user.membership === "free") {
    throw new ForbiddenError("Las estadísticas avanzadas están reservadas para miembros VIP y PRO");
  }

  // Filtrar diario
  const whereClause: any = { user_id: userId };
  if (filters.media_type) {
    whereClause.media_type = filters.media_type;
  }
  if (filters.from || filters.to) {
    whereClause.watched_date = {};
    if (filters.from) whereClause.watched_date.gte = new Date(filters.from);
    if (filters.to) whereClause.watched_date.lte = new Date(filters.to);
  }

  const diaryEntries = await prisma.diary_entries.findMany({
    where: whereClause,
    include: {
      movies_ref: {
        select: { tmdb_id: true, media_type: true },
      },
    },
    orderBy: { watched_date: "asc" },
  });

  // Agrupaciones y cálculos
  const genresMap: Record<string, number> = {};
  const directorsMap: Record<string, number> = {};
  const decadesMap: Record<string, number> = {};
  const countriesMap: Record<string, number> = {};
  const watchedDates: Date[] = [];

  // Procesar en lotes de tamaño 10 para evitar sobrecargar TMDB/Redis
  const batchSize = 10;
  for (let i = 0; i < diaryEntries.length; i += batchSize) {
    const batch = diaryEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        if (entry.watched_date) {
          watchedDates.push(entry.watched_date);
        }

        const metadata = await fetchMediaMetadata(
          entry.movies_ref.tmdb_id,
          entry.movies_ref.media_type as "movie" | "tv"
        );

        if (metadata) {
          metadata.genres.forEach((g) => (genresMap[g] = (genresMap[g] || 0) + 1));
          metadata.directors.forEach((d) => (directorsMap[d] = (directorsMap[d] || 0) + 1));
          decadesMap[metadata.decade] = (decadesMap[metadata.decade] || 0) + 1;
          metadata.countries.forEach((c) => (countriesMap[c] = (countriesMap[c] || 0) + 1));
        }
      })
    );
  }

  // Racha de días consecutivos
  const racha = calcularRachaCinefila(watchedDates);

  // Comparativa histórica contra promedio de la plataforma
  const totalEntriesGlobal = await prisma.diary_entries.count();
  const totalUsersGlobal = await prisma.users.count();
  const promedioPlataforma = totalUsersGlobal > 0 ? totalEntriesGlobal / totalUsersGlobal : 0;

  return {
    total_watched: diaryEntries.length,
    racha_cinefila_dias: racha,
    comparativa_promedio: {
      usuario: diaryEntries.length,
      plataforma: Math.round(promedioPlataforma * 10) / 10,
    },
    top_genres: Object.entries(genresMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    top_directors: Object.entries(directorsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    decades: Object.entries(decadesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    countries: Object.entries(countriesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

/**
 * Obtiene los datos del historial de visionado para exportación en formato plano.
 */
export async function getExportDataService(
  userId: number,
  filters: { from?: string; to?: string }
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  });

  if (!user) throw new NotFoundError("Usuario no encontrado");

  // Validar nivel de membresía
  if (user.membership === "free") {
    throw new ForbiddenError("La exportación de datos está reservada para miembros VIP y PRO");
  }

  const whereClause: any = { user_id: userId };
  if (filters.from || filters.to) {
    whereClause.watched_date = {};
    if (filters.from) whereClause.watched_date.gte = new Date(filters.from);
    if (filters.to) whereClause.watched_date.lte = new Date(filters.to);
  }

  const diaryEntries = await prisma.diary_entries.findMany({
    where: whereClause,
    include: {
      movies_ref: {
        select: { tmdb_id: true, media_type: true },
      },
    },
    orderBy: { watched_date: "asc" },
  });

  const exportData: Array<{
    date: string;
    media_type: string;
    title: string;
    release_date: string;
    genres: string;
    directors: string;
  }> = [];

  const batchSize = 10;
  for (let i = 0; i < diaryEntries.length; i += batchSize) {
    const batch = diaryEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        const metadata = await fetchMediaMetadata(
          entry.movies_ref.tmdb_id,
          entry.movies_ref.media_type as "movie" | "tv"
        );

        exportData.push({
          date: entry.watched_date ? entry.watched_date.toISOString().split("T")[0] : "N/A",
          media_type: entry.media_type,
          title: metadata?.title || "Desconocido",
          release_date: metadata?.release_date || "N/A",
          genres: metadata?.genres.join(", ") || "",
          directors: metadata?.directors.join(", ") || "",
        });
      })
    );
  }

  return exportData;
}
