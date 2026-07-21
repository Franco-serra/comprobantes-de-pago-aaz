# Comprobantes de pago · A.A.Z. Aerocontrolados Zárate

Generador de recibos de pago con número correlativo automático.
Backend y frontend van juntos, en un solo servicio de Render.
Los datos se guardan en Turso (base de datos SQLite en la nube,
plan gratis, no vence, no pide tarjeta).

## Estructura

- `server.js` — backend (Node + Express). Sirve la página y la API
  que asigna el número de recibo.
- `public/` — el sitio (HTML, CSS, JS, logo).
- La base de datos vive en Turso, no en un archivo local — por eso
  no hay carpeta `data/` ni depende de discos persistentes del
  hosting.

## Paso 1 — Crear la base de datos en Turso (una sola vez)

1. Entrá a https://turso.tech y creá una cuenta gratis (no pide
   tarjeta).
2. Instalá su CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. Iniciá sesión:
   ```bash
   turso auth login
   ```
4. Creá la base:
   ```bash
   turso db create aaz-recibos
   ```
5. Conseguí la URL de conexión:
   ```bash
   turso db show aaz-recibos --url
   ```
   Vas a obtener algo como `libsql://aaz-recibos-tuusuario.turso.io`
   — guardalo.
6. Generá el token de acceso:
   ```bash
   turso db tokens create aaz-recibos
   ```
   Esto te da un token largo — guardalo también (no lo vuelve a
   mostrar, si lo perdés generás uno nuevo con el mismo comando).

*(También podés hacer estos mismos pasos desde la web de Turso, sin
instalar el CLI, si preferís.)*

## Paso 2 — Subir el proyecto a GitHub

Este proyecto ya viene con un repositorio git inicializado y el
primer commit hecho, así que solo falta conectarlo a GitHub:

1. Creás un repositorio nuevo (vacío, sin README) en
   https://github.com/new — por ejemplo `aaz-recibos`.
2. Copiás la URL que te da GitHub y corrés, dentro de esta carpeta:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/aaz-recibos.git
   git branch -M main
   git push -u origin main
   ```

## Paso 3 — Crear el servicio en Render

Este proyecto ya trae un archivo `render.yaml`, así que Render puede
configurar todo solo (Blueprint):

1. Entrá a https://render.com y creá una cuenta gratis.
2. "New" → "Blueprint" → conectá tu repositorio de GitHub.
3. Render va a detectar el `render.yaml` y te va a pedir que cargues
   los dos valores marcados como secretos:
   - `TURSO_DATABASE_URL` → la URL que sacaste en el paso 1 (punto 5)
   - `TURSO_AUTH_TOKEN` → el token que sacaste en el paso 1 (punto 6)
4. "Apply". Render instala, arranca el server, y te da una URL
   pública (algo como `https://aaz-recibos.onrender.com`). Esa es la
   dirección que le pasás al club.

*(Si preferís hacerlo a mano en vez de usar el Blueprint: "New" →
"Web Service", Environment "Node", Build Command `npm install`,
Start Command `npm start`, Plan "Free", y cargás las mismas dos
variables de entorno en la sección "Environment Variables".)*

## Sobre el plan gratis de Render

El plan Free "duerme" el servicio después de ~15 minutos sin uso —
la primera visita después de eso tarda unos segundos extra en
responder mientras se despierta. Es normal y no afecta los datos:
como la base vive en Turso (no en el disco de Render), el contador
de recibos nunca se pierde, aunque el servicio se reinicie.

## Probarlo en tu compu antes de subirlo

Creás un archivo `.env` en la raíz del proyecto (no lo subas a
GitHub) con:

```
TURSO_DATABASE_URL=libsql://tu-base.turso.io
TURSO_AUTH_TOKEN=tu-token
```

Y corrés:

```bash
npm install
node -r dotenv/config server.js
```

(Si no tenés `dotenv` instalado: `npm install dotenv`, o simplemente
exportá las variables a mano antes de correr `npm start`.)

## Endpoints de la API (por si querés armar un panel más adelante)

- `POST /api/recibos` → registra un recibo nuevo y devuelve el número.
- `GET /api/recibos` → lista todos los recibos emitidos, más nuevo primero.
- `GET /api/recibos/:numero` → devuelve un recibo puntual (para
  reimprimir, por ejemplo).
