/* ==========================================================================
   EJEMPLOS DE USO DEL RBAC EN RUTAS
   --------------------------------------------------------------------------
   Este archivo muestra cómo integrar los middlewares de autorización
   en tus rutas existentes. Adaptá cada ejemplo a tu código real.
   ========================================================================== */

import { Router, Request } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  verificarPermiso,
  verificarRol,
  verificarPropietarioOPermiso,
} from "../middlewares/rbac.middleware.js"
import { PERMISOS } from "../config/permisos.js"
import { prisma } from "../lib/prisma.js"

const router = Router()

/* ==========================================================================
   REVIEWS — el dueño puede borrar la suya, el admin cualquiera
   ========================================================================== */

router.delete(
  "/reviews/:id",
  middlewareAutenticacion,
  verificarPropietarioOPermiso(
    PERMISOS.BORRAR_REVIEWS_AJENAS,
    async (req: Request) => {
      const review = await prisma.reviews.findUnique({
        where: { id: Number(req.params.id) },
        select: { user_id: true },
      })
      return review?.user_id ?? null
    }
  ),
  manejadorAsincrono(async (req, res) => {
    await prisma.reviews.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: "Review eliminada correctamente" })
  })
)

/* ==========================================================================
   NOTICIAS — solo admin y editor pueden crear/editar/borrar
   ========================================================================== */

// Crear noticia — admin y editor
router.post(
  "/news",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    const { title, content, category } = req.body
    const noticia = await prisma.news.create({
      data: { title, content, category },
    })
    res.status(201).json(noticia)
  })
)

// Editar noticia — admin y editor
router.patch(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    const noticia = await prisma.news.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    })
    res.json(noticia)
  })
)

// Borrar noticia — admin y editor
router.delete(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    await prisma.news.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: "Noticia eliminada correctamente" })
  })
)

/* ==========================================================================
   REPORTES — admin gestiona, editor solo ve
   ========================================================================== */

// Ver reportes — admin y editor
router.get(
  "/reports",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  manejadorAsincrono(async (req, res) => {
    const reportes = await prisma.reports.findMany({
      include: { users: true, reviews: true },
      orderBy: { created_at: "desc" },
    })
    res.json(reportes)
  })
)

// Resolver/rechazar reporte — solo admin
router.patch(
  "/reports/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_REPORTES),
  manejadorAsincrono(async (req, res) => {
    const { status } = req.body // "resolved" | "rejected"
    const reporte = await prisma.reports.update({
      where: { id: Number(req.params.id) },
      data: { status },
    })
    res.json(reporte)
  })
)

/* ==========================================================================
   USUARIOS — solo admin puede cambiar roles y ver actividad
   ========================================================================== */

// Cambiar rol de un usuario — solo admin
router.patch(
  "/users/:id/role",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.CAMBIAR_ROL_USUARIOS),
  manejadorAsincrono(async (req, res) => {
    const { role } = req.body
    const usuario = await prisma.users.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, username: true, role: true },
    })
    res.json(usuario)
  })
)

// Ver actividad de todos los usuarios — solo admin
router.get(
  "/users/activity",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_ACTIVIDAD_USUARIOS),
  manejadorAsincrono(async (req, res) => {
    const actividad = await prisma.user_activity.findMany({
      include: { users: { select: { id: true, username: true } } },
      orderBy: { created_at: "desc" },
      take: 100,
    })
    res.json(actividad)
  })
)

// Ver todos los pagos — solo admin
router.get(
  "/payments",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_PAGOS),
  manejadorAsincrono(async (req, res) => {
    const pagos = await prisma.payments.findMany({
      include: { users: { select: { id: true, username: true, email: true } } },
      orderBy: { created_at: "desc" },
    })
    res.json(pagos)
  })
)

/* ==========================================================================
   MEMBRESÍA — ejemplo de límite de exhibición (para el futuro)
   ========================================================================== */

// Subir película para exhibición — solo vip y pro
// Cuando lo implementes, importá LIMITES_MEMBRESIA para verificar el límite
// import { LIMITES_MEMBRESIA } from "../config/permisos.js"
//
// router.post(
//   "/exhibicion",
//   middlewareAutenticacion,
//   verificarPermiso(PERMISOS.EXHIBIR_PELICULAS),
//   manejadorAsincrono(async (req, res) => {
//     const membresia = usuario.membership
//     const limite = LIMITES_MEMBRESIA[membresia].peliculas_exhibicion
//     const total = await prisma.exhibicion.count({ where: { user_id } })
//     if (total >= limite) throw new ForbiddenError(`Tu plan ${membresia} permite hasta ${limite} películas`)
//     // ... crear exhibición
//   })
// )

export default router