from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ OJO: CAMBIA 'tu_contraseña' POR LA CONTRASEÑA REAL QUE USASTE EN PGADMIN
# Formato: postgresql://usuario:contraseña@servidor:puerto/nombre_base_datos
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:nomames@localhost:5432/taller_db"

# Crear el motor de conexión
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Crear la sesión (es lo que usaremos para guardar/leer datos)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Función para obtener la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()