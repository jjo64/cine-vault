import { Request, Response, NextFunction, RequestHandler } from "express"

/**
 * manejadorAsincrono: Un envoltorio para funciones asíncronas.
 * Evita tener que escribir try/catch en cada ruta.
 * Si ocurre un error, lo envía automáticamente al manejador global con next(err).
 */
export const manejadorAsincrono =
  (
    fn: RequestHandler | ((req: any, res: any, next: any) => Promise<any>)
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

/**
 * manejadorErrores: Manejador de errores global.
 * Captura todos los errores de la aplicación y los devuelve en un formato JSON limpio.
 */
export const manejadorErrores = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("--- ERROR CAPTURADO ---")
  console.error(err)

  const status = err.status || 500
  const message = err.message || "Error interno del servidor"

  res.status(status).json({
    status,
    message,
    // Solo enviamos el stack trace en desarrollo si fuera necesario,
    // pero para este proyecto mantenemos simplicidad profesional.
  })
}
