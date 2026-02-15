import { Router, Request, Response } from "express"
import { fetchTMDB } from "../helpers/fetchTMDB.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

// Usamos asyncHandler para simplificar el código y centralizar errores
router.get('/upcoming', asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchTMDB('movie/upcoming', { region: 'es' });
  res.status(200).json(data);
}));

router.get('/top-rated', asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchTMDB('movie/top_rated', { region: 'es' });
  res.status(200).json(data);
}));

router.get('/popular', asyncHandler(async (req: Request, res: Response) => {
  const data = await fetchTMDB('movie/popular', { region: 'es' });
  res.status(200).json(data);
}));

// Ruta individual de película por ID o slug con manejo profesional de errores
router.get('/:idOrSlug', asyncHandler(async (req: Request<{ idOrSlug: string }>, res: Response) => {
  const idOrSlug: string = req.params.idOrSlug; // Aseguramos que es un string para evitar avisos de TS

  let movieId: number = parseInt(idOrSlug);

  // Si no es número, buscar por nombre (slug)
  if (isNaN(movieId)) {
    const cleanName: string = idOrSlug.replace(/-/g, ' ');
    // Tipamos explícitamente la respuesta de TMDB
    const searchData = await fetchTMDB('search/movie', { query: cleanName }) as { results: { id: number }[] };
    
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ message: 'Película no encontrada por slug' });
    }
    movieId = searchData.results[0].id;
  }

  // Realizamos todas las peticiones necesarias en paralelo
  const [details, credits, providers, titles, images] = await Promise.all([
    fetchTMDB(`movie/${movieId}`),
    fetchTMDB(`movie/${movieId}/credits`),
    fetchTMDB(`movie/${movieId}/watch/providers`, { language: '' }),
    fetchTMDB(`movie/${movieId}/alternative_titles`, { language: '' }),
    fetchTMDB(`movie/${movieId}/images`, { include_image_language: 'en,null' })
  ]) as [any, any, any, any, any];

  res.status(200).json({
    ...details,
    credits: {
      cast: credits.cast || [],
      crew: credits.crew || []
    },
    watch_providers: providers.results || {},
    alternative_titles: titles.titles || [],
    images: {
      backdrops: images.backdrops || [],
      logos: images.logos || [],
      posters: images.posters || []
    }
  });
}));

export default router;