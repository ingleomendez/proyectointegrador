from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.documento_postulacion import DocumentoPostulacion
from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import PostulacionEstadoEnum
from app.models.postulacion import Postulacion
from app.models.respuesta_bitacora import RespuestaBitacora

# Estados que cuentan como "postulación activa" para la regla de una sola
# postulación activa por estudiante (CU-06, precondición 2 / excepción 2.1.a).
ESTADOS_ACTIVOS = (
    PostulacionEstadoEnum.BORRADOR,
    PostulacionEstadoEnum.PENDIENTE_DE_APROBACION,
    PostulacionEstadoEnum.APROBADA,
)


class PostulacionRepository:
    """Acceso a datos de `postulaciones` y sus entidades dependientes
    `respuestas_bitacora` / `documentos_postulacion` (CU-06, CU-03, CU-05).
    Ver nota de convención de `commit()`/`flush()` en `usuario_repository.py`."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _query_base(self) -> Select:
        return select(Postulacion).options(
            joinedload(Postulacion.estudiante),
            joinedload(Postulacion.empresa).joinedload(EmpresaReceptora.coordinador),
            joinedload(Postulacion.empresa).joinedload(EmpresaReceptora.docente_asesor),
            selectinload(Postulacion.respuestas_bitacora),
            selectinload(Postulacion.documentos_postulacion),
            selectinload(Postulacion.avances_semanales),
        )

    def get_by_id(self, postulacion_id: int) -> Postulacion | None:
        stmt = self._query_base().where(Postulacion.id == postulacion_id)
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_activa_de_estudiante(self, estudiante_id: int) -> Postulacion | None:
        """CU-06, precondición 2: ¿el estudiante ya tiene una postulación
        BORRADOR, PENDIENTE_DE_APROBACION o APROBADA?"""
        stmt = self._query_base().where(
            Postulacion.estudiante_id == estudiante_id,
            Postulacion.estado.in_(ESTADOS_ACTIVOS),
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def listar_por_estudiante(self, estudiante_id: int) -> list[Postulacion]:
        """CU-06, paso 19: historial de postulaciones del estudiante."""
        stmt = self._query_base().where(
            Postulacion.estudiante_id == estudiante_id
        ).order_by(Postulacion.id.desc())
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_pendientes(self, empresa_id: int | None = None) -> list[Postulacion]:
        """CU-03, pasos 2-5: solicitudes en PENDIENTE_DE_APROBACION, agrupadas
        por empresa (el agrupamiento lo arma la capa de servicio); `empresa_id`
        permite pedir directamente las de una sola empresa (paso 4)."""
        stmt = self._query_base().where(
            Postulacion.estado == PostulacionEstadoEnum.PENDIENTE_DE_APROBACION
        )
        if empresa_id is not None:
            stmt = stmt.where(Postulacion.empresa_id == empresa_id)
        stmt = stmt.order_by(Postulacion.empresa_id, Postulacion.fecha_postulacion)
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_matriculados(self) -> list[Postulacion]:
        """CU-04/CU-05 (Director): todas las prácticas MATRICULADAS (APROBADA)."""
        stmt = self._query_base().where(
            Postulacion.estado == PostulacionEstadoEnum.APROBADA
        ).order_by(Postulacion.empresa_id, Postulacion.id)
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_matriculados_por_coordinador(self, coordinador_id: int) -> list[Postulacion]:
        """CU-09, paso 2: estudiantes matriculados en empresas donde este
        usuario es el Coordinador asignado."""
        stmt = self._query_base().where(
            Postulacion.estado == PostulacionEstadoEnum.APROBADA,
            Postulacion.empresa.has(EmpresaReceptora.coordinador_id == coordinador_id),
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def listar_matriculados_por_docente_asesor(self, docente_asesor_id: int) -> list[Postulacion]:
        """CU-10, paso 2 (y CU-11, paso 12): estudiantes matriculados en
        empresas donde este usuario es el Docente Asesor asignado."""
        stmt = self._query_base().where(
            Postulacion.estado == PostulacionEstadoEnum.APROBADA,
            Postulacion.empresa.has(EmpresaReceptora.docente_asesor_id == docente_asesor_id),
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def crear(self, postulacion: Postulacion) -> Postulacion:
        self.db.add(postulacion)
        self.db.flush()
        return postulacion

    def guardar(self, postulacion: Postulacion) -> Postulacion:
        self.db.flush()
        return postulacion

    def agregar_respuesta_bitacora(
        self, postulacion: Postulacion, respuesta: RespuestaBitacora
    ) -> RespuestaBitacora:
        respuesta.postulacion_id = postulacion.id
        self.db.add(respuesta)
        self.db.flush()
        return respuesta

    def agregar_documento(
        self, postulacion: Postulacion, documento: DocumentoPostulacion
    ) -> DocumentoPostulacion:
        documento.postulacion_id = postulacion.id
        self.db.add(documento)
        self.db.flush()
        return documento