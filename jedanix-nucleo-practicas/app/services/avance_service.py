from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.avance_semanal import AvanceSemanal
from app.models.dia_trabajado import DiaTrabajado
from app.models.enums import AvanceEstadoEnum, ObjetivoEstadoEnum, PostulacionEstadoEnum
from app.models.soporte_avance import SoporteAvance
from app.repositories.avance_repository import AvanceSemanalRepository
from app.repositories.objetivo_repository import ObjetivoPracticaRepository
from app.repositories.postulacion_repository import PostulacionRepository
from app.schemas.avance_semanal import (
    AvanceCalificacion,
    AvanceObservacionDocente,
    AvanceSemanalCreate,
)
from app.services.exceptions import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.services.notificaciones_client import notificar


class AvanceSemanalService:
    """CU-08 (Estudiante registra), CU-09 (Coordinador califica) y CU-10
    (Docente Asesor observa) -- las tres operan sobre la misma tabla
    `avances_semanales`. Recordatorio del hallazgo de la ronda de esquemas:
    CU-09 y CU-10 son independientes entre sí -- solo el Coordinador cambia
    `estado` (ACEPTADO/OBSERVADO); la observación del Docente Asesor nunca lo
    toca."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AvanceSemanalRepository(db)
        self.postulacion_repo = PostulacionRepository(db)
        self.objetivo_repo = ObjetivoPracticaRepository(db)

    # ---- Lectura (sin reglas de negocio) ----

    def obtener(self, avance_id: int) -> AvanceSemanal:
        avance = self.repo.get_by_id(avance_id)
        if avance is None:
            raise NoEncontradoError(f"No existe un avance con id={avance_id}.")
        return avance

    def listar_mios(self, estudiante_id: int) -> list[AvanceSemanal]:
        """CU-08, paso 4: historial de avances de la práctica del estudiante
        autenticado. Si no tiene una postulación activa, no tiene avances."""
        postulacion = self.postulacion_repo.get_activa_de_estudiante(estudiante_id)
        if postulacion is None:
            return []
        return self.repo.listar_por_postulacion(postulacion.id)

    def listar_por_coordinador(
        self, coordinador_id: int, solo_pendientes: bool = False
    ) -> list[AvanceSemanal]:
        """CU-09, pasos 2-7."""
        return self.repo.listar_por_coordinador(coordinador_id, solo_pendientes=solo_pendientes)

    def listar_por_docente_asesor(self, docente_asesor_id: int) -> list[AvanceSemanal]:
        """CU-10, pasos 2-7."""
        return self.repo.listar_por_docente_asesor(docente_asesor_id)

    # ---- CU-08 ----

    def registrar_avance(self, estudiante_id: int, data: AvanceSemanalCreate) -> AvanceSemanal:
        """Precondiciones 2-4: práctica MATRICULADA, objetivos APROBADOS por el
        Docente Asesor (CU-11) y práctica no FINALIZADA. Postcondición 4: un
        único avance por semana calendario (`UNIQUE (postulacion_id,
        semana_calendario)`)."""
        postulacion = self.postulacion_repo.get_activa_de_estudiante(estudiante_id)
        if postulacion is None or postulacion.estado != PostulacionEstadoEnum.APROBADA:
            # Cubre tanto "no MATRICULADO" como "ya FINALIZADA" -- ninguna de las
            # dos queda como la única postulación "activa" de ESTADOS_ACTIVOS.
            raise ReglaDeNegocioError(
                "El estudiante debe tener una práctica en estado MATRICULADO (no "
                "FINALIZADA) para registrar avances."
            )

        objetivo = self.objetivo_repo.get_by_postulacion_id(postulacion.id)
        if objetivo is None or objetivo.estado != ObjetivoEstadoEnum.APROBADOS:
            raise ReglaDeNegocioError(
                "Los objetivos de la práctica deben estar APROBADOS (CU-11) antes de "
                "poder registrar avances."
            )

        if self.repo.get_por_postulacion_y_semana(postulacion.id, data.semana_calendario) is not None:
            raise ConflictoError(
                f"Ya existe un avance registrado para la semana {data.semana_calendario}."
            )

        avance = AvanceSemanal(
            postulacion_id=postulacion.id,
            semana_calendario=data.semana_calendario,
            actividades_a_desarrollar=data.actividades_a_desarrollar,
            horas_totales=data.horas_totales,
            beneficio_economico=data.beneficio_economico,
            actividades_generales=data.actividades_generales,
            ejecucion=data.ejecucion,
            observaciones_estudiante=data.observaciones_estudiante,
        )
        self.repo.crear(avance)

        for dia in data.dias_trabajados:
            self.repo.agregar_dia_trabajado(
                avance,
                DiaTrabajado(
                    numero_dia=dia.numero_dia,
                    descripcion_dia=dia.descripcion_dia,
                    horas_dia=dia.horas_dia,
                ),
            )
        for soporte in data.soportes:
            self.repo.agregar_soporte(
                avance, SoporteAvance(archivo=soporte.archivo, tipo_archivo=soporte.tipo_archivo)
            )

        self.db.commit()

        # Pasos 32-33: notifica al Coordinador y al Docente Asesor asignados.
        empresa = postulacion.empresa
        notificar("avance.registrado", empresa.coordinador.correo_institucional, {})
        notificar("avance.registrado", empresa.docente_asesor.correo_institucional, {})
        return avance

    # ---- CU-09 ----

    def calificar_avance(self, avance_id: int, data: AvanceCalificacion) -> AvanceSemanal:
        """`AvanceCalificacion` ya garantiza, a nivel de esquema, que viene
        exactamente uno de `calificacion_coordinador`/`comentario_coordinador`
        -- aquí solo se traduce esa decisión al `estado` del avance (ACEPTADO
        si calificó, OBSERVADO si comentó). Permite recalificar un avance ya
        ACEPTADO (flujo alterno 7.1.a)."""
        avance = self.repo.get_by_id(avance_id)
        if avance is None:
            raise NoEncontradoError(f"No existe un avance con id={avance_id}.")

        if data.calificacion_coordinador is not None:
            avance.calificacion_coordinador = data.calificacion_coordinador
            avance.comentario_coordinador = None
            avance.estado = AvanceEstadoEnum.ACEPTADO
            evento = "avance.calificado"
        else:
            avance.comentario_coordinador = data.comentario_coordinador
            avance.estado = AvanceEstadoEnum.OBSERVADO
            evento = "avance.observado"

        avance.fecha_calificacion = datetime.utcnow()
        self.repo.guardar(avance)
        self.db.commit()

        notificar(evento, avance.postulacion.estudiante.correo_institucional, {})
        return avance

    # ---- CU-10 ----

    def observar_avance_docente(
        self, avance_id: int, data: AvanceObservacionDocente
    ) -> AvanceSemanal:
        """Independiente de CU-09: nunca cambia `estado`, solo dato informativo."""
        avance = self.repo.get_by_id(avance_id)
        if avance is None:
            raise NoEncontradoError(f"No existe un avance con id={avance_id}.")

        avance.observacion_docente_asesor = data.observacion_docente_asesor
        avance.fecha_observacion_docente = datetime.utcnow()
        self.repo.guardar(avance)
        self.db.commit()

        notificar(
            "avance.observacion_docente", avance.postulacion.estudiante.correo_institucional, {}
        )
        return avance
