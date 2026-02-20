import { Router, Request, Response } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Usamos manejadorAsincrono para simplificar el código y centralizar errores
router.get(
  "/upcoming",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await consultarTMDB("movie/upcoming", { region: "es" })
    res.status(200).json(data)
  })
)

router.get(
  "/top-rated",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await consultarTMDB("movie/top_rated", { region: "es" })
    res.status(200).json(data)
  })
)

router.get(
  "/popular",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await consultarTMDB("movie/popular", { region: "es" })
    res.status(200).json(data)
  })
)

// Ruta individual de película por ID o slug con manejo profesional de errores
router.get(
  "/:idOrSlug",
  manejadorAsincrono(
    async (req: Request<{ idOrSlug: string }>, res: Response) => {
      const idOSlug: string = req.params.idOrSlug

      let idPelicula: number = parseInt(idOSlug)

      // Si no es número, buscar por nombre (slug)
      if (isNaN(idPelicula)) {
        const nombreLimpio: string = idOSlug.replace(/-/g, " ")
        // Tipamos explícitamente la respuesta de TMDB
        const datosBusqueda = (await consultarTMDB("search/movie", {
          query: nombreLimpio,
        })) as { results: { id: number }[] }

        if (!datosBusqueda.results || datosBusqueda.results.length === 0) {
          return res
            .status(404)
            .json({ message: "Película no encontrada por slug" })
        }
        idPelicula = datosBusqueda.results[0].id
      }

      // Realizamos todas las peticiones necesarias en paralelo
      const [detalles, creditos, proveedores, titulos, imagenes] =
        (await Promise.all([
          consultarTMDB(`movie/${idPelicula}`),
          consultarTMDB(`movie/${idPelicula}/credits`),
          consultarTMDB(`movie/${idPelicula}/watch/providers`, {
            language: "",
          }),
          consultarTMDB(`movie/${idPelicula}/alternative_titles`, {
            language: "",
          }),
          consultarTMDB(`movie/${idPelicula}/images`, {
            include_image_language: "en,null",
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ])) as [any, any, any, any, any]

      res.status(200).json({
        ...detalles,
        credits: {
          cast: creditos.cast || [],
          crew: creditos.crew || [],
        },
        watch_providers: proveedores.results || {},
        alternative_titles: titulos.titles || [],
        images: {
          backdrops: imagenes.backdrops || [],
          logos: imagenes.logos || [],
          posters: imagenes.posters || [],
        },
      })
    }
  )
)

export default router
