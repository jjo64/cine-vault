/**
 * @file PaymentsRepository.ts
 * @description Repositorio especializado en la gestión de transacciones económicas y suscripciones.
 * Interactúa con Stripe para la persistencia de pagos, cambios de membresía y estados 
 * de suscripciones (PRO/VIP) en una arquitectura transaccional.
 */

import { users_membership, subscriptions_plan } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/**
 * Datos requeridos tras completar un flujo de checkout con éxito.
 */
export interface ICheckoutCompletedData {
  userId: number
  plan: "vip" | "pro"
  startDate: Date
  endDate: Date
  stripeSubscriptionId: string
  amountTotal: number
  currency: string
  providerPaymentId: string
}

/**
 * Estructura interna para el registro de pagos individuales.
 */
interface PaymentRecord {
  userId: number
  subscriptionId: number
  amount: number
  currency: string
  providerPaymentId: string
  status: "paid" | "failed"
}

/**
 * Clase PaymentsRepository
 * Gestiona la integridad de los datos financieros y niveles de acceso (membership) de los usuarios.
 */
class PaymentsRepository {
  /**
   * Busca un usuario por ID para verificar su estado actual antes de un cobro.
   */
  async findUserById(userId: number) {
    return prisma.users.findUnique({ where: { id: userId } })
  }

  /**
   * Localiza una suscripción mediante el identificador externo del proveedor (ej: Stripe).
   */
  async findSubscriptionByProviderId(stripeSubId: string) {
    return prisma.subscriptions.findFirst({
      where: { provider_subscription_id: stripeSubId },
    })
  }

  /**
   * Recupera la suscripción más reciente de un usuario.
   */
  async findSubscriptionByUser(userId: number) {
    return prisma.subscriptions.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    })
  }

  /** 
   * Registra la finalización de un proceso de compra de forma atómica.
   * Crea la suscripción, registra el pago inicial y eleva el rango del usuario.
   */
  async checkoutCompleted(data: ICheckoutCompletedData) {
    return prisma.$transaction(async (tx) => {
      // 1. Elevar membresía del usuario
      await tx.users.update({
        where: { id: data.userId },
        data: { membership: data.plan as users_membership },
      })

      // 2. Crear registro de suscripción
      const suscripcion = await tx.subscriptions.create({
        data: {
          user_id: data.userId,
          plan: data.plan as subscriptions_plan,
          start_date: data.startDate,
          end_date: data.endDate,
          status: "active",
          provider: "stripe",
          provider_subscription_id: data.stripeSubscriptionId,
        },
      })

      // 3. Registrar el pago realizado
      await tx.payments.create({
        data: {
          user_id: data.userId,
          subscription_id: suscripcion.id,
          amount: data.amountTotal,
          currency: data.currency,
          provider: "stripe",
          payment_status: "paid",
          provider_payment_id: data.providerPaymentId,
        },
      })

      return suscripcion
    })
  }

  /** 
   * Renueva la vigencia de una suscripción activa.
   * Se ejecuta habitualmente tras el cobro de una factura mensual (webhook invoice.paid).
   */
  async renewSubscription(stripeSubId: string, newEndDate: Date) {
    return prisma.subscriptions.updateMany({
      where: { provider_subscription_id: stripeSubId },
      data: { end_date: newEndDate, status: "active" },
    })
  }

  /**
   * Actualiza el estado vital de una suscripción.
   */
  async updateSubscriptionStatus(
    stripeSubId: string,
    status: "active" | "cancelled" | "expired",
    newEndDate?: Date
  ) {
    return prisma.subscriptions.updateMany({
      where: { provider_subscription_id: stripeSubId },
      data: {
        status,
        ...(newEndDate && { end_date: newEndDate }),
      },
    })
  }

  /**
   * Persiste un registro de pago, actualizando si ya existe (upsert manual para evitar duplicados).
   */
  async recordPayment(data: PaymentRecord) {
    const existing = await prisma.payments.findFirst({
      where: { provider_payment_id: data.providerPaymentId },
    })
    
    if (existing) {
      return prisma.payments.update({
        where: { id: existing.id },
        data: { payment_status: data.status === "paid" ? "paid" : "failed" },
      })
    }

    return prisma.payments.create({
      data: {
        user_id: data.userId,
        subscription_id: data.subscriptionId,
        amount: data.amount,
        currency: data.currency,
        provider: "stripe",
        payment_status: data.status === "paid" ? "paid" : "failed",
        provider_payment_id: data.providerPaymentId,
      },
    })
  }

  /** 
   * Procesa la cancelación de una suscripción.
   * Marca la suscripción como cancelada y degrada al usuario a la membresía "free" atómicamente.
   */
  async cancelSubscription(stripeSubId: string) {
    const sub = await prisma.subscriptions.findFirst({
      where: { provider_subscription_id: stripeSubId },
    })
    
    if (!sub) return

    await prisma.$transaction([
      prisma.subscriptions.update({
        where: { id: sub.id },
        data: { status: "cancelled" },
      }),
      prisma.users.update({
        where: { id: sub.user_id },
        data: { membership: "free" as users_membership },
      }),
    ])
  }
}

export const paymentsRepository = new PaymentsRepository()
