from database import SessionLocal, engine
import models, auth

# Conectar a BD
db = SessionLocal()

# Datos del Admin
nombre = "Arturo Admin"
user = "admin"
email = "admin@taller.com" # <--- ESTO FALTABA
password = "123" 
rol = "admin"
permisos = "todo_acceso,admin_panel,caja,taller"

# Crear
print(f"Creando usuario: {user}...")
hashed_pwd = auth.get_password_hash(password)

nuevo_admin = models.Usuario(
    nombre=nombre,
    username=user,
    email=email, # <--- AQUÍ LO ENVIAMOS
    password_hash=hashed_pwd,
    rol=rol,
    permisos=permisos,
    activo=True
)

try:
    db.add(nuevo_admin)
    db.commit()
    print("✅ ¡Usuario ADMIN creado exitosamente!")
    print(f"Usuario: {user}")
    print(f"Password: {password}")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()