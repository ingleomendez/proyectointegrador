from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.restablecimiento_password import RestablecimientoPassword


class RestablecimientoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_token_hash(self, token_hash: str) -> RestablecimientoPassword | None:
        return self.db.execute(
            select(RestablecimientoPassword).where(RestablecimientoPassword.token_hash == token_hash)
        ).scalar_one_or_none()

    def hay_solicitud_reciente(self, usuario_id: int, segundos: int) -> bool:
        """Evita que alguien dispare correos en ráfaga a nombre de otro usuario."""
        limite = datetime.utcnow() - timedelta(seconds=segundos)
        return (
            self.db.execute(
                select(RestablecimientoPassword.id)
                .where(
                    RestablecimientoPassword.usuario_id == usuario_id,
                    RestablecimientoPassword.creado_en >= limite,
                )
                .limit(1)
            ).first()
            is not None
        )

    def invalidar_pendientes(self, usuario_id: int) -> None:
        self.db.execute(
            update(RestablecimientoPassword)
            .where(
                RestablecimientoPassword.usuario_id == usuario_id,
                RestablecimientoPassword.usado.is_(False),
            )
            .values(usado=True)
        )

    def crear(self, usuario_id: int, token_hash: str, expira_en: datetime) -> RestablecimientoPassword:
        fila = RestablecimientoPassword(
            usuario_id=usuario_id,
            token_hash=token_hash,
            creado_en=datetime.utcnow(),
            expira_en=expira_en,
        )
        self.db.add(fila)
        self.db.flush()
        return fila
