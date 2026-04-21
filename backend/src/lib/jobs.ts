/**
 * @file jobs.ts
 * @description Tareas de mantenimiento programadas (Background Jobs) para CineVault.
 * Centraliza la lógica de limpieza automática y optimización de la base de datos
 * que se dispara periódicamente mediante el CRON del sistema.
 */

import { prisma } from "../lib/prisma.js"

/**
 * Elimina de forma persistente a los usuarios que no han completado el proceso
 * de verificación de correo electrónico tras un periodo de gracia de 24 horas.
 * 
 * @note Esta tarea previene la acumulación de registros "fantasma" en la tabla `users`.
 */
export const limpiarUsuariosNoVerificados = async () => {
  try {
    const umbralTiempo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const eliminados = await prisma.users.deleteMany({
      where: {
        is_verified: false,
        created_at: { lt: umbralTiempo },
      },
    })

    if (eliminados.count > 0) {
      console.log(
        `Auditoría Mantenimiento: ${eliminados.count} registros de usuarios no verificados purgados.`
      )
    }
  } catch (error) {
    // Si la limpieza falla, omitimos el error para no interrumpir el hilo principal; 
    // se reintentará en el siguiente ciclo programado.
    console.error("Error crítico en job de limpieza de usuarios:", error)
  }
}
