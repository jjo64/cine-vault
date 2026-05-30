/**
 * @file VaultMediaController.ts
 * @description Controlador para gestionar videos y clips de video dentro de la Cripta (Vault).
 */

import { Request, Response } from "express";
import * as vaultMediaService from "../services/vaultMedia.services.js";

/**
 * Añade un video al Vault.
 */
export async function addVideo(req: Request, res: Response) {
  const result = await vaultMediaService.addVideoService(req.user!.user_id, req.body);
  res.status(201).json(result);
}

/**
 * Elimina un video del Vault.
 */
export async function deleteVideo(req: Request, res: Response) {
  const videoId = Number(req.params.id);
  await vaultMediaService.deleteVideoService(req.user!.user_id, videoId);
  res.json({ message: "Video eliminado correctamente del Vault" });
}

/**
 * Añade un clip de video.
 */
export async function addClip(req: Request, res: Response) {
  const result = await vaultMediaService.addClipService(req.user!.user_id, req.body);
  res.status(201).json(result);
}

/**
 * Fija o desfija un clip de video en el perfil.
 */
export async function pinClip(req: Request, res: Response) {
  const clipId = Number(req.params.id);
  const { pinned } = req.body;
  const result = await vaultMediaService.pinClipService(req.user!.user_id, clipId, pinned);
  res.json(result);
}
