/**
 * @file PaymentsRepository.ts
 * @description Repositorio crítico para la gestión financiera y de suscripciones.
 * Administra el ciclo de vida de los planes CineVault (PRO/VIP), encargándose de la
 * persistencia de pagos, renovaciones automáticas y la sincronización de estados
 * con el proveedor externo de pagos (Stripe). Garantiza la integridad de la
 * membresía del usuario mediante operaciones transaccionales.
 */

import { users_membership, subscriptions_plan } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/**
 * Payload consolidado tras una operación exitosa en la pasarela de pagos.
 */
export interface ICheckoutCompletedData {
  userId: number
  /** Identificador técnico del plan adquirido */
  plan: "vip" | "pro"
  /** Fecha de inicio de la vigencia */
  startDate: Date
  /** Fecha de expiración (habitualmente 1 mes o 1 año después) */
  endDate: Date
  /** ID de relación en la plataforma de Stripe */
  stripeSubscriptionId: string
  /** Importe total de la transacción en céntimos/subunidades */
  amountTotal: number
  /** Código de divisa (ISO 4217) */
  currency: string
  /** Referencia del cobro individual del proveedor */
  providerPaymentId: string
}

/**
 * Estructura de auditoría interna para el registro histórico de cobros.
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
 * Repositorio de Pagos
 * Centraliza la lógica de negocio económica, asegurando que los privilegios
 * premium estén siempre sincronizados con el estado real de los cobros.
 */
class PaymentsRepository {
  /**
   * Verifica la identidad y estado del usuario previo al procesamiento del pago.
   */
  async findUserById(userId: number) {
    return prisma.users.findUnique({ where: { id: userId } })
  }

  /**
   * Localiza una suscripción activa mediante su referencia externa.
   * Utilizado para procesar webhooks de actualización de Stripe.
   */
  async findSubscriptionByProviderId(stripeSubId: string) {
    return prisma.subscriptions.findFirst({
      where: { provider_subscription_id: stripeSubId },
    })
  }

  /**
   * Recupera el estado de membresía actual del usuario.
   */
  async findSubscriptionByUser(userId: number) {
    return prisma.subscriptions.findFirst({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    })
  }

  /**
   * Orquestador de finalización de compra.
   * Ejecuta una serie de operaciones atómicas:
   * 1. Eleva el rango del usuario al plan correspondiente.
   * 2. Inicializa la entidad de suscripción persistente.
   * 3. Registra el asiento contable del pago inicial.
   *
   * @param data - Resultados validados de la pasarela Stripe.
   */
  async checkoutCompleted(data: ICheckoutCompletedData) {
    return prisma.$transaction(async (tx) => {
      // Sincronización de privilegios de acceso
      await tx.users.update({
        where: { id: data.userId },
        data: { membership: data.plan as users_membership },
      })

      // Registro del contrato de servicio (Suscripción)
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

      // Registro de la transacción monetaria para auditoría
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
   * Extiende la validez de una membresía activa.
   *
   * @param stripeSubId - Referencia de la suscripción a renovar.
   * @param newEndDate - Próxima fecha de vencimiento.
   */
  async renewSubscription(stripeSubId: string, newEndDate: Date) {
    return prisma.subscriptions.updateMany({
      where: { provider_subscription_id: stripeSubId },
      data: { end_date: newEndDate, status: "active" },
    })
  }

  /**
   * Actualiza el estado vitalicio de la suscripción (ej: expirado por falta de pago).
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
   * Persiste o actualiza un registro de pago individual.
   * Implementa una lógica de 'Idempotencia' manual para evitar duplicar asientos
   * contables en caso de recepciones múltiples de webhooks.
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
   * Ejecuta la baja del servicio para un usuario.
   * Transacción atómica que asegura que el usuario pierda los privilegios PRO
   * en el momento exacto en que la suscripción se marca como cancelada.
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

/** Instancia exportada para la gestión financiera de la plataforma */
export const paymentsRepository = new PaymentsRepository()
