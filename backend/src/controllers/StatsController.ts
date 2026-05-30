/**
 * @file StatsController.ts
 * @description Controlador para gestionar las estadísticas avanzadas e inicio del flujo de exportación.
 */

import { Request, Response } from "express";
import * as statsService from "../services/stats.services.js";

/**
 * Obtiene las estadísticas avanzadas del usuario actual.
 */
export async function getAdvancedStats(req: Request, res: Response) {
  const filters = {
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    media_type: req.query.media_type as "movie" | "tv" | undefined,
  };

  const stats = await statsService.getAdvancedStatsService(req.user!.user_id, filters);
  res.json(stats);
}

/**
 * Genera un archivo exportable (CSV o JSON) del historial del usuario.
 */
export async function exportStats(req: Request, res: Response) {
  const format = (req.query.format as "csv" | "json") || "json";
  const filters = {
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  };

  const data = await statsService.getExportDataService(req.user!.user_id, filters);

  if (format === "csv") {
    if (data.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="cinevault-export.csv"');
      return res.send("date,media_type,title,release_date,genres,directors");
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Inyecta el BOM UTF-8 para Excel

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="cinevault-export.csv"');
    return res.send(csvContent);
  }

  // Por defecto retorna JSON
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="cinevault-export.json"');
  res.json(data);
}
