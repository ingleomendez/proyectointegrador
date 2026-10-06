from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.enums import ObjetivoEstadoEnum, PostulacionEstadoEnum
from app.models.objetivo_practica import ObjetivoPractica
from app.repositories.objetivo_repository import ObjetivoPracticaRepository
from app.repositories.postulacion_repository import PostulacionRepository
from app.schemas.objetivo_practica import ObjetivoPracticaCreate, ObjetivoPracticaDecision
from app.services.exceptions import NoEncontradoError, ReglaDeNegocioError
from app.services.notificaciones_client import notificar


class ObjetivoPracticaService:
    """CU-11: Gestionar Objetivos de la Práctica (Estudiante plantea, Docente
    Asesor aprueba/rechaza). A lo sumo una fila por postulación -- un reenvío
    tras rechazo (flujo alterno 4.1.a) reutiliza la misma fila en vez de crear
    una nueva (ver docstring del modelo `ObjetivoPractica`)."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ObjetivoPracticaRepository(db)
        self.postulacion_repo = PostulacionRepository(db)

    # ---- Lectura (sin reglas de negocio) ----

    def obtener_de_mi_practica(self, estudiante_id: int) -> ObjetivoPractica:
        """GET /objetivos/me: objetivos (o su ausencia) de la práctica MATRICULADA
        del estudiante autenticado."""
        postulacion = self.postulacion_repo.get_activa_de_estudiante(estudiante_id)
        if postulacion is None or postulacion.estado != PostulacionEstadoEnum.APROBADA:
            raise NoEncontradoError(
                "El estudiante no tiene una práctica en estado MATRICULADO."
            )
        objetivo = self.repo.get_by_postulacion_id(postulacion.id)
        if objetivo is None:
            raise NoEncontradoError("Aún no se han planteado objetivos para esta práctica.")
        return objetivo

    def obtener(self, objetivo_id: int) -> ObjetivoPractica:
        objetivo = self.db.get(ObjetivoPractica, objetivo_id)
        if objetivo is None:
            raise NoEncontradoError(f"No existe un planteamiento de objetivos con id={objetivo_id}.")
        return objetivo

    def obtener_de_postulacion(self, postulacion_id: int) -> ObjetivoPractica:
        """GET /objetivos/postulacion/{id} (Director): objetivos de una práctica
        concreta. Lo usa CU-04 para saber desde qué semana corre el seguimiento
        (fecha en que se aprobaron los objetivos) y marcar las "No reportadas"."""
        if self.postulacion_repo.get_by_id(postulacion_id) is None:
            raise NoEncontradoError(f"No existe una postulación con id={postulacion_id}.")
        objetivo = self.repo.get_by_postulacion_id(postulacion_id)
        if objetivo is None:
            raise NoEncontradoError("Aún no se han planteado objetivos para esta práctica.")
        return objetivo

    def listar_pendientes_docente(self, docente_asesor_id: int) -> list[ObjetivoPractica]:
        """CU-11, pasos 11-13: cola de objetivos pendientes de decisión del
        Docente Asesor autenticado."""
        return self.repo.listar_pendientes_por_docente_asesor(docente_asesor_id)

    def enviar_objetivos(self, estudiante_id: int, data: ObjetivoPracticaCreate) -> ObjetivoPractica:
        """Pasos 1-8 (envío inicial) y flujo alterno 4.1.a (reenvío tras
        RECHAZADOS): mismo método para ambos casos."""
        # Precondición 2 / excepción 1.1.a: debe tener una práctica MATRICULADA.
        postulacion = self.postulacion_repo.get_activa_de_estudiante(estudiante_id)
        if postulacion is None or postulacion.estado != PostulacionEstadoEnum.APROBADA:
            raise ReglaDeNegocioError(
                "El estudiante debe tener una práctica en estado MATRICULADO para "
                "plantear objetivos."
            )

        existente = self.repo.get_by_postulacion_id(postulacion.id)
        if existente is not None:
            # Excepción 3.1.a: ya aprobados -> solo lectura, ni edición ni reenvío.
            if existente.estado == ObjetivoEstadoEnum.APROBADOS:
                raise ReglaDeNegocioError(
                    "Los objetivos de esta práctica ya están APROBADOS; no se pueden editar."
                )
            # Flujo alterno 4.1.a: reenvío tras RECHAZADOS -> reutiliza la misma fila.
            existente.contenido = data.contenido
            existente.estado = ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION
            existente.observacion_docente = None
            existente.fecha_decision = None
            self.repo.guardar(existente)
            self.db.commit()
            objetivo = existente
        else:
            objetivo = ObjetivoPractica(postulacion_id=postulacion.id, contenido=data.contenido)
            self.repo.crear(objetivo)
            self.db.commit()

        # Paso 10: notifica al Docente Asesor asignado.
        notificar(
            "objetivos.pendientes",
            postulacion.empresa.docente_asesor.correo_institucional,
            {"estudiante": postulacion.estudiante.nombre_completo},
        )
        return objetivo

    def decidir_objetivos(self, objetivo_id: int, data: ObjetivoPracticaDecision) -> ObjetivoPractica:
        """Pasos 17-18 y flujo alterno 17.1.a: decisión del Docente Asesor."""
        objetivo = self.db.get(ObjetivoPractica, objetivo_id)
        if objetivo is None:
            raise NoEncontradoError(f"No existe un planteamiento de objetivos con id={objetivo_id}.")
        if objetivo.estado != ObjetivoEstadoEnum.PENDIENTE_DE_APROBACION:
            raise ReglaDeNegocioError(
                "Solo se pueden decidir objetivos en estado PENDIENTE_DE_APROBACION."
            )

        if data.aprobar:
            objetivo.estado = ObjetivoEstadoEnum.APROBADOS
            evento = "objetivos.aprobados"
        else:
            # Excepción 17.1.a.1 (el esquema permite observacion_docente=None; la
            # obligatoriedad depende de `aprobar`, por eso se valida aquí).
            if not data.observacion_docente:
                raise ReglaDeNegocioError("La observación es obligatoria al rechazar los objetivos.")
            objetivo.estado = ObjetivoEstadoEnum.RECHAZADOS
            objetivo.observacion_docente = data.observacion_docente
            evento = "objetivos.rechazados"

        objetivo.fecha_decision = datetime.utcnow()
        self.repo.guardar(objetivo)
        self.db.commit()

        notificar(evento, objetivo.postulacion.estudiante.correo_institucional, {})
        return objetivo
