from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, Text, UniqueConstraint, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AvanceEstadoEnum


class AvanceSemanal(Base):
    """Tabla `avances_semanales` (CU-08 registra y consulta; CU-09 lo califica;
    CU-10 lo observa). Un único avance por semana calendario por práctica
    (postcondición 4 de CU-08); solo puede registrarse si la práctica está
    APROBADA/FINALIZADA y sus objetivos (CU-11) están en estado APROBADOS."""

    __tablename__ = "avances_semanales"
    __table_args__ = (
        UniqueConstraint(
            "postulacion_id", "semana_calendario", name="uq_avance_postulacion_semana"
        ),
        CheckConstraint("horas_totales > 0", name="ck_avance_horas_totales_positivas"),
        CheckConstraint("beneficio_economico >= 0", name="ck_avance_beneficio_no_negativo"),
        CheckConstraint(
            "calificacion_coordinador IS NULL OR "
            "(calificacion_coordinador >= 0.0 AND calificacion_coordinador <= 5.0)",
            name="ck_avance_calificacion_rango",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id"), nullable=False
    )
    semana_calendario: Mapped[date] = mapped_column(Date, nullable=False)

    actividades_a_desarrollar: Mapped[str] = mapped_column(Text, nullable=False)
    horas_totales: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    beneficio_economico: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    actividades_generales: Mapped[str] = mapped_column(Text, nullable=False)
    ejecucion: Mapped[str] = mapped_column(Text, nullable=False)
    observaciones_estudiante: Mapped[str] = mapped_column(Text, nullable=False)

    estado: Mapped[AvanceEstadoEnum] = mapped_column(
        PgEnum(AvanceEstadoEnum, name="avance_estado_enum", native_enum=True),
        nullable=False,
        default=AvanceEstadoEnum.PENDIENTE_DE_REVISION,
        server_default=AvanceEstadoEnum.PENDIENTE_DE_REVISION.value,
    )
    fecha_envio: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    calificacion_coordinador: Mapped[float | None] = mapped_column(Numeric(2, 1), nullable=True)
    comentario_coordinador: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_calificacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    observacion_docente_asesor: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_observacion_docente: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # --- Relaciones ---
    postulacion: Mapped["Postulacion"] = relationship(
        "Postulacion", back_populates="avances_semanales"
    )
    dias_trabajados: Mapped[list["DiaTrabajado"]] = relationship(
        "DiaTrabajado",
        back_populates="avance",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    soportes_avance: Mapped[list["SoporteAvance"]] = relationship(
        "SoporteAvance",
        back_populates="avance",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<AvanceSemanal id={self.id} postulacion_id={self.postulacion_id} estado={self.estado}>"