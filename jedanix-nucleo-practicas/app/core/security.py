from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Genera el hash de una contraseña en texto plano.
    Se usa en CU-01 (contraseña temporal al crear un usuario) y en cualquier
    flujo futuro de cambio de contraseña."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara una contraseña en texto plano contra su hash almacenado.
    Se usa en el login (precondición 'el actor debe estar autenticado' de todos los CU)."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    """Genera un JWT firmado a partir de `data` (debe incluir al menos
    {"sub": id_usuario, "rol": rol} para que los routers puedan validar
    autenticación y autorización por rol en cada endpoint)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(data_token: str) -> Optional[dict[str, Any]]:
    """Decodifica y valida un JWT. Devuelve el payload si es válido,
    o None si el token expiró, fue alterado o está mal formado."""
    try:
        return jwt.decode(data_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
        