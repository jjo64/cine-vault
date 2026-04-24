# Resumen y Evolución del Proyecto CineVault

Este documento sirve como índice y resumen del histórico de implementaciones de CineVault. Se hace un recorrido desde el inicio del proyecto hasta su estabilización.

## Indice de Semanas / Fases
1. [Fase 1: Configuración y Autenticación (Feb 2026)](./01_febrero_2026_autenticacion_y_setup.md)
2. [Fase 2: Interfaz de Usuario y Detalles (Mar 2026)](./02_marzo_2026_frontend_ui.md)
3. [Fase 3: Refactorización y Características Avanzadas (Abr 2026)](./03_abril_2026_arquitectura_y_features.md)

## 1. El Inicio de CineVault
El proyecto comenzó a finales de enero/mediados de febrero de 2026 como una plataforma para administrar películas. Las decisiones iniciales se centraron fuertemente en **Seguridad y Autenticación**. Se integraron registros, validaciones, 2FA, y control de sesiones mediante Redis y autenticación tradicional. Se empezó desde el principio con la mentalidad de desplegar (Vercel para el Front / Railway para el Back).

## 2. Cómo Mejoró
A medida que el backend se solidificó, el proyecto transicionó a construir una experiencia de usuario (UI) moderna y responsiva.
- Se implementaron vistas completas para Películas y Series (TV).
- Se añadieron repositorios y servicios robustos para el guardado de películas, reseñas, etc.
- Se modularizó la lógica de negocio, creando una separación de responsabilidades a través de controladores, repositorios y servicios.

## 3. Evolución Tecnológica
* **Bases de Datos & Prisma**: Empezó con modelos simples de User. Posteriormente se agregaron modelos complejos como `CinematographicSignature`, `CuratedGallery`, `MovieRef`, y autenticaciones más robustas que requirieron configurar **conexiones SSL** en Prisma para optimizar y asegurar la conexión en entornos de producción.
* **Middlewares y Zod**: Se centralizó la validación del input del usuario y se implementó lógica de "Rate Limiting", middlewares autenticados con "Refresh Tokens" y manejo de errores estructurados.
* **Gestión de Sesiones**: El gran salto se dio al implementar **Redis** para el caché y el manejo de tokens, evitando consultas lentas a la base de datos principal y preparando el terreno para concurrencias mayores.

## 4. Cambios Principales en Base de Datos
- **Fase de Auth:** Tabla de `Users` expandida y adición de esquemas para tokens, 2FA y validación de emails.
- **Fase Media:** Agregación de repositorios de "Watchlists", "Reseñas" y "Firmas Cinematográficas". Mapas de relaciones directas hacia TMDB usando un esquema intermedio para IDs.

## 5. Fortalezas y Debilidades
* **Fortalezas**: 
  * Seguridad muy robusta (Google Login, 2FA, Verificación de Email, Rate Limiting).
  * Arquitectura escalable separando Controladores, Servicios y Repositorios.
  * Autenticación moderna mediante JWT y Redis.
* **Debilidades (Retos históricos)**:
  * El despliegue inicial en plataformas PaaS como Railway causó fricciones considerables al inicio ("Intento 40mil de arreglar railway").
  * Algunos "GOD Components" en el frontend requirieron refactorizaciones intensas para mantener la mantenibilidad, lo que ralentizó ciertas entregas.
  * Inconsistencias ocasionales con el manejo de `media_type` entre películas y series que requerían fix recurrentes.

## 6. Próximos Pasos Globales
Dado el robustecimiento del esquema de bases de datos y la vista cliente de películas:
- **Próximo Paso:** Conectar todas las llamadas restantes del dashboard principal a eventos de tiempo real o revalidación en background.
- Expandir el motor de recomendaciones (`recommendations controllers`).
- Completar la implementación completa del sistema Role-Based Access Control (RBAC) iniciado en abril.
