from __future__ import annotations

import secrets
import string

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import RolEnum, UsuarioEstadoEnum
from app.models.usuario import Usuario
from app.repositories.avance_repository import AvanceSemanalRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import PerfilUpdate, UsuarioCreate, UsuarioUpdateDirector
from app.services.exceptions import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
    RequiereConfirmacionError,
)
from app.services.notificaciones_client import notificar

_ALFABETO_PASSWORD_TEMPORAL = string.ascii_letters + string.digits
_ROLES_CON_ASIGNACIONES = (RolEnum.COORDINADOR, RolEnum.DOCENTE_ASESOR)


def _generar_password_temporal(longitud: int = 12) -> str:
    """CU-01, paso 17: "el sistema genera una contraseña temporal aleatoria"."""
    return "".join(secrets.choice(_ALFABETO_PASSWORD_TEMPORAL) for _ in range(longitud))


class UsuarioService:
    """CU-01 (Gestionar Usuarios del Sistema, a cargo del Director), Gestionar
    Perfil (compartido por los 4 roles) y el login (precondición transversal de
    todos los CU)."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = UsuarioRepository(db)
        self.avance_repo = AvanceSemanalRepository(db)

    # ---- CU-01: listar / obtener (lectura, sin reglas de negocio) ----

    def listar(self, rol: RolEnum | None = None) -> list[Usuario]:
        """CU-01, paso 2 (listado del Director) y selectores de Coordinador/
        Docente Asesor de CU-02, pasos 11 y 13 (con `rol`)."""
        return self.repo.listar(rol=rol)

    def obtener(self, usuario_id: int) -> Usuario:
        """Detalle de un usuario: lo usa tanto el Director (CU-01) como el
        propio usuario autenticado para ver su perfil (GET /usuarios/me)."""
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NoEncontradoError(f"No existe un usuario con id={usuario_id}.")
        return usuario

    # ---- CU-01: crear usuario ----

    def crear_usuario(self, data: UsuarioCreate) -> Usuario:
        """Flujo básico, pasos 13-21. La validación de nombre no vacío, formato
        de correo y programa académico obligatorio-si-Estudiante ya las aplicó
        `UsuarioCreate` (esquema); aquí solo queda lo que requiere la base de
        datos: el correo duplicado (excepción 15.1.a)."""
        if self.repo.existe_correo(data.correo_institucional):
            raise ConflictoError("El correo ya está registrado por otro usuario.")

        password_temporal = _generar_password_temporal()
        usuario = Usuario(
            nombre_completo=data.nombre_completo,
            correo_institucional=data.correo_institucional,
            contrasena_hash=hash_password(password_temporal),
            rol=data.rol,
            programa_academico=data.programa_academico,
            estado=UsuarioEstadoEnum.ACTIVO,
        )
        self.repo.crear(usuario)
        self.db.commit()

        # Excepción 19.1.a: si esto falla, la cuenta queda creada de todas formas.
        notificar(
            "usuario.creado",
            usuario.correo_institucional,
            {"nombre_completo": usuario.nombre_completo, "password_temporal": password_temporal},
        )
        return usuario

    # ---- CU-01, flujo alterno 4.1.a: editar usuario (Director) ----

    def actualizar_usuario_director(
        self,
        usuario_id: int,
        data: UsuarioUpdateDirector,
        confirmar_cambio_rol: bool = False,
    ) -> Usuario:
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NoEncontradoError(f"No existe un usuario con id={usuario_id}.")

        cambia_rol = data.rol != usuario.rol
        if cambia_rol and usuario.rol in _ROLES_CON_ASIGNACIONES:
            # Excepción 6.1.a: advertencia + confirmación explícita, no un bloqueo duro.
            afectadas = self.repo.contar_empresas_asignadas(usuario_id)
            if afectadas > 0 and not confirmar_cambio_rol:
                raise RequiereConfirmacionError(
                    f"Este usuario es responsable de {afectadas} empresa(s) receptora(s); "
                    "cambiarle el rol las dejaría sin ese responsable. Confirma para continuar.",
                    detalle={"empresas_afectadas": afectadas},
                )

        usuario.nombre_completo = data.nombre_completo
        usuario.rol = data.rol
        usuario.programa_academico = data.programa_academico
        if data.rol != RolEnum.ESTUDIANTE:
            # Si el rol deja de ser ESTUDIANTE, los campos exclusivos de ese rol
            # deben quedar en NULL -- si no, se viola el CHECK de la tabla
            # `usuarios` (ck_usuarios_campos_estudiante_solo_estudiante).
            usuario.direccion_residencia = None
            usuario.grupo_sanguineo = None
            usuario.factor_rh = None
            usuario.eps = None

        self.repo.guardar(usuario)
        self.db.commit()
        return usuario

    # ---- Gestionar Perfil: el propio usuario autenticado ----

    def actualizar_perfil(self, usuario_id: int, data: PerfilUpdate) -> Usuario:
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NoEncontradoError(f"No existe un usuario con id={usuario_id}.")

        # Excepción 22.1.a: EPS obligatoria para Estudiante. El esquema `PerfilUpdate`
        # no conoce el rol del usuario autenticado (ver su docstring) -> vive aquí.
        if usuario.rol == RolEnum.ESTUDIANTE and not data.eps:
            raise ReglaDeNegocioError("La EPS es obligatoria para el rol Estudiante.")

        usuario.nombre_completo = data.nombre_completo
        usuario.celular = data.celular
        usuario.foto_perfil = data.foto_perfil
        if usuario.rol == RolEnum.ESTUDIANTE:
            usuario.direccion_residencia = data.direccion_residencia
            usuario.grupo_sanguineo = data.grupo_sanguineo
            usuario.factor_rh = data.factor_rh
            usuario.eps = data.eps

        self.repo.guardar(usuario)
        self.db.commit()
        return usuario

    # ---- CU-01, flujo alterno 4.1.b: inactivar ----

    def inactivar_usuario(self, usuario_id: int, forzar: bool = False) -> Usuario:
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NoEncontradoError(f"No existe un usuario con id={usuario_id}.")

        if usuario.rol in _ROLES_CON_ASIGNACIONES:
            # Excepción 4.1.b.1
            sin_revisar = self.avance_repo.contar_sin_revisar_por_responsable(usuario_id)
            if sin_revisar > 0 and not forzar:
                raise RequiereConfirmacionError(
                    f"Este usuario tiene {sin_revisar} avance(s) sin revisar bajo su "
                    "responsabilidad; reasígnalos a otro responsable o confirma la "
                    "inactivación de todas formas.",
                    detalle={"avances_sin_revisar": sin_revisar},
                )

        usuario.estado = UsuarioEstadoEnum.INACTIVO
        self.repo.guardar(usuario)
        self.db.commit()
        return usuario

    # ---- CU-01, flujo alterno 4.1.c: reactivar ----

    def reactivar_usuario(self, usuario_id: int) -> Usuario:
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise NoEncontradoError(f"No existe un usuario con id={usuario_id}.")

        usuario.estado = UsuarioEstadoEnum.ACTIVO
        self.repo.guardar(usuario)
        self.db.commit()
        notificar("usuario.reactivado", usuario.correo_institucional, {})
        return usuario

    # ---- Login (precondición transversal de todos los CU) ----

    def login(self, data: LoginRequest) -> TokenResponse:
        usuario = self.repo.get_by_correo(data.correo_institucional)
        if usuario is None or not verify_password(data.password, usuario.contrasena_hash):
            # Mensaje genérico a propósito: no se revela si el correo existe.
            raise ReglaDeNegocioError("Correo o contraseña incorrectos.")
        if usuario.estado == UsuarioEstadoEnum.INACTIVO:
            raise ReglaDeNegocioError("Esta cuenta está inactiva.")

        token = create_access_token({"sub": str(usuario.id), "rol": usuario.rol.value})
        return TokenResponse(
            access_token=token,
            usuario_id=usuario.id,
            nombre_completo=usuario.nombre_completo,
            rol=usuario.rol,
        )
