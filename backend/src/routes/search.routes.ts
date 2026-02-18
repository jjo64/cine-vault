import { Router, Request, Response } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import pMap from "p-map" // Control de concurrencia para peticiones a TMDB

const router = Router()

// Ruta principal de búsqueda
// Usamos manejadorAsincrono para no tener que escribir try/catch aquí
router.get(
  "/",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const q = req.query.q as string
    const pagina = Number(req.query.page) || 1

    if (!q) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un término de búsqueda." })
    }

    const datos: any = await consultarTMDB("search/movie", {
      query: q,
      page: pagina,
    })
    console.log(
      `Búsqueda para "${q}": TMDB devolvió ${datos.results?.length || 0} resultados.`
    )

    // Filtrar resultados con poster y overview (calidad mínima)
    const resultadosCrudos = (datos.results || []).filter(
      (pelicula: any) => pelicula.poster_path && pelicula.overview
    )

    /**
     * CONTROL DE CONCURRENCIA:
     * Usamos pMap para procesar los detalles de las películas de 5 en 5.
     * Esto evita saturar la API de TMDB con demasiadas peticiones simultáneas.
     */
    const resultadosConInfo = await pMap(
      resultadosCrudos,
      async (pelicula: any) => {
        // Para cada película, traemos créditos y títulos alternativos en paralelo
        const [creditos, titulos]: any[] = await Promise.all([
          consultarTMDB(`movie/${pelicula.id}/credits`),
          consultarTMDB(`movie/${pelicula.id}/alternative_titles`, {
            language: "",
          }),
        ])

        const director = creditos.crew?.find(
          (persona: any) => persona.job === "Director"
        )?.name
        return {
          ...pelicula,
          director,
          alternative_titles: titulos.titles || [],
        }
      },
      { concurrency: 5 }
    ) // Máximo 5 películas procesándose a la vez

    res.status(200).json({
      results: resultadosConInfo,
      total_pages: datos.total_pages,
      total_results: datos.total_results,
      page: datos.page,
    })
  })
)

export default router
