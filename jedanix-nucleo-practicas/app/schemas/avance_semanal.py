from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.enums import AvanceEstadoEnum, TipoArchivoSoporteEnum


class DiaTrabajadoInput(BaseModel):
    """CU-08, pasos 11-13: un bloque de día dentro del avance semanal."""

    numero_dia: int = Field(ge=1, le=6)
    descripcion_dia: str = Field(min_length=1)
    horas_dia: Decimal = Field(gt=0, le=24)


class DiaTrabajadoOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    numero_dia: int
    descripcion_dia: str
    horas_dia: Decimal


class SoporteAvanceInput(BaseModel):
    """CU-08, pasos 18-22: un archivo de evidencia (PDF/PNG/JPG) adjunto al
    avance. `archivo` es la ruta/URL que entrega el endpoint de carga, igual que
    en `DocumentoPostulacionInput`."""

    archivo: str = Field(min_length=1, max_length=255)
    tipo_archivo: TipoArchivoSoporteEnum


class SoporteAvanceOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    archivo: str
    tipo_archivo: TipoArchivoSoporteEnum
    fecha_carga: datetime


class AvanceSemanalCreate(BaseModel):
    """CU-08, flujo básico pasos 8-27 (y flujo 6.1.c para reenviar un avance
    OBSERVADO, que reutiliza este mismo esquema). Validaciones que sí puede
    resolver un esquema Pydantic sin tocar la base de datos:
    - `dias_trabajados` trae entre 1 y 6 bloques, con `numero_dia` único y
      consecutivo de 1 a N (paso 10).
    - `horas_totales` debe coincidir exactamente con la suma de `horas_dia` de
      todos los bloques (paso 14 / excepción 28.1.a).
    - al menos un soporte cargado (paso 27, campos obligatorios).

    Lo que SÍ requiere base de datos y se valida en la capa de servicio: que la
    práctica del estudiante esté MATRICULADA con objetivos APROBADOS y no
    FINALIZADA (precondiciones 2-4), y que no exista ya un avance para la misma
    `semana_calendario` (postcondición 4 / `UNIQUE (postulacion_id, semana_calendario)`)."""

    semana_calendario: date
    actividades_a_desarrollar: str = Field(min_length=1)
    dias_trabajados: list[DiaTrabajadoInput] = Field(min_length=1, max_length=6)
    horas_totales: Decimal = Field(gt=0)
    beneficio_economico: Decimal = Field(ge=0)
    soportes: list[SoporteAvanceInput] = Field(min_length=1)
    actividades_generales: str = Field(min_length=1)
    ejecucion: str = Field(min_length=1)
    observaciones_estudiante: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validar_dias_y_horas(self) -> "AvanceSemanalCreate":
        numeros = sorted(d.numero_dia for d in self.dias_trabajados)
        esperados = list(range(1, len(self.dias_trabajados) + 1))
        if numeros != esperados:
            raise ValueError(
                "Los días trabajados deben numerarse consecutivamente de 1 a N, sin repetir."
            )
        suma_horas = sum((d.horas_dia for d in self.dias_trabajados), Decimal("0"))
        if suma_horas != self.horas_totales:
            raise ValueError(
                f"Las horas totales ({self.horas_totales}) no coinciden con la suma "
                f"de las horas diarias ingresadas ({suma_horas})."
            )
        return self


class AvanceCalificacion(BaseModel):
    """CU-09, pasos 12-16 y flujo alterno 12.1.a: el Coordinador califica (y el
    avance pasa a ACEPTADO) u observa (y pasa a OBSERVADO). Exactamente uno de
    los dos debe venir diligenciado."""

    calificacion_coordinador: Decimal | None = Field(default=None, ge=0, le=5)
    comentario_coordinador: str | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def _calificar_o_observar(self) -> "AvanceCalificacion":
        tiene_calificacion = self.calificacion_coordinador is not None
        tiene_comentario = bool(self.comentario_coordinador)
        if tiene_calificacion == tiene_comentario:
            raise ValueError(
                "Debes enviar exactamente uno de los dos: una calificación (para aceptar) "
                "o un comentario (para observar), no ambos ni ninguno."
            )
        return self


class AvanceObservacionDocente(BaseModel):
    """CU-10, pasos 10-13 y flujo alterno 7.1.a (editar una observación
    existente, mismo esquema): observación cualitativa del Docente Asesor.
    A diferencia de CU-09, esto nunca cambia el `estado` del avance."""

    observacion_docente_asesor: str = Field(min_length=1)


class AvanceSemanalOut(BaseModel):
    """Detalle completo de un avance, usado por el Estudiante (CU-08), el
    Coordinador (CU-09) y el Docente Asesor (CU-10) — los tres ven los mismos
    campos, según indica CU-10 paso 8 ("mismos campos que en CU-09")."""

    model_config = {"from_attributes": True}

    id: int
    postulacion_id: int
    estudiante_nombre: str
    empresa_nombre: str
    semana_calendario: date
    actividades_a_desarrollar: str
    dias_trabajados: list[DiaTrabajadoOut]
    horas_totales: Decimal
    beneficio_economico: Decimal
    soportes_avance: list[SoporteAvanceOut]
    actividades_generales: str
    ejecucion: str
    observaciones_estudiante: str
    estado: AvanceEstadoEnum
    fecha_envio: datetime
    calificacion_coordinador: Decimal | None
    comentario_coordinador: str | None
    fecha_calificacion: datetime | None
    observacion_docente_asesor: str | None
    fecha_observacion_docente: datetime | None


class AvanceSemanalListItem(BaseModel):
    """CU-08 paso 4 / CU-09 paso 6 / CU-10 paso 6: fila del historial de avances."""

    model_config = {"from_attributes": True}

    id: int
    postulacion_id: int
    estudiante_nombre: str
    empresa_nombre: str
    semana_calendario: date
    fecha_envio: datetime
    estado: AvanceEstadoEnum
    horas_totales: Decimal
    calificacion_coordinador: Decimal | None
