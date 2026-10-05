from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ObjetivoEstadoEnum


class ObjetivoPractica(Base):
    """Tabla `objetivo_practica` (CU-11: Gestionar Objetivos de la Práctica).

    A lo sumo un registro por `Postulacion` (una práctica activa tiene un solo
    planteamiento de objetivos vigente): el estudiante lo redacta después de
    quedar matriculado, y el Docente Asesor asignado lo aprueba o rechaza. Un
    reenvío tras un rechazo actualiza esta misma fila en vez de crear una nueva.
    El registro de avances semanales (CU-08) exige que `estado = APROBADOS`."""

    __tablename__ = "objetivo_practica"

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[ObjetivoEstadoEnum] = mapped_column(
        PgEnum(ObjetivoEstadoEnum, name="objetivo_estado_enum", native_enum=True),
        nullable=False,
        default=ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION,
        server_default=ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION.value,
    )
    observacion_docente: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_envio: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    fecha_decision: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # --- Relaciones ---
    postulacion: Mapped["Postulacion"] = relationship(
        "Postulacion", back_populates="objetivo", passive_deletes=True
    )

    # Datos de contexto para la bandeja del Docente Asesor (CU-11).
    @property
    def estudiante_nombre(self) -> str:
        return self.postulacion.estudiante.nombre_completo

    @property
    def empresa_nombre(self) -> str:
        return self.postulacion.empresa.nombre

    def __repr__(self) -> str:
        return f"<ObjetivoPractica id={self.id} postulacion_id={self.postulacion_id} estado={self.estado}>"