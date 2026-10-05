from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario, requiere_rol
from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import RolEnum
from app.models.usuario import Usuario
from app.schemas.empresa_receptora import (
    DocumentoRequeridoCreate,
    DocumentoRequeridoOut,
    EmpresaReceptoraCreate,
    EmpresaReceptoraListItem,
    EmpresaReceptoraOut,
    EmpresaReceptoraUpdate,
    PreguntaBitacoraCreate,
    PreguntaBitacoraOut,
)
from app.services.empresa_service import EmpresaReceptoraService

router = APIRouter(prefix="/empresas", tags=["empresas receptoras"])


@router.post(
    "",
    response_model=EmpresaReceptoraOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def crear_empresa(data: EmpresaReceptoraCreate, db: Session = Depends(get_db)) -> EmpresaReceptora:
    return EmpresaReceptoraService(db).crear_empresa(data)


@router.get("", response_model=list[EmpresaReceptoraListItem])
def listar_empresas(
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> list[EmpresaReceptora]:
    """CU-02, paso 2 (Director: listado completo) y CU-06, pasos 4-5 (Estudiante:
    solo empresas ACTIVAS). El filtro lo decide el rol del token, no un query
    param, para que un Estudiante no pueda pedir las inactivas cambiando la URL."""
    solo_activas = usuario_actual.rol == RolEnum.ESTUDIANTE
    return EmpresaReceptoraService(db).listar(solo_activas=solo_activas)


@router.get("/{empresa_id}", response_model=EmpresaReceptoraOut)
def obtener_empresa(
    empresa_id: int,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> EmpresaReceptora:
    return EmpresaReceptoraService(db).obtener(empresa_id)


@router.put(
    "/{empresa_id}",
    response_model=EmpresaReceptoraOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def actualizar_empresa(
    empresa_id: int, data: EmpresaReceptoraUpdate, db: Session = Depends(get_db)
) -> EmpresaReceptora:
    return EmpresaReceptoraService(db).actualizar_empresa(empresa_id, data)


@router.post(
    "/{empresa_id}/preguntas",
    response_model=PreguntaBitacoraOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def agregar_pregunta(
    empresa_id: int,
    data: PreguntaBitacoraCreate,
    confirmar_duplicado: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    """Excepción 17.1.a: enunciado duplicado -> 409 con `requiere_confirmacion`;
    repetir con `?confirmar_duplicado=true` para agregarla de todas formas."""
    return EmpresaReceptoraService(db).agregar_pregunta(
        empresa_id, data, confirmar_duplicado=confirmar_duplicado
    )


@router.post(
    "/{empresa_id}/documentos-requeridos",
    response_model=DocumentoRequeridoOut,
    status_code=201,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def agregar_documento_requerido(
    empresa_id: int, data: DocumentoRequeridoCreate, db: Session = Depends(get_db)
):
    return EmpresaReceptoraService(db).agregar_documento_requerido(empresa_id, data)


@router.patch(
    "/{empresa_id}/inactivar",
    response_model=EmpresaReceptoraOut,
    dependencies=[Depends(requiere_rol(RolEnum.DIRECTOR))],
)
def inactivar_empresa(
    empresa_id: int, forzar: bool = Query(default=False), db: Session = Depends(get_db)
) -> EmpresaReceptora:
    """Excepción 31.1.a: postulaciones pendientes -> 409 con
    `requiere_confirmacion`; repetir con `?forzar=true`."""
    return EmpresaReceptoraService(db).inactivar_empresa(empresa_id, forzar=forzar)
