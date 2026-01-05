import sys
import os

# Aseguramos que Python encuentre los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Usuario
from passlib.context import CryptContext

# Configuración de encriptación (Igual que en tu sistema)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_final():
    db = SessionLocal()
    try:
        print("🔧 Iniciando CORRECCIÓN de usuario Admin...")
        
        # 1. Asegurar tablas
        Base.metadata.create_all(bind=engine)

        # 2. Buscar admin
        user = db.query(Usuario).filter(Usuario.username == "admin").first()
        
        # Generamos el hash de "admin123"
        pass_secreta = "admin123"
        hash_nuevo = pwd_context.hash(pass_secreta)

        if user:
            print("♻️  El usuario existe. ACTUALIZANDO datos...")
            # AQUÍ ESTABA EL ERROR: Usamos el nombre correcto de la columna
            user.password_hash = hash_nuevo 
            user.email = "admin@taller.com"
            user.activo = True
            user.rol = "admin"
            user.permisos = "todo_acceso,admin_panel,caja,taller"
        else:
            print("🆕 Creando usuario 'admin' desde cero...")
            user = Usuario(
                username="admin",
                nombre="Arturo Admin",
                email="admin@taller.com",
                password_hash=hash_nuevo, # Usamos el nombre correcto
                rol="admin",
                permisos="todo_acceso,admin_panel,caja,taller",
                activo=True
            )
            db.add(user)
        
        db.commit()
        print(f"✅ ¡ÉXITO TOTAL! Usuario actualizado.")
        print(f"👉 Usuario: admin")
        print(f"👉 Password: {pass_secreta}")

    except Exception as e:
        print(f"❌ Error grave: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_final()