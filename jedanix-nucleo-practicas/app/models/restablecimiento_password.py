from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RestablecimientoPassword(Base):
    """Tabla `restablecimientos_password`: enlaces de "¿Olvidaste tu contraseña?".

    El token que viaja por correo NO se guarda: solo su hash SHA-256
    (`token_hash`), igual que una contraseña. Cada token vence a los pocos
    minutos (`expira_en`) y sirve una sola vez (`usado`)."""

    __tablename__ = "restablecimientos_password"
    __table_args__ = (Index("ix_restablecimientos_password_token_hash", "token_hash", unique=True),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    expira_en: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    usado: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    def __repr__(self) -> str:
        return f"<RestablecimientoPassword id={self.id} usuario_id={self.usuario_id} usado={self.usado}>"
