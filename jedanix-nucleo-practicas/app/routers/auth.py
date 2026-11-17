from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    MensajeResponse,
    OlvideContrasenaRequest,
    RestablecerContrasenaRequest,
    TokenResponse,
)
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/auth", tags=["autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Precondición transversal de todos los CU ("el actor debe estar
    autenticado"). No es un CU propio, por decisión explícita de alcance."""
    return UsuarioService(db).login(data)


@router.post("/olvide-contrasena", response_model=MensajeResponse)
def olvide_contrasena(
    data: OlvideContrasenaRequest, db: Session = Depends(get_db)
) -> MensajeResponse:
    """Siempre responde lo mismo, exista o no el correo (no revela cuentas)."""
    UsuarioService(db).solicitar_restablecimiento(data.correo_institucional)
    return MensajeResponse(
        mensaje="Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva. "
        "Revisa también la carpeta de spam."
    )


@router.post("/restablecer-contrasena", response_model=MensajeResponse)
def restablecer_contrasena(
    data: RestablecerContrasenaRequest, db: Session = Depends(get_db)
) -> MensajeResponse:
    UsuarioService(db).restablecer_contrasena(data.token, data.password_nueva)
    return MensajeResponse(mensaje="Tu contraseña fue actualizada. Ya puedes iniciar sesión.")
