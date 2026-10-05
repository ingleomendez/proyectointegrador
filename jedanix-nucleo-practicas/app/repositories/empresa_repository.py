from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.documento_requerido import DocumentoRequerido
from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import EmpresaEstadoEnum
from app.models.pregunta_bitacora import PreguntaBitacora


class EmpresaReceptoraRepository:
    """Acceso a datos de `empresas_receptoras` y sus entidades dependientes
    `preguntas_bitacora` / `documentos_requeridos` (CU-02). Ver nota de
    convención de `commit()`/`flush()` en `usuario_repository.py`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _query_base(self) -> Select:
        return select(EmpresaReceptora).options(
            selectinload(EmpresaReceptora.coordinador),
            selectinload(EmpresaReceptora.docente_asesor),
            selectinload(EmpresaReceptora.preguntas_bitacora),
            selectinload(EmpresaReceptora.documentos_requeridos),
        )

    def get_by_id(self, empresa_id: int) -> EmpresaReceptora | None:
        stmt = self._query_base().where(EmpresaReceptora.id == empresa_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def listar(self, solo_activas: bool = False) -> list[EmpresaReceptora]:
        """CU-02, paso 2: listado completo del Director. Con
        `solo_activas=True`: CU-06, pasos 4-5, empresas disponibles para que
        el estudiante se postule."""
        stmt = self._query_base().order_by(EmpresaReceptora.nombre)
        if solo_activas:
            stmt = stmt.where(EmpresaReceptora.estado == EmpresaEstadoEnum.ACTIVA)
        return list(self.db.execute(stmt).scalars().all())

    def crear(self, empresa: EmpresaReceptora) -> EmpresaReceptora:
        self.db.add(empresa)
        self.db.flush()
        return empresa

    def guardar(self, empresa: EmpresaReceptora) -> EmpresaReceptora:
        self.db.flush()
        return empresa

    def agregar_pregunta(
        self, empresa: EmpresaReceptora, pregunta: PreguntaBitacora
    ) -> PreguntaBitacora:
        """CU-02, pasos 16-19: agregar una pregunta a una empresa ya existente."""
        pregunta.empresa_id = empresa.id
        self.db.add(pregunta)
        self.db.flush()
        return pregunta

    def existe_enunciado_duplicado(self, empresa_id: int, enunciado: str) -> bool:
        """CU-02, excepción 17.1.a: el CU especifica esto como una advertencia,
        no como un bloqueo duro — la capa de servicio decide qué hacer con el
        resultado (p. ej. devolverlo como advertencia en la respuesta)."""
        stmt = select(PreguntaBitacora).where(
            PreguntaBitacora.empresa_id == empresa_id,
            PreguntaBitacora.enunciado == enunciado,
        )
        return self.db.execute(stmt).scalar_one_or_none() is not None

    def agregar_documento_requerido(
        self, empresa: EmpresaReceptora, documento: DocumentoRequerido
    ) -> DocumentoRequerido:
        """CU-02, pasos 22-24: agregar un documento requerido a una empresa
        ya existente."""
        documento.empresa_id = empresa.id
        self.db.add(documento)
        self.db.flush()
        return documento