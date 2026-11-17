from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario
from app.models.notificacion_usuario import NotificacionUsuario
from app.models.usuario import Usuario
from app.schemas.notificacion_usuario import MisNotificacionesOut, NotificacionUsuarioOut

router = APIRouter(prefix="/mis-notificaciones", tags=["notificaciones internas"])

# Más de esto no se conserva por usuario: se borran las leídas más antiguas.
_MAX_CONSERVADAS = 200


@router.get("", response_model=MisNotificacionesOut)
def listar_mis_notificaciones(
    limite: int = Query(20, ge=1, le=50),
    usuario: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> MisNotificacionesOut:
    """Avisos del usuario autenticado, del más reciente al más antiguo."""
    no_leidas = db.execute(
        select(func.count())
        .select_from(NotificacionUsuario)
        .where(NotificacionUsuario.usuario_id == usuario.id, NotificacionUsuario.leida.is_(False))
    ).scalar_one()
    filas = (
        db.execute(
            select(NotificacionUsuario)
            .where(NotificacionUsuario.usuario_id == usuario.id)
            .order_by(NotificacionUsuario.creada_en.desc(), NotificacionUsuario.id.desc())
            .limit(limite)
        )
        .scalars()
        .all()
    )
    return MisNotificacionesOut(
        no_leidas=no_leidas,
        notificaciones=[NotificacionUsuarioOut.model_validate(f) for f in filas],
    )


@router.post("/leer-todas", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def marcar_todas_leidas(
    usuario: Usuario = Depends(get_current_usuario), db: Session = Depends(get_db)
) -> Response:
    db.execute(
        update(NotificacionUsuario)
        .where(NotificacionUsuario.usuario_id == usuario.id, NotificacionUsuario.leida.is_(False))
        .values(leida=True)
    )
    _podar(db, usuario.id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{notificacion_id}/leer", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def marcar_leida(
    notificacion_id: int,
    usuario: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> Response:
    # Solo se puede marcar un aviso propio: un id ajeno responde 404, no 403,
    # para no revelar que existe.
    notificacion = db.get(NotificacionUsuario, notificacion_id)
    if notificacion is None or notificacion.usuario_id != usuario.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe esa notificación.")
    notificacion.leida = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _podar(db: Session, usuario_id: int) -> None:
    """Conserva como máximo `_MAX_CONSERVADAS` avisos por usuario (los más recientes)."""
    ids_conservar = (
        select(NotificacionUsuario.id)
        .where(NotificacionUsuario.usuario_id == usuario_id)
        .order_by(NotificacionUsuario.creada_en.desc(), NotificacionUsuario.id.desc())
        .limit(_MAX_CONSERVADAS)
    )
    db.execute(
        NotificacionUsuario.__table__.delete().where(
            NotificacionUsuario.usuario_id == usuario_id,
            NotificacionUsuario.leida.is_(True),
            NotificacionUsuario.id.not_in(ids_conservar),
        )
    )
