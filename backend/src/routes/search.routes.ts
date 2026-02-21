import { Router, Request, Response } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { getOSet } from "../config/redis.js"
import pMap from "p-map"

const router = Router()

// 2 horas — las búsquedas de TMDB no cambian entre requests
const TTL_BUSQUEDA = 60 * 60 * 2

router.get(
  "/",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const q = req.query.q as string
    const pagina = String(req.query.page || "1")

    if (!q) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un término de búsqueda." })
    }

    // La clave incluye query + página para que cada combinación tenga su propio caché
    const cacheKey = `tmdb:search:${q.toLowerCase().trim()}:p${pagina}`

    const resultado = await getOSet(
      cacheKey,
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const datos: any = await consultarTMDB("search/movie", {
          query: q,
          page: pagina,
        })

        console.log(
          `Búsqueda para "${q}": TMDB devolvió ${datos.results?.length || 0} resultados.`
        )

        const resultadosCrudos = (datos.results || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (pelicula: any) => pelicula.poster_path && pelicula.overview
        )

        const resultadosConInfo = await pMap(
          resultadosCrudos,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (pelicula: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const [creditos, titulos]: any[] = await Promise.all([
              consultarTMDB(`movie/${pelicula.id}/credits`),
              consultarTMDB(`movie/${pelicula.id}/alternative_titles`, {
                language: "",
              }),
            ])

            const director = creditos.crew?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (persona: any) => persona.job === "Director"
            )?.name

            return {
              ...pelicula,
              director,
              alternative_titles: titulos.titles || [],
            }
          },
          { concurrency: 5 }
        )

        return {
          results: resultadosConInfo,
          total_pages: datos.total_pages,
          total_results: datos.total_results,
          page: datos.page,
        }
      },
      TTL_BUSQUEDA
    )

    res.status(200).json(resultado)
  })
)

export default router
