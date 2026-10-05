from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ObjetivoEstadoEnum


class ObjetivoPracticaCreate(BaseModel):
    """CU-11, pasos 5-8: el estudiante redacta y envía (o reenvía, flujo 4.1.a,
    tras un rechazo) el contenido de sus objetivos de práctica."""

    contenido: str = Field(min_length=1)


class ObjetivoPracticaDecision(BaseModel):
    """CU-11, pasos 17-18 y flujo alterno 17.1.a: decisión del Docente Asesor.
    `observacion_docente` es obligatoria solo si `aprobar=False` (excepción
    17.1.a.1); se valida en la capa de servicio porque depende de `aprobar`."""

    aprobar: bool
    observacion_docente: str | None = Field(default=None, min_length=1)


class ObjetivoPracticaOut(BaseModel):
    """Estado de los objetivos de una práctica, visible para el Estudiante
    (CU-07, CU-11) y para el Docente Asesor (CU-11)."""

    model_config = {"from_attributes": True}

    id: int
    postulacion_id: int
    contenido: str
    estado: ObjetivoEstadoEnum
    observacion_docente: str | None
    fecha_envio: datetime
    fecha_decision: datetime | None