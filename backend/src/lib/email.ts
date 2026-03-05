import { Resend } from "resend"

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

const apiKey = process.env.RESEND_API_KEY
const defaultFrom = process.env.RESEND_FROM || "CineVault <noreply@mail.cinevault.art>"

const resendClient = apiKey ? new Resend(apiKey) : null

const sendEmail = async ({ to, subject, html, text, from }: EmailPayload) => {
  if (!resendClient) {
    // En tests o sin API key no fallamos: devolvemos un stub.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falta RESEND_API_KEY para enviar emails")
    }
    console.warn("[Email] RESEND_API_KEY no configurada; envío simulado")
    return { id: "mocked-email", mocked: true }
  }

  return resendClient.emails.send({
    from: from || defaultFrom,
    to,
    subject,
    html,
    text,
  })
}

export const enviarCorreoVerificacion = async (email: string, token: string) => {
  const link = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: "Verifica tu cuenta",
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Haz clic en el enlace para verificar tu cuenta:</p>
      <a href="${link}">Verificar cuenta</a>
    `,
    text: `Verifica tu cuenta: ${link}`,
  })
}

export const enviarCorreoResetPassword = async (email: string, token: string) => {
  const link = `${process.env.BACKEND_URL}/api/auth/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: "Restablecer contraseña",
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>El enlace expira en <strong>15 minutos</strong>.</p>
      <a href="${link}">Restablecer contraseña</a>
      <p>Si no solicitaste esto, ignorá este correo.</p>
    `,
    text: `Restablece tu contraseña: ${link}`,
  })
}

export const enviarCorreoBackupCodes = async (email: string, codes: string[]) => {
  const listado = codes.map((c) => `<li>${c}</li>`).join("")
  return sendEmail({
    to: email,
    subject: "Tus códigos de respaldo 2FA",
    html: `
      <h2>Conserva estos códigos en un lugar seguro</h2>
      <ul>${listado}</ul>
    `,
    text: `Códigos de respaldo: ${codes.join(", ")}`,
  })
}

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
      <a href="${url}">Ver ahora</a>
    `,
    text: `${titulo}\n${descripcion}\n${url}`,
  })
}

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
    subject: "Recibo de pago",
    html: `
      <h2>Gracias por tu pago</h2>
      <p>Total: ${total} ${currency.toUpperCase()}</p>
      <a href="${invoiceUrl}">Ver recibo</a>
    `,
    text: `Total: ${total} ${currency.toUpperCase()} - Recibo: ${invoiceUrl}`,
  })
}

export { sendEmail }