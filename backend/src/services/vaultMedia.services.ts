/**
 * @file vaultMedia.services.ts
 * @description Servicio para la gestión de contenido multimedia del Vault (videos y clips de video).
 */

import { prisma } from "../lib/prisma.js";
import { getEntitlements } from "../config/entitlements.js";
import { ForbiddenError, NotFoundError } from "../errors/AppErrors.js";
import { ensureMovieRefId } from "./movieRef.services.js";
import { ReviewMediaType } from "@prisma/client";

/**
 * Agrega un video al Vault de un usuario, validando los límites según su plan de membresía.
 */
export async function addVideoService(
  userId: number,
  data: {
    title: string;
    movie_id?: number;
    media_type?: "movie" | "tv";
    video_url: string;
    duration_sec?: number;
    cover_url?: string;
    is_public?: boolean;
  }
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  });

  if (!user) throw new NotFoundError("Usuario no encontrado");

  const entitlements = getEntitlements(user.membership);

  // Contar videos actuales
  const videoCount = await prisma.vault_videos.count({
    where: { user_id: userId },
  });

  if (videoCount >= entitlements.max_videos) {
    throw new ForbiddenError(
      `Límite de videos alcanzado para tu plan (${entitlements.max_videos}). Actualiza tu plan para subir más.`
    );
  }

  let dbMovieId: number | null = null;
  if (data.movie_id) {
    dbMovieId = await ensureMovieRefId(data.movie_id, (data.media_type as ReviewMediaType) || "movie");
  }

  const video = await prisma.vault_videos.create({
    data: {
      user_id: userId,
      movie_id: dbMovieId,
      media_type: (data.media_type as ReviewMediaType) || "movie",
      title: data.title,
      video_url: data.video_url,
      duration_sec: data.duration_sec,
      cover_url: data.cover_url,
      is_public: data.is_public ?? true,
    },
  });

  return video;
}

/**
 * Elimina un video del Vault.
 */
export async function deleteVideoService(userId: number, videoId: number) {
  const video = await prisma.vault_videos.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new NotFoundError("Video no encontrado");
  if (video.user_id !== userId) throw new ForbiddenError("No tienes permiso para eliminar este video");

  await prisma.vault_videos.delete({
    where: { id: videoId },
  });
}

/**
 * Agrega un clip al Vault de un usuario.
 */
export async function addClipService(
  userId: number,
  data: {
    title: string;
    movie_id?: number;
    media_type?: "movie" | "tv";
    clip_url: string;
    cover_url?: string;
    is_public?: boolean;
  }
) {
  let dbMovieId: number | null = null;
  if (data.movie_id) {
    dbMovieId = await ensureMovieRefId(data.movie_id, (data.media_type as ReviewMediaType) || "movie");
  }

  const clip = await prisma.vault_clips.create({
    data: {
      user_id: userId,
      movie_id: dbMovieId,
      media_type: (data.media_type as ReviewMediaType) || "movie",
      title: data.title,
      clip_url: data.clip_url,
      cover_url: data.cover_url,
      is_public: data.is_public ?? true,
      pinned: false,
    },
  });

  return clip;
}

/**
 * Fija o desfija un clip, validando el límite máximo permitido por su plan.
 */
export async function pinClipService(userId: number, clipId: number, pinned: boolean) {
  const clip = await prisma.vault_clips.findUnique({
    where: { id: clipId },
  });

  if (!clip) throw new NotFoundError("Clip no encontrado");
  if (clip.user_id !== userId) throw new ForbiddenError("No tienes permiso sobre este clip");

  if (pinned) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { membership: true },
    });

    if (!user) throw new NotFoundError("Usuario no encontrado");

    const entitlements = getEntitlements(user.membership);

    // Contar clips fijados actuales
    const pinnedCount = await prisma.vault_clips.count({
      where: { user_id: userId, pinned: true },
    });

    if (pinnedCount >= entitlements.max_pinned_clips) {
      throw new ForbiddenError(
        `Límite de clips fijados alcanzado para tu plan (${entitlements.max_pinned_clips}).`
      );
    }
  }

  const updated = await prisma.vault_clips.update({
    where: { id: clipId },
    data: { pinned },
  });

  return updated;
}
