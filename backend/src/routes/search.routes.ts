import { Router, Request, Response } from "express";
import { fetchTMDB } from "../helpers/fetchTMDB.js";
import { asyncHandler } from "../middlewares/error.middlewares.js"; // Importamos el envoltorio de errores
import pMap from "p-map"; // Importamos p-map para controlar la concurrencia

const router = Router();

// Ruta principal de búsqueda
// Usamos asyncHandler para no tener que escribir try/catch aquí
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const page = Number(req.query.page) || 1;

  if (!q) {
    return res.status(400).json({ error: 'Debe proporcionar un término de búsqueda.' });
  }

  const data: any = await fetchTMDB('search/movie', { query: q, page });
  console.log(`Búsqueda para "${q}": TMDB devolvió ${data.results?.length || 0} resultados.`);

  // Filtrar resultados con poster y overview (calidad mínima)
  const rawResults = (data.results || []).filter(
    (movie: any) => movie.poster_path && movie.overview
  );

  /**
   * CONTROL DE CONCURRENCIA:
   * Usamos pMap para procesar los detalles de las películas de 5 en 5.
   * Esto evita saturar la API de TMDB con demasiadas peticiones simultáneas.
   */
  const resultsWithExtraInfo = await pMap(rawResults, async (movie: any) => {
    // Para cada película, traemos créditos y títulos alternativos en paralelo
    const [credits, titles]: any[] = await Promise.all([
      fetchTMDB(`movie/${movie.id}/credits`),
      fetchTMDB(`movie/${movie.id}/alternative_titles`, { language: '' })
    ]);

    const director = credits.crew?.find((person: any) => person.job === 'Director')?.name;
    return { 
      ...movie, 
      director, 
      alternative_titles: titles.titles || [] 
    };
  }, { concurrency: 5 }); // Máximo 5 películas procesándose a la vez

  res.status(200).json({
    results: resultsWithExtraInfo,
    total_pages: data.total_pages,
    total_results: data.total_results,
    page: data.page
  });
}));

export default router;
