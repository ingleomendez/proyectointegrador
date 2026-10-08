from __future__ import annotations

import logging
import threading
import time

import httpx

from app.core.config import settings

logger = logging.getLogger("jedanix.notificaciones")

# Códigos con los que el servicio "no está listo todavía" (p. ej. Render responde
# 502/503 mientras despierta una instancia gratuita dormida). Se reintentan.
_ESTADOS_REINTENTABLES = {429, 500, 502, 503, 504}


def _enviar_con_reintentos(
    evento: str, destinatario_correo: str, payload: dict, headers: dict
) -> bool:
    """Hace la llamada HTTP a Notificaciones y la reintenta mientras el servicio
    esté despertando o no responda. Devuelve True si fue aceptada.

    Un 4xx (p. ej. 401 por clave interna distinta, o 400 por datos inválidos) no
    se reintenta: no se arregla esperando; solo se deja en el log."""
    intentos = max(1, settings.NOTIFICACIONES_REINTENTOS)
    espera = settings.NOTIFICACIONES_ESPERA_SEGUNDOS
    url = f"{settings.NOTIFICACIONES_SERVICE_URL}/eventos"

    for intento in range(1, intentos + 1):
        motivo = ""
        try:
            with httpx.Client(timeout=settings.NOTIFICACIONES_TIMEOUT_SECONDS) as client:
                respuesta = client.post(url, json=payload, headers=headers)
            if respuesta.status_code < 400:
                if intento > 1:
                    logger.info(
                        "Evento '%s' aceptado por Notificaciones en el intento %s.", evento, intento
                    )
                return True
            if respuesta.status_code not in _ESTADOS_REINTENTABLES:
                # No es un error para el usuario, pero sí algo que el operador debe ver
                # (p. ej. clave interna distinta en los dos servicios).
                logger.warning(
                    "Notificaciones rechazó el evento '%s' (HTTP %s).",
                    evento,
                    respuesta.status_code,
                )
                return False
            motivo = f"HTTP {respuesta.status_code}"
        except Exception as exc:  # noqa: BLE001 — red/timeout: se reintenta
            motivo = f"{type(exc).__name__}: {exc}"

        if intento < intentos:
            logger.info(
                "Notificaciones no está lista para '%s' (%s). Reintento %s/%s en %.0fs.",
                evento,
                motivo,
                intento,
                intentos - 1,
                espera,
            )
            time.sleep(espera)
        else:
            logger.warning(
                "No se pudo notificar el evento '%s' a %s tras %s intentos (último: %s).",
                evento,
                destinatario_correo,
                intentos,
                motivo,
            )
    return False


def notificar(evento: str, destinatario_correo: str, datos: dict | None = None) -> None:
    """Cliente de Notificaciones (`Arquitectura_JEDANIX_v2.md`, sección
    "Comunicación entre servicios"): es la única pieza del Núcleo que conoce la
    URL del microservicio de Notificaciones (Node.js/Express) y le hace esta
    llamada HTTP de forma no bloqueante y "fire-and-forget" — el Núcleo nunca
    espera su resultado para continuar su propio flujo.

    El envío corre en un hilo aparte y reintenta si Notificaciones está
    despertando (hosting gratuito) o no responde; así el Director no espera y
    el aviso no se pierde por un arranque en frío.

    Cualquier falla (servicio caído, timeout, error de red) se captura aquí
    mismo y se registra en el log, sin propagarse como error al usuario ni
    revertir la transacción que la originó. Esto es exactamente lo que piden
    las excepciones "falla en la notificación" de prácticamente todos los CU
    (p. ej. CU-01 19.1.a, CU-03 19.1.a, CU-06 27.1.a, CU-08 32.1.a): la cuenta,
    la decisión o el avance quedan registrados igual, y es Notificaciones quien
    reintenta su propio envío al destinatario final desde su estado `PENDIENTE`.

    Se llama siempre DESPUÉS de hacer `commit()` en el servicio que la invoca,
    nunca antes: si notificar fallara de una forma que si se propagara, jamás
    debe poder deshacer una escritura que ya quedó confirmada en la base de
    datos transaccional del Núcleo."""

    payload = {
        "evento": evento,
        "destinatario_correo": destinatario_correo,
        "datos": datos or {},
    }
    headers = {"X-API-Key": settings.NOTIFICACIONES_API_KEY} if settings.NOTIFICACIONES_API_KEY else {}

    def _trabajo() -> None:
        try:
            _enviar_con_reintentos(evento, destinatario_correo, payload, headers)
        except Exception:  # noqa: BLE001 — nunca debe tumbar el hilo en silencio
            logger.warning(
                "No se pudo notificar el evento '%s' a %s", evento, destinatario_correo, exc_info=True
            )

    if settings.NOTIFICACIONES_ASINCRONO:
        threading.Thread(target=_trabajo, name=f"notificar-{evento}", daemon=True).start()
    else:
        _trabajo()
