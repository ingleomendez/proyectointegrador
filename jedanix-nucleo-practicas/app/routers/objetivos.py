from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, requiere_rol
from app.models.enums import RolEnum
from app.models.objetivo_practica import ObjetivoPractica
from app.models.usuario import Usuario
from app.schemas.objetivo_practica import (
    ObjetivoPracticaCreate,
    ObjetivoPracticaDecision,
    ObjetivoPracticaOut,
)
from app.services.objetivo_service import ObjetivoPracticaService

router = APIRouter(prefix="/objetivos", tags=["objetivos de práctica"])


# ---- CU-11 (Estudiante) ----


@router.post(
    "",
    response_model=ObjetivoPracticaOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def enviar_objetivos(
    data: ObjetivoPracticaCreate,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> ObjetivoPractica:
    """Sirve tanto para el envío inicial como para el reenvío tras rechazo
    (flujo alterno 4.1.a) -- mismo endpoint, mismo cuerpo."""
    return ObjetivoPracticaService(db).enviar_objetivos(usuario_actual.id, data)


@router.get(
    "/me",
    response_model=ObjetivoPracticaOut,
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def obtener_mis_objetivos(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> ObjetivoPractica:
    return ObjetivoPracticaService(db).obtener_de_mi_practica(usuario_actual.id)


# ---- CU-11 (Docente Asesor) ----


@router.get(
    "/pendientes",
    response_model=list[ObjetivoPracticaOut],
    dependencies=[Depends(requiere_rol(RolEnum.DOCENTE_ASESOR))],
)
def listar_objetivos_pendientes(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> list[ObjetivoPractica]:
    return ObjetivoPracticaService(db).listar_pendientes_docente(usuario_actual.id)


@router.patch(
    "/{objetivo_id}/decision",
    response_model=ObjetivoPracticaOut,
    dependencies=[Depends(requiere_rol(RolEnum.DOCENTE_ASESOR))],
)
def decidir_objetivos(
    objetivo_id: int, data: ObjetivoPracticaDecision, db: Session = Depends(get_db)
) -> ObjetivoPractica:
    return ObjetivoPracticaService(db).decidir_objetivos(objetivo_id, data)
