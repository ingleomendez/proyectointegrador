from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import (
    FactorRhEnum,
    GrupoSanguineoEnum,
    RolEnum,
    UsuarioEstadoEnum,
)

# Validación básica de "formato institucional" (CU-01 excepción 14.1.a, Gestionar
# Perfil no lo exige porque el correo no es editable ahí). Ningún CU especifica un
# dominio institucional exacto, así que se valida solo la forma general de correo.
_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# CU Gestionar Perfil, excepción 19.1.a: formato de celular. Se acepta un prefijo
# "+" opcional seguido de 7 a 15 dígitos (sin espacios ni guiones).
_CELULAR_REGEX = re.compile(r"^\+?\d{7,15}$")


class UsuarioCreate(BaseModel):
    """CU-01, flujo básico pasos 6-16: datos que el Director diligencia al crear
    una cuenta. El sistema genera la contraseña temporal (paso 17) — no la recibe
    este esquema. `programa_academico` es obligatorio únicamente si `rol` es
    ESTUDIANTE (paso 16)."""

    nombre_completo: str = Field(min_length=1, max_length=150)
    correo_institucional: str = Field(min_length=1, max_length=150)
    rol: RolEnum
    programa_academico: str | None = Field(default=None, max_length=150)

    @field_validator("correo_institucional")
    @classmethod
    def _correo_valido(cls, v: str) -> str:
        if not _EMAIL_REGEX.match(v):
            raise ValueError("El correo institucional no tiene un formato válido.")
        return v

    @model_validator(mode="after")
    def _programa_requerido_si_estudiante(self) -> "UsuarioCreate":
        if self.rol == RolEnum.ESTUDIANTE and not self.programa_academico:
            raise ValueError(
                "El programa académico es obligatorio cuando el rol es ESTUDIANTE."
            )
        if self.rol != RolEnum.ESTUDIANTE and self.programa_academico:
            raise ValueError(
                "El programa académico solo aplica a usuarios con rol ESTUDIANTE."
            )
        return self


class UsuarioUpdateDirector(BaseModel):
    """CU-01, flujo alterno 4.1.a: edición por parte del Director. El correo
    institucional NO es editable (precondición del flujo alterno) por lo que no
    aparece aquí."""

    nombre_completo: str = Field(min_length=1, max_length=150)
    rol: RolEnum
    programa_academico: str | None = Field(default=None, max_length=150)

    @model_validator(mode="after")
    def _programa_requerido_si_estudiante(self) -> "UsuarioUpdateDirector":
        if self.rol == RolEnum.ESTUDIANTE and not self.programa_academico:
            raise ValueError(
                "El programa académico es obligatorio cuando el rol es ESTUDIANTE."
            )
        if self.rol != RolEnum.ESTUDIANTE and self.programa_academico:
            raise ValueError(
                "El programa académico solo aplica a usuarios con rol ESTUDIANTE."
            )
        return self


class PerfilUpdate(BaseModel):
    """Caso de uso compartido "Gestionar Perfil": campos editables por el propio
    usuario autenticado. `correo_institucional` y `programa_academico` NO están
    aquí porque son de solo lectura (los define el Director en CU-01).

    `direccion_residencia`, `grupo_sanguineo`, `factor_rh` y `eps` solo aplican a
    un Estudiante; como este esquema no conoce el rol del usuario autenticado (lo
    sabe el router/servicio a partir del token), la regla "EPS obligatoria para
    Estudiante" (excepción 22.1.a) se valida en la capa de servicio, no aquí."""

    nombre_completo: str = Field(min_length=1, max_length=150)
    celular: str | None = Field(default=None, max_length=20)
    foto_perfil: str | None = Field(default=None, max_length=255)
    direccion_residencia: str | None = Field(default=None, max_length=255)
    grupo_sanguineo: GrupoSanguineoEnum | None = None
    factor_rh: FactorRhEnum | None = None
    eps: str | None = Field(default=None, max_length=100)

    @field_validator("celular")
    @classmethod
    def _celular_valido(cls, v: str | None) -> str | None:
        if v is not None and not _CELULAR_REGEX.match(v):
            raise ValueError("El número de celular no tiene un formato válido.")
        return v


class UsuarioOut(BaseModel):
    """Representación de un usuario para el Director (CU-01) y para el propio
    usuario (Gestionar Perfil). Nunca incluye `contrasena_hash`."""

    model_config = {"from_attributes": True}

    id: int
    nombre_completo: str
    correo_institucional: str
    celular: str | None
    foto_perfil: str | None
    rol: RolEnum
    estado: UsuarioEstadoEnum
    fecha_registro: datetime
    programa_academico: str | None
    direccion_residencia: str | None
    grupo_sanguineo: GrupoSanguineoEnum | None
    factor_rh: FactorRhEnum | None
    eps: str | None


class UsuarioListItem(BaseModel):
    """Fila del listado de usuarios de CU-01, paso 3: nombre, correo, rol y estado."""

    model_config = {"from_attributes": True}

    id: int
    nombre_completo: str
    correo_institucional: str
    rol: RolEnum
    estado: UsuarioEstadoEnum