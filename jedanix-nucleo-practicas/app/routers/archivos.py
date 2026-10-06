from __future__ import annotations

import mimetypes
import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_usuario
from app.models.archivo_subido import ArchivoSubido
from app.models.usuario import Usuario

# Dos routers: `router` (prefijo /archivos, carga, requiere sesión) y
# `router_publico` (/uploads/<nombre>, descarga). La descarga es abierta porque
# el navegador abre el soporte/PDF con un enlace directo (sin cabecera
# Authorization); el nombre lleva un UUID aleatorio, así que no es adivinable.
router = APIRouter(prefix="/archivos", tags=["archivos"])
router_publico = APIRouter(prefix="/uploads", tags=["archivos"])

EXTENSIONES_PERMITIDAS = {".pdf"}
# CU-08, paso 19: los soportes de un avance aceptan PDF, PNG o JPG. Solo se
# habilitan cuando el cliente lo pide explícitamente (?permitir_imagenes=true);
# CU-06 sigue exigiendo PDF.
EXTENSIONES_SOPORTE = {".pdf", ".png", ".jpg", ".jpeg"}
TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024  # 10 MB

_TIPOS_CONTENIDO = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _sanear_nombre(nombre: str) -> str:
    """Quita acentos/espacios/caracteres raros del nombre original para que el
    nombre guardado sea predecible y seguro."""
    nombre = nombre.strip().replace(" ", "_")
    return re.sub(r"[^A-Za-z0-9._-]", "", nombre) or "archivo"


@router.post("", status_code=status.HTTP_201_CREATED)
async def cargar_archivo(
    archivo: UploadFile = File(...),
    permitir_imagenes: bool = False,
    usuario_actual: Usuario = Depends(get_current_usuario),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Endpoint genérico de carga de archivos. `DocumentoPostulacionInput.archivo`
    (CU-06, pasos 12-15) documenta que ese campo es "la ruta/URL que entrega el
    endpoint de carga de archivos" -- este es ese endpoint.

    CU-06, paso 13: "el sistema valida que el archivo tenga formato PDF" -- se
    valida por extensión (y se deja `TAMANO_MAXIMO_BYTES` como tope razonable,
    no especificado explícitamente en el CU pero necesario en cualquier subida
    real). El contenido se guarda en la base de datos con un nombre único
    (evita colisiones entre estudiantes) y se devuelve la ruta pública."""
    extension = Path(archivo.filename or "").suffix.lower()
    permitidas = EXTENSIONES_SOPORTE if permitir_imagenes else EXTENSIONES_PERMITIDAS
    if extension not in permitidas:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Solo se aceptan archivos en formato PDF, PNG o JPG."
                if permitir_imagenes
                else "Solo se aceptan archivos en formato PDF."
            ),
        )

    contenido = await archivo.read()
    if len(contenido) > TAMANO_MAXIMO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El archivo supera el tamaño máximo permitido (10 MB).",
        )

    nombre_unico = f"{uuid.uuid4().hex}_{_sanear_nombre(archivo.filename or 'archivo.pdf')}"
    db.add(
        ArchivoSubido(
            nombre=nombre_unico[:255],
            contenido=contenido,
            tipo_contenido=_TIPOS_CONTENIDO.get(extension)
            or mimetypes.guess_type(nombre_unico)[0]
            or "application/octet-stream",
            tamano_bytes=len(contenido),
            usuario_id=usuario_actual.id,
        )
    )
    db.commit()

    return {"archivo": f"/uploads/{nombre_unico[:255]}"}


@router_publico.get("/{nombre}")
def descargar_archivo(nombre: str, db: Session = Depends(get_db)) -> Response:
    """Entrega el contenido guardado en la base de datos para que la ruta
    `/uploads/<nombre>` siga siendo un enlace directo (visualizable/descargable)."""
    registro = db.get(ArchivoSubido, nombre)
    if registro is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado.")
    return Response(
        content=registro.contenido,
        media_type=registro.tipo_contenido,
        headers={"Content-Disposition": "inline", "Cache-Control": "private, max-age=3600"},
    )
