from __future__ import annotations

"""Notificaciones internas ("campanita"): avisos que el usuario ve dentro del
sistema. Se generan desde el MISMO punto por el que salen los correos
(`notificaciones_client.notificar`), así cada evento que ya avisa por correo
también deja su aviso en pantalla, sin tocar los servicios de cada caso de uso.

Nunca lanza: un fallo aquí no debe afectar la operación que lo originó."""

import logging

from app.core.database import SessionLocal
from app.models.enums import RolEnum
from app.models.notificacion_usuario import NotificacionUsuario
from app.models.usuario import Usuario

logger = logging.getLogger("jedanix.notificaciones")

_ESTUDIANTE = RolEnum.ESTUDIANTE
_DIRECTOR = RolEnum.DIRECTOR
_COORD = RolEnum.COORDINADOR
_DOCENTE = RolEnum.DOCENTE_ASESOR

# Rutas por rol para los avisos que reciben varios roles (revisores).
_REVISORES = {_COORD: "/coordinador/estudiantes", _DOCENTE: "/docente-asesor/estudiantes"}


def _con(valor: str | None, plantilla: str, por_defecto: str) -> str:
    return plantilla.format(valor) if valor else por_defecto


# evento -> (título, función(datos) -> mensaje, ruta fija o dict rol -> ruta)
# Los eventos que no están aquí (credenciales, reactivación, restablecer
# contraseña) no generan aviso interno: el usuario aún no tiene sesión.
_CATALOGO: dict[str, tuple[str, object, str | dict]] = {
    "postulacion.enviada": (
        "Nueva solicitud de práctica",
        lambda d: _con(d.get("empresa"), "Un estudiante solicitó práctica en {}. Está pendiente de tu revisión.", "Hay una solicitud de práctica pendiente de tu revisión."),
        "/director/solicitudes",
    ),
    "postulacion.aprobada": (
        "Tu solicitud fue aceptada",
        lambda d: "Ya estás matriculado. Plantea tus objetivos de práctica para que tu Docente Asesor los apruebe.",
        "/estudiante/objetivos",
    ),
    "postulacion.rechazada": (
        "Tu solicitud fue rechazada",
        lambda d: _con(d.get("motivo"), "Motivo: {}", "Consulta el motivo en el sistema; puedes postularte a otra empresa."),
        "/estudiante/solicitud",
    ),
    "practica.cerrada": (
        "Práctica finalizada",
        lambda d: "El Director aprobó el cierre formal de la práctica.",
        {_ESTUDIANTE: "/estudiante/mi-practica", _COORD: "/coordinador/estudiantes", _DOCENTE: "/docente-asesor/estudiantes"},
    ),
    "practica.cierre_rechazado": (
        "El cierre de tu práctica no fue aprobado",
        lambda d: _con(d.get("observacion"), "Observación: {}", "Consulta la observación en el sistema."),
        "/estudiante/mi-practica",
    ),
    "avance.registrado": (
        "Nuevo avance por revisar",
        lambda d: "Un estudiante a tu cargo registró su avance semanal.",
        _REVISORES,
    ),
    "avance.calificado": (
        "Tu avance fue calificado",
        lambda d: "El Coordinador aceptó tu avance semanal: sus horas ya cuentan para tu práctica.",
        "/estudiante/seguimiento",
    ),
    "avance.observado": (
        "Tu avance tiene observaciones",
        lambda d: "El Coordinador dejó comentarios en tu avance. Corrígelo y vuelve a enviarlo.",
        "/estudiante/seguimiento",
    ),
    "avance.observacion_docente": (
        "Observación de tu Docente Asesor",
        lambda d: "Tu Docente Asesor dejó una observación en uno de tus avances.",
        "/estudiante/seguimiento",
    ),
    "objetivos.pendientes": (
        "Objetivos por aprobar",
        lambda d: _con(d.get("estudiante"), "{} planteó sus objetivos de práctica y esperan tu aprobación.", "Un estudiante planteó sus objetivos y esperan tu aprobación."),
        {_DOCENTE: "/docente-asesor/estudiantes"},
    ),
    "objetivos.aprobados": (
        "Objetivos aprobados",
        lambda d: "Tu Docente Asesor aprobó tus objetivos. Ya puedes registrar tus avances semanales.",
        "/estudiante/seguimiento",
    ),
    "objetivos.rechazados": (
        "Objetivos rechazados",
        lambda d: "Tu Docente Asesor rechazó tus objetivos. Corrígelos y vuelve a enviarlos.",
        "/estudiante/objetivos",
    ),
}


def registrar_aviso(evento: str, destinatario_correo: str, datos: dict | None = None) -> None:
    """Guarda el aviso interno del `evento` para el usuario con ese correo."""
    entrada = _CATALOGO.get(evento)
    if entrada is None:
        return
    titulo, construir_mensaje, rutas = entrada
    datos = datos or {}
    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.correo_institucional == destinatario_correo).first()
        if usuario is None:
            return
        ruta = rutas.get(usuario.rol) if isinstance(rutas, dict) else rutas
        if isinstance(rutas, dict) and ruta is None:
            return  # este rol no recibe ese aviso
        db.add(
            NotificacionUsuario(
                usuario_id=usuario.id,
                evento=evento,
                titulo=titulo,
                mensaje=construir_mensaje(datos),  # type: ignore[operator]
                ruta=ruta,
            )
        )
        db.commit()
    except Exception:  # noqa: BLE001 — un aviso interno nunca debe romper el flujo
        db.rollback()
        logger.warning("No se pudo guardar el aviso interno '%s'.", evento, exc_info=True)
    finally:
        db.close()
