import { z } from "zod"

export const arcoIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "id debe ser un numero" })
    .int("id debe ser un entero")
    .positive("id debe ser positivo"),
})

export const marcarProgresoArcoSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un numero" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

export type ArcoIdParamsDTO = z.infer<typeof arcoIdParamsSchema>
export type MarcarProgresoArcoDTO = z.infer<typeof marcarProgresoArcoSchema>
