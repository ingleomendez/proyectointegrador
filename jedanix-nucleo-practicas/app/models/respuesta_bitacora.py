from __future__ import annotations

from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RespuestaBitacora(Base):
    """Tabla `respuestas_bitacora` (CU-06), clase asociativa entre `Postulacion`
    y `PreguntaBitacora`: la respuesta que el estudiante da a cada pregunta de
    la bitácora de la empresa a la que se postula."""

    __tablename__ = "respuestas_bitacora"
    __table_args__ = (
        UniqueConstraint("postulacion_id", "pregunta_id", name="uq_respuesta_postulacion_pregunta"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id", ondelete="CASCADE"), nullable=False
    )
    pregunta_id: Mapped[int] = mapped_column(
        ForeignKey("preguntas_bitacora.id"), nullable=False
    )
    respuesta_texto: Mapped[str] = mapped_column(Text, nullable=False)

    # --- Relaciones ---
    postulacion: Mapped["Postulacion"] = relationship(
        "Postulacion", back_populates="respuestas_bitacora", passive_deletes=True
    )
    pregunta: Mapped["PreguntaBitacora"] = relationship(
        "PreguntaBitacora", back_populates="respuestas_bitacora"
    )

    def __repr__(self) -> str:
        return f"<RespuestaBitacora id={self.id} postulacion_id={self.postulacion_id}>"