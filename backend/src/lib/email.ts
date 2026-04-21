/**
 * @file email.ts
 * @description Capa de abstracción para el envío de correos electrónicos.
 * Utiliza el servicio "Resend" para el despacho de transaccionales y notificaciones.
 * Incluye un sistema de simulación (Mock) para entornos de desarrollo y test.
 */

import { Resend } from "resend"

/** Estructura base para el envío de cualquier correo */
type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

const apiKey = process.env.RESEND_API_KEY
const defaultFrom =
  process.env.RESEND_FROM || "CineVault <hola@mail.cinevault.art>"
const allowMockSend = process.env.EMAIL_SIMULATE === "true"

/** Instancia del cliente Resend. Se mantiene nula si no hay API Key configurada. */
const resendClient = apiKey ? new Resend(apiKey) : null

/**
 * Función interna de bajo nivel para el despacho de correos.
 * Maneja la lógica de simulación y las excepciones del proveedor externo.
 * 
 * @param payload - Datos del correo a enviar.
 * @throws Error si no hay API Key y no está activado el modo simulación.
 */
const sendEmail = async ({ to, subject, html, text, from }: EmailPayload) => {
  if (!resendClient) {
    if (allowMockSend || process.env.NODE_ENV === "test") {
      console.warn(
        "[Email] Envío simulado (EMAIL_SIMULATE=true o NODE_ENV=test)"
      )
      return { id: "mocked-email", mocked: true }
    }

    throw new Error(
      "No se pudo enviar email: falta RESEND_API_KEY. " +
        "Configura la clave o activa EMAIL_SIMULATE=true para desarrollo local."
    )
  }

  const result = await resendClient.emails.send({
    from: from || defaultFrom,
    to,
    subject,
    html,
    text,
  })

  // Validación de respuesta del SDK de Resend
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    result.error
  ) {
    const err = result.error as { message?: string }
    throw new Error(err.message || "Resend rechazó el envío del correo electrónico")
  }

  return result
}

/**
 * Envía el correo de verificación de cuenta inicial.
 */
export const enviarCorreoVerificacion = async (
  email: string,
  token: string
) => {
  const publicAppBase =
    process.env.EMAIL_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  const link = `${publicAppBase}/verify-email?token=${token}`

  return sendEmail({
    to: email,
    subject: "CineVault · Verifica tu cuenta",
    html: `
      <div style="background:#070809;padding:32px 14px;font-family:Georgia,'Times New Roman',serif;color:#e2e2e2;">
        <div style="max-width:560px;margin:0 auto;border:1px solid #1f2430;background:linear-gradient(160deg,#0d1018 0%,#0a0c12 100%);box-shadow:0 30px 80px rgba(0,0,0,.45)">
          <div style="padding:26px 26px 10px;border-bottom:1px solid #1f2430">
            <div style="font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#9a7a48;margin-bottom:10px;font-family:Arial,sans-serif">CineVault</div>
            <h1 style="margin:0;font-weight:500;font-size:34px;line-height:1;color:#f0f0f0;">Verifica tu cuenta</h1>
            <p style="margin:14px 0 0;color:#9ba3b4;font-size:16px;line-height:1.5;">Tu sala está lista. Solo falta confirmar tu email para empezar a guardar películas, reseñas y rituales nocturnos.</p>
          </div>
          <div style="padding:24px 26px 26px;">
            <a href="${link}" style="display:inline-block;text-decoration:none;background:#d4af7a;color:#0a0b10;padding:11px 18px;border-radius:2px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:700;">Verificar mi cuenta</a>
            <p style="margin:18px 0 0;color:#7a7f8b;font-size:13px;line-height:1.55;">Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
          </div>
        </div>
      </div>
    `,
    text: `Verifica tu cuenta en CineVault: ${link}`,
  })
}

/**
 * Envía el enlace para recuperación de contraseña olvidada.
 */
export const enviarCorreoResetPassword = async (
  email: string,
  token: string
) => {
  const link = `${process.env.BACKEND_URL}/api/auth/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: "CineVault · Restablecer contraseña",
    html: `
      <h2>Restablecimiento de credenciales</h2>
      <p>Hemos recibido una solicitud para modificar la contraseña de acceso a tu bóveda.</p>
      <p>Por seguridad, este enlace expirará en <strong>15 minutos</strong>.</p>
      <a href="${link}">Restablecer contraseña ahora</a>
      <p>Si no has solicitado este cambio, te recomendamos actualizar tu seguridad.</p>
    `,
    text: `Restablece tu contraseña en CineVault mediante este enlace: ${link}`,
  })
}

/**
 * Envía los códigos de respaldo generados tras activar la autenticación de dos factores (2FA).
 */
export const enviarCorreoBackupCodes = async (
  email: string,
  codes: string[]
) => {
  const listado = codes.map((c) => `<li>${c}</li>`).join("")
  return sendEmail({
    to: email,
    subject: "CineVault · Tus códigos de respaldo 2FA",
    html: `
      <h2>Custodia estos códigos en un lugar seguro</h2>
      <p>Estos códigos te permitirán acceder a tu cuenta si pierdes el dispositivo de autenticación.</p>
      <ul>${listado}</ul>
    `,
    text: `Tus códigos de respaldo CineVault son: ${codes.join(", ")}`,
  })
}

/**
 * Envía una recomendación editorial o de un contacto.
 */
export const enviarCorreoRecomendacion = async (
  email: string,
  {
    titulo,
    descripcion,
    url,
  }: { titulo: string; descripcion: string; url: string }
) => {
  return sendEmail({
    to: email,
    subject: `Recomendación nocturna: ${titulo}`,
    html: `
      <h2>${titulo}</h2>
      <p>${descripcion}</p>
      <a href="${url}">Ver detalle en CineVault</a>
    `,
    text: `${titulo}\n${descripcion}\n${url}`,
  })
}

/**
 * Despacha el recibo tras una suscripción Premium exitosa.
 */
export const enviarCorreoReciboStripe = async (
  email: string,
  {
    amount,
    currency,
    invoiceUrl,
  }: { amount: number; currency: string; invoiceUrl: string }
) => {
  const total = (amount / 100).toFixed(2)
  return sendEmail({
    to: email,
    subject: "CineVault · Confirmación de pago",
    html: `
      <h2>Gracias por tu suscripción</h2>
      <p>Hemos procesado el pago de tu membresía CineVault correctamente.</p>
      <p>Importe total: ${total} ${currency.toUpperCase()}</p>
      <a href="${invoiceUrl}">Descargar recibo oficial</a>
    `,
    text: `Confirmación de pago CineVault por un total de ${total} ${currency.toUpperCase()} - Recibo: ${invoiceUrl}`,
  })
}

export { sendEmail }
