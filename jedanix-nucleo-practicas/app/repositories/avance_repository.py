from __future__ import annotations

from datetime import date

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.avance_semanal import AvanceSemanal
from app.models.dia_trabajado import DiaTrabajado
from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import AvanceEstadoEnum
from app.models.postulacion import Postulacion
from app.models.soporte_avance import SoporteAvance


class AvanceSemanalRepository:
    """Acceso a datos de `avances_semanales` y sus entidades dependientes
    `dias_trabajados` / `soportes_avance` (CU-08, CU-09, CU-10). Ver nota de
    convención de `commit()`/`flush()` en `usuario_repository.py`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _query_base(self) -> Select:
        return select(AvanceSemanal).options(
            selectinload(AvanceSemanal.dias_trabajados),
            selectinload(AvanceSemanal.soportes_avance),
            joinedload(AvanceSemanal.postulacion).joinedload(Postulacion.estudiante),
        )

    def get_by_id(self, avance_id: int) -> AvanceSemanal | None:
        stmt = self._query_base().where(AvanceSemanal.id == avance_id)
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_por_postulacion_y_semana(
        self, postulacion_id: int, semana_calendario: date
    ) -> AvanceSemanal | None:
        """CU-08, postcondición 4 / `UNIQUE (postulacion_id, semana_calendario)`:
        valida que no exista ya un avance para esta semana antes de crear uno."""
        stmt = select(AvanceSemanal).where(
            AvanceSemanal.postulacion_id == postulacion_id,
            AvanceSemanal.semana_calendario == semana_calendario,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def listar_por_postulacion(self, postulacion_id: int) -> list[AvanceSemanal]:
        """CU-08, paso 4: historial de avances de la práctica del estudiante."""
        stmt = self._query_base().where(
            AvanceSemanal.postulacion_id == postulacion_id
        ).order_by(AvanceSemanal.semana_calendario.desc())
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_por_coordinador(
        self, coordinador_id: int, solo_pendientes: bool = False
    ) -> list[AvanceSemanal]:
        """CU-09, pasos 2-7: avances de los estudiantes matriculados en las
        empresas donde este usuario es el Coordinador asignado."""
        stmt = self._query_base().join(AvanceSemanal.postulacion).join(Postulacion.empresa).where(
            EmpresaReceptora.coordinador_id == coordinador_id
        )
        if solo_pendientes:
            stmt = stmt.where(AvanceSemanal.estado == AvanceEstadoEnum.PENDIENTE_DE_REVISION)
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_por_docente_asesor(self, docente_asesor_id: int) -> list[AvanceSemanal]:
        """CU-10, pasos 2-7: avances de los estudiantes matriculados en las
        empresas donde este usuario es el Docente Asesor asignado."""
        stmt = self._query_base().join(AvanceSemanal.postulacion).join(Postulacion.empresa).where(
            EmpresaReceptora.docente_asesor_id == docente_asesor_id
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def contar_sin_revisar_por_responsable(self, usuario_id: int) -> int:
        """CU-01, excepción 4.1.b: avances en PENDIENTE_DE_REVISION bajo la
        responsabilidad de este usuario (como Coordinador o como Docente
        Asesor), usado para impedir/advertir al inactivarlo."""
        stmt = (
            select(func.count())
            .select_from(AvanceSemanal)
            .join(AvanceSemanal.postulacion)
            .join(Postulacion.empresa)
            .where(
                AvanceSemanal.estado == AvanceEstadoEnum.PENDIENTE_DE_REVISION,
                (EmpresaReceptora.coordinador_id == usuario_id)
                | (EmpresaReceptora.docente_asesor_id == usuario_id),
            )
        )
        return self.db.execute(stmt).scalar_one()

    def crear(self, avance: AvanceSemanal) -> AvanceSemanal:
        self.db.add(avance)
        self.db.flush()
        return avance

    def guardar(self, avance: AvanceSemanal) -> AvanceSemanal:
        self.db.flush()
        return avance

    def agregar_dia_trabajado(
        self, avance: AvanceSemanal, dia: DiaTrabajado
    ) -> DiaTrabajado:
        dia.avance_id = avance.id
        self.db.add(dia)
        self.db.flush()
        return dia

    def agregar_soporte(
        self, avance: AvanceSemanal, soporte: SoporteAvance
    ) -> SoporteAvance:
        soporte.avance_id = avance.id
        self.db.add(soporte)
        self.db.flush()
        return soporte