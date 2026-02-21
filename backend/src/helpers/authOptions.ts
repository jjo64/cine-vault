import "dotenv/config"
import nodemailer from "nodemailer"
import { prisma } from "../lib/prisma.js"

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export async function enviarCorreoVerificacion(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: `"Cine Vault" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifica tu cuenta",
    text: `Haz clic en el enlace para verificar tu cuenta: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    html: `
      <h1>Verifica tu cuenta</h1>
      <p>Haz clic en el enlace para verificar tu cuenta:</p>
      <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verificar cuenta</a>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo enviado:", info.response)
  } catch (error) {
    console.error("Error al enviar correo:", error)
    throw error
  }
}

export async function limpiarUsuariosNoVerificados() {
  try {
    const eliminados = await prisma.users.deleteMany({
      where: {
        is_verified: false,
        created_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (eliminados.count > 0)
      console.log(
        `Limpieza: ${eliminados.count} usuarios no verificados eliminados`
      )
  } catch (error) {
    console.error("Error en limpieza de usuarios no verificados:", error)
    // No relanzamos el error — si falla, el próximo ciclo lo intentará
  }
}

export const enviarCorreoResetPassword = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

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
}
