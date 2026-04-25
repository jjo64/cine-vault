# Fase 1: Febrero 2026 - Configuración, Despliegue y Autenticación (Semanas 1-2)

## Resumen de la Fase
El proyecto inicia bajo la premisa de establecer un entorno sólido y seguro. Se busca no solo iniciar el repositorio vacío, sino crear la arquitectura necesaria de autenticación que sostendrá a los futuros usuarios de la plataforma y probar el pipeline de despliegue en Vercel (Front) y Railway (Back).

## Implementaciones y Lógica
1. **Configuración Inicial y Dockerización**
   - **Lógica:** Desde el principio se buscó que la aplicación pudiera correr consistentemente, creando archivos base y dockerizando el proyecto para llevarlo luego a Railway.
2. **Sistema de Autenticación Riguroso**
   - **Registro y Verificación:** Se incorporó el registro por email con su respectiva comprobación y la eliminación inteligente en la BBDD de los usuarios que no se hayan verificado.
   - **OAuth y 2FA:** Se integró Google Login para un acceso ágil y autenticación multifactor (TOTP) para mejorar la seguridad a nivel bancario.
   - **Refresh Tokens:** Manejo persistente e invisible al usuario para su sesión utilizando refrescos de tokens JWT.
3. **Caché y Seguridad Activa**
   - **Redis y Rate Limit:** En previsión de posibles vulnerabilidades, se añade Redis para manejar la caché de peticiones, así como limitadores de picos de tráfico (rate limits) y una gestión centralizada de errores (Clase especializada).

## Errores Conocidos y Soluciones
- **Despliegues Interrumpidos en Railway:** "Intento 40mil de arreglar railway" documenta el obstáculo principal durante esta fase. Se solucionó iterando configuraciones de entorno y Docker hasta conseguir una "versión estable de cinevault".

## Próximos Pasos (Enlazado hacia Marzo)
Al conseguir una infraestructura que maneja usuarios, peticiones y cuenta con bases de datos estables, **el próximo paso** natural era empezar a construir lo que el usuario ve: **FrontEnd, Interfaces, Búsqueda y Rutas** (Implementado en la Fase 2).
