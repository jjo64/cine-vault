/**
 * @file errores.ts
 * @description Utilidades auxiliares para la interpretación y extracción de metadatos de errores.
 * Proporciona métodos para normalizar mensajes de excepción y capturar códigos
 * específicos del motor Prisma.
 */

import { Prisma } from "@prisma/client"

/**
 * Extrae un mensaje legible de un error desconocido.
 *
 * @param error - Excepción capturada en bloque catch.
 * @returns Cadena de texto con el mensaje del error o un fallback genérico.
 */
export function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Ocurrió un error inesperado en el servidor"
}

/**
 * Identifica si un error proviene de una restricción conocida de Prisma (ej: Unique constraint).
 *
 * @param error - Excepción capturada.
 * @returns El código de error de Prisma (ej: 'P2002') o null si no es un error de base de datos conocido.
 */
export function obtenerCodigoPrisma(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code
  }
  return null
}
