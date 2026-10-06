from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, Text, text
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AvanceEstadoEnum, PostulacionEstadoEnum


class Postulacion(Base):
    """Tabla `postulaciones` (CU-06: Postularse a una Práctica; CU-03: Gestionar
    Solicitudes de Práctica; CU-05: Realizar Cierre Formal de Práctica).

    Representa tanto la solicitud de matrícula como, una vez en estado APROBADA,
    la práctica activa del estudiante (no existe una entidad "Matrícula" aparte).
    Ciclo de vida de `estado`: BORRADOR -> PENDIENTE_DE_APROBACION -> APROBADA
    -> FINALIZADA, o RECHAZADA en cualquier punto antes de APROBADA."""

    __tablename__ = "postulaciones"
    __table_args__ = (
        # CU-06, precondición 2: un estudiante no puede tener más de una
        # postulación activa (BORRADOR, PENDIENTE_DE_APROBACION o APROBADA) a la vez.
        Index(
            "ux_postulaciones_estudiante_activa",
            "estudiante_id",
            unique=True,
            postgresql_where=text(
                "estado IN ('BORRADOR', 'PENDIENTE_DE_APROBACION', 'APROBADA')"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    estudiante_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas_receptoras.id"), nullable=False
    )

    estado: Mapped[PostulacionEstadoEnum] = mapped_column(
        PgEnum(PostulacionEstadoEnum, name="postulacion_estado_enum", native_enum=True),
        nullable=False,
        default=PostulacionEstadoEnum.BORRADOR,
        server_default=PostulacionEstadoEnum.BORRADOR.value,
    )

    fecha_postulacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    motivo_rechazo: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_decision: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    observacion_cierre: Mapped[str | None] = mapped_column(Text, nullable=True)
    # CU-05, flujo alterno 9.1.a: cuándo el Director rechazó el cierre. Mientras no
    # haya un avance calificado (ACEPTADO) posterior, el estudiante queda fuera de
    # "Pendiente de aprobación práctica".
    fecha_rechazo_cierre: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # --- Relaciones ---
    estudiante: Mapped["Usuario"] = relationship(
        "Usuario", foreign_keys=[estudiante_id], back_populates="postulaciones"
    )
    empresa: Mapped["EmpresaReceptora"] = relationship(
        "EmpresaReceptora", foreign_keys=[empresa_id], back_populates="postulaciones"
    )
    respuestas_bitacora: Mapped[list["RespuestaBitacora"]] = relationship(
        "RespuestaBitacora",
        back_populates="postulacion",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documentos_postulacion: Mapped[list["DocumentoPostulacion"]] = relationship(
        "DocumentoPostulacion",
        back_populates="postulacion",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    objetivo: Mapped[Optional["ObjetivoPractica"]] = relationship(
        "ObjetivoPractica",
        back_populates="postulacion",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    avances_semanales: Mapped[list["AvanceSemanal"]] = relationship(
        "AvanceSemanal", back_populates="postulacion"
    )

    @property
    def horas_acumuladas(self) -> float:
        """Horas oficiales de la práctica: solo cuentan los avances ACEPTADOS por
        el Coordinador (ver `PostulacionService._horas_aceptadas`)."""
        return sum(
            float(a.horas_totales)
            for a in self.avances_semanales
            if a.estado == AvanceEstadoEnum.ACEPTADO
        )

    @property
    def horas_requeridas(self) -> int:
        return self.empresa.horas_requeridas

    @property
    def pendiente_cierre(self) -> bool:
        """CU-04, pasos 16-17 / CU-05, precondición 2: práctica MATRICULADA con el
        100 % de las horas aceptadas. Tras un rechazo del cierre (9.1.a) el
        estudiante sale del subconjunto hasta que se acepte un avance posterior."""
        if self.estado != PostulacionEstadoEnum.APROBADA:
            return False
        requeridas = self.horas_requeridas
        if requeridas <= 0 or self.horas_acumuladas < requeridas:
            return False
        if self.fecha_rechazo_cierre is None:
            return True
        return any(
            a.estado == AvanceEstadoEnum.ACEPTADO
            and a.fecha_calificacion is not None
            and a.fecha_calificacion > self.fecha_rechazo_cierre
            for a in self.avances_semanales
        )

    def __repr__(self) -> str:
        return f"<Postulacion id={self.id} estudiante_id={self.estudiante_id} estado={self.estado}>"
        