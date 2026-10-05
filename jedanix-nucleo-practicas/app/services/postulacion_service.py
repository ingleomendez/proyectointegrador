from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.documento_postulacion import DocumentoPostulacion
from app.models.enums import AvanceEstadoEnum, EmpresaEstadoEnum, PostulacionEstadoEnum, RolEnum
from app.models.postulacion import Postulacion
from app.models.respuesta_bitacora import RespuestaBitacora
from app.repositories.avance_repository import AvanceSemanalRepository
from app.repositories.empresa_repository import EmpresaReceptoraRepository
from app.repositories.postulacion_repository import PostulacionRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.postulacion import PostulacionCierre, PostulacionCreate, PostulacionDecision
from app.services.exceptions import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.services.notificaciones_client import notificar


class PostulacionService:
    """CU-06 (Postularse a una Práctica, Estudiante), CU-03 (Gestionar
    Solicitudes de Práctica, Director) y CU-05 (Realizar Cierre Formal de
    Práctica, Director) -- las tres comparten la misma tabla `postulaciones`,
    que representa tanto la solicitud como, una vez APROBADA, la práctica
    activa (ver docstring del modelo `Postulacion`).

    Simplificación de alcance, documentada a propósito: `crear_postulacion`
    siempre registra una fila nueva (BORRADOR, o PENDIENTE_DE_APROBACION si
    `enviar=True`). El flujo alterno 9.1.a de CU-06 ("Guardar y salir" y
    retomar el proceso después) se cubre con `enviar_borrador`, que toma un
    BORRADOR ya existente -- con las respuestas/documentos que se le hayan
    agregado hasta ese momento -- y lo promueve a PENDIENTE_DE_APROBACION tras
    revalidar que la bitácora y los documentos quedaron completos. No se
    implementó edición in-place de un borrador (reemplazar sus respuestas ya
    guardadas) porque los repositorios de este agregado no exponen una
    operación de borrado; se puede agregar si el frontend lo necesita."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PostulacionRepository(db)
        self.empresa_repo = EmpresaReceptoraRepository(db)
        self.usuario_repo = UsuarioRepository(db)
        self.avance_repo = AvanceSemanalRepository(db)

    # ---- Lectura (sin reglas de negocio, usada por varios CU y roles) ----

    def obtener(self, postulacion_id: int) -> Postulacion:
        postulacion = self.repo.get_by_id(postulacion_id)
        if postulacion is None:
            raise NoEncontradoError(f"No existe una postulación con id={postulacion_id}.")
        return postulacion

    def listar_mias(self, estudiante_id: int) -> list[Postulacion]:
        """CU-06 paso 19 / CU-07: historial de postulaciones del estudiante autenticado."""
        return self.repo.listar_por_estudiante(estudiante_id)

    def listar_pendientes_director(self, empresa_id: int | None = None) -> list[Postulacion]:
        """CU-03, pasos 2-5: solicitudes pendientes de aprobación (todas, o de
        una empresa puntual con `empresa_id`)."""
        return self.repo.listar_pendientes(empresa_id=empresa_id)

    def listar_matriculados(self) -> list[Postulacion]:
        """CU-04/CU-05 (Director): todas las prácticas matriculadas."""
        return self.repo.listar_matriculados()

    def listar_matriculados_por_coordinador(self, coordinador_id: int) -> list[Postulacion]:
        """CU-09, paso 2: estudiantes matriculados bajo este Coordinador."""
        return self.repo.listar_matriculados_por_coordinador(coordinador_id)

    def listar_matriculados_por_docente_asesor(self, docente_asesor_id: int) -> list[Postulacion]:
        """CU-10, paso 2 (y CU-11, pasos 11-13): estudiantes matriculados bajo
        este Docente Asesor."""
        return self.repo.listar_matriculados_por_docente_asesor(docente_asesor_id)

    # ---- CU-06 ----

    def crear_postulacion(self, estudiante_id: int, data: PostulacionCreate) -> Postulacion:
        # Precondición 2 / excepción 2.1.a (CU-06) / 10.1.a: una sola postulación
        # activa (BORRADOR, PENDIENTE_DE_APROBACION o APROBADA) por estudiante.
        activa = self.repo.get_activa_de_estudiante(estudiante_id)
        if activa is not None:
            raise ConflictoError(
                "Ya tienes una postulación activa (borrador, pendiente o aprobada); no "
                "puedes enviar una nueva solicitud a otra empresa mientras esté en trámite."
            )

        empresa = self.empresa_repo.get_by_id(data.empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={data.empresa_id}.")
        # Precondición 3 / excepción 3.1.a
        if empresa.estado != EmpresaEstadoEnum.ACTIVA:
            raise ReglaDeNegocioError("Esta empresa receptora no está activa.")

        if data.enviar:
            self._validar_completitud(
                empresa,
                {r.pregunta_id for r in data.respuestas_bitacora},
                {d.documento_requerido_id for d in data.documentos_postulacion},
            )

        postulacion = Postulacion(estudiante_id=estudiante_id, empresa_id=data.empresa_id)
        self.repo.crear(postulacion)

        for r in data.respuestas_bitacora:
            self.repo.agregar_respuesta_bitacora(
                postulacion,
                RespuestaBitacora(pregunta_id=r.pregunta_id, respuesta_texto=r.respuesta_texto),
            )
        for d in data.documentos_postulacion:
            self.repo.agregar_documento(
                postulacion,
                DocumentoPostulacion(
                    documento_requerido_id=d.documento_requerido_id, archivo=d.archivo
                ),
            )

        if data.enviar:
            postulacion.estado = PostulacionEstadoEnum.PENDIENTE_DE_APROBACION
            postulacion.fecha_postulacion = datetime.utcnow()
            self.repo.guardar(postulacion)

        self.db.commit()

        if data.enviar:
            # Paso 27: notifica al Director que hay una nueva solicitud pendiente.
            self._notificar_directores("postulacion.enviada", {"empresa": empresa.nombre})
        return postulacion

    def enviar_borrador(self, estudiante_id: int, postulacion_id: int) -> Postulacion:
        """Flujo alterno 9.1.a: promueve un BORRADOR ya existente a
        PENDIENTE_DE_APROBACION, revalidando bitácora y documentos completos."""
        postulacion = self.repo.get_by_id(postulacion_id)
        if postulacion is None or postulacion.estudiante_id != estudiante_id:
            raise NoEncontradoError(
                f"No existe una postulación con id={postulacion_id} para este estudiante."
            )
        if postulacion.estado != PostulacionEstadoEnum.BORRADOR:
            raise ReglaDeNegocioError("Solo se puede enviar una postulación en estado BORRADOR.")

        self._validar_completitud(
            postulacion.empresa,
            {r.pregunta_id for r in postulacion.respuestas_bitacora},
            {d.documento_requerido_id for d in postulacion.documentos_postulacion},
        )

        postulacion.estado = PostulacionEstadoEnum.PENDIENTE_DE_APROBACION
        postulacion.fecha_postulacion = datetime.utcnow()
        self.repo.guardar(postulacion)
        self.db.commit()

        self._notificar_directores("postulacion.enviada", {"empresa": postulacion.empresa.nombre})
        return postulacion

    def _validar_completitud(
        self, empresa, pregunta_ids_respondidas: set[int], documento_ids_cargados: set[int]
    ) -> None:
        """Excepciones 21.1.a (documentos incompletos) y 22.1.a (bitácora
        incompleta): solo se exigen al ENVIAR formalmente, nunca al guardar
        como borrador."""
        preguntas_ids = {p.id for p in empresa.preguntas_bitacora}
        faltantes = preguntas_ids - pregunta_ids_respondidas
        if faltantes:
            raise ReglaDeNegocioError(
                f"Faltan responder {len(faltantes)} pregunta(s) obligatoria(s) de la bitácora."
            )

        documentos_ids = {d.id for d in empresa.documentos_requeridos}
        faltantes_doc = documentos_ids - documento_ids_cargados
        if faltantes_doc:
            raise ReglaDeNegocioError(
                f"Faltan cargar {len(faltantes_doc)} documento(s) requerido(s)."
            )

    # ---- CU-03 ----

    def decidir_postulacion(self, postulacion_id: int, data: PostulacionDecision) -> Postulacion:
        postulacion = self.repo.get_by_id(postulacion_id)
        if postulacion is None:
            raise NoEncontradoError(f"No existe una postulación con id={postulacion_id}.")
        if postulacion.estado != PostulacionEstadoEnum.PENDIENTE_DE_APROBACION:
            raise ReglaDeNegocioError(
                "Solo se pueden decidir solicitudes en estado PENDIENTE_DE_APROBACION."
            )

        if data.aprobar:
            # Excepción 14.1.a: el estudiante no debe haberse matriculado en otra
            # empresa mientras esta solicitud estaba pendiente.
            otra_activa = self.repo.get_activa_de_estudiante(postulacion.estudiante_id)
            if (
                otra_activa is not None
                and otra_activa.id != postulacion.id
                and otra_activa.estado == PostulacionEstadoEnum.APROBADA
            ):
                raise ConflictoError(
                    "El estudiante ya fue matriculado en otra empresa mientras esta "
                    "solicitud estaba pendiente; sugerido: rechazar esta solicitud."
                )

            postulacion.estado = PostulacionEstadoEnum.APROBADA
            postulacion.fecha_decision = datetime.utcnow()
            self.repo.guardar(postulacion)
            self.db.commit()
            notificar("postulacion.aprobada", postulacion.estudiante.correo_institucional, {})
        else:
            # Excepción 13.1.a.1 (el esquema permite motivo_rechazo=None; la
            # obligatoriedad depende de `aprobar`, por eso se valida aquí).
            if not data.motivo_rechazo:
                raise ReglaDeNegocioError("El motivo de rechazo es obligatorio.")

            postulacion.estado = PostulacionEstadoEnum.RECHAZADA
            postulacion.motivo_rechazo = data.motivo_rechazo
            postulacion.fecha_decision = datetime.utcnow()
            self.repo.guardar(postulacion)
            self.db.commit()
            notificar(
                "postulacion.rechazada",
                postulacion.estudiante.correo_institucional,
                {"motivo": data.motivo_rechazo},
            )
        return postulacion

    # ---- CU-05 ----

    def decidir_cierre(self, postulacion_id: int, data: PostulacionCierre) -> Postulacion:
        postulacion = self.repo.get_by_id(postulacion_id)
        if postulacion is None:
            raise NoEncontradoError(f"No existe una postulación con id={postulacion_id}.")
        if postulacion.estado != PostulacionEstadoEnum.APROBADA:
            raise ReglaDeNegocioError(
                "Solo se puede decidir el cierre de una práctica en estado MATRICULADO (APROBADA)."
            )

        if data.aprobar:
            horas_aceptadas = self._horas_aceptadas(postulacion_id)
            if horas_aceptadas < float(postulacion.empresa.horas_requeridas):
                raise ReglaDeNegocioError(
                    f"Aún no se completan las horas requeridas ({horas_aceptadas} de "
                    f"{postulacion.empresa.horas_requeridas})."
                )

            postulacion.estado = PostulacionEstadoEnum.FINALIZADA
            postulacion.fecha_cierre = datetime.utcnow()
            self.repo.guardar(postulacion)
            self.db.commit()
            for correo in self._correos_involucrados(postulacion):
                notificar("practica.cerrada", correo, {})
        else:
            # Excepción 9.1.a.1
            if not data.observacion_cierre:
                raise ReglaDeNegocioError("La observación es obligatoria al rechazar el cierre.")

            postulacion.observacion_cierre = data.observacion_cierre
            self.repo.guardar(postulacion)
            self.db.commit()
            notificar(
                "practica.cierre_rechazado",
                postulacion.estudiante.correo_institucional,
                {"observacion": data.observacion_cierre},
            )
        return postulacion

    def _horas_aceptadas(self, postulacion_id: int) -> float:
        avances = self.avance_repo.listar_por_postulacion(postulacion_id)
        return sum(
            float(a.horas_totales) for a in avances if a.estado == AvanceEstadoEnum.ACEPTADO
        )

    def _correos_involucrados(self, postulacion: Postulacion) -> list[str]:
        empresa = postulacion.empresa
        return [
            postulacion.estudiante.correo_institucional,
            empresa.coordinador.correo_institucional,
            empresa.docente_asesor.correo_institucional,
        ]

    def _notificar_directores(self, evento: str, datos: dict) -> None:
        for director in self.usuario_repo.listar(rol=RolEnum.DIRECTOR):
            notificar(evento, director.correo_institucional, datos)
