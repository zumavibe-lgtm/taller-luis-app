import sys
import os

# Aseguramos que Python encuentre los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Usuario
from passlib.context import CryptContext

# Configuración de hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def poblar_datos_v3():
    db = SessionLocal()
    try:
        print("🚀 Iniciando Script de Arranque Seguro...")
        
        # 1. Crear las tablas si no existen
        Base.metadata.create_all(bind=engine)

        # 2. Verificar si ya existe el admin
        usuario_existente = db.query(Usuario).filter(Usuario.username == "admin").first()
        if usuario_existente:
            print("✅ El usuario 'admin' YA existe. Todo listo.")
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
        print("✨ ¡Usuario 'admin' creado exitosamente!")

    except Exception as e:
        print(f"❌ Error leve: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    poblar_datos_v3()