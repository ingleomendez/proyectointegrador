"""Importar todos los modelos aquí es obligatorio: SQLAlchemy resuelve las
relaciones entre modelos por el nombre de clase (como cadenas de texto, p. ej.
relationship("Postulacion")), y necesita que todas las clases ya estén
registradas en el Base.registry antes de la primera consulta. Alembic también
depende de este archivo para detectar todas las tablas al autogenerar
migraciones."""

from app.models.usuario import Usuario
from app.models.empresa_receptora import EmpresaReceptora
from app.models.pregunta_bitacora import PreguntaBitacora
from app.models.documento_requerido import DocumentoRequerido
from app.models.postulacion import Postulacion
from app.models.respuesta_bitacora import RespuestaBitacora
from app.models.documento_postulacion import DocumentoPostulacion
from app.models.objetivo_practica import ObjetivoPractica
from app.models.avance_semanal import AvanceSemanal
from app.models.dia_trabajado import DiaTrabajado
from app.models.soporte_avance import SoporteAvance
from app.models.archivo_subido import ArchivoSubido

__all__ = [
    "Usuario",
    "EmpresaReceptora",
    "PreguntaBitacora",
    "DocumentoRequerido",
    "Postulacion",
    "RespuestaBitacora",
    "DocumentoPostulacion",
    "ObjetivoPractica",
    "AvanceSemanal",
    "DiaTrabajado",
    "SoporteAvance",
    "ArchivoSubido",
]
