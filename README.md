# 🎬 Cinevault: Registro y Descubrimiento Cinematográfico

¡Hola equipo! 👋 Este es nuestro proyecto para Cinevault. Acá les dejo los pasos detallados para que puedan hacerlo andar en sus máquinas sin problemas. Sigan este orden:

## 🚀 Cómo empezar (Paso a paso)

### 1. Clonar y preparar las carpetas
Primero que nada, una vez que tengan el código, tienen que instalar todas las librerías porque la carpeta `node_modules` no se sube al repo.

*   **Para el Backend:** Entren en la carpeta `backend` desde la terminal y ejecuten:
    ```bash
    npm install
    ```
*   **Para el Frontend:** Entren en la carpeta `frontend` y hagan lo mismo:
    ```bash
    npm install
    ```

### 2. Configurar las variables de entorno
Chicas, esto es **MUY IMPORTANTE**. El servidor no va a arrancar si no tiene sus credenciales.
1.  Vayan a la carpeta `backend`.
2.  Busquen el archivo `.env.example`.
3.  Hagan una copia de ese archivo y cámbienle el nombre a solo `.env`.
4.  Abran ese nuevo `.env` y rellenen los datos:
    *   **API_KEY_TMDB:** Tienen que ponerse la suya de TheMovieDB.
    *   **DATABASE_URL:** Asegúrense de que coincida con su usuario y password de MySQL (usualmente es `root` y sin contraseña en XAMPP).
    *   **JWT_SECRET:** Pongan cualquier palabra larga, es para que el login funcione.

### 3. Preparar la Base de Datos (Prisma)
Como usamos Prisma, tienen que "sincronizar" el modelo con su base de datos local. En la carpeta `backend`, ejecuten:
```bash
npx prisma generate
npx prisma db push
```
Esto va a crear las tablas automáticamente en su MySQL.

### 4. ¡A correr el proyecto!
Ahora sí, para ver la magia:
*   **Backend:** `npm run dev` (dentro de la carpeta backend).
*   **Frontend:** `npm run dev` (dentro de la carpeta frontend).

---

## 🏗️ Sobre el Proyecto
Cinevault es una plataforma social para amantes del cine. Está construido con:
- **Backend:** Node.js + Express + TypeScript + Prisma.
- **Frontend:** React + Vite + TypeScript.
- **Aesthetics:** Diseño premium "Black & Gold Elegance".

### Comandos útiles (Backend)
- `npm run dev`: Arranca el servidor con cambios en tiempo real.
- `npm run stop`: Mata los procesos de Node (solo en Windows).

---

## ⚠️ Notas importantes
- **¿Error con el .env?** Si el servidor les dice que falta una variable, revisen que el nombre del archivo sea exactamente `.env` y no `.env.txt`.
- **¿Error de Prisma?** Asegúrense de tener el XAMPP (MySQL) prendido antes de hacer el `db push`.

¡Cualquier duda me avisan! 🎬✨
