from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, SmallInteger, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DiaTrabajado(Base):
    """Tabla `dias_trabajados` (CU-08, dependiente de `avances_semanales`):
    el detalle día por día (1 a 6) de lo realizado dentro de un avance semanal."""

    __tablename__ = "dias_trabajados"
    __table_args__ = (
        UniqueConstraint("avance_id", "numero_dia", name="uq_dia_trabajado_avance_numero"),
        CheckConstraint("numero_dia >= 1 AND numero_dia <= 6", name="ck_dia_numero_rango"),
        CheckConstraint("horas_dia > 0 AND horas_dia <= 24", name="ck_dia_horas_rango"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    avance_id: Mapped[int] = mapped_column(
        ForeignKey("avances_semanales.id", ondelete="CASCADE"), nullable=False
    )
    numero_dia: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    descripcion_dia: Mapped[str] = mapped_column(Text, nullable=False)
    horas_dia: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)

    # --- Relaciones ---
    avance: Mapped["AvanceSemanal"] = relationship(
        "AvanceSemanal", back_populates="dias_trabajados", passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<DiaTrabajado id={self.id} avance_id={self.avance_id} numero_dia={self.numero_dia}>"