from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import FactorRhEnum, GrupoSanguineoEnum, RolEnum, UsuarioEstadoEnum


class Usuario(Base):
    """Tabla `usuarios` (Modelo_Relacional_JEDANIX_v2.md, sección 2).

    Generalización de los 4 actores mediante herencia de tabla única (STI):
    el campo `rol` discrimina entre ESTUDIANTE, DIRECTOR, COORDINADOR y
    DOCENTE_ASESOR. Los campos exclusivos del Estudiante quedan NULL para
    los demás roles (Gestionar Perfil, CU-01)."""

    __tablename__ = "usuarios"
    __table_args__ = (
        CheckConstraint(
            "(rol = 'ESTUDIANTE') OR ("
            "programa_academico IS NULL AND direccion_residencia IS NULL AND "
            "grupo_sanguineo IS NULL AND factor_rh IS NULL AND eps IS NULL)",
            name="ck_usuarios_campos_estudiante_solo_estudiante",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    nombre_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    correo_institucional: Mapped[str] = mapped_column(
        String(150), nullable=False, unique=True
    )
    contrasena_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    celular: Mapped[str | None] = mapped_column(String(20), nullable=True)
    foto_perfil: Mapped[str | None] = mapped_column(String(255), nullable=True)

    rol: Mapped[RolEnum] = mapped_column(
        PgEnum(RolEnum, name="rol_enum", native_enum=True), nullable=False
    )
    estado: Mapped[UsuarioEstadoEnum] = mapped_column(
        PgEnum(UsuarioEstadoEnum, name="usuario_estado_enum", native_enum=True),
        nullable=False,
        default=UsuarioEstadoEnum.ACTIVO,
        server_default=UsuarioEstadoEnum.ACTIVO.value,
    )
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), nullable=False, server_default=func.now()
    )

    # Exclusivos del Estudiante (Gestionar Perfil / CU-01) — NULL para los demás roles.
    programa_academico: Mapped[str | None] = mapped_column(String(150), nullable=True)
    direccion_residencia: Mapped[str | None] = mapped_column(String(255), nullable=True)
    grupo_sanguineo: Mapped[GrupoSanguineoEnum | None] = mapped_column(
        PgEnum(GrupoSanguineoEnum, name="grupo_sanguineo_enum", native_enum=True),
        nullable=True,
    )
    factor_rh: Mapped[FactorRhEnum | None] = mapped_column(
        PgEnum(FactorRhEnum, name="factor_rh_enum", native_enum=True), nullable=True
    )
    eps: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Relaciones ---
    empresas_como_coordinador: Mapped[list["EmpresaReceptora"]] = relationship(
        "EmpresaReceptora",
        foreign_keys="EmpresaReceptora.coordinador_id",
        back_populates="coordinador",
    )
    empresas_como_docente_asesor: Mapped[list["EmpresaReceptora"]] = relationship(
        "EmpresaReceptora",
        foreign_keys="EmpresaReceptora.docente_asesor_id",
        back_populates="docente_asesor",
    )
    postulaciones: Mapped[list["Postulacion"]] = relationship(
        "Postulacion",
        foreign_keys="Postulacion.estudiante_id",
        back_populates="estudiante",
    )

    def __repr__(self) -> str:
        return f"<Usuario id={self.id} correo={self.correo_institucional} rol={self.rol}>"
        