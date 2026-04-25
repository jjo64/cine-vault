/**
 * @file generateSlug.ts
 * @description Utilidad para la generación de slugs amigables (SEO-friendly).
 * Transforma títulos de películas en cadenas normalizadas para su uso en URLs,
 * asegurando la compatibilidad con buscadores y la legibilidad del usuario.
 */

/**
 * Genera un slug basado en el título y el año de lanzamiento.
 * Realiza limpieza de diacríticos, eliminación de caracteres especiales
 * y sustitución de espacios por guiones.
 *
 * @param title - Título original de la película.
 * @param year - Año de estreno para garantizar unicidad.
 * @returns Cadena formateada como "titulo-normalizado-1999".
 */
export function generateSlug(title: string, year: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFD") // Descompone tildes (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, "") // Elimina las marcas de acento
    .replace(/[^a-z0-9\s-]/g, "") // Elimina todo lo que no sea alfanumérico o espacio
    .trim()
    .replace(/\s+/g, "-") // Colapsa múltiples espacios en un guion
    .replace(/-+/g, "-") // Colapsa múltiples guiones seguidos

  return `${base}-${year}`
}
