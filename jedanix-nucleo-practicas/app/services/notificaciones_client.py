from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("jedanix.notificaciones")


def notificar(evento: str, destinatario_correo: str, datos: dict | None = None) -> None:
    """Cliente de Notificaciones (`Arquitectura_JEDANIX_v2.md`, sección
    "Comunicación entre servicios"): es la única pieza del Núcleo que conoce la
    URL del microservicio de Notificaciones (Node.js/Express) y le hace esta
    llamada HTTP de forma no bloqueante y "fire-and-forget" — el Núcleo nunca
    espera su resultado para continuar su propio flujo.

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
    try:
        with httpx.Client(timeout=settings.NOTIFICACIONES_TIMEOUT_SECONDS) as client:
            client.post(f"{settings.NOTIFICACIONES_SERVICE_URL}/eventos", json=payload)
    except Exception:  # noqa: BLE001 — cualquier falla de red/timeout se traga a propósito
        logger.warning(
            "No se pudo notificar el evento '%s' a %s", evento, destinatario_correo, exc_info=True
        )
