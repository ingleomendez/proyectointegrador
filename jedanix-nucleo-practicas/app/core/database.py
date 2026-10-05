from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependencia de FastAPI: abre una sesión de base de datos por cada request
    y la cierra automáticamente al terminar, incluso si hubo un error."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        