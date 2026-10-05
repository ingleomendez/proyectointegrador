from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.enums import RolEnum, UsuarioEstadoEnum
from app.models.usuario import Usuario
from app.repositories.usuario_repository import UsuarioRepository

# `auto_error=False`: así podemos devolver nuestro propio mensaje 401 en vez del
# genérico de FastAPI cuando no viene el header `Authorization`.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_usuario(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Dependencia transversal a TODOS los CU ("el actor debe estar
    autenticado"): valida el JWT del header `Authorization: Bearer <token>`
    (emitido por `UsuarioService.login`) y carga el usuario correspondiente.

    401 si falta el token, está mal formado, expiró, o el usuario ya no existe
    o fue inactivado mientras el token seguía siendo válido (CU-01, flujo
    alterno 4.1.b: inactivar debe cortar el acceso, no solo el login)."""
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de autenticación inválidas o ausentes.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credenciales is None:
        raise credenciales_invalidas

    payload = decode_access_token(credenciales.credentials)
    if payload is None or "sub" not in payload:
        raise credenciales_invalidas

    try:
        usuario_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise credenciales_invalidas

    usuario = UsuarioRepository(db).get_by_id(usuario_id)
    if usuario is None:
        raise credenciales_invalidas
    if usuario.estado == UsuarioEstadoEnum.INACTIVO:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Esta cuenta está inactiva.",
        )
    return usuario


def requiere_rol(*roles: RolEnum):
    """Factory de dependencia para autorización por rol. Uso en un router:
    `dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))]`. Devuelve 403 si
    el rol del usuario autenticado no está entre los permitidos.

    Es una fábrica (no una dependencia en sí) porque cada endpoint necesita un
    conjunto distinto de roles permitidos; `requiere_rol(RolEnum.DIRECTOR)` y
    `requiere_rol(RolEnum.COORDINADOR, RolEnum.DOCENTE_ASESOR)` son dos
    dependencias distintas generadas a partir de la misma función."""

    def _verificar(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción.",
            )
        return usuario

    return _verificar
