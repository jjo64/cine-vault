/**
 * Genera un slug amigable para una persona combinando su ID y su nombre.
 * Formato: {id}-{nombre-en-kebab-case}
 */
export function generatePersonSlug(id: number | string, name: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "") // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, "-"); // Espacios a guiones

  return `${id}-${cleanName}`;
}
