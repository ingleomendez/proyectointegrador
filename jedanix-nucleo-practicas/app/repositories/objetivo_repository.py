from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import ObjetivoEstadoEnum
from app.models.objetivo_practica import ObjetivoPractica
from app.models.postulacion import Postulacion


class ObjetivoPracticaRepository:
    """Acceso a datos de `objetivo_practica` (CU-11). Ver nota de convención de
    `commit()`/`flush()` en `usuario_repository.py`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_postulacion_id(self, postulacion_id: int) -> ObjetivoPractica | None:
        stmt = select(ObjetivoPractica).where(
            ObjetivoPractica.postulacion_id == postulacion_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def listar_pendientes_por_docente_asesor(
        self, docente_asesor_id: int
    ) -> list[ObjetivoPractica]:
        """CU-11, pasos 11-13: estudiantes asignados a este Docente Asesor con
        objetivos en PENDIENTE_DE_APROBACION."""
        stmt = (
            select(ObjetivoPractica)
            .join(ObjetivoPractica.postulacion)
            .join(Postulacion.empresa)
            .options(
                joinedload(ObjetivoPractica.postulacion).joinedload(Postulacion.estudiante)
            )
            .where(
                ObjetivoPractica.estado == ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION,
                EmpresaReceptora.docente_asesor_id == docente_asesor_id,
            )
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def crear(self, objetivo: ObjetivoPractica) -> ObjetivoPractica:
        self.db.add(objetivo)
        self.db.flush()
        return objetivo

    def guardar(self, objetivo: ObjetivoPractica) -> ObjetivoPractica:
        self.db.flush()
        return objetivo