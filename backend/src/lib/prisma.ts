/**
 * @file prisma.ts
 * @description Punto de entrada para el cliente de base de datos Prisma.
 * Configura el adaptador específico para MariaDB y exporta una instancia 
 * compartida (Singleton) del PrismaClient para todo el backend.
 */

import "dotenv/config"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@prisma/client"

/**
 * Configuración del adaptador MariaDB.
 * Utiliza variables de entorno para establecer la conexión con el servidor SQL.
 */
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "cinevault",
  connectionLimit: 5, // Límite de conexiones simultáneas en el pool
  allowPublicKeyRetrieval: true,
  ssl: {
    rejectUnauthorized: true,
  },
})

/**
 * Instancia global de PrismaClient.
 * Centraliza el acceso al ORM, asegurando un único pool de conexiones.
 */
const prisma = new PrismaClient({ adapter })

export { adapter, prisma }
