from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, requiere_rol
from app.models.enums import RolEnum
from app.models.usuario import Usuario
from app.schemas.usuario import (
    PerfilUpdate,
    UsuarioCreate,
    UsuarioListItem,
    UsuarioOut,
    UsuarioUpdateDirector,
)
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


# ---- Gestionar Perfil: el propio usuario autenticado, sobre sí mismo ----
# (van primero: "/me" es una ruta literal y debe registrarse antes que
# "/{usuario_id}" para que FastAPI no intente interpretar "me" como un id)


@router.get("/me", response_model=UsuarioOut)
def obtener_mi_perfil(usuario_actual: Usuario = Depends(get_current_usuario)) -> Usuario:
    return usuario_actual


@router.put("/me", response_model=UsuarioOut)
def actualizar_mi_perfil(
    data: PerfilUpdate,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> Usuario:
    return UsuarioService(db).actualizar_perfil(usuario_actual.id, data)


# ---- CU-01: Gestionar Usuarios del Sistema (Director) ----


@router.post(
    "",
    response_model=UsuarioOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db)) -> Usuario:
    return UsuarioService(db).crear_usuario(data)


@router.get(
    "",
    response_model=list[UsuarioListItem],
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def listar_usuarios(
    rol: RolEnum | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Usuario]:
    return UsuarioService(db).listar(rol=rol)


@router.get(
    "/{usuario_id}",
    response_model=UsuarioOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)) -> Usuario:
    """Detalle de un usuario para el formulario de edición del Director
    (CU-01, flujo alterno 4.1.a)."""
    return UsuarioService(db).obtener(usuario_id)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def actualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdateDirector,
    confirmar_cambio_rol: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> Usuario:
    """Excepción 6.1.a: si el cambio de rol deja empresas sin responsable, el
    servicio responde 409 con `requiere_confirmacion`; repetir la llamada con
    `?confirmar_cambio_rol=true` para aplicarlo de todas formas."""
    return UsuarioService(db).actualizar_usuario_director(
        usuario_id, data, confirmar_cambio_rol=confirmar_cambio_rol
    )


@router.patch(
    "/{usuario_id}/inactivar",
    response_model=UsuarioOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def inactivar_usuario(
    usuario_id: int,
    forzar: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> Usuario:
    """Excepción 4.1.b.1: igual patrón de confirmación que arriba, con
    `?forzar=true`."""
    return UsuarioService(db).inactivar_usuario(usuario_id, forzar=forzar)


@router.post(
    "/{usuario_id}/reenviar-credenciales",
    response_model=UsuarioOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def reenviar_credenciales(usuario_id: int, db: Session = Depends(get_db)) -> Usuario:
    """CU-01, excepción 19.1.a: genera una contraseña temporal nueva y la envía
    al correo institucional del usuario."""
    return UsuarioService(db).reenviar_credenciales(usuario_id)


@router.patch(
    "/{usuario_id}/reactivar",
    response_model=UsuarioOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def reactivar_usuario(usuario_id: int, db: Session = Depends(get_db)) -> Usuario:
    return UsuarioService(db).reactivar_usuario(usuario_id)
