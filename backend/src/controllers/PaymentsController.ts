import "dotenv/config"
import Stripe from "stripe"
import { Response } from "express"
import { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { prisma } from "../lib/prisma.js"
import { obtenerMensajeError } from "../helpers/errores.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

/**
 * Crea una sesión de pago en Stripe para actualizar la suscripción del usuario.
 */
export const createCheckoutSession = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const IDS_PRECIOS = {
    vip: "price_1T1Cm0BQQbliTr5uCZTeQnEA",
    pro: "price_1T1CmWBQQbliTr5u1SE1fMib",
  }

  try {
    const { userId, plan } = req.body

    if (!IDS_PRECIOS[plan as keyof typeof IDS_PRECIOS]) {
      return res.status(400).json({ error: "Plan inválido" })
    }

    const usuario = await prisma.users.findUnique({
      where: { id: Number(userId) },
    })

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    const sesion = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: IDS_PRECIOS[plan as keyof typeof IDS_PRECIOS],
          quantity: 1,
        },
      ],
      customer_email: usuario.email,
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: usuario.id.toString(),
        plan,
      },
    })

    res.json({ url: sesion.url })
  } catch (error: unknown) {
    console.error("Error de Stripe:", obtenerMensajeError(error))
    res.status(500).json({ error: obtenerMensajeError(error) })
  }
}
