from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import PostulacionEstadoEnum
from app.schemas.empresa_receptora import EmpresaReceptoraListItem
from app.schemas.usuario import UsuarioListItem


class RespuestaBitacoraInput(BaseModel):
    """CU-06, paso 12: respuesta del estudiante a una pregunta de la bitácora
    de la empresa a la que se postula."""

    pregunta_id: int
    respuesta_texto: str = Field(min_length=1)


class RespuestaBitacoraOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    pregunta_id: int
    respuesta_texto: str


class DocumentoPostulacionInput(BaseModel):
    """CU-06, pasos 12-15: un documento requerido ya cargado por el estudiante.
    `archivo` es la ruta/URL que entrega el endpoint de carga de archivos (la
    subida del binario no es responsabilidad de este esquema)."""

    documento_requerido_id: int
    archivo: str = Field(min_length=1, max_length=255)


class DocumentoPostulacionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    documento_requerido_id: int
    archivo: str
    fecha_carga: datetime


class PostulacionCreate(BaseModel):
    """CU-06, flujo básico pasos 11-24 y flujo alterno 9.1.a. El mismo esquema
    sirve para "Guardar y salir" (`enviar=False` → la postulación queda en
    `BORRADOR`) y para "Enviar solicitud formalmente" (`enviar=True` → queda en
    `PENDIENTE_DE_APROBACION`).

    Las validaciones que requieren consultar la base de datos — que la empresa
    esté ACTIVA, que el estudiante no tenga ya una postulación activa (excepción
    2.1.a/10), que todas las preguntas obligatorias de la bitácora estén
    respondidas (excepción 22.1.a) y todos los documentos requeridos estén
    cargados (excepción 21.1.a) antes de poder enviar — se hacen en la capa de
    servicio, no aquí: un esquema Pydantic no tiene acceso a la base de datos."""

    empresa_id: int
    enviar: bool = True
    respuestas_bitacora: list[RespuestaBitacoraInput] = Field(default_factory=list)
    documentos_postulacion: list[DocumentoPostulacionInput] = Field(default_factory=list)


class PostulacionDecision(BaseModel):
    """CU-03, pasos 13-15 y flujo alterno 13.1.a: decisión del Director sobre una
    solicitud pendiente. `motivo_rechazo` es obligatorio solo si `aprobar=False`
    (excepción 13.1.a.1), validado en la capa de servicio porque depende del
    valor de `aprobar`, no de un solo campo aislado."""

    aprobar: bool
    motivo_rechazo: str | None = Field(default=None, min_length=1)


class PostulacionCierre(BaseModel):
    """CU-05: cierre formal de la práctica una vez cumplidas las horas
    requeridas, o rechazo del cierre con una observación."""

    aprobar: bool
    observacion_cierre: str | None = Field(default=None, min_length=1)


class PostulacionOut(BaseModel):
    """Detalle completo de una postulación/práctica, usado tanto por el
    Estudiante (CU-06, CU-07) como por el Director (CU-03, CU-05)."""

    model_config = {"from_attributes": True}

    id: int
    estudiante: UsuarioListItem
    empresa: EmpresaReceptoraListItem
    estado: PostulacionEstadoEnum
    fecha_postulacion: datetime | None
    motivo_rechazo: str | None
    fecha_decision: datetime | None
    fecha_cierre: datetime | None
    observacion_cierre: str | None
    respuestas_bitacora: list[RespuestaBitacoraOut]
    documentos_postulacion: list[DocumentoPostulacionOut]


class PostulacionListItem(BaseModel):
    """CU-03, paso 5: fila del listado de solicitudes pendientes de una empresa
    (nombre del estudiante y fecha de envío)."""

    model_config = {"from_attributes": True}

    id: int
    estudiante: UsuarioListItem
    empresa: EmpresaReceptoraListItem
    estado: PostulacionEstadoEnum
    fecha_postulacion: datetime | None