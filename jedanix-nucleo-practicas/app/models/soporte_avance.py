from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TipoArchivoSoporteEnum


class SoporteAvance(Base):
    """Tabla `soportes_avance` (CU-08, dependiente de `avances_semanales`):
    uno o más archivos de evidencia (PDF/PNG/JPG) por avance semanal."""

    __tablename__ = "soportes_avance"

    id: Mapped[int] = mapped_column(primary_key=True)

    avance_id: Mapped[int] = mapped_column(
        ForeignKey("avances_semanales.id", ondelete="CASCADE"), nullable=False
    )
    archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_archivo: Mapped[TipoArchivoSoporteEnum] = mapped_column(
        PgEnum(TipoArchivoSoporteEnum, name="tipo_archivo_soporte_enum", native_enum=True),
        nullable=False,
    )
    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # --- Relaciones ---
    avance: Mapped["AvanceSemanal"] = relationship(
        "AvanceSemanal", back_populates="soportes_avance", passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<SoporteAvance id={self.id} avance_id={self.avance_id} tipo={self.tipo_archivo}>"