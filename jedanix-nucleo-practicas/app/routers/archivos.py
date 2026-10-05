from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.deps import get_current_usuario
from app.models.usuario import Usuario

router = APIRouter(prefix="/archivos", tags=["archivos"])

# Carpeta `uploads/` en la raíz del proyecto (al lado de `app/`), servida como
# archivos estáticos en `/uploads` (ver app/main.py) para que el `archivo`
# devuelto aquí sea directamente una URL descargable.
DIRECTORIO_CARGAS = Path(__file__).resolve().parent.parent.parent / "uploads"
DIRECTORIO_CARGAS.mkdir(parents=True, exist_ok=True)

EXTENSIONES_PERMITIDAS = {".pdf"}
# CU-08, paso 19: los soportes de un avance aceptan PDF, PNG o JPG. Solo se
# habilitan cuando el cliente lo pide explícitamente (?permitir_imagenes=true);
# CU-06 sigue exigiendo PDF.
EXTENSIONES_SOPORTE = {".pdf", ".png", ".jpg", ".jpeg"}
TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024  # 10 MB


def _sanear_nombre(nombre: str) -> str:
    """Quita acentos/espacios/caracteres raros del nombre original para que el
    archivo en disco tenga un nombre predecible y seguro."""
    nombre = nombre.strip().replace(" ", "_")
    return re.sub(r"[^A-Za-z0-9._-]", "", nombre) or "archivo"


@router.post("", status_code=status.HTTP_201_CREATED)
async def cargar_archivo(
    archivo: UploadFile = File(...),
    permitir_imagenes: bool = False,
    usuario_actual: Usuario = Depends(get_current_usuario),
) -> dict[str, str]:
    """Endpoint genérico de carga de archivos. `DocumentoPostulacionInput.archivo`
    (CU-06, pasos 12-15) documenta que ese campo es "la ruta/URL que entrega el
    endpoint de carga de archivos" -- este es ese endpoint.

    CU-06, paso 13: "el sistema valida que el archivo tenga formato PDF" -- se
    valida por extensión (y se deja `TAMANO_MAXIMO_BYTES` como tope razonable,
    no especificado explícitamente en el CU pero necesario en cualquier subida
    real). El archivo se guarda en disco con un nombre único (evita colisiones
    y sobrescrituras entre estudiantes) y se devuelve la ruta pública."""
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
    destino = DIRECTORIO_CARGAS / nombre_unico
    destino.write_bytes(contenido)

    return {"archivo": f"/uploads/{nombre_unico}"}
