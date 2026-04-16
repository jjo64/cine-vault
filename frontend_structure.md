# Estructura Completa del Proyecto (src/)

A continuación se detalla cada carpeta y archivo dentro de `frontend/src`, junto con una breve descripción de su función.

## 📁 src/
Directorio raíz del código fuente.
- **App.tsx**: Componente principal que define las rutas (React Router) y la estructura global de la aplicación.
- **App.css**: Estilos asociados al componente principal App.
- **main.tsx**: Punto de entrada de la aplicación; monta React en el DOM.
- **index.css**: Estilos globales, reseteos CSS y variables básicas de diseño.
- **vite-env.d.ts**: Declaraciones de tipos para variables de entorno de Vite.

### 📁 src/assets/
- **react.svg**: Logo de React utilizado en la aplicación.

### 📁 src/components/
Componentes reutilizables generales.
- **AuthModal.tsx / .css**: Modal y estilos para el inicio de sesión y registro.
- **BottomNav.tsx / .css**: Barra de navegación inferior para dispositivos móviles.
- **Footer.tsx**: Pie de página global.
- **HomeLogged.tsx / .css**: Componente de vista principal para usuarios autenticados.
- **InfiniteSlider.tsx**: Carrusel de desplazamiento infinito para películas.
- **Landing.tsx / .css**: Página de aterrizaje para usuarios no autenticados.
- **MovieActionsPanel.tsx / .css**: Panel de acciones rápidas para películas (guardar, reseñar).
- **MovieSection.tsx**: Sección de grid para mostrar grupos de películas.
- **Navbar.tsx / .module.css**: Barra de navegación superior principal.
- **UserNavbar.tsx / .css**: Barra de navegación específica con perfil de usuario y notificaciones.
- **Notificaciones.tsx**: Sistema de visualización de notificaciones.
- **SeoManager.tsx**: Componente para inyectar meta-tags dinámicos.
- **📁 atoms/ molecules/ organisms/**: Carpetas preparadas para metodología Atomic Design (vacías por ahora).
- **📁 SeoHead/**: 
  - **index.tsx**: Componente base para la gestión de cabeceras SEO.
- **📁 profile-v2/**: Reinvención modular del perfil de usuario.
  - **layout.tsx**: Estructura de rejilla del perfil.
  - **panels.tsx**: Lógica de los diferentes paneles de información.
  - **primitives.tsx**: Elementos visuales básicos del perfil.
  - **theme.ts**: Definición de colores y estilos específicos.
  - **assets.ts / models.ts**: Datos estáticos y tipos del perfil.
  - **Profile.css**: Estilos generales del perfil v2.

### 📁 src/context/
- **SocketContext.tsx**: Maneja la conexión global por WebSockets para actualizaciones en tiempo real.

### 📁 src/features/
Lógica y componentes organizados por funcionalidad (Domain Driven).
- **📁 feed/** (Módulo Social):
  - **index.ts**: Barril de exportaciones del feed.
  - **smoke.test.ts**: Prueba básica de renderizado.
  - **📁 components/** (FeedCard, FeedNavbar, FeedOverlay): Componentes visuales del muro social.
  - **📁 hooks/** (useFeedData, useFeedActions): Lógica de obtención de posts y likes/comentarios.
  - **📁 types/** (index.ts): Definiciones de interfaces para los datos del feed.
- **📁 movie-detail/** (Módulo de Detalle):
  - **📁 components/**: (CastCrew, DirectorQuote, Reviews, StarRating, StarRating, etc.): Micro-componentes de la ficha de película.
  - **📁 hooks/** (useMovieDetail.ts): Lógica para cargar toda la información de una película.
  - **📁 utils/** (mapping.ts): Transformación de datos de la API a formato de la UI.
  - **constants.ts / types.ts**: Valores fijos e interfaces del módulo.

### 📁 src/hooks/
- **useMediaQuery.ts**: Hook para detectar cambios en el tamaño de pantalla (responsive).
- **useProfilePageData.ts**: Hook complejo para gestionar la carga de datos del perfil de usuario y sus listas.

### 📁 src/lib/
- **navigation.ts**: Utilidades para navegación programática.
- **notify.ts**: Configuración y disparadores de notificaciones (Toast/Alerts).

### 📁 src/pages/
Vistas completas que corresponden a rutas.
- **Feed.tsx**: Página principal de la red social.
- **Home.tsx**: Vista inicial de la plataforma.
- **MovieDetail.tsx / .css**: Página detallada de una película.
- **PersonPage.tsx / .css**: Ficha técnica de un actor o director.
- **Profile.tsx**: Página de perfil de usuario.
- **SearchResults.tsx / .css**: Resultados de búsqueda global.
- **Vault.tsx / .css**: Sección de colección personal (Mi Vault).
- **Settings.tsx / .css**: Configuración de cuenta y perfil.
- **Activity.tsx / .css**: Historial de actividad del usuario.
- **Arcos.tsx / ArcoDetail.tsx**: Secciones especiales de contenido curado (Arco).
- **DirectorAutopsy.tsx**: Página con análisis profundo de un director.
- **📁 TVDetail/**: Carpeta dedicada al detalle de series.
  - **TVDetailPage.tsx**: Página principal de detalle de serie.
  - **constants.ts**: Configuración específica para series.
  - **📁 components / hooks / services**: Sub-módulos internos de TV.

### 📁 src/services/
Capa de comunicación con el Backend (Axios/Fetch).
- **authServices.ts**: Login, Registro, Logout.
- **movieDetailServices.ts**: Datos de películas desde TMDB/Backend.
- **profileServices.ts**: Operaciones sobre datos de usuario.
- **searchServices.ts**: Motor de búsqueda.
- **socialServices.ts**: Interacciones sociales (Seguir, Likes).
- **arcosServices.ts / listsServices.ts / tvDetailServices.ts**: Servicios específicos por entidad.

### 📁 src/styles/
- **tokens.css**: Definición de variables CSS (colores, espaciados, tipografía).

### 📁 src/utils/
- **stringUtils.ts**: Formateo de textos y fechas.
- **📁 seo/**:
  - **buildMovieSchema.ts**: Genera el schema JSON-LD para motores de búsqueda.
