# Guía — Diagramas de secuencia de JEDANIX (casos de uso de la demo)

Imágenes (PNG y PDF) en `JEDANIX\diagramas\` y `JEDANIX\diagramas\pdf\`:
`CU01_Crear_Usuario`, `CU02_Registrar_Empresa`, `CU03_Aprobar_Matricula`, `CU08_Registrar_Avance`, `CU09_CU10_Revisar_Avances`, `CU11_Objetivos`.

Los 6 ya están **dentro de Astah**: archivo `diagramas\prototipo2_completo_JEDANIX_v2.asta`, paquete `jedanix → secuencias`.

## Participantes (iguales en todos)

| Participante | Qué representa |
|---|---|
| Actor (Director / Coordinador / Docente Asesor / Estudiante) | Persona que usa la web |
| SPA Angular | Frontend en Cloudflare Pages |
| Router FastAPI | Endpoints del Núcleo (valida JWT y rol) |
| Servicio (UsuarioService, PostulacionService…) | Reglas de negocio |
| PostgreSQL jedanix_nucleo | Base de datos del Núcleo (Neon) |
| Servicio de Notificaciones | Microservicio Express: guarda el evento y envía el correo |
| Brevo | Proveedor del correo (HTTPS) |

## Qué muestra cada diagrama

| Diagrama | Flujo principal | Alternativas incluidas |
|---|---|---|
| CU-01 Crear usuario | `POST /usuarios` → contraseña temporal (bcrypt) → INSERT → evento `usuario.creado` | 422 datos inválidos, 409 correo duplicado, falla de correo → «Reenviar credenciales» |
| CU-02 Registrar empresa | `POST /empresas` en una sola transacción (empresa + preguntas de bitácora + documentos) | 422 campos/responsables/preguntas, ROLLBACK si se cae la BD |
| CU-03 Aprobar matrícula | `GET /postulaciones/pendientes` → detalle → `PATCH …/decision` → evento aprobada/rechazada | 409 ya matriculado en otra empresa, 422 motivo vacío, 422 ya decidida |
| CU-08 Registrar avance | Subida de soportes `POST /archivos` → `POST /avances` → evento `avance.registrado` | Archivo inválido o >10 MB, horas ≠ suma diaria, sin práctica MATRICULADA, objetivos sin aprobar, semana duplicada, corrección de avance OBSERVADO |
| CU-09 / CU-10 | A: Coordinador califica (0.0–5.0) u observa. B: Docente Asesor observa (no cambia el estado) | 403 estudiante de otro coordinador/docente, 422 nota fuera de rango, comentario vacío |
| CU-11 Objetivos | A: Estudiante envía. B: Docente Asesor aprueba o rechaza con observación | Ya aprobados, no matriculado, observación vacía al rechazar, reenvío tras rechazo |

**Subsecuencia de correo (se repite al final de cada diagrama):** el Núcleo llama `POST /eventos` con `X-API-Key` en un hilo aparte (no espera) → Notificaciones inserta PENDIENTE y responde `202` → arma la plantilla → `POST /v3/smtp/email` a Brevo → ENVIADA, o FALLIDA y el job de reintentos (cada 60 s, máx. 5).

## Cómo leer los diagramas (convenciones)

- Flecha continua = llamada; flecha de vuelta = respuesta (en Astah todas se ven continuas).
- Flecha con punta abierta = mensaje asíncrono (el evento a Notificaciones).
- Recuadro `alt` = una u otra rama; `opt` = opcional; `loop` = repetición.
- Cuadro amarillo = nota. «Seguridad: valida JWT y rol» resume la dependencia `requiere_rol` (401 / 403).

## Si quieres rehacer uno a mano en Astah

1. Clic derecho en el paquete → *Create Diagram* → *UML Diagrams* → **Sequence Diagram**.
2. Herramienta *Lifeline*: una por participante, en el orden de la tabla.
3. Herramienta *Message*: de izquierda a derecha, de arriba abajo, escribiendo el texto de la imagen.
4. Herramienta *Combined Fragment*: elige `alt`, `opt` o `loop`; escribe la condición como *Guard*.
5. Herramienta *Note* para las aclaraciones.

## Qué decir al exponer (30 s por diagrama)

- **CU-01:** «El Director crea la cuenta; el sistema genera una contraseña temporal, la guarda cifrada y avisa por correo sin hacer esperar al usuario.»
- **CU-03:** «Solo se aprueba si el estudiante no está matriculado en otra empresa; al decidir, el estudiante recibe un correo.»
- **CU-08:** «Un avance solo se registra con práctica matriculada y objetivos aprobados; el correo a coordinador y docente sale en segundo plano.»
