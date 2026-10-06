from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import archivos, auth, avances, empresas, objetivos, postulaciones, usuarios
from app.services.exceptions import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
    RequiereConfirmacionError,
    ServiceError,
)

app = FastAPI(
    title="JEDANIX - Núcleo de Prácticas",
    description="API del servicio FastAPI para la gestión de prácticas académicas.",
    version="1.0.0",
)

# CORS: solo los orígenes del frontend Angular (`CORS_ORIGINS` en el `.env`; por
# defecto http://localhost:4200 y http://127.0.0.1:4200).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_lista,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sirve en /uploads/<archivo> lo que `app/routers/archivos.py` guarda en disco,
# para que el `archivo` (ruta) que devuelve ese endpoint sea una URL
# directamente descargable/visualizable (p. ej. por el Director al revisar
# una postulación).
_DIRECTORIO_CARGAS = Path(__file__).resolve().parent.parent / "uploads"
_DIRECTORIO_CARGAS.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_DIRECTORIO_CARGAS)), name="uploads")


# ---- Traducción de las excepciones de app/services/ a respuestas HTTP ----
# Ninguna excepción de `app.services.exceptions` conoce FastAPI (ver su propio
# docstring); este es el único lugar de todo el proyecto que las traduce a
# códigos HTTP, para que los 6 archivos de `app/routers/` no repitan try/except.


def _cuerpo_error(exc: ServiceError) -> dict:
    cuerpo: dict = {"detail": str(exc)}
    if isinstance(exc, RequiereConfirmacionError):
        cuerpo["requiere_confirmacion"] = True
        cuerpo["detalle"] = exc.detalle
    return cuerpo


@app.exception_handler(NoEncontradoError)
async def _handle_no_encontrado(request: Request, exc: NoEncontradoError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=_cuerpo_error(exc))


@app.exception_handler(ReglaDeNegocioError)
async def _handle_regla_de_negocio(request: Request, exc: ReglaDeNegocioError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=_cuerpo_error(exc))


@app.exception_handler(ConflictoError)
async def _handle_conflicto(request: Request, exc: ConflictoError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=_cuerpo_error(exc))


@app.exception_handler(RequiereConfirmacionError)
async def _handle_requiere_confirmacion(
    request: Request, exc: RequiereConfirmacionError
) -> JSONResponse:
    # Debe registrarse después de ConflictoError pero FastAPI empareja por tipo
    # exacto/MRO de la excepción levantada, así que el orden de declaración
    # entre handlers de clases hermanas no afecta cuál se ejecuta.
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=_cuerpo_error(exc))


# ---- Routers ----

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(empresas.router)
app.include_router(postulaciones.router)
app.include_router(objetivos.router)
app.include_router(avances.router)
app.include_router(archivos.router)


@app.get("/health", tags=["sistema"])
def health() -> dict:
    """Verificación simple de que el servicio está arriba (útil para probes de
    despliegue más adelante)."""
    return {"status": "ok"}
