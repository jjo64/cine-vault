import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Envía el email de verificación de cuenta al registrarse.
 */
export const enviarCorreoVerificacion = async (
  email: string,
  token: string
) => {
  const link = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: "CineVault <noreply@mail.cinevault.art>",
    to: email,
    subject: "Verifica tu cuenta",
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Haz clic en el enlace para verificar tu cuenta:</p>
      <a href="${link}">Verificar cuenta</a>
    `,
  })
}

/**
 * Envía el email para restablecer la contraseña.
 */
export const enviarCorreoResetPassword = async (
  email: string,
  token: string
) => {
  const link = `${process.env.BACKEND_URL}/api/auth/reset-password?token=${token}`

  await resend.emails.send({
    from: "CineVault <noreply@mail.cinevault.art>",
    to: email,
    subject: "Restablecer contraseña",
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>El enlace expira en <strong>15 minutos</strong>.</p>
      <a href="${link}">Restablecer contraseña</a>
      <p>Si no solicitaste esto, ignorá este correo.</p>
    `,
  })
}