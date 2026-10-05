from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentoPostulacion(Base):
    """Tabla `documentos_postulacion` (CU-06), clase asociativa entre
    `Postulacion` y `DocumentoRequerido`: el archivo que el estudiante carga
    para cumplir un requisito específico de la empresa a la que se postula."""

    __tablename__ = "documentos_postulacion"
    __table_args__ = (
        UniqueConstraint(
            "postulacion_id", "documento_requerido_id", name="uq_documento_postulacion_requisito"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    postulacion_id: Mapped[int] = mapped_column(
        ForeignKey("postulaciones.id", ondelete="CASCADE"), nullable=False
    )
    documento_requerido_id: Mapped[int] = mapped_column(
        ForeignKey("documentos_requeridos.id"), nullable=False
    )
    archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_carga: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # --- Relaciones ---
    postulacion: Mapped["Postulacion"] = relationship(
        "Postulacion", back_populates="documentos_postulacion", passive_deletes=True
    )
    documento_requerido: Mapped["DocumentoRequerido"] = relationship(
        "DocumentoRequerido", back_populates="documentos_postulacion"
    )

    def __repr__(self) -> str:
        return f"<DocumentoPostulacion id={self.id} postulacion_id={self.postulacion_id}>"