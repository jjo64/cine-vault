# Plan Maestro de Pulido Backend para TFG (CineVault)

Fecha: 2026-04-09
Objetivo: dejar el backend consistente con la arquitectura objetivo (Controller -> Service -> Repository), cubierto por pruebas, con documentacion trazable para defensa y sin deuda zombie.

## 1. Diagnostico inicial (estado actual -> estado objetivo)

### 1.1 Arquitectura y capas

- Estado actual:
  - Existe ADR de Patron Repository aceptado y arquitectura por capas definida.
  - Aun hay servicios con Prisma directo en lugar de pasar por repositorio.
  - Caso confirmado: User service acoplado a Prisma en multiples operaciones.
- Estado objetivo:
  - Ningun servicio con acceso directo a Prisma salvo excepciones explicitas y justificadas.
  - Todo acceso a datos via repositories (incluyendo consultas complejas y transacciones).
  - Contratos de repositorio tipados y testeables.

### 1.2 Documentacion

- Estado actual:
  - Swagger se genera desde anotaciones en rutas y se sirve en /api-docs.
  - openapi.yaml sigue principalmente orientado a Auth y no refleja todo el backend real.
  - ADR 0002 figura como Aceptado, pero el indice ADR aun muestra estados viejos para 0002/0003.
- Estado objetivo:
  - OpenAPI completo por dominios (Auth, Users, Diary, Reviews, Watchlist, Favorites, Notifications, Payments, Settings, Feed, etc.).
  - Criterio unico de documentacion (fuente de verdad definida: spec-first o code-first).
  - ADR index y ADRs consistentes entre si.

### 1.3 Testing y calidad

- Estado actual:
  - Existe Vitest con setup y coverage habilitado.
  - Hay pruebas en varios dominios, pero sin matriz explicita de cobertura por feature.
- Estado objetivo:
  - Matriz endpoint/servicio/repo -> test asociado.
  - Suite verde en local y coverage objetivo alcanzado en modulos criticos.
  - Verificaciones de build/lint/test incorporadas al flujo de PR.

### 1.4 Limpieza tecnica

- Estado actual:
  - Hay naming inconsistente heredado (favorities, mentiras, etc.) y riesgo de archivos/herramientas desalineados.
  - Existen posibles rutas superpuestas de funcionalidades de perfil entre users y settings.
- Estado objetivo:
  - Inventario de codigo vivo y codigo deprecado.
  - Eliminacion de zombies solo tras prueba de no-referencia.
  - Naming normalizado o documentado con plan de migracion sin breaking changes.

## 2. Fases del plan (orden, duracion y entregables)

## Fase 0 - Baseline y congelacion de contratos (1-2 dias)

Objetivo: medir y congelar el estado actual antes de refactor.

Tareas:
1. Ejecutar baseline tecnico:
   - npm run lint
   - npm run build
   - npm run test:run
   - npm run test:coverage
2. Guardar resultados (logs y metricas) en docs/plans/evidence.
3. Definir umbrales iniciales y objetivo:
   - Build = 0 errores
   - Lint = 0 errores bloqueantes
   - Test = 100% suite verde
   - Coverage (objetivo recomendado):
     - Services >= 80%
     - Repositories >= 70%
     - Controllers >= 70%
4. Confirmar fuente de verdad de API:
   - Opcion A: openapi.yaml canonico
   - Opcion B: anotaciones swagger en rutas canonicamente
   - Recomendada para TFG: A (openapi.yaml canonico) + validacion de sincronia.

Entregable:
- Documento baseline con metricas y decision de estrategia OpenAPI.

## Fase 1 - Refactor de arquitectura por dominios (5-8 dias)

Objetivo: eliminar deuda de capas y alinear con ADR 0001 y ADR 0004.

### 1A. User domain (prioridad maxima)

Ahora:
- user.services.ts importa Prisma y ejecuta CRUD/queries/raw directamente.

Debe quedar:
- UserRepository ampliado con metodos necesarios.
- user.services.ts solo orquesta negocio, validacion semantica y errores de dominio.
- Prisma y SQL crudo encapsulados en repository.

Checklist tareas:
1. Extender IUserRepository y UserRepository con:
   - updateProfile
   - follow/unfollow
   - findPublicById
   - findPublicByUsername
   - searchUsers
   - getFollowers/getFollowing
   - signature/curated-gallery reads-writes
2. Inyectar repository (o singleton desacoplado) en user.services.ts.
3. Eliminar import de Prisma en user.services.ts.
4. Mantener AppErrors y mapping de conflictos/not found sin romper contratos HTTP.
5. Crear pruebas unitarias de user.services con mocks de repository.

### 1B. Resto de servicios con Prisma directo

Ahora:
- Se detectan usos directos de Prisma en search.services.ts, settings.services.ts, reviews.services.ts, movieRef.services.ts.

Debe quedar:
- Cada uno apoyado por su repository correspondiente o nuevo repository dedicado para movieRef/search auxiliar.

Checklist tareas:
1. Listar cada acceso prisma.* por archivo y clasificar:
   - CRUD simple -> mover a repo existente.
   - Query compleja/raw -> encapsular en repo con metodo nombrado.
2. Evitar SQL inline en services salvo excepcion documentada en ADR.
3. Revisar transacciones y limites de responsabilidad por capa.

Entregable:
- Servicios desacoplados y prueba de no-import Prisma en services (excepto whitelist documentada).

## Fase 2 - Contratos, validacion y errores (2-4 dias)

Objetivo: cerrar consistencia entre Zod, tipos TS y errores HTTP.

Tareas:
1. Completar validacion Zod en rutas que aun parsean manualmente params/query.
2. Tipar DTOs por dominio en src/types (entrada/servicio/salida).
3. Estandarizar respuestas de error segun AppErrors y API standards.
4. Revisar que no haya try/catch redundantes en controllers.
5. Definir y aplicar un catalogo minimo de codigos de error de dominio.

Entregable:
- Guia de contratos y errores por dominio + endpoints alineados.

## Fase 3 - Limpieza zombie, naming y deuda estructural (2-3 dias)

Objetivo: eliminar ambiguedad del codigo y reducir riesgo de mantenimiento.

Tareas:
1. Auditoria de codigo muerto:
   - exports no usados
   - archivos no importados
   - rutas sin registro en server
   - middlewares/helpers sin uso
2. Marcar candidatos como DEPRECATED antes de borrar (1 iteracion).
3. Borrado seguro en segunda iteracion con evidencia de no uso.
4. Naming cleanup:
   - plan de migracion para nombres heredados (favorities, etc.).
   - si se renombra endpoint o archivo publico, mantener alias temporal y documentar deprecacion.

Entregable:
- Registro de limpieza con antes/despues y decision de cada archivo.

## Fase 4 - Documentacion de defensa TFG (4-6 dias)

Objetivo: que cualquier tribunal pueda entender, ejecutar y evaluar el backend.

Aplicar Diataxis en 4 piezas:
1. Tutorial:
   - "Levantar backend desde cero y ejecutar flujo Auth + Review + Notification"
2. How-to:
   - "Como agregar endpoint nuevo con Zod + Service + Repository + test + OpenAPI"
3. Reference:
   - API completa (OpenAPI), catalogo de errores, variables de entorno, scripts, matrices de permisos.
4. Explanation:
   - decisiones de arquitectura, trade-offs y por que este diseño es mantenible.

Donde documentar:
1. docs/openapi.yaml
2. docs/backend-architecture.md
3. docs/backend-domains.md
4. docs/backend-howto.md
5. docs/adr/*.md y docs/adr/README.md
6. Documento de evidencia final en docs/plans (checklist de defensa)

Que documentar del codigo:
1. Modulos core:
   - server bootstrap, middleware chain, error handling.
2. Dominios criticos:
   - auth, users, reviews, diary, payments, notifications, settings.
3. Integraciones:
   - Stripe, Redis, TMDB, Resend, Cloudinary, Socket.IO.
4. Cross-cutting:
   - rate limit, cache invalidation, RBAC, jobs.

Como documentar:
1. Enfocar "por que" y "trade-off", no solo "que hace".
2. Incluir ejemplos request/response reales y casos de error.
3. Acompanhar cada decision con su ADR o referencia cruzada.
4. Mantener una tabla de trazabilidad:
   - feature -> endpoints -> service -> repository -> test -> ADR/doc.

Entregable:
- Pack documental completo listo para anexo de memoria y defensa oral.

## Fase 5 - Hardening final y cierre (2-3 dias)

Objetivo: cerrar con evidencia objetiva de calidad.

Tareas:
1. Ejecutar smoke y regresion completa.
2. Repetir baseline comandos y comparar contra Fase 0.
3. Generar checklist final de aceptacion (DoD).
4. Preparar guion de defensa tecnica (10-15 min) con:
   - problema inicial
   - decisiones
   - mejoras medidas
   - riesgos y trabajo futuro

Entregable:
- Informe final de calidad y readiness para tribunal.

## 3. Plan de pruebas (que debe pasar, como ejecutarlo, resultado esperado)

## 3.1 Comandos base

En backend:
1. npm install
2. npm run lint
3. npm run build
4. npm run test:run
5. npm run test:coverage

Opcional de entorno:
1. npm run redis:check
2. docker compose up -d (si necesitas stack local)

## 3.2 Resultado esperado

- lint: sin errores bloqueantes.
- build: compila dist sin errores TypeScript.
- test:run: todas las pruebas en verde.
- test:coverage:
  - reporte text y html generado.
  - cobertura no menor al baseline; objetivo de mejora sostenida por dominio.

## 3.3 Matriz minima de pruebas a cubrir

1. Unitarias de services:
   - reglas de negocio, validaciones semanticas, mapping de errores.
2. Unitarias de repositories:
   - queries complejas y mapeos criticos.
3. Integracion API (supertest):
   - auth, users/profile, follows, reviews/comments/likes, diary, settings, payments webhooks.
4. Contrato API:
   - consistencia endpoint real vs OpenAPI.
5. No regresion cross-cutting:
   - auth middleware, RBAC, rate limits, cache invalidation.

## 4. Lista de tareas priorizada (ejecucion inmediata)

Prioridad P0 (hacer primero):
1. Refactor user.services.ts para eliminar Prisma directo y usar UserRepository extendido.
2. Crear pruebas unitarias de user.services con mocks de UserRepository.
3. Alinear docs/adr/README.md con estado real de ADR 0002 y 0003.
4. Definir oficialmente estrategia OpenAPI (spec-first recomendado) y aplicarla.

Prioridad P1:
1. Refactor settings/search/reviews/movieRef services para quitar Prisma directo donde aplique.
2. Completar OpenAPI para dominios no documentados.
3. Crear matriz de trazabilidad feature -> endpoint -> test.
4. Revisar naming legacy y plan de deprecacion (sin romper frontend).

Prioridad P2:
1. Auditoria zombie completa y borrado seguro por etapas.
2. Pulido de explicaciones de arquitectura para defensa.
3. Endurecer automatizacion de checks en CI/local (script unico de calidad).

## 5. Riesgos y mitigaciones

1. Riesgo: romper contratos consumidos por frontend al refactor.
   - Mitigacion: tests de integracion + alias temporales + changelog de endpoints.
2. Riesgo: abrir demasiados frentes a la vez.
   - Mitigacion: trabajar por dominio (Users -> Settings -> Reviews -> resto).
3. Riesgo: borrar archivo "zombie" que si se usa indirectamente.
   - Mitigacion: doble verificacion (busqueda + ejecucion de tests + build) antes de borrar.

## 6. Criterio de terminado (Definition of Done)

Se considera backend "pulido para TFG" cuando:
1. Servicios core sin Prisma directo (salvo whitelist justificada en ADR).
2. Suite lint/build/test/coverage verde y estable.
3. OpenAPI completo y navegable en /api-docs.
4. ADRs e indice ADR actualizados y coherentes.
5. Documentacion Diataxis completa (tutorial/how-to/reference/explanation).
6. Registro de limpieza zombie con evidencia de decisiones.
7. Demo de defensa ejecutable en local siguiendo solo la documentacion.

## 7. Orden recomendado de ejecucion (de inicio a fin)

1. Baseline + decision OpenAPI.
2. Refactor Users completo (tu caso detectado en user.services.ts).
3. Tests de Users y cierre de regresion.
4. Refactor del resto de servicios con Prisma directo.
5. Limpieza zombie por iteraciones.
6. Completar documentacion y ADRs.
7. Hardening final + informe de defensa.
