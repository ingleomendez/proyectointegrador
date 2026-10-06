# JEDANIX — Microservicio de Notificaciones

Segundo servicio de la arquitectura SOA (ver `Arquitectura_JEDANIX_v2.md`): **Node.js + Express + PostgreSQL propio**.
No conoce las reglas de negocio de las prácticas: el **Núcleo de Prácticas** (FastAPI) le avisa de cada evento relevante con una
llamada HTTP no bloqueante, y este servicio arma el correo, lo envía y guarda el resultado.

## Puesta en marcha (Windows)

1. **Crear la base de datos** (pgAdmin → Query Tool, conectado a `postgres`):

   ```sql
   CREATE DATABASE jedanix_notificaciones OWNER jedanix_user;
   ```

   (Usa el mismo usuario `jedanix_user` del Núcleo. La tabla se crea sola al arrancar el servicio.)

2. **Instalar dependencias** (una sola vez, dentro de esta carpeta):

   ```
   npm install
   ```

3. **Crear el archivo `.env`** copiando `.env.example` y ajustando lo que haga falta:

   ```
   copy .env.example .env
   ```

4. **Arrancar**:

   ```
   npm start
   ```

   Debe mostrar `JEDANIX Notificaciones escuchando en http://localhost:4000`. El Núcleo ya apunta a ese puerto
   (`NOTIFICACIONES_SERVICE_URL=http://localhost:4000`).

Con `npm run dev` el servicio se reinicia solo al guardar cambios. `npm test` corre las pruebas de las plantillas.

## Correo: modo simulado o SMTP real

- **Sin `SMTP_HOST`** (por defecto): **modo simulado**. No sale ningún correo real; cada mensaje se imprime en la consola de este servicio y
  queda registrado como `ENVIADA` con canal `SIMULADO`. Así puedes ver, por ejemplo, la **contraseña temporal** de un usuario recién creado
  (CU-01) en la consola de Notificaciones.
- **Con `SMTP_HOST`**: envía correos reales con Nodemailer (canal `SMTP`). Ejemplo con Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
  `SMTP_SECURE=false`, `SMTP_USER=tu-correo@gmail.com`, `SMTP_PASS=<contraseña de aplicación>`.

## Seguridad entre servicios

Por defecto cualquiera que llegue al puerto 4000 puede enviar eventos. Para restringirlo al Núcleo, define la **misma** clave en los dos `.env`:

- En `jedanix-notificaciones/.env`: `NOTIFICACIONES_API_KEY=una-clave-larga-y-aleatoria`
- En `jedanix-nucleo-practicas/.env`: `NOTIFICACIONES_API_KEY=una-clave-larga-y-aleatoria`

El Núcleo la envía en la cabecera `X-API-Key`; sin ella (o con otra) este servicio responde **401** en `/eventos` y `/notificaciones`.
`/salud` queda abierta para monitoreo. Reinicia ambos servicios tras cambiarla.

## API

| Método y ruta | Quién la usa | Descripción |
|---|---|---|
| `POST /eventos` | Núcleo de Prácticas | Body `{ "evento", "destinatario_correo", "datos": {} }`. Registra la notificación como `PENDIENTE`, responde **202** y envía en segundo plano. **400** si el evento o el correo no son válidos. |
| `GET /eventos/tipos` | Depuración | Lista los eventos soportados. |
| `GET /notificaciones?estado=&correo=&limite=` | Depuración / Director | Historial (sin datos sensibles). |
| `POST /notificaciones/:id/reenviar` | CU-01 19.1.a | Reenvío manual de una notificación `FALLIDA`. |
| `GET /salud` | Monitoreo | Estado del servicio, de la base de datos y del modo de correo. |

Los errores usan el mismo formato que el Núcleo: `{ "detail": "..." }`.

## Eventos soportados (14)

| Evento | Destinatario | CU |
|---|---|---|
| `usuario.creado` (datos: `nombre_completo`, `password_temporal`) | Usuario nuevo | CU-01 |
| `usuario.credenciales_reenviadas` (datos: `nombre_completo`, `password_temporal`) | Reenvío manual de credenciales | CU-01 (19.1.a) |
| `usuario.reactivado` | Usuario reactivado | CU-01 |
| `postulacion.enviada` (datos: `empresa`) | Director(es) | CU-06 |
| `postulacion.aprobada` / `postulacion.rechazada` (datos: `motivo`) | Estudiante | CU-03 |
| `practica.cerrada` / `practica.cierre_rechazado` (datos: `observacion`) | Estudiante, Coordinador, Docente Asesor / Estudiante | CU-05 |
| `avance.registrado` | Coordinador y Docente Asesor | CU-08 |
| `avance.calificado` / `avance.observado` | Estudiante | CU-09 |
| `avance.observacion_docente` | Estudiante | CU-10 |
| `objetivos.pendientes` (datos: `estudiante`) | Docente Asesor | CU-11 |
| `objetivos.aprobados` / `objetivos.rechazados` | Estudiante | CU-11 |

Los `datos` son opcionales: si el Núcleo no los manda, el correo igual sale con un texto genérico.

## Estados y reintentos

`PENDIENTE` (recibida) → `ENVIADA` o `FALLIDA`. Un job interno revisa cada `REINTENTOS_INTERVALO_SEGUNDOS` (60 s por defecto) y
reintenta las `FALLIDA` con espera creciente (30 s × nº de intentos), hasta `REINTENTOS_MAX_INTENTOS` (5). También rescata las
`PENDIENTE` que quedaron sin enviar si el servicio se reinició. Tras un envío exitoso se **borra la contraseña temporal** de la base de datos.

Si este servicio está caído justo cuando el Núcleo lo llama, esa notificación puntual se pierde (decisión consciente al simplificar
la arquitectura sin cola de mensajes; ver sección "Comunicación entre servicios" de `Arquitectura_JEDANIX_v2.md`).

## Estructura

```
src/
  index.js                      arranque (esquema, servidor, job de reintentos)
  app.js                        Express: rutas, errores { detail }
  config.js  db.js              configuración (.env) y pool de PostgreSQL
  middleware/claveInterna.js    clave compartida con el Núcleo (X-API-Key)
  routes/eventos.js             POST /eventos
  routes/notificaciones.js      historial y reenvío manual
  services/plantillas.js        motor de plantillas (un mensaje por evento)
  services/mailer.js            Cliente de Envío (SMTP o simulado)
  services/notificacionService.js   registro, envío, estados
  jobs/reintentos.js            job de reintentos
sql/schema.sql                  tabla notificaciones (idempotente)
test/plantillas.test.js, test/claveInterna.test.js
```
