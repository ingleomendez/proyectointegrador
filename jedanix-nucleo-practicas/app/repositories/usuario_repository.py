from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.empresa_receptora import EmpresaReceptora
from app.models.enums import RolEnum
from app.models.usuario import Usuario


class UsuarioRepository:
    """Acceso a datos de `usuarios` (CU-01, Gestionar Perfil, y los selectores
    de Coordinador/Docente Asesor que usa CU-02 al registrar una empresa).

    Convención de todo `app/repositories/`: estos métodos no hacen `commit()`.
    La capa de servicio confirma la transacción al final de una operación de
    negocio completa, para que varias escrituras relacionadas (p. ej. crear un
    usuario y luego enviarle el correo de credenciales) queden coordinadas en
    un único punto de decisión. Lo que sí hacen es `flush()`, para que el
    `id` autogenerado quede disponible de inmediato dentro de la misma
    transacción."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, usuario_id: int) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

    def get_by_correo(self, correo_institucional: str) -> Usuario | None:
        """Usado tanto para el login (CU precondición transversal) como para
        la validación de correo duplicado al crear un usuario (CU-01, paso 15)."""
        stmt = select(Usuario).where(Usuario.correo_institucional == correo_institucional)
        return self.db.execute(stmt).scalar_one_or_none()

    def existe_correo(self, correo_institucional: str) -> bool:
        return self.get_by_correo(correo_institucional) is not None

    def listar(self, rol: RolEnum | None = None) -> list[Usuario]:
        """CU-01, paso 2: listado completo de usuarios; o, con `rol`, los
        selectores de Coordinador/Docente Asesor disponibles de CU-02, pasos
        11 y 13."""
        stmt = select(Usuario)
        if rol is not None:
            stmt = stmt.where(Usuario.rol == rol)
        stmt = stmt.order_by(Usuario.nombre_completo)
        return list(self.db.execute(stmt).scalars().all())

    def crear(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.flush()
        return usuario

    def guardar(self, usuario: Usuario) -> Usuario:
        """Persiste en la transacción actual los cambios hechos en memoria
        sobre una instancia ya rastreada por la sesión (edición, cambio de
        estado ACTIVO/INACTIVO, etc.)."""
        self.db.flush()
        return usuario

    def contar_empresas_asignadas(self, usuario_id: int) -> int:
        """CU-01, excepción 6.1.a: cuántas empresas receptoras quedarían sin
        Coordinador o sin Docente Asesor si se cambia el rol de este usuario."""
        stmt = select(func.count()).select_from(EmpresaReceptora).where(
            (EmpresaReceptora.coordinador_id == usuario_id)
            | (EmpresaReceptora.docente_asesor_id == usuario_id)
        )
        return self.db.execute(stmt).scalar_one()