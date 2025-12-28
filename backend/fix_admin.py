from database import SessionLocal, engine # <--- AGREGAMOS 'engine'
import models, auth

print("--- CONSTRUYENDO TABLAS (SI NO EXISTEN) ---")
# ESTA ES LA LÍNEA MÁGICA: Crea las tablas antes de hacer nada
models.Base.metadata.create_all(bind=engine) 

db = SessionLocal()

print("--- INICIANDO LIMPIEZA PROFUNDA ---")

# 1. Borrar si existe el username "admin"
try:
    usuario_nombre = db.query(models.Usuario).filter(models.Usuario.username == "admin").first()
    if usuario_nombre:
        print(f"🗑️ Borrando usuario por nombre: {usuario_nombre.username}")
        db.delete(usuario_nombre)

    # 2. Borrar si existe alguien con el correo "admin@taller.com"
    usuario_email = db.query(models.Usuario).filter(models.Usuario.email == "admin@taller.com").first()
    if usuario_email:
        print(f"🗑️ Borrando usuario por email: {usuario_email.email}")
        db.delete(usuario_email)
    
    db.commit()
except Exception as e:
    print(f"⚠️ Nota: No se pudo limpiar usuarios previos (quizás la tabla estaba vacía). Continuando...")
    db.rollback()

# 3. CREAR AL NUEVO ADMIN
print("--- CREANDO NUEVO ADMIN ---")
try:
    nuevo_admin = models.Usuario(
        nombre="Arturo Admin",
        username="admin",
        email="admin@taller.com",
        password_hash=auth.get_password_hash("123"), 
        rol="admin",
        permisos="todo_acceso,admin_panel,caja,taller",
        activo=True
    )
    
    db.add(nuevo_admin)
    db.commit()
    print("🎉 ¡ÉXITO TOTAL! Usuario 'admin' creado con contraseña '123'.")

except Exception as e:
    print(f"❌ Error fatal: {e}")
finally:
    db.close()