# Guía — Diagramas de estados de JEDANIX

Imágenes (PNG y PDF) en `JEDANIX\diagramas\` y `JEDANIX\diagramas\pdf\`: `E1_Postulacion`, `E2_Avance`, `E3_Objetivos`, `E4_Notificacion`.

Los 4 ya están **dentro de Astah**: `diagramas\prototipo2_completo_JEDANIX_v2.asta`, paquete `jedanix → estados`.

Los estados y las reglas salen del código real (servicios `postulacion_service`, `avance_service`, `objetivo_service` y `notificacionService`).

## E1 — Postulación (tabla `postulaciones.estado`)

| Estado | Significado | Sale hacia |
|---|---|---|
| BORRADOR | El estudiante guardó sin enviar (se puede modificar) | PENDIENTE_DE_APROBACION al enviar |
| PENDIENTE_DE_APROBACION | Espera al Director | APROBADA (acepta) o RECHAZADA (rechaza con motivo) |
| APROBADA | En pantalla es **MATRICULADO**; habilita Objetivos y Avances | FINALIZADA (cierre aprobado) o se queda en APROBADA si el Director rechaza el cierre |
| RECHAZADA | Final; guarda el motivo | — |
| FINALIZADA | Final; guarda la fecha de cierre | — |

Reglas clave: al aceptar no puede haber otra práctica aprobada del mismo estudiante (409); el cierre exige horas aceptadas ≥ horas requeridas; solo se permite UNA postulación activa (borrador, pendiente o aprobada).

## E2 — Avance semanal (`avances_semanales.estado`)

| Estado | Significado |
|---|---|
| PENDIENTE_DE_REVISION | Recién enviado, espera al Coordinador |
| ACEPTADO | Calificado (0.0 a 5.0); sus horas cuentan como oficiales |
| OBSERVADO | El Coordinador dejó un comentario; el estudiante debe corregir |

Transiciones: PENDIENTE → ACEPTADO u OBSERVADO; OBSERVADO → PENDIENTE (el estudiante corrige y reenvía, misma fila); ACEPTADO → ACEPTADO (recalificar) o → OBSERVADO. **La observación del Docente Asesor no cambia el estado.**

## E3 — Objetivos (`objetivos_practica.estado`)

PENDIENTE_DE_APROBACION → APROBADOS (el Docente Asesor aprueba) o RECHAZADOS (con observación obligatoria). RECHAZADOS → PENDIENTE (el estudiante corrige y reenvía). APROBADOS es de solo lectura y habilita registrar avances.

## E4 — Notificación (`notificaciones.estado`)

PENDIENTE (se registra y se responde 202) → ENVIADA (Brevo responde 201; se borran datos sensibles como la contraseña temporal) o FALLIDA (guarda `ultimo_error`). FALLIDA se reintenta cada 60 s mientras `intentos < 5` (espera = intentos × 30 s) o con el reenvío manual (reinicia intentos). Una PENDIENTE «huérfana» de más de 2 min también se reprocesa.

## Cómo leerlos

- Círculo negro = inicio; círculo con anillo = fin.
- Etiqueta de flecha: `evento [condición] / acción`. La acción suele ser el evento que se envía a Notificaciones.
- Colores (solo en las imágenes): amarillo = en espera, verde = bueno, rojo = rechazo o error, gris = final.
- En Astah las etiquetas están abreviadas; el detalle completo está en las imágenes.

## Si quieres rehacer uno a mano en Astah

1. Clic derecho en el paquete → *Create Diagram* → *UML Diagrams* → **State Machine Diagram**.
2. Herramienta *State* para cada estado; *Initial* y *Final* para inicio y fin.
3. Herramienta *Transition* entre estados; doble clic en la flecha para escribir *Event*, *Guard* y *Action*.

## Qué decir al exponer (30 s)

- «Cada entidad importante tiene un ciclo de vida con reglas: una práctica solo avanza si el Director la aprueba, y solo se registran avances cuando los objetivos están aprobados.»
- «Un avance observado vuelve a pendiente cuando el estudiante lo corrige; solo los aceptados suman horas.»
- «Si el correo falla, la notificación pasa a FALLIDA y se reintenta sola hasta 5 veces.»
