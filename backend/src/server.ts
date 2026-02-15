import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import moviesRoutes from './routes/movies.routes.js'
import diaryRoutes from './routes/diary.routes.js'
import watchlistRoutes from './routes/watchlist.routes.js'
import reviewsRoutes from './routes/reviews.routes.js'
import searchRoutes from './routes/search.routes.js'
import { errorHandler } from './middlewares/error.middlewares.js';
import helmet from 'helmet';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    console.log('Request from origin:', origin);
    // Permitir si el origen coincide con FRONTEND_URL o si es undefined (peticiones locales/herramientas)
    if (!origin || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin, 'Expected:', process.env.FRONTEND_URL);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
})); // Activamos el cors
app.use(express.json({ limit: '10mb' })); // Parsear el body
app.disable('x-powered-by') // Desactivamos el x-powered-by para mayor seguridad y no pasar estadisticas

app.use("/api/auth", authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/movies', moviesRoutes) // Cambiado a plural para consistencia
app.use('/api/search', searchRoutes); // Unificado bajo /api/
app.use('/api/diary', diaryRoutes) // OK
app.use('/api/watchlist', watchlistRoutes) // OK
app.use('/api/reviews', reviewsRoutes)

// MANEJO DE ERRORES: Este middleware debe ir siempre después de todas las rutas
app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!',
        peliculas_destacadas: 'Peliculas destacadas'
    });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});