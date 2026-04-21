/**
 * @file permisos.ts
 * @description Definición centralizada del sistema de Control de Acceso Basado en Roles (RBAC).
 * Este archivo orquestra la relación entre los roles de usuario (admin, editor, user)
 * y los niveles de membresía (free, vip, pro) con permisos granulares.
 * 
 * @note La arquitectura permite la coexistencia de roles administrativos con 
 * niveles de suscripción Premium sin conflictos de lógica.
 */

/**
 * Constantes de permisos disponibles en la plataforma.
 */
export const PERMISOS = {
  // Moderación de Reseñas
  BORRAR_REVIEWS_AJENAS: "borrar_reviews_ajenas",

  // Gestión de Reportes (Comunidad)
  GESTIONAR_REPORTES: "gestionar_reportes", // Resolver o rechazar reportes activos
  VER_REPORTES: "ver_reportes",           // Acceso de solo lectura a la cola de reportes

  // Contenido Editorial
  GESTIONAR_NOTICIAS: "gestionar_noticias", // Creación, edición y borrado de noticias oficiales

  // Administración de Usuarios
  CAMBIAR_ROL_USUARIOS: "cambiar_rol_usuarios",
  VER_ACTIVIDAD_USUARIOS: "ver_actividad_usuarios", // Acceso a logs de auditoría

  // Curaduría de Contenido
  GESTIONAR_ARCOS: "gestionar_arcos", // Gestión de Arcos Cinematográficos oficiales

  // Auditoría Financiera
  VER_PAGOS: "ver_pagos",

  // Funcionalidades Premium (Membresía)
  EXHIBIR_PELICULAS: "exhibir_peliculas", // Capacidad de destacar películas en el perfil
} as const

/** Tipo que representa uno de los valores de la constante PERMISOS */
export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS]

/**
 * Mapeo estático de permisos asignados a cada rol del sistema.
 */
const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
  admin: [
    PERMISOS.BORRAR_REVIEWS_AJENAS,
    PERMISOS.GESTIONAR_REPORTES,
    PERMISOS.VER_REPORTES,
    PERMISOS.GESTIONAR_NOTICIAS,
    PERMISOS.CAMBIAR_ROL_USUARIOS,
    PERMISOS.VER_ACTIVIDAD_USUARIOS,
    PERMISOS.GESTIONAR_ARCOS,
    PERMISOS.VER_PAGOS,
  ],
  editor: [
    PERMISOS.GESTIONAR_NOTICIAS,
    PERMISOS.VER_REPORTES,
    PERMISOS.GESTIONAR_ARCOS,
  ],
  user: [], // El rol básico no otorga permisos administrativos
}

/**
 * Mapeo de permisos otorgados por el nivel de membresía.
 * Separar la membresía del rol permite que un usuario básico tenga funciones Premium.
 */
const PERMISOS_POR_MEMBRESIA: Record<string, Permiso[]> = {
  free: [],
  vip: [
    PERMISOS.EXHIBIR_PELICULAS,
  ],
  pro: [
    PERMISOS.EXHIBIR_PELICULAS,
  ],
}

/**
 * Centralización de límites cuantitativos por nivel de membresía.
 * Evita la dispersión de valores "mágicos" en la lógica de negocio.
 */
export const LIMITES_MEMBRESIA: Record<string, Record<string, number>> = {
  free: {
    peliculas_exhibicion: 0,
  },
  vip: {
    peliculas_exhibicion: 2,
  },
  pro: {
    peliculas_exhibicion: 4,
  },
}

/**
 * Determina si un usuario posee un permiso específico basándose en su rol y membresía.
 * 
 * @param rol - El rol administrativo del usuario (admin, editor, user).
 * @param permiso - El permiso que se desea validar.
 * @param membresia - (Opcional) El nivel de suscripción del usuario.
 * @returns true si el usuario tiene autorización, false en caso contrario.
 */
export const tienePermiso = (
  rol: string,
  permiso: Permiso,
  membresia?: string
): boolean => {
  const permisosRol = PERMISOS_POR_ROL[rol] ?? []
  const permisosMembresia = membresia
    ? (PERMISOS_POR_MEMBRESIA[membresia] ?? [])
    : []

  // Se realiza la unión de ambos conjuntos de permisos para la validación final.
  return [...permisosRol, ...permisosMembresia].includes(permiso)
}
