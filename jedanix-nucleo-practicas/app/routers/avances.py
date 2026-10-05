from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, requiere_rol
from app.models.avance_semanal import AvanceSemanal
from app.models.enums import RolEnum
from app.models.usuario import Usuario
from app.schemas.avance_semanal import (
    AvanceCalificacion,
    AvanceObservacionDocente,
    AvanceSemanalCreate,
    AvanceSemanalListItem,
    AvanceSemanalOut,
)
from app.services.avance_service import AvanceSemanalService

router = APIRouter(prefix="/avances", tags=["avances semanales"])


# ---- CU-08 (Estudiante) ----
# Las rutas literales ("/me", "/coordinador", "/docente") van antes que
# "/{avance_id}" por la misma razón explicada en usuarios.py.


@router.post(
    "",
    response_model=AvanceSemanalOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def registrar_avance(
    data: AvanceSemanalCreate,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> AvanceSemanal:
    return AvanceSemanalService(db).registrar_avance(usuario_actual.id, data)


@router.get(
    "/me",
    response_model=list[AvanceSemanalListItem],
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def listar_mis_avances(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> list[AvanceSemanal]:
    return AvanceSemanalService(db).listar_mios(usuario_actual.id)


# ---- CU-05 (Director): avances de una práctica concreta ----


@router.get(
    "/postulacion/{postulacion_id}",
    response_model=list[AvanceSemanalListItem],
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def listar_avances_de_postulacion(
    postulacion_id: int, db: Session = Depends(get_db)
) -> list[AvanceSemanal]:
    return AvanceSemanalService(db).listar_por_postulacion(postulacion_id)


# ---- CU-09 (Coordinador) ----


@router.get(
    "/coordinador",
    response_model=list[AvanceSemanalListItem],
    dependencies=[Depends(requiere_rol(RolEnum.COORDINADOR))],
)
def listar_avances_coordinador(
    solo_pendientes: bool = Query(default=False),
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> list[AvanceSemanal]:
    return AvanceSemanalService(db).listar_por_coordinador(
        usuario_actual.id, solo_pendientes=solo_pendientes
    )


@router.patch(
    "/{avance_id}/calificacion",
    response_model=AvanceSemanalOut,
    dependencies=[Depends(requiere_rol(RolEnum.COORDINADOR))],
)
def calificar_avance(
    avance_id: int, data: AvanceCalificacion, db: Session = Depends(get_db)
) -> AvanceSemanal:
    """Exactamente uno de `calificacion_coordinador`/`comentario_coordinador`
    (lo exige el esquema): califica -> ACEPTADO, comenta -> OBSERVADO."""
    return AvanceSemanalService(db).calificar_avance(avance_id, data)


# ---- CU-10 (Docente Asesor) ----


@router.get(
    "/docente",
    response_model=list[AvanceSemanalListItem],
    dependencies=[Depends(requiere_rol(RolEnum.DOCENTE_ASESOR))],
)
def listar_avances_docente(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> list[AvanceSemanal]:
    return AvanceSemanalService(db).listar_por_docente_asesor(usuario_actual.id)


@router.patch(
    "/{avance_id}/observacion",
    response_model=AvanceSemanalOut,
    dependencies=[Depends(requiere_rol(RolEnum.DOCENTE_ASESOR))],
)
def observar_avance(
    avance_id: int, data: AvanceObservacionDocente, db: Session = Depends(get_db)
) -> AvanceSemanal:
    """Independiente de CU-09: nunca cambia el `estado` del avance, solo deja
    una observación cualitativa."""
    return AvanceSemanalService(db).observar_avance_docente(avance_id, data)


# ---- Detalle (ruta dinámica al final) ----


@router.get("/{avance_id}", response_model=AvanceSemanalOut)
def obtener_avance(
    avance_id: int,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> AvanceSemanal:
    avance = AvanceSemanalService(db).obtener(avance_id)
    empresa = avance.postulacion.empresa
    autorizado = (
        usuario_actual.rol == RolEnum.DIRECTOR
        or (usuario_actual.rol == RolEnum.ESTUDIANTE and avance.postulacion.estudiante_id == usuario_actual.id)
        or (usuario_actual.rol == RolEnum.COORDINADOR and empresa.coordinador_id == usuario_actual.id)
        or (usuario_actual.rol == RolEnum.DOCENTE_ASESOR and empresa.docente_asesor_id == usuario_actual.id)
    )
    if not autorizado:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este avance.",
        )
    return avance
