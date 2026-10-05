from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import EmpresaEstadoEnum


class EmpresaReceptora(Base):
    """Tabla `empresas_receptoras` (CU-02: Gestionar Empresas Receptoras).

    Registrada, editada e inactivada por el Director. Cada empresa tiene
    exactamente un Coordinador de Práctica y un Docente Asesor responsables
    (CU-02, pasos 10-14); ambos deben existir previamente como usuarios con
    ese rol (CU-01)."""

    __tablename__ = "empresas_receptoras"
    __table_args__ = (
        CheckConstraint("horas_requeridas > 0", name="ck_empresas_horas_requeridas_positivas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    requisitos_generales: Mapped[str] = mapped_column(Text, nullable=False)
    horas_requeridas: Mapped[int] = mapped_column(Integer, nullable=False)

    estado: Mapped[EmpresaEstadoEnum] = mapped_column(
        PgEnum(EmpresaEstadoEnum, name="empresa_estado_enum", native_enum=True),
        nullable=False,
        default=EmpresaEstadoEnum.ACTIVA,
        server_default=EmpresaEstadoEnum.ACTIVA.value,
    )

    coordinador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    docente_asesor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)

    # --- Relaciones ---
    coordinador: Mapped["Usuario"] = relationship(
        "Usuario", foreign_keys=[coordinador_id], back_populates="empresas_como_coordinador"
    )
    docente_asesor: Mapped["Usuario"] = relationship(
        "Usuario", foreign_keys=[docente_asesor_id], back_populates="empresas_como_docente_asesor"
    )
    preguntas_bitacora: Mapped[list["PreguntaBitacora"]] = relationship(
        "PreguntaBitacora",
        back_populates="empresa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    documentos_requeridos: Mapped[list["DocumentoRequerido"]] = relationship(
        "DocumentoRequerido",
        back_populates="empresa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    postulaciones: Mapped[list["Postulacion"]] = relationship(
        "Postulacion", back_populates="empresa"
    )

    def __repr__(self) -> str:
        return f"<EmpresaReceptora id={self.id} nombre={self.nombre} estado={self.estado}>"