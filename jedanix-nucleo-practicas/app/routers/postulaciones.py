from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, requiere_rol
from app.models.enums import RolEnum
from app.models.postulacion import Postulacion
from app.models.usuario import Usuario
from app.schemas.postulacion import (
    PostulacionCierre,
    PostulacionCreate,
    PostulacionDecision,
    PostulacionListItem,
    PostulacionOut,
)
from app.services.postulacion_service import PostulacionService

router = APIRouter(prefix="/postulaciones", tags=["postulaciones / prácticas"])


# ---- CU-06 (Estudiante) ----
# "/me" va antes que "/{postulacion_id}" por la misma razón que en usuarios.py.


@router.post(
    "",
    response_model=PostulacionOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def crear_postulacion(
    data: PostulacionCreate,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> Postulacion:
    return PostulacionService(db).crear_postulacion(usuario_actual.id, data)


@router.post(
    "/{postulacion_id}/enviar",
    response_model=PostulacionOut,
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def enviar_borrador(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> Postulacion:
    """Flujo alterno 9.1.a: promueve un BORRADOR propio a PENDIENTE_DE_APROBACION."""
    return PostulacionService(db).enviar_borrador(usuario_actual.id, postulacion_id)


@router.get(
    "/me",
    response_model=list[PostulacionOut],
    dependencies=[Depends(requiere_rol(RolEnum.ESTUDIANTE))],
)
def listar_mis_postulaciones(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> list[Postulacion]:
    return PostulacionService(db).listar_mias(usuario_actual.id)


# ---- CU-03 (Director) ----


@router.get(
    "/pendientes",
    response_model=list[PostulacionListItem],
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def listar_pendientes(
    empresa_id: int | None = Query(default=None), db: Session = Depends(get_db)
) -> list[Postulacion]:
    return PostulacionService(db).listar_pendientes_director(empresa_id=empresa_id)


@router.patch(
    "/{postulacion_id}/decision",
    response_model=PostulacionOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def decidir_postulacion(
    postulacion_id: int, data: PostulacionDecision, db: Session = Depends(get_db)
) -> Postulacion:
    """Excepción 14.1.a: si el estudiante ya quedó matriculado en otra empresa
    mientras esta solicitud seguía pendiente, el servicio responde 409."""
    return PostulacionService(db).decidir_postulacion(postulacion_id, data)


# ---- CU-05 (Director) ----


@router.patch(
    "/{postulacion_id}/cierre",
    response_model=PostulacionOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def decidir_cierre(
    postulacion_id: int, data: PostulacionCierre, db: Session = Depends(get_db)
) -> Postulacion:
    return PostulacionService(db).decidir_cierre(postulacion_id, data)


# ---- CU-09 / CU-10: estudiantes matriculados bajo mi responsabilidad ----


@router.get(
    "/matriculados",
    response_model=list[PostulacionListItem],
    dependencies=[Depends(requiere_rol(RolEnum.COORDINADOR, RolEnum.DOCENTE_ASESOR))],
)
def listar_matriculados(
    usuario_actual: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> list[Postulacion]:
    service = PostulacionService(db)
    if usuario_actual.rol == RolEnum.COORDINADOR:
        return service.listar_matriculados_por_coordinador(usuario_actual.id)
    return service.listar_matriculados_por_docente_asesor(usuario_actual.id)


# ---- Detalle (ruta dinámica al final: debe quedar después de las literales) ----


@router.get("/{postulacion_id}", response_model=PostulacionOut)
def obtener_postulacion(
    postulacion_id: int,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> Postulacion:
    """El Estudiante solo ve su propia postulación; el Director ve cualquiera
    (es quien decide y cierra). Coordinador/Docente Asesor no la consultan por
    aquí -- ven a sus estudiantes matriculados vía `/postulaciones/matriculados`
    y el detalle de avances/objetivos por sus propios endpoints."""
    postulacion = PostulacionService(db).obtener(postulacion_id)
    es_dueno = usuario_actual.rol == RolEnum.ESTUDIANTE and postulacion.estudiante_id == usuario_actual.id
    es_director = usuario_actual.rol == RolEnum.DIRECTOR
    if not (es_dueno or es_director):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver el detalle de esta postulación.",
        )
    return postulacion
