from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class NotificacionUsuario(Base):
    """Tabla `notificaciones_usuario`: avisos que el usuario ve dentro del
    sistema (la "campanita"). Son independientes de los correos del servicio de
    Notificaciones: aquí solo se guarda lo que el usuario ve en pantalla.

    `ruta` es una ruta del frontend (p. ej. `/estudiante/seguimiento`) a la que
    lleva el aviso al pulsarlo."""

    __tablename__ = "notificaciones_usuario"
    __table_args__ = (
        Index("ix_notificaciones_usuario_usuario_leida", "usuario_id", "leida", "creada_en"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    evento: Mapped[str] = mapped_column(String(60), nullable=False)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    ruta: Mapped[str | None] = mapped_column(String(200), nullable=True)
    leida: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    creada_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<NotificacionUsuario id={self.id} usuario_id={self.usuario_id} evento={self.evento}>"
