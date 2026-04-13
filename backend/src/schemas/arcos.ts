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

const arcoLevelSchema = z.enum(["INICIACION", "INTERMEDIO", "AVANZADO"])

const arcoMovieInputSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un numero" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  note: z
    .string({ error: "note debe ser un texto" })
    .trim()
    .max(600, "note no puede superar 600 caracteres")
    .optional(),
  is_optional: z.boolean().optional().default(false),
})

export const crearArcoSchema = z.object({
  title: z
    .string({ error: "title debe ser un texto" })
    .trim()
    .min(3, "title debe tener al menos 3 caracteres")
    .max(180, "title no puede superar 180 caracteres"),
  description: z
    .string({ error: "description debe ser un texto" })
    .trim()
    .min(10, "description debe tener al menos 10 caracteres")
    .max(4000, "description no puede superar 4000 caracteres"),
  poster_url: z
    .string({ error: "poster_url debe ser un texto" })
    .trim()
    .min(3, "poster_url es requerido"),
  level: arcoLevelSchema.default("INTERMEDIO"),
  movies: z
    .array(arcoMovieInputSchema, { error: "movies debe ser un arreglo" })
    .min(2, "Un arco debe tener al menos 2 peliculas")
    .max(80, "Un arco no puede superar 80 peliculas"),
})

export const actualizarArcoSchema = z
  .object({
    title: z
      .string({ error: "title debe ser un texto" })
      .trim()
      .min(3, "title debe tener al menos 3 caracteres")
      .max(180, "title no puede superar 180 caracteres")
      .optional(),
    description: z
      .string({ error: "description debe ser un texto" })
      .trim()
      .min(10, "description debe tener al menos 10 caracteres")
      .max(4000, "description no puede superar 4000 caracteres")
      .optional(),
    poster_url: z
      .string({ error: "poster_url debe ser un texto" })
      .trim()
      .min(3, "poster_url no puede estar vacio")
      .optional(),
    level: arcoLevelSchema.optional(),
    movies: z
      .array(arcoMovieInputSchema, { error: "movies debe ser un arreglo" })
      .min(2, "Un arco debe tener al menos 2 peliculas")
      .max(80, "Un arco no puede superar 80 peliculas")
      .optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  })

export const moderarArcoSchema = z.object({
  status: z.enum(["approved", "rejected", "archived"]),
  review_note: z
    .string({ error: "review_note debe ser un texto" })
    .trim()
    .max(500, "review_note no puede superar 500 caracteres")
    .optional(),
  cinevault_badge: z
    .string({ error: "cinevault_badge debe ser un texto" })
    .trim()
    .max(120, "cinevault_badge no puede superar 120 caracteres")
    .optional(),
})

export const listArcosModeracionQuerySchema = z.object({
  status: z
    .enum(["pending_review", "approved", "rejected", "archived"])
    .default("pending_review")
    .optional(),
})

export type ArcoIdParamsDTO = z.infer<typeof arcoIdParamsSchema>
export type MarcarProgresoArcoDTO = z.infer<typeof marcarProgresoArcoSchema>
export type CrearArcoDTO = z.infer<typeof crearArcoSchema>
export type ActualizarArcoDTO = z.infer<typeof actualizarArcoSchema>
export type ModerarArcoDTO = z.infer<typeof moderarArcoSchema>
export type ListArcosModeracionQueryDTO = z.infer<
  typeof listArcosModeracionQuerySchema
>
