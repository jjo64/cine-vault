/**
 * @file date.utils.ts
 * @description Utilidades centralizadas para el manejo de fechas en CineVault.
 * Asegura la consistencia entre zonas horarias y formatos de almacenamiento.
 */

/**
 * Normaliza una fecha a formato UTC sin componentes de tiempo (Medianoche).
 * Ideal para el Diario de Visionado y comparaciones de días naturales.
 *
 * @param date - Fecha original (Date object o string ISO).
 * @returns Date normalizada a las 00:00:00 UTC.
 */
export const standardizeToMidnight = (date?: Date | string): Date => {
  const d = date ? new Date(date) : new Date()

  // Si la fecha es inválida, retornar ahora
  if (isNaN(d.getTime())) return new Date(new Date().setUTCHours(0, 0, 0, 0))

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  )
}

/**
 * Retorna la fecha actual en formato ISO YYYY-MM-DD para almacenamiento en DB.
 */
export const getCurrentISODate = (): string => {
  return new Date().toISOString().split("T")[0]
}

/**
 * Compara si dos fechas caen en el mismo día natural UTC.
 */
export const isSameDayUTC = (date1: Date, date2: Date): boolean => {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  )
}
