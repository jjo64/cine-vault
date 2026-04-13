import { z } from "zod"

const idPositivo = z.coerce.number().int().positive()

export const idParamSchema = z.object({ id: idPositivo })
export const userIdParamSchema = z.object({ userId: idPositivo })
export const movieIdParamSchema = z.object({ movieId: idPositivo })
export const idUserParamSchema = z.object({ id_user: idPositivo })
export const movieIdAltParamSchema = z.object({ movie_id: idPositivo })
export const tokenParamSchema = z.object({ token: z.string().min(1) })

export type IdParam = z.infer<typeof idParamSchema>
export type UserIdParam = z.infer<typeof userIdParamSchema>
export type MovieIdParam = z.infer<typeof movieIdParamSchema>
export type IdUserParam = z.infer<typeof idUserParamSchema>
export type MovieIdAltParam = z.infer<typeof movieIdAltParamSchema>
export type TokenParam = z.infer<typeof tokenParamSchema>
