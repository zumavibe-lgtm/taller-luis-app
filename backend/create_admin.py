import sys
import os

# Aseguramos que Python encuentre los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Usuario
from passlib.context import CryptContext

# Configuración de hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_super_admin():
    db = SessionLocal()
    try:
        # 1. Crear las tablas si no existen
        print("🛠️  Verificando tablas...")
        Base.metadata.create_all(bind=engine)

        # 2. Verificar si ya existe el admin
        usuario_existente = db.query(Usuario).filter(Usuario.username == "admin").first()
        if usuario_existente:
            print("✅ El usuario 'admin' YA existe.")
            return

        # 3. Crear el usuario
        print("👤 Creando usuario 'admin'...")
        password_encriptada = pwd_context.hash("admin123")
        
        nuevo_admin = Usuario(
            username="admin",
            nombre="Administrador Sistema",
            password=password_encriptada,
            rol="admin",
            permisos="todo"
        )
        
        db.add(nuevo_admin)
        db.commit()
        print("🚀 ¡Usuario 'admin' creado exitosamente!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    crear_super_admin()