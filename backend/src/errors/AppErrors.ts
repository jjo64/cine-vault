/**
 * @file AppErrors.ts
 * @description Jerarquía de clases de error personalizadas para CineVault.
 * Permite una gestión semántica de las excepciones en toda la API, 
 * facilitando que el middleware global de errores devuelva el código HTTP 
 * y el mensaje apropiado al cliente.
 */

/**
 * Clase base para todos los errores controlados de la aplicación.
 */
export class ApplicationError extends Error {
  /**
   * @param message - Mensaje descriptivo del error.
   * @param statusCode - Código de estado HTTP correlativo.
   * @param code - Código alfanumérico único para identificación (ej: "NOT_FOUND").
   */
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message)
    this.name = this.constructor.name
    // Asegura que el stack trace apunte a la instancia correcta sin incluir el constructor.
    Error.captureStackTrace(this, this.constructor)
  }
}

/** Error 400 - Los datos de la petición son inválidos o no cumplen el esquema. */
export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

/** Error 401 - El usuario no está autenticado o sus credenciales son inválidas. */
export class UnauthorizedError extends ApplicationError {
  constructor(message = "No autorizado") {
    super(message, 401, "UNAUTHORIZED")
  }
}

/** Error 403 - El usuario está autenticado pero no posee los privilegios requeridos. */
export class ForbiddenError extends ApplicationError {
  constructor(message = "Acceso prohibido") {
    super(message, 403, "FORBIDDEN")
  }
}

/** Error 404 - El recurso solicitado (entidad de DB o endpoint) no existe. */
export class NotFoundError extends ApplicationError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404, "NOT_FOUND")
  }
}

/** Error 409 - La operación entra en conflicto con el estado actual del servidor (ej: duplicados). */
export class ConflictError extends ApplicationError {
  constructor(message = "Conflicto con un recurso existente") {
    super(message, 409, "CONFLICT")
  }
}

/** Error 410 - El recurso existió pero ya no está disponible (ej: tokens expirados). */
export class GoneError extends ApplicationError {
  constructor(message = "El recurso ha expirado o ya no está disponible") {
    super(message, 410, "GONE")
  }
}

/** Error 429 - Se ha superado el límite de peticiones permitido por el rate-limit. */
export class TooManyRequestsError extends ApplicationError {
  constructor(message = "Demasiadas solicitudes. Intenta nuevamente más tarde") {
    super(message, 429, "TOO_MANY_REQUESTS")
  }
}
