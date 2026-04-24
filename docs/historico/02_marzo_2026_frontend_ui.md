# Fase 2: Marzo 2026 - Construcción del Frontend y Consumo de Datos (Semanas 3-4)

## Resumen de la Fase
Habiendo dejado atrás el setup de autenticación, el proyecto se enfoca en pintar la data en pantalla. Se avanza con rapidez en la construcción de los flujos de "Movie Detail", "TV Detail", Componentes Globales (Navbars, Heroes), y se empieza a implementar la interacción de base de datos relativa a la funcionalidad central: listas y perfiles.

## Implementaciones y Lógica
1. **Páginas Principales (Core Pages)**
   - Se crearon rutas para el inicio, búsquedas, perfil de usuario y notificaciones.
   - **Lógica:** Separar los componentes por características para evitar un código desorganizado.
2. **Experiencia de Detalles de Media**
   - **MovieDetail y TVDetail:** Páginas responsivas dedicadas a representar toda la información de TMDB de las películas y de la programación televisiva. 
   - **Hero Component:** Elementos interactivos destacados en la cabecera del título, incluyendo el "Cast & Crew".
3. **Acciones del Usuario (Watchlists y Reviews)**
   - Integración nativa a la base de datos (Backend) para listar películas (Watchlist) o añadir reseñas. 
   - **Lógica:** Acoplar la vista de React directamente con llamadas estructuradas al backend construido en la etapa anterior.

## Errores Conocidos y Soluciones
- En este mes se detectaron algunos problemas incipientes con componentes demasiado acoplados ("GOD Components"), los cuales comenzaron a ser delegados en "features" y "hooks" específicos como se evidencia en la refactorización final de *MovieDetail*.

## Próximos Pasos (Enlazado hacia Abril)
Con un Frontend plenamente capaz de representar datos visualmente y de gestionar interacciones de los usuarios, la base de código empieza a crecer significativamente. **El próximo paso** (y fase) está enfocado en refactorizar el backend para modularizar estos controladores masivos que se fueron creando de manera temporal, e introducir repositorios para features más complejas (Curaduría y Feed Social).
