/**
 * @file validation.middleware.ts
 * @description Fábrica de middlewares para la validación de integridad de datos mediante Esquemas Zod.
 * Proporciona una capa de pre-procesamiento que garantiza que cualquier petición que 
 * alcance los controladores cumpla con los tipos, formatos y reglas de negocio 
 * definidos en la capa de esquemas, inyectando además los valores predeterminados.
 */

import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodIssue } from "zod"
import { ValidationError } from "../errors/AppErrors.js"

/**
 * Genera un formateador amigable para los mensajes de error de Zod.
 */
const formatZodIssue = (e: ZodIssue) => `${e.path.join(".")}: ${e.message}`

/**
 * Middleware: Validación de Cuerpo (Body).
 * Procesa req.body contra el esquema proporcionado.
 * Reemplaza req.body con el resultado del parseo exitoso (sanitizado).
 * 
 * @param schema - Esquema Zod de validación.
 */
export const validarBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const mensaje = result.error.issues.map(formatZodIssue).join(" | ")
      throw new ValidationError(`Error en los datos enviados: ${mensaje}`)
    }
    // Sobrescribimos con los datos parseados (incluye defaults y cast de tipos)
    req.body = result.data as typeof req.body
    next()
  }

/**
 * Middleware: Validación de Consulta (Query).
 * Procesa req.query (parámetros de búsqueda, filtros, paginación).
 * Útil para convertir cadenas de URL en tipos numéricos o booleanos de forma segura.
 * 
 * @param schema - Esquema Zod de validación.
 */
export const validarQuery =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const mensaje = result.error.issues.map(formatZodIssue).join(" | ")
      throw new ValidationError(`Parámetros de búsqueda inválidos: ${mensaje}`)
    }
    // Reconfiguración de la propiedad query (solo lectura por defecto en algunas versiones)
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
    })
    next()
  }

/**
 * Middleware: Validación de Parámetros de Ruta (Params).
 * Procesa req.params (ej: /api/movies/:id).
 * Asegura que los identificadores de recursos cumplan con las restricciones técnicas.
 * 
 * @param schema - Esquema Zod de validación.
 */
export const validarParams =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      const mensaje = result.error.issues.map(formatZodIssue).join(" | ")
      throw new ValidationError(`Identificador de recurso inválido: ${mensaje}`)
    }
    req.params = result.data as typeof req.params
    next()
  }
