from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    NOTIFICACIONES_SERVICE_URL: str
    NOTIFICACIONES_TIMEOUT_SECONDS: float = 2.0
    # Clave compartida con el servicio de Notificaciones (cabecera X-API-Key). Vacía = no se envía.
    NOTIFICACIONES_API_KEY: str = ""
    ENVIRONMENT: str = "development"
    # Orígenes del frontend que CORS deja pasar, separados por comas. Para otro
    # dominio/puerto (despliegue, otro equipo en la red) se define en el `.env`.
    CORS_ORIGINS: str = "http://localhost:4200,http://127.0.0.1:4200"

    @property
    def cors_origins_lista(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
