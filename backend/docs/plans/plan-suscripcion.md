# Plan de Suscripcion (VIP/PRO)

Objetivo: definir una matriz clara de beneficios por tier y convertirla en entitlements reutilizables en backend y frontend. Luego agregar enforcement estricto en endpoints clave, exponer un endpoint de estado/beneficios y estadisticas, y construir el flujo UI de precios, checkout, gestion y upsell. Esto aprovecha el Stripe flow ya existente y asegura coherencia entre limites, UX y pagos.

## Tiers

- free: base gratuita
- vip: plan intermedio
- pro: plan superior

## Beneficios (base actual)

VIP
- Desbloquea la mitad de opciones de poster alternativos.
- Subir hasta 2 videos al vault.
- Fijar hasta 2 clips en el perfil.
- Desbloquea las resenas al nivel critico.
- Suma x1.25 los puntos que ganen completando recomendaciones.

PRO
- Desbloquea todas las opciones de poster alternativos.
- Subir hasta 4 videos al vault.
- Fijar hasta 4 clips.
- Parche especial para el perfil.
- Desbloquea las resenas al nivel critico.
- Suma x1.75 los puntos que ganen completando recomendaciones.

## Features premium alineadas al alma de la app (propuestas)

- Estadisticas avanzadas por usuario: generos, directores, decadas, paises, racha cinefila, comparativas contra historico.
- Export de estadisticas y libreria (CSV/JSON) con filtros por rango.
- Colecciones curadas VIP con insignias y acceso temprano.
- Filtros avanzados en busqueda y discovery (afinidad, rareza, tendencias, ranking personal).
- Recomendaciones con ponderacion extra por afinidad (solo visual, no altera ranking global).
- Heatmap de visionado y ranking de exploracion (por semana/mes).

## Steps

1. Discovery de recursos sujetos a limites (videos, clips fijados, posters, resenas criticas, puntos, export). Mapear endpoints, servicios y modelos actuales para aplicar enforcement.
2. Definir matriz de beneficios (free/vip/pro) como fuente unica de verdad: limites, flags y multiplicadores. Documentar en backend y compartir contrato para frontend.
3. Backend: modulo de entitlements que lea membresia del usuario y devuelva limites/flags. Integrar validaciones en servicios/endpoints. Errores consistentes para bloqueos por limite.
4. Backend: endpoint de estado de suscripcion y beneficios (membership, status, end_date, entitlements). Endpoints de estadisticas avanzadas y export, gated por tier.
5. Backend/DB: agregar campos/tablas para conteos eficientes (pinned clips, videos por usuario, posters alternativos habilitados, descargas de export). Agregar indices segun uso.
6. Frontend: pagina de precios con comparativa clara (cards + tabla), CTA de checkout y acceso a portal.
7. Frontend: vista de cuenta/perfil con estado de suscripcion, beneficios activos y panel de estadisticas + export. Mostrar limites restantes (ej. 2/4 videos).
8. Frontend: bloqueos/upsell en features premium (modales, tooltips, CTA), incluyendo analytics/export y resenas criticas.
9. QA: pruebas de webhooks, renovaciones/expiraciones, enforcement y flujo E2E de compra/downgrade.

## Referencias directas (existentes)

Pagos y suscripciones (backend)
- Ruta: POST /api/payments/create-checkout-session (crear suscripcion en Stripe para vip/pro).
- Ruta: POST /api/payments/portal-session (gestion de suscripcion en portal Stripe).
- Ruta: POST /api/payments/webhook (procesa eventos Stripe).
- Servicio: createCheckoutSessionService (crea sesion de checkout con metadata plan).
- Servicio: createPortalSessionService (abre portal de facturacion).
- Servicio: processWebhookEventService (checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.updated/deleted).
- Repo: PaymentsRepository.checkoutCompleted / renewSubscription / updateSubscriptionStatus / cancelSubscription.

Membresias y permisos (backend)
- users.membership (free/vip/pro) en schema prisma.
- LIMITES_MEMBRESIA en config/permisos.ts (usa membresia para limites basicos).
- Middleware RBAC verifica permisos por membresia y rol.

Vault y contenido social (backend)
- Ruta: GET /api/vault (vault propio).
- Ruta: POST /api/vault (agregar pelicula al vault).
- Ruta: DELETE /api/vault/:movie_id (remover pelicula del vault).
- Ruta: GET /api/vault/social/mine (social entries del usuario).
- Ruta: POST /api/vault/social (crear social entry).
- Ruta: PATCH /api/vault/social/:id (editar social entry).
- Ruta: DELETE /api/vault/social/:id (eliminar social entry).

Resenas (backend)
- Ruta: GET /api/reviews (reseñas del usuario).
- Ruta: POST /api/reviews (crear reseña, con mode=RAPIDO|ESTANDAR|CRITICO).
- Ruta: PATCH /api/reviews/:reviewId (editar reseña).
- Ruta: DELETE /api/reviews/:reviewId (eliminar reseña).

Recomendaciones (backend)
- Ruta: GET /api/recommendations/for-you (feed personalizado).
- Ruta: GET /api/recommendations/tonight (pelicula recomendada).
- Ruta: GET /api/recommendations/onboarding (onboarding).
- Ruta: GET /api/recommendations/onboarding/status (estado onboarding).
- Ruta: POST /api/recommendations/interact (interaccion explicita).

## Falta crear (backend)

Endpoints de estado y entitlements
- GET /subscriptions/me: devuelve membership, status, end_date y entitlements activos.
- GET /subscriptions/entitlements: devuelve limites/flags para pintar UI (opcional si se incluye en /me).

Endpoints de estadisticas y export
- GET /stats/advanced: stats avanzadas (filtros por rango, genero, director, decada, pais).
- GET /stats/export: export CSV/JSON (gated por tier).

Entitlements y enforcement
- Modulo entitlements central (por ejemplo backend/src/config/entitlements.ts) con matriz de beneficios.
- Validaciones en endpoints existentes:
	- /api/reviews (POST/PATCH) para bloquear mode=CRITICO segun tier.
	- /api/vault/social (POST/PATCH) si se usa como base para contenido premium.
- Endpoints nuevos para medios del Vault (no existen hoy):
	- POST /api/vault/media/videos (subir video al vault).
	- DELETE /api/vault/media/videos/:id (borrar video).
	- POST /api/vault/media/clips (crear clip fijable).
	- PATCH /api/vault/media/clips/:id/pin (fijar/desfijar clip).
- Endpoints nuevos para posters alternativos (no existen hoy):
	- GET /api/users/posters/options (opciones disponibles segun tier).
	- PATCH /api/users/posters/selection (guardar poster alternativo).
- Multiplicador de puntos en el servicio que liquida recomendaciones (definir en services de recomendaciones cuando se encuentre el calculo actual).
- Respuestas de error consistentes: 403 (no permitido por tier) y 409 (limite alcanzado).

Puntos por recomendaciones (estado actual)
- No hay logica de puntos en recommendation.services.ts; el flujo actual registra interacciones en saveExplicitInteraction (POST /api/recommendations/interact).
- Falta definir el punto exacto donde se otorgan puntos por completar recomendaciones.
- Propuesta: crear un endpoint de completado y una tabla de rewards (o agregarlo al dominio actual de gamificacion si existe).
	- POST /api/recommendations/complete (otorga puntos segun tier, idempotente por recomendacion).
	- Tabla sugerida: recommendation_rewards (user_id, recommendation_id, points, multiplier, created_at).

## Falta crear (frontend)

UI de suscripciones
- /pricing con comparativa visual (cards + tabla) y badge de ahorro para plan anual.
- CTA de checkout + acceso al portal (botones que llaman a create-checkout-session/portal-session).
- Vista de cuenta/perfil con estado de suscripcion y beneficios activos.
- Seccion "Suscripcion" dentro de /settings (ruta existente) para gestionar plan y portal.
- Badge de tier en /:username y /profile (rutas existentes) para visibilidad publica.

UI de premium features
- Panel de estadisticas avanzadas y export.
- Bloqueos/upsell en features premium (posters, clips, resenas criticas, export).

## Backlog priorizado

MVP (fase 1)
- Modulo de entitlements central (backend) y endpoint GET /subscriptions/me.
- Enforcement en endpoints criticos: /api/reviews (mode=CRITICO), /api/vault/social, y nuevos endpoints de videos/clips/posters.
- UI /pricing con comparativa y CTA de checkout + acceso a portal.
- Vista de cuenta/perfil con estado de suscripcion y beneficios activos.
- Seccion "Suscripcion" en /settings (gestionar plan, abrir portal).
- Bloqueos/upsell en UI para features premium.

Fase 2
- Endpoint /stats/advanced con filtros y /stats/export (CSV/JSON).
- Panel de estadisticas avanzadas en frontend + export.
- Indicadores de uso (limites restantes) en UI.
- Parche especial de perfil (asset + render condicional por tier).

Fase 3
- Colecciones curadas VIP, filtros avanzados de discovery, heatmap de visionado.
- Badge de ahorro anual y soporte a plan anual en pricing.

## Mapeo feature -> endpoint -> validacion -> UI

| Feature | Endpoint actual | Endpoint nuevo | Validacion backend | UI/UX |
| --- | --- | --- | --- | --- |
| Checkout VIP/PRO | POST /api/payments/create-checkout-session | - | Verifica plan valido (vip/pro) | Botones CTA en /pricing y upsell |
| Gestion de suscripcion | POST /api/payments/portal-session | - | Auth + membership actual | Boton "Gestionar" en /settings |
| Estado de suscripcion | - | GET /api/subscriptions/me | Auth + join subscriptions | Panel de cuenta/perfil |
| Posters alternativos | - | GET /api/users/posters/options, PATCH /api/users/posters/selection | Limite por tier (entitlements) | Selector bloquea opciones premium |
| Subir videos al vault | - | POST /api/vault/media/videos | Limite por tier (2/4) | Contador de uso + bloqueo |
| Fijar clips en perfil | - | POST /api/vault/media/clips, PATCH /api/vault/media/clips/:id/pin | Limite por tier (2/4) | Contador de uso + bloqueo |
| Resena critica | POST /api/reviews, PATCH /api/reviews/:reviewId | - | Flag por tier al usar mode=CRITICO | Toggle bloqueado + upsell |
| Multiplicador puntos | POST /api/recommendations/interact | POST /api/recommendations/complete | Aplicar multiplicador en reward service | Badge en UI de rewards |
| Estadisticas avanzadas | - | GET /api/stats/advanced | Permiso por tier | Dashboard premium |
| Export estadisticas | - | GET /api/stats/export | Permiso por tier + rate limit | Boton export (CSV/JSON) |
| Parche especial perfil | - | - | Flag por tier | Render de parche en /:username |

## DTOs propuestos (schemas)

POST /api/vault/media/videos
```ts
{
	title: string
	movie_id?: number
	media_type?: "movie" | "tv"
	video_url: string
	duration_sec?: number
	cover_url?: string
	is_public?: boolean
}
```

POST /api/vault/media/clips
```ts
{
	title: string
	movie_id?: number
	media_type?: "movie" | "tv"
	clip_url: string
	cover_url?: string
	is_public?: boolean
}
```

PATCH /api/vault/media/clips/:id/pin
```ts
{
	pinned: boolean
}
```

GET /api/users/posters/options
```ts
{
	options: Array<{ key: string; label: string; url: string; tier: "free" | "vip" | "pro" }>
}
```

PATCH /api/users/posters/selection
```ts
{
	poster_key: string
}
```

GET /api/subscriptions/me
```ts
{
	membership: "free" | "vip" | "pro"
	status: "active" | "expired" | "cancelled"
	end_date: string | null
	entitlements: {
		max_videos: number
		max_pinned_clips: number
		poster_alt_level: "none" | "half" | "all"
		reviews_critical: boolean
		points_multiplier: number
	}
}
```

GET /api/stats/advanced
```ts
Query: { from?: string; to?: string; media_type?: "movie" | "tv" }
```

GET /api/stats/export
```ts
Query: { format: "csv" | "json"; from?: string; to?: string }
```

POST /api/recommendations/complete
```ts
{
	recommendation_id: string
	media_id: number
	media_type: "movie" | "tv"
}
```

## UX (preparado para plan anual)

- Comparativa visual con tabla de beneficios.
- Badge de ahorro (si se agrega anual).
- Indicadores de uso: progreso por limite (videos/clips/exports).

## Verification

- Webhooks Stripe actualizan membership y subscription status.
- Endpoints premium bloquean cuando se excede limite.
- UI refleja estado de suscripcion y habilita/deshabilita features segun tier.

## Archivos de referencia

- backend/prisma/schema.prisma
- backend/src/routes/payments.routes.ts
- backend/src/services/payments.services.ts
- backend/src/repositories/PaymentsRepository.ts
- backend/src/config/permisos.ts
- backend/src/middlewares/rbac.middleware.ts
- backend/DOCUMENTACION.md
- frontend/src/App.tsx
