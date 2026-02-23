import nodemailer from "nodemailer"
/* ==========================================================================
   5. EMAILS
   ========================================================================== */

/**
 * Crea y reutiliza un transporter de nodemailer.
 * Centralizado para no repetir la configuración en cada función.
 */
const crearTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

/**
 * Envía el email de verificación de cuenta al registrarse.
 */
export const enviarCorreoVerificacion = async (email: string, token: string) => {
  const transporter = crearTransporter()
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  try {
    const info = await transporter.sendMail({
      from: `"CineVault" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta",
      text: `Verificá tu cuenta entrando a: ${link}`,
      html: `
        <h1>Verifica tu cuenta</h1>
        <p>Haz clic en el enlace para verificar tu cuenta:</p>
        <a href="${link}">Verificar cuenta</a>
      `,
    })
    console.log("Correo de verificación enviado:", info.response)
  } catch (error) {
    console.error("Error al enviar correo de verificación:", error)
    throw error
  }
}

/**
 * Envía el email para restablecer la contraseña.
 */
export const enviarCorreoResetPassword = async (email: string, token: string) => {
  const transporter = crearTransporter()
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  try {
    await transporter.sendMail({
      from: `"CineVault" <${process.env.EMAIL_USER}>`,
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
  } catch (error) {
    console.error("Error al enviar correo de reset:", error)
    throw error
  }
}