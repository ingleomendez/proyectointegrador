from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.documento_requerido import DocumentoRequerido
from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import EmpresaEstadoEnum
from app.models.pregunta_bitacora import PreguntaBitacora
from app.repositories.empresa_repository import EmpresaReceptoraRepository
from app.repositories.postulacion_repository import PostulacionRepository
from app.schemas.empresa_receptora import (
    DocumentoRequeridoCreate,
    DocumentoRequeridoUpdate,
    EmpresaReceptoraCreate,
    EmpresaReceptoraUpdate,
    PreguntaBitacoraCreate,
    PreguntaBitacoraUpdate,
)
from app.services.exceptions import (
    NoEncontradoError,
    ReglaDeNegocioError,
    RequiereConfirmacionError,
)


class EmpresaReceptoraService:
    """CU-02: Gestionar Empresas Receptoras (Director)."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = EmpresaReceptoraRepository(db)
        self.postulacion_repo = PostulacionRepository(db)

    def crear_empresa(self, data: EmpresaReceptoraCreate) -> EmpresaReceptora:
        """Flujo básico completo (pasos 6-29): datos generales, responsables,
        bitácora y documentos requeridos, todo en una sola transacción. La
        exigencia de "al menos una pregunta de bitácora" (excepción 29.1.a) ya
        la aplica `EmpresaReceptoraCreate` (`Field(min_length=1)`); no hace
        falta repetirla aquí."""
        empresa = EmpresaReceptora(
            nombre=data.nombre,
            descripcion=data.descripcion,
            requisitos_generales=data.requisitos_generales,
            horas_requeridas=data.horas_requeridas,
            telefono=data.telefono,
            direccion=data.direccion,
            coordinador_id=data.coordinador_id,
            docente_asesor_id=data.docente_asesor_id,
            estado=EmpresaEstadoEnum.ACTIVA,
        )
        self.repo.crear(empresa)

        for pregunta_data in data.preguntas_bitacora:
            self.repo.agregar_pregunta(
                empresa,
                PreguntaBitacora(
                    enunciado=pregunta_data.enunciado,
                    tipo_respuesta=pregunta_data.tipo_respuesta,
                ),
            )
        for documento_data in data.documentos_requeridos:
            self.repo.agregar_documento_requerido(
                empresa, DocumentoRequerido(nombre_documento=documento_data.nombre_documento)
            )

        self.db.commit()
        return empresa

    def actualizar_empresa(self, empresa_id: int, data: EmpresaReceptoraUpdate) -> EmpresaReceptora:
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")

        empresa.nombre = data.nombre
        empresa.descripcion = data.descripcion
        empresa.requisitos_generales = data.requisitos_generales
        empresa.horas_requeridas = data.horas_requeridas
        empresa.telefono = data.telefono
        empresa.direccion = data.direccion
        empresa.coordinador_id = data.coordinador_id
        empresa.docente_asesor_id = data.docente_asesor_id

        self.repo.guardar(empresa)
        self.db.commit()
        return empresa

    def agregar_pregunta(
        self,
        empresa_id: int,
        data: PreguntaBitacoraCreate,
        confirmar_duplicado: bool = False,
    ) -> PreguntaBitacora:
        """Pasos 16-19 sobre una empresa ya existente. Excepción 17.1.a: un
        enunciado duplicado es una advertencia, no un bloqueo -- exige
        confirmación explícita, igual que el cambio de rol de CU-01 (6.1.a)."""
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")

        if self.repo.existe_enunciado_duplicado(empresa_id, data.enunciado) and not confirmar_duplicado:
            raise RequiereConfirmacionError(
                "Ya existe una pregunta con ese enunciado en la bitácora de esta empresa."
            )

        pregunta = PreguntaBitacora(enunciado=data.enunciado, tipo_respuesta=data.tipo_respuesta)
        self.repo.agregar_pregunta(empresa, pregunta)
        self.db.commit()
        return pregunta

    def agregar_documento_requerido(
        self, empresa_id: int, data: DocumentoRequeridoCreate
    ) -> DocumentoRequerido:
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")

        documento = DocumentoRequerido(nombre_documento=data.nombre_documento)
        self.repo.agregar_documento_requerido(empresa, documento)
        self.db.commit()
        return documento

    # ---- Edición y eliminación de preguntas / documentos (flujo alterno 4.1.a) ----

    def actualizar_pregunta(
        self,
        empresa_id: int,
        pregunta_id: int,
        data: PreguntaBitacoraUpdate,
        confirmar_duplicado: bool = False,
    ) -> PreguntaBitacora:
        pregunta = self.repo.get_pregunta(empresa_id, pregunta_id)
        if pregunta is None:
            raise NoEncontradoError(f"No existe la pregunta id={pregunta_id} en esta empresa.")

        if (
            self.repo.existe_enunciado_duplicado(empresa_id, data.enunciado, excluir_id=pregunta_id)
            and not confirmar_duplicado
        ):
            raise RequiereConfirmacionError(
                "Ya existe otra pregunta con ese enunciado en la bitácora de esta empresa."
            )

        pregunta.enunciado = data.enunciado
        if data.tipo_respuesta is not None:
            pregunta.tipo_respuesta = data.tipo_respuesta
        self.db.commit()
        return pregunta

    def eliminar_pregunta(
        self, empresa_id: int, pregunta_id: int, confirmar: bool = False
    ) -> None:
        """Flujo alterno 4.1.a / excepción 22.1.a. Una pregunta con respuestas en
        postulaciones EN CURSO exige confirmación explícita. Si tiene respuestas
        de cualquier postulación se da de baja (`activa=False`) para que las ya
        enviadas conserven la respuesta original; si nunca se usó, se borra."""
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")
        pregunta = self.repo.get_pregunta(empresa_id, pregunta_id)
        if pregunta is None:
            raise NoEncontradoError(f"No existe la pregunta id={pregunta_id} en esta empresa.")

        # Excepción 29.1.a: la bitácora nunca puede quedar vacía.
        if sum(1 for p in empresa.preguntas_bitacora if p.activa) <= 1:
            raise ReglaDeNegocioError(
                "La bitácora debe conservar al menos una pregunta; agrega otra antes de eliminar esta."
            )

        en_curso = self.repo.contar_respuestas_de_pregunta(pregunta_id, solo_en_curso=True)
        if en_curso and not confirmar:
            raise RequiereConfirmacionError(
                f"Esta pregunta ya tiene respuestas en {en_curso} postulación(es) en curso. "
                "Las postulaciones ya enviadas conservarán su respuesta original, pero la "
                "pregunta no se pedirá en postulaciones futuras.",
                detalle={"postulaciones_en_curso": en_curso},
            )

        if self.repo.contar_respuestas_de_pregunta(pregunta_id) > 0:
            pregunta.activa = False
        else:
            self.repo.eliminar(pregunta)
        self.db.commit()

    def actualizar_documento_requerido(
        self, empresa_id: int, documento_id: int, data: DocumentoRequeridoUpdate
    ) -> DocumentoRequerido:
        documento = self.repo.get_documento_requerido(empresa_id, documento_id)
        if documento is None:
            raise NoEncontradoError(f"No existe el documento id={documento_id} en esta empresa.")
        documento.nombre_documento = data.nombre_documento
        self.db.commit()
        return documento

    def eliminar_documento_requerido(
        self, empresa_id: int, documento_id: int, confirmar: bool = False
    ) -> None:
        """Igual que `eliminar_pregunta` pero para documentos requeridos
        (excepción 22.1.a: postulaciones EN CURSO con cargas)."""
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")
        documento = self.repo.get_documento_requerido(empresa_id, documento_id)
        if documento is None:
            raise NoEncontradoError(f"No existe el documento id={documento_id} en esta empresa.")

        # Excepción 30.1.a: la empresa activa debe conservar al menos un documento.
        if sum(1 for d in empresa.documentos_requeridos if d.activa) <= 1:
            raise ReglaDeNegocioError(
                "La empresa debe conservar al menos un documento requerido; agrega otro "
                "antes de eliminar este."
            )

        en_curso = self.repo.contar_cargas_de_documento(documento_id, solo_en_curso=True)
        if en_curso and not confirmar:
            raise RequiereConfirmacionError(
                f"Este documento ya fue cargado en {en_curso} postulación(es) en curso. "
                "Las postulaciones ya enviadas conservarán el archivo cargado, pero el "
                "documento no se pedirá en postulaciones futuras.",
                detalle={"postulaciones_en_curso": en_curso},
            )

        if self.repo.contar_cargas_de_documento(documento_id) > 0:
            documento.activa = False
        else:
            self.repo.eliminar(documento)
        self.db.commit()

    def inactivar_empresa(self, empresa_id: int, forzar: bool = False) -> EmpresaReceptora:
        """Flujo alterno 4.1.b / excepción 31.1.a: con postulaciones pendientes
        de aprobación, exige confirmación antes de inactivar."""
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")

        pendientes = self.postulacion_repo.listar_pendientes(empresa_id=empresa_id)
        if pendientes and not forzar:
            raise RequiereConfirmacionError(
                f"Esta empresa tiene {len(pendientes)} postulación(es) pendiente(s) de "
                "aprobación; resuélvelas primero (CU-03) o confirma inactivar solo para "
                "nuevas postulaciones, conservando las existentes en trámite.",
                detalle={"postulaciones_pendientes": len(pendientes)},
            )

        empresa.estado = EmpresaEstadoEnum.INACTIVA
        self.repo.guardar(empresa)
        self.db.commit()
        return empresa

    def listar(self, solo_activas: bool = False) -> list[EmpresaReceptora]:
        return self.repo.listar(solo_activas=solo_activas)

    def obtener(self, empresa_id: int) -> EmpresaReceptora:
        empresa = self.repo.get_by_id(empresa_id)
        if empresa is None:
            raise NoEncontradoError(f"No existe una empresa receptora con id={empresa_id}.")
        return empresa
