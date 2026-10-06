# Despliegue gratuito de JEDANIX en la nube

Resultado final: una URL pública (`https://….pages.dev`) que funciona desde cualquier computador.

| Pieza | Dónde vive | Costo |
|---|---|---|
| Frontend Angular | Cloudflare Pages | gratis |
| Núcleo de Prácticas (FastAPI) | Render (Web Service, plan Free) | gratis |
| Notificaciones (Node/Express) | Render (Web Service, plan Free) | gratis |
| Base de datos `jedanix_nucleo` y `jedanix_notificaciones` | Neon (2 proyectos Postgres) | gratis |
| Envío de correos | Brevo (API HTTPS, 300 correos/día) | gratis |

> Por qué Brevo y no Gmail: Render gratis **bloquea los puertos SMTP** (25/465/587), así que Gmail SMTP no funciona desde la nube. Brevo envía por HTTPS (puerto 443). En tu PC sigues pudiendo usar Gmail SMTP.
> Por qué archivos en la base de datos: el disco de Render gratis se borra en cada reinicio; ahora los PDF y soportes se guardan en la tabla `archivos_subidos`.

Tiempo estimado: 40–60 minutos la primera vez. Haz los pasos en orden.

---

## Paso 1 — Bases de datos en Neon (https://neon.com)

1. Crea cuenta (puedes entrar con GitHub o Google; no pide tarjeta).
2. Crea un proyecto llamado `jedanix-nucleo` (región AWS más cercana, p. ej. US East). Postgres 16 o 17.
3. En el panel del proyecto pulsa **Connect** y copia la cadena de conexión (`postgresql://usuario:clave@ep-xxxx.neon.tech/neondb?sslmode=require`). Guárdala en un bloc de notas como **URL_NUCLEO**.
4. Crea **otro** proyecto llamado `jedanix-notificaciones` y copia su cadena como **URL_NOTIF**.

No necesitas crear tablas: el Núcleo corre las migraciones solo al arrancar y Notificaciones crea su tabla sola.

## Paso 2 — Correo con Brevo (https://www.brevo.com)

1. Crea cuenta gratuita.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: nombre `JEDANIX`, correo `antiyakecho@gmail.com`. Brevo te manda un código de 6 dígitos a ese Gmail; escríbelo para verificarlo.
3. **SMTP & API → API Keys → Generate a new API key** (nombre `jedanix`). Cópiala (empieza con `xkeysib-…`) como **BREVO_KEY**. No la pegues en el chat ni en el repositorio.
4. Nota: al enviar desde una dirección Gmail, algunos correos pueden caer en **spam**; pide a quien pruebe que revise esa carpeta.

## Paso 3 — Genera 2 secretos

En CMD (necesitas Python instalado, que ya tienes):

```
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Ejecútalo dos veces. El primer resultado es **SECRET_KEY** (firma de sesiones) y el segundo es **API_KEY_INTERNA** (clave entre Núcleo y Notificaciones). Guárdalos en el bloc de notas.

## Paso 4 — Sube los cambios a GitHub

```
cd C:\Users\USUARIO\OneDrive\Documentos\JEDANIX
git add -A
git commit -m "Preparar despliegue en la nube (Render, Neon, Cloudflare, Brevo)"
git push origin main
```

## Paso 5 — Render (https://render.com)

1. Crea cuenta con GitHub y autoriza el repositorio `proyectointegrador`.
2. **New → Blueprint** → elige el repositorio. Render lee `render.yaml` y propone 2 servicios (`jedanix-nucleo` y `jedanix-notificaciones`).
3. Te pide las variables marcadas como secretas. Llénalas así:

**jedanix-nucleo**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL_NUCLEO |
| `SECRET_KEY` | SECRET_KEY |
| `NOTIFICACIONES_SERVICE_URL` | `https://jedanix-notificaciones.onrender.com` (si Render te asigna otro nombre, lo corriges luego, ver paso 7) |
| `NOTIFICACIONES_API_KEY` | API_KEY_INTERNA |
| `CORS_ORIGINS` | por ahora `http://localhost:4200` (se cambia en el paso 7) |
| `DIRECTOR_CORREO` | el correo del Director, p. ej. `director@udi.edu.co` |
| `DIRECTOR_NOMBRE` | `Director JEDANIX` |
| `DIRECTOR_PASSWORD` | una contraseña de mínimo 8 caracteres (será la inicial del Director) |

**jedanix-notificaciones**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL_NOTIF |
| `NOTIFICACIONES_API_KEY` | API_KEY_INTERNA (la misma de arriba) |
| `BREVO_API_KEY` | BREVO_KEY |
| `MAIL_FROM` | `JEDANIX <antiyakecho@gmail.com>` |
| `FRONTEND_URL` | por ahora `http://localhost:4200` (se cambia en el paso 7) |

4. Pulsa **Apply / Create**. El primer despliegue tarda 5–10 min. Cuando ambos digan **Live**, copia la URL de cada uno.
5. Prueba en el navegador: `https://<tu-nucleo>.onrender.com/health` debe responder `{"status":"ok"}` y `https://<tu-notificaciones>.onrender.com/salud` también responde ok.

## Paso 6 — Frontend en Cloudflare Pages (https://dash.cloudflare.com)

1. Abre `jedanix-frontend/src/environments/environment.prod.ts` y cambia `apiUrl` por la URL real del Núcleo (sin `/` final). Luego:

```
git add -A
git commit -m "URL de produccion del Nucleo"
git push origin main
```

2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** → repositorio `proyectointegrador`.
3. Configuración de build:

| Campo | Valor |
|---|---|
| Framework preset | None |
| Root directory | `jedanix-frontend` |
| Build command | `npm run build` |
| Build output directory | `dist/jedanix-frontend/browser` |
| Variable de entorno | `NODE_VERSION` = `22` |

4. **Save and Deploy**. Al terminar tendrás una URL `https://<nombre>.pages.dev`.

## Paso 7 — Conectar las piezas

En Render:

- `jedanix-nucleo` → Environment → `CORS_ORIGINS` = `https://<nombre>.pages.dev` (sin `/` final).
- `jedanix-notificaciones` → Environment → `FRONTEND_URL` = `https://<nombre>.pages.dev`.
- Si la URL real de Notificaciones es distinta a la que pusiste, corrige `NOTIFICACIONES_SERVICE_URL` en el Núcleo.

Guardar reinicia los servicios. Abre `https://<nombre>.pages.dev`, entra con el Director (correo y contraseña del paso 5) y crea un usuario de prueba: debe llegarle el correo con la contraseña temporal.

## Datos de la demo

La base de datos de Neon nace **vacía** (solo existe el Director). Antes de presentar, entra como Director y crea: empresas receptoras (con preguntas de bitácora y documentos), un Coordinador, un Docente Asesor y un Estudiante. Los datos de tu PC no se copian solos.

## Qué esperar del plan gratuito (importante para la presentación)

- **Servicios dormidos:** Render duerme los servicios tras 15 min sin tráfico y tardan ~1 minuto en despertar. **15 minutos antes de presentar**, abre en el navegador `…/health` del Núcleo y `…/salud` de Notificaciones, y luego entra a la aplicación; así la demo va fluida.
- **No uses un ping 24/7:** Render da 750 horas/mes **en total** para el workspace; dos servicios siempre despiertos las superan. Si quieres mantenerlos despiertos, hazlo solo el día de la presentación.
- **Neon** también duerme la base tras 5 min, pero despierta en menos de 1 segundo.
- El plan gratuito de Render permite pocos recursos: cargas grandes de archivos (máx. 10 MB por archivo) funcionan, pero con calma.

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El login muestra error de red / CORS en la consola del navegador | `CORS_ORIGINS` no coincide con la URL de Pages, o `apiUrl` apunta mal | Revisa ambos; sin `/` final, con `https://` |
| El Núcleo queda "Deploy failed" | Falta alguna variable o `DATABASE_URL` mal copiada | Mira **Logs** en Render; el error sale justo antes del fallo |
| Crear usuario funciona pero no llega el correo | `BREVO_API_KEY` o remitente sin verificar; o `NOTIFICACIONES_API_KEY` distinta en los dos servicios | Logs de `jedanix-notificaciones` (busca "Brevo respondió …" o 401); revisa spam |
| El primer clic del día tarda ~1 min | Servicio dormido | Normal en plan gratuito; calienta antes de presentar |
| Los PDF de postulaciones no abren | Migración no aplicada | En los logs del Núcleo debe verse `Running upgrade … archivos subidos` |
| Pages falla al compilar | Falta `NODE_VERSION=22` | Agrégala y reintenta el despliegue |
