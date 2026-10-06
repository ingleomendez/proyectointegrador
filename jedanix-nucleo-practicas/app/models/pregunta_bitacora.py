from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Text, text
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TipoRespuestaEnum


class PreguntaBitacora(Base):
    """Tabla `preguntas_bitacora` (CU-02, dependiente de `empresas_receptoras`).

    El Director agrega estas preguntas al configurar la bitácora de una empresa
    receptora; el estudiante las responde al postularse (CU-06).

    Nota (corregido 2026-10-02): esta tabla NO tiene un `UniqueConstraint` sobre
    (`empresa_id`, `enunciado`) a propósito. La versión original del modelo sí
    lo tenía, pero contradecía el texto exacto de CU-02 excepción 17.1.a: un
    enunciado duplicado es solo una ADVERTENCIA ("el sistema advierte la
    duplicidad y solicita confirmar si desea agregarla de todas formas"), no un
    bloqueo irreversible a nivel de base de datos. Esa regla vive en
    `EmpresaReceptoraService.agregar_pregunta` (capa de servicio), que sí puede
    pedir confirmación explícita antes de insertar; una constraint de base de
    datos no puede "pedir confirmación", solo rechazar."""

    __tablename__ = "preguntas_bitacora"

    id: Mapped[int] = mapped_column(primary_key=True)

    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas_receptoras.id", ondelete="CASCADE"), nullable=False
    )
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_respuesta: Mapped[TipoRespuestaEnum] = mapped_column(
        PgEnum(TipoRespuestaEnum, name="tipo_respuesta_enum", native_enum=True), nullable=False
    )
    # Baja lógica (CU-02, excepción 22.1.a): una pregunta eliminada que ya tiene
    # respuestas queda `activa=False`: deja de pedirse en postulaciones nuevas
    # pero las ya enviadas conservan la respuesta original.
    activa: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    # --- Relaciones ---
    empresa: Mapped["EmpresaReceptora"] = relationship(
        "EmpresaReceptora", back_populates="preguntas_bitacora", passive_deletes=True
    )
    respuestas_bitacora: Mapped[list["RespuestaBitacora"]] = relationship(
        "RespuestaBitacora", back_populates="pregunta"
    )

    def __repr__(self) -> str:
        return f"<PreguntaBitacora id={self.id} empresa_id={self.empresa_id}>"