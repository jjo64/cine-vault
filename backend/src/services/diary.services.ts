import { diaryRepository } from "../repositories/DiaryRepository.js"
import { NotFoundError, ForbiddenError } from "../errors/AppErrors.js"
import type { CrearEntradaDiarioDTO } from "../schemas/diary.js"

/* ==========================================================================
   DIARY SERVICE
   --------------------------------------------------------------------------
   Lógica de negocio del diario de visionado.
   ========================================================================== */

export const obtenerDiarioService = async (userId: number) => {
  const diario = await diaryRepository.buildRichResponse(userId)
  if (!diario) throw new NotFoundError("No se encontraron entradas de diario")
  return diario
}

export const crearEntradaDiarioService = (
  userId: number,
  data: CrearEntradaDiarioDTO
) => diaryRepository.create(userId, data)

export const eliminarEntradaDiarioService = async (
  userId: number,
  entradaId: number
) => {
  const entrada = await diaryRepository.findById(entradaId)
  if (!entrada) throw new NotFoundError("Entrada no encontrada")
  if (entrada.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para eliminar esta entrada")
  await diaryRepository.delete(entradaId)
}
