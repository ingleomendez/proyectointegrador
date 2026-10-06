"""Crea el primer usuario Director si todavía no existe (bootstrap).

`POST /usuarios` exige ser Director, así que la primera cuenta no se puede crear
por la API. En local se insertaba a mano con pgAdmin; en la nube (Render free no
da consola) este script lo hace solo durante el arranque.

Variables de entorno (si falta DIRECTOR_PASSWORD el script no hace nada):
    DIRECTOR_CORREO    (por defecto director@udi.edu.co)
    DIRECTOR_NOMBRE    (por defecto "Director JEDANIX")
    DIRECTOR_PASSWORD  contraseña inicial (cámbiala después de entrar)

Es idempotente: si ya existe un usuario con ese correo, no lo toca (no pisa
contraseñas de cuentas existentes)."""
from __future__ import annotations

import os
import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
import app.models  # noqa: F401  (registra todos los modelos antes de consultar)
from app.models.enums import RolEnum, UsuarioEstadoEnum
from app.models.usuario import Usuario


def main() -> int:
    password = os.environ.get("DIRECTOR_PASSWORD", "")
    if not password:
        print("[crear_director] DIRECTOR_PASSWORD no definida: se omite la creación del Director.")
        return 0
    if len(password) < 8:
        print("[crear_director] DIRECTOR_PASSWORD debe tener al menos 8 caracteres.", file=sys.stderr)
        return 1

    correo = os.environ.get("DIRECTOR_CORREO", "director@udi.edu.co").strip().lower()
    nombre = os.environ.get("DIRECTOR_NOMBRE", "Director JEDANIX").strip() or "Director JEDANIX"

    db = SessionLocal()
    try:
        existente = db.query(Usuario).filter(Usuario.correo_institucional == correo).first()
        if existente is not None:
            print(f"[crear_director] Ya existe {correo}; no se modifica.")
            return 0
        db.add(
            Usuario(
                nombre_completo=nombre,
                correo_institucional=correo,
                contrasena_hash=hash_password(password),
                rol=RolEnum.DIRECTOR,
                estado=UsuarioEstadoEnum.ACTIVO,
            )
        )
        db.commit()
        print(f"[crear_director] Director creado: {correo}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
