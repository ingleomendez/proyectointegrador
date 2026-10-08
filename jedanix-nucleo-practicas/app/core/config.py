from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    NOTIFICACIONES_SERVICE_URL: str
    NOTIFICACIONES_TIMEOUT_SECONDS: float = 2.0
    # Reintentos del aviso cuando Notificaciones está despertando (hosting gratuito:
    # Render responde 502 hasta ~1 min). Total ≈ REINTENTOS x ESPERA_SEGUNDOS (~4 min, cubre un arranque en frío lento).
    NOTIFICACIONES_REINTENTOS: int = 24
    NOTIFICACIONES_ESPERA_SEGUNDOS: float = 10.0
    # True = el aviso sale en un hilo aparte y no hace esperar la petición del usuario.
    NOTIFICACIONES_ASINCRONO: bool = True
    # Clave compartida con el servicio de Notificaciones (cabecera X-API-Key). Vacía = no se envía.
    NOTIFICACIONES_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    # Orígenes del frontend que CORS deja pasar, separados por comas. Para otro
    # dominio/puerto (despliegue, otro equipo en la red) se define en el `.env`.
    CORS_ORIGINS: str = "http://localhost:4200,http://127.0.0.1:4200"

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalizar_url_postgres(cls, valor: str) -> str:
        """Algunos proveedores (Render, Heroku) entregan `postgres://...`, esquema
        que SQLAlchemy 2 ya no acepta; se traduce a `postgresql://`."""
        valor = valor.strip()
        if valor.startswith("postgres://"):
            return "postgresql://" + valor[len("postgres://"):]
        return valor

    @property
    def cors_origins_lista(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
