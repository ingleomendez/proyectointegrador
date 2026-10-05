from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import EmpresaEstadoEnum, TipoRespuestaEnum
from app.schemas.usuario import UsuarioListItem


class PreguntaBitacoraCreate(BaseModel):
    """CU-02, pasos 16-19: una pregunta de la bitácora que el Director agrega
    al configurar la empresa."""

    enunciado: str = Field(min_length=1)
    tipo_respuesta: TipoRespuestaEnum


class PreguntaBitacoraOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    enunciado: str
    tipo_respuesta: TipoRespuestaEnum


class DocumentoRequeridoCreate(BaseModel):
    """CU-02, pasos 22-24: un documento requerido (p. ej. "Hoja de vida")."""

    nombre_documento: str = Field(min_length=1, max_length=150)


class DocumentoRequeridoOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    nombre_documento: str


class EmpresaReceptoraCreate(BaseModel):
    """CU-02, flujo básico completo (pasos 6-29): datos generales, responsables,
    bitácora y documentos requeridos de una empresa nueva. El sistema exige al
    menos una pregunta de bitácora para poder guardar (paso 29 / postcondición 2);
    los documentos requeridos son opcionales a nivel de esquema, aunque sin
    ninguno la empresa no aparecerá realmente disponible para postularse."""

    nombre: str = Field(min_length=1, max_length=150)
    descripcion: str = Field(min_length=1)
    requisitos_generales: str = Field(min_length=1)
    horas_requeridas: int = Field(gt=0)
    coordinador_id: int
    docente_asesor_id: int
    preguntas_bitacora: list[PreguntaBitacoraCreate] = Field(min_length=1)
    documentos_requeridos: list[DocumentoRequeridoCreate] = Field(default_factory=list)


class EmpresaReceptoraUpdate(BaseModel):
    """Edición de los datos generales y responsables de una empresa ya existente.
    Las preguntas de bitácora y los documentos requeridos se agregan/editan con
    endpoints propios (`PreguntaBitacoraCreate`/`DocumentoRequeridoCreate`), igual
    que el CU los plantea como acciones independientes ("Agregar pregunta",
    "Agregar documento requerido")."""

    nombre: str = Field(min_length=1, max_length=150)
    descripcion: str = Field(min_length=1)
    requisitos_generales: str = Field(min_length=1)
    horas_requeridas: int = Field(gt=0)
    coordinador_id: int
    docente_asesor_id: int


class EmpresaReceptoraOut(BaseModel):
    """CU-02, detalle de una empresa receptora con sus responsables, bitácora y
    documentos requeridos ya cargados."""

    model_config = {"from_attributes": True}

    id: int
    nombre: str
    descripcion: str
    requisitos_generales: str
    horas_requeridas: int
    estado: EmpresaEstadoEnum
    coordinador: UsuarioListItem
    docente_asesor: UsuarioListItem
    preguntas_bitacora: list[PreguntaBitacoraOut]
    documentos_requeridos: list[DocumentoRequeridoOut]


class EmpresaReceptoraListItem(BaseModel):
    """Fila del listado de CU-02, paso 3: nombre, estado, Coordinador y Docente
    Asesor asignados. También es la fila que ve el Estudiante en CU-06, paso 5
    (ahí solo se listan las que están en estado ACTIVA — ese filtro lo aplica el
    servicio, no este esquema)."""

    model_config = {"from_attributes": True}

    id: int
    nombre: str
    estado: EmpresaEstadoEnum
    coordinador: UsuarioListItem
    docente_asesor: UsuarioListItem