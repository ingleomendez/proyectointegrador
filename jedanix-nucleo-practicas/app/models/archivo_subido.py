from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ArchivoSubido(Base):
    """Tabla `archivos_subidos`: guarda en la base de datos el contenido de los
    archivos que cargan los usuarios (PDF de postulación, soportes de avance,
    fotos). Se usa la base de datos y no el disco porque en los hosting
    gratuitos (p. ej. Render) el disco se borra en cada reinicio.

    `nombre` es el identificador público: `<uuid>_<nombre-saneado>`. Es lo que
    el resto del sistema guarda como ruta (`/uploads/<nombre>`)."""

    __tablename__ = "archivos_subidos"

    nombre: Mapped[str] = mapped_column(String(255), primary_key=True)
    contenido: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    tipo_contenido: Mapped[str] = mapped_column(String(100), nullable=False)
    tamano_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<ArchivoSubido nombre={self.nombre} tamano={self.tamano_bytes}>"
