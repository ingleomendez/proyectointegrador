from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import RolEnum


class LoginRequest(BaseModel):
    """Credenciales de acceso. La autenticación es precondición transversal de
    todos los CU ("el actor debe estar autenticado"); no existe un CU dedicado,
    por decisión explícita del alcance del proyecto."""

    correo_institucional: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    """Respuesta del login: el JWT más los datos mínimos de sesión, para que el
    frontend arme el panel correcto según el rol sin decodificar el token."""

    access_token: str
    token_type: str = "bearer"
    usuario_id: int
    nombre_completo: str
    rol: RolEnum