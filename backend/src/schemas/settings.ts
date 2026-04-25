/**
 * @file settings.ts
 * @description Esquemas de validación Zod para la configuración de cuenta y perfil.
 * Define las reglas de integridad para la actualización de datos de usuario,
 * cambios de credenciales de seguridad y gestión de la imagen de perfil (avatar).
 */

import { z } from "zod"

/**
 * Esquema para la actualización parcial del perfil de usuario.
 * Valida el formato del nombre de usuario (solo alfanumérico y guion bajo),
 * la validez del correo electrónico y la extensión de la biografía.
 */
export const actualizarPerfilSchema = z
  .object({
    username: z
      .string()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
      .max(30, "El nombre de usuario no puede superar los 30 caracteres")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "El nombre de usuario solo puede contener letras, números y guiones bajos"
      )
      .optional(),
    email: z
      .string()
      .email("El formato del correo electrónico no es válido")
      .optional(),
    bio: z
      .string()
      .max(280, "La biografía no puede superar los 280 caracteres")
      .optional(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.email !== undefined ||
      data.bio !== undefined,
    {
      message:
        "Debe proporcionar al menos un campo (usuario, email o bio) para la actualización",
    }
  )

/**
 * Esquema para el cambio seguro de contraseña.
 * Garantiza que se conozca la contraseña actual y que la nueva cumpla con los
 * requisitos mínimos, además de forzar la coincidencia con la confirmación.
 */
export const actualizarAuthSchema = z
  .object({
    password_actual: z
      .string()
      .min(1, "La contraseña actual es requerida para validar la identidad"),
    password_nueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .refine((val) => val.trim().length > 0, {
        message:
          "La contraseña no puede consistir únicamente en espacios en blanco",
      }),
    password_confirmacion: z
      .string()
      .min(1, "La confirmación de la contraseña es obligatoria"),
  })
  .refine((data) => data.password_nueva === data.password_confirmacion, {
    message: "Las contraseñas nuevas no coinciden entre sí",
    path: ["password_confirmacion"],
  })

/**
 * Esquema para la actualización de la imagen de perfil.
 * Valida que se proporcione una cadena (habitualmente en base64 o una URL válida).
 */
export const actualizarAvatarSchema = z.object({
  avatar: z
    .string()
    .min(1, "No se ha proporcionado una imagen de avatar válida"),
})

// Tipado exportado deducido
export type ActualizarPerfilDTO = z.infer<typeof actualizarPerfilSchema>
export type ActualizarAuthDTO = z.infer<typeof actualizarAuthSchema>
export type ActualizarAvatarDTO = z.infer<typeof actualizarAvatarSchema>
