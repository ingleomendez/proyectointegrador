from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionUsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evento: str
    titulo: str
    mensaje: str
    ruta: str | None
    leida: bool
    creada_en: datetime


class MisNotificacionesOut(BaseModel):
    """Los avisos más recientes del usuario y cuántos tiene sin leer (el número
    de la campanita cuenta TODOS los no leídos, no solo los de esta página)."""

    no_leidas: int
    notificaciones: list[NotificacionUsuarioOut]
