import "dotenv/config"
import Stripe from "stripe"
import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { obtenerMensajeError } from "../helpers/errores.js"
import { users_membership, subscriptions_plan } from "@prisma/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

/**
 * Crea una sesión de pago en Stripe para actualizar la suscripción del usuario.
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id
    const { plan } = req.body
    const IDS_PRECIOS = {
      vip: process.env.STRIPE_PRICE_VIP as string,
      pro: process.env.STRIPE_PRICE_PRO as string,
    }

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

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body as unknown as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (error) {
    return res.status(400).json({ error: "Webhook inválido" })
  }

  try {
    switch (event.type) {
      // Pago inicial completado → crear suscripción y pago
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = Number(session.metadata?.userId)
        const plan = session.metadata?.plan as "vip" | "pro"

        const hoy = new Date()
        const finSuscripcion = new Date()
        finSuscripcion.setMonth(finSuscripcion.getMonth() + 1)

        await prisma.users.update({
          where: { id: userId },
          data: { membership: plan as users_membership },
        })

        const suscripcion = await prisma.subscriptions.create({
          data: {
            user_id: userId,
            plan: plan as subscriptions_plan,
            start_date: hoy,
            end_date: finSuscripcion,
            status: "active",
            provider: "stripe",
            provider_subscription_id: session.subscription as string,
          },
        })

        await prisma.payments.create({
          data: {
            user_id: userId,
            subscription_id: suscripcion.id,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "eur",
            provider: "stripe",
            payment_status: "paid",
            provider_payment_id: session.payment_intent as string,
          },
        })
        break
      }

      // Renovación mensual → actualizar end_date
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubId = (invoice as any).subscription as string

        // Solo procesar renovaciones, no el pago inicial (que ya lo maneja checkout.session.completed)
        if (invoice.billing_reason === "subscription_create") break

        const nuevaFechaFin = new Date()
        nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1)

        await prisma.subscriptions.updateMany({
          where: { provider_subscription_id: stripeSubId },
          data: {
            end_date: nuevaFechaFin,
            status: "active",
          },
        })
        break
      }

      // Cancelación → bajar a free
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const stripeSubId = subscription.id

        const sub = await prisma.subscriptions.findFirst({
          where: { provider_subscription_id: stripeSubId },
        })

        if (sub) {
          await prisma.subscriptions.update({
            where: { id: sub.id },
            data: { status: "cancelled" },
          })

          await prisma.users.update({
            where: { id: sub.user_id },
            data: { membership: "free" as users_membership },
          })
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }
    res.json({ received: true })
  } catch (error) {
    console.error("Error procesando webhook:", obtenerMensajeError(error))
    res.status(500).json({ error: "Error procesando el evento" })
  }
}
