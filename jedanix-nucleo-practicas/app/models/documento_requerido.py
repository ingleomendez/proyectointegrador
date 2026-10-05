from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentoRequerido(Base):
    """Tabla `documentos_requeridos` (CU-02, dependiente de `empresas_receptoras`).

    El Director define qué documentos debe cargar el estudiante al postularse
    (por ejemplo "Hoja de vida", "Certificado de notas") — CU-06 los exige."""

    __tablename__ = "documentos_requeridos"

    id: Mapped[int] = mapped_column(primary_key=True)

    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas_receptoras.id", ondelete="CASCADE"), nullable=False
    )
    nombre_documento: Mapped[str] = mapped_column(String(150), nullable=False)

    # --- Relaciones ---
    empresa: Mapped["EmpresaReceptora"] = relationship(
        "EmpresaReceptora", back_populates="documentos_requeridos", passive_deletes=True
    )
    documentos_postulacion: Mapped[list["DocumentoPostulacion"]] = relationship(
        "DocumentoPostulacion", back_populates="documento_requerido"
    )

    def __repr__(self) -> str:
        return f"<DocumentoRequerido id={self.id} nombre={self.nombre_documento}>"