/**
 * @file user.ts
 * @description Esquemas de validación Zod para la gestión de Usuarios.
 * Define las reglas de integridad para el registro de nuevas cuentas,
 * la búsqueda de perfiles en la plataforma y la validación de parámetros de identidad.
 */

import { z } from "zod"

/**
 * Esquema interno para el registro de nuevos usuarios.
 * Aplica restricciones de longitud y formato sobre el nombre de usuario,
 * el correo electrónico y la fortaleza de la contraseña.
 */
const esquemaUsuario = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z
    .string()
    .email("El formato del correo electrónico no es válido")
    .trim(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .refine(
      (val) => val.trim().length > 0,
      "La contraseña no puede consistir únicamente en espacios en blanco"
    ),
})

/**
 * Función de utilidad para la validación síncrona de datos de usuario.
 * Proporciona una interfaz simplificada para el parseo seguro y la recopilación de errores.
 *
 * @param data - Payload con los datos del usuario a validar.
 * @returns Objeto con el estado de la validación y los datos o mensajes de error resultantes.
 */
function validarUsuario(data: unknown) {
  const resultado = esquemaUsuario.safeParse(data)

  if (!resultado.success) {
    return {
      success: false,
      errorMessages: resultado.error.issues.map((err) => err.message),
    }
  }

  return { success: true, data: resultado.data }
}

/** Esquema para la consulta de búsqueda de usuarios con soporte de paginación y límites */
export const buscarUsuariosQuerySchema = z.object({
  /** Término de búsqueda (username o email) */
  q: z.string().default(""),
  /** Límite de resultados por página */
  limit: z.coerce.number().int().positive().max(30).default(12),
})

/** Esquema para validar el acceso a un perfil público mediante su nombre de usuario */
export const usernameParamSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
})

// Tipado exportado deducido de los esquemas
export type BuscarUsuariosQuery = z.infer<typeof buscarUsuariosQuerySchema>
export type UsernameParam = z.infer<typeof usernameParamSchema>

export { validarUsuario }
