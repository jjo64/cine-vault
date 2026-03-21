import { z } from "zod"

export const directorAutopsyParamsSchema = z.object({
  id: z.coerce
    .number({ error: "id debe ser un numero" })
    .int("id debe ser un entero")
    .positive("id debe ser positivo"),
})

export type DirectorAutopsyParamsDTO = z.infer<typeof directorAutopsyParamsSchema>
