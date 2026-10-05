from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.usuario_service import UsuarioService

router = APIRouter(prefix="/auth", tags=["autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Precondición transversal de todos los CU ("el actor debe estar
    autenticado"). No es un CU propio, por decisión explícita de alcance."""
    return UsuarioService(db).login(data)
