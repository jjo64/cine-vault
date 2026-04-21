/**
 * @file claudinary.config.ts
 * @description Configuración centralizada de Cloudinary para CineVault.
 * Gestiona la conexión con el servicio de almacenamiento en la nube para 
 * avatares, posters y capturas de los usuarios.
 */

import { v2 as cloudinary } from "cloudinary"

// Se configura el SDK utilizando variables de entorno para seguridad.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
