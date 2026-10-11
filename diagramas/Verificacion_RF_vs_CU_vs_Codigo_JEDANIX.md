# JEDANIX — Verificación de los 14 RF contra el diagrama de casos de uso y el código

**Qué se revisó:** diagrama de casos de uso (imagen `JEDANIX_Diagrama_CasosDeUso_4Actores.png`) y su especificación v2; backend Núcleo (routers y servicios), microservicio de Notificaciones y rutas/menús del frontend.
**Qué no se hizo:** no se ejecutó la aplicación en vivo; la verificación es por lectura del código.

## Resultado general

Los 14 RF están respaldados por el código y por los casos de uso. Se encontró **una inconsistencia en el diagrama** (CU-11) y **una brecha menor en el código** (tipos de pregunta de la bitácora).

## Matriz de trazabilidad

| RF | Caso de uso (diagrama) | Evidencia en el código | Resultado |
|---|---|---|---|
| RF-01 Autenticar y autorizar | Precondición general (no es óvalo, por decisión del proyecto) | `POST /auth/login`; JWT validado en `get_current_usuario` (rechaza cuentas inactivas); `requiere_rol` (403); `roleGuard` y menú por rol en el frontend | Cumple |
| RF-02 Administrar perfil | Gestionar Perfil (4 actores) | `GET/PUT /usuarios/me` (nombre, celular, foto, dirección, grupo sanguíneo, RH, EPS); pantalla `perfil` con carga de foto | Cumple |
| RF-03 Administrar usuarios | CU-01 (Director) | `POST/GET/PUT /usuarios`, `PATCH …/inactivar`, `PATCH …/reactivar`, `POST …/reenviar-credenciales`; correo único; programa del estudiante; contraseña temporal; evento `usuario.creado`; advertencias con confirmación al cambiar rol o inactivar | Cumple |
| RF-04 Parametrizar empresas | CU-02 (Director) | `POST/GET/PUT /empresas`, preguntas y documentos requeridos (alta, edición, baja), `PATCH …/inactivar`; horas, teléfono y dirección en el modelo; Coordinador y Docente por empresa | Cumple (ver brecha 1) |
| RF-05 Postular | CU-06 (Estudiante) | `POST /postulaciones`, `PUT /{id}` (borrador), `POST /{id}/enviar`, `GET /me`; una sola postulación activa; PDF hasta 10 MB; vistas Documentos, Bitácora y Estado | Cumple |
| RF-06 Dictaminar solicitudes | CU-03 (Director) | `GET /postulaciones/pendientes`, `PATCH /{id}/decision` (aprobar o rechazar con motivo obligatorio); eventos `postulacion.aprobada` y `postulacion.rechazada` | Cumple |
| RF-07 Consultar práctica | CU-07 (Estudiante) | Ruta `/estudiante/mi-practica` (empresa con teléfono y dirección, horas, % de avance, estado de objetivos) | Cumple |
| RF-08 Formular objetivos | CU-11 (Estudiante y Docente Asesor) | `POST /objetivos`, `GET /objetivos/me`, `GET /objetivos/pendientes`, `PATCH /{id}/decision` (observación obligatoria al rechazar; los APROBADOS no se editan); `avance_service` bloquea avances si los objetivos no están APROBADOS | Cumple en código; **el diagrama está desactualizado** (ver inconsistencia) |
| RF-09 Reportar avances | CU-08 (Estudiante) | `POST /avances` (práctica matriculada, objetivos aprobados, una semana única, corrección de OBSERVADO), `GET /avances/me`; soportes PDF/PNG/JPG hasta 10 MB; plazo y «No reportada» en `semana.ts` | Cumple |
| RF-10 Evaluar avances | CU-09 (Coordinador) | `GET /avances/coordinador`, `PATCH /{id}/calificacion` (calificar → ACEPTADO u observar → OBSERVADO, recalificar) | Cumple |
| RF-11 Asesorar avances | CU-10 (Docente Asesor) | `GET /avances/docente`, `PATCH /{id}/observacion` (no cambia el estado); evento `avance.observacion_docente` | Cumple |
| RF-12 Monitorear matriculados | CU-04 (Director) | `GET /postulaciones/matriculados`, `GET /avances/postulacion/{id}`; frontend con lista, filtro por empresa, % de horas y detalle | Cumple |
| RF-13 Formalizar cierre | CU-05 (Director) | `PATCH /postulaciones/{id}/cierre`: aprobar exige horas aceptadas ≥ requeridas y pasa a FINALIZADA con `fecha_cierre`; rechazar exige observación, guarda `fecha_rechazo_cierre` y exige avances nuevos antes de volver a cerrar | Cumple |
| RF-14 Notificar | Transversal | Núcleo → `POST /eventos` con `X-API-Key`, sin bloquear la operación; 15 plantillas de evento (usuario, postulación, práctica, avance, objetivos); envío por Brevo; estados PENDIENTE/ENVIADA/FALLIDA; job de reintentos cada 60 s con máximo 5 intentos; reenvío manual | Cumple |

## Cobertura inversa (diagrama → RF)

Los 12 óvalos del diagrama quedan cubiertos: Gestionar Perfil → RF-02; CU-01 → RF-03; CU-02 → RF-04; CU-03 → RF-06; CU-04 → RF-12; CU-05 → RF-13; CU-06 → RF-05; CU-07 → RF-07; CU-08 → RF-09; CU-09 → RF-10; CU-10 → RF-11; CU-11 → RF-08. No hay ningún RF sin caso de uso ni caso de uso sin RF.

## Inconsistencia encontrada en el diagrama

**CU-11 en la imagen del diagrama no coincide con la especificación v2 ni con el código.**
- En la imagen se llama «Aprobar Objetivos del Estudiante» y está conectado al Docente Asesor **y al Coordinador de Práctica**; el Estudiante no está conectado.
- La especificación v2 y el código dicen: se llama «Gestionar Objetivos de la Práctica», participan el **Estudiante** (formula y reenvía) y el **Docente Asesor** (aprueba o rechaza), y el Coordinador no interviene (`PATCH /objetivos/{id}/decision` solo admite al Docente Asesor).
- **Corrección propuesta:** renombrar el óvalo, quitar la línea al Coordinador y agregar la del Estudiante. Esto no se pudo comprobar en el archivo de Astah, solo en la imagen; conviene revisar también el `.asta`.

## Brechas menores en el código

1. **Tipos de pregunta de la bitácora.** El modelo y el formulario del Director aceptan «selección única» y «selección múltiple», pero no existe dónde guardar la lista de opciones; en la práctica todas las preguntas son de texto libre. No afecta los RF (RF-04 solo dice «bitácora de postulación»).
2. **Observaciones de la bitácora anterior ya resueltas.** El borrador editable (`PUT /postulaciones/{id}`), el teléfono y la dirección de la empresa y el rechazo temporal del cierre (`fecha_rechazo_cierre`) ya existen en el código; los puntos 1 a 3 de la sección «Observaciones» del documento de RF detallado quedaron obsoletos.

## Recomendación

Corregir el óvalo de CU-11 en el diagrama y mantener los 14 RF tal como están.
