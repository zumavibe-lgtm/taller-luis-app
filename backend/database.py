import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Buscamos si hay una base de datos en la nube (Variable de Entorno)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Fix pequeño para Render: ellos usan postgres:// pero SQLAlchemy quiere postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    # MODO LOCAL
    DATABASE_URL = "sqlite:///./taller.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # MODO NUBE (Postgres)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- ESTA PARTE FALTABA Y ES LA QUE DA EL ERROR ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()