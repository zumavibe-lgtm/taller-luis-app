import sys
import os

# Aseguramos que Python encuentre los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Usuario, Configuracion, EstadoOrden, Categoria, MetodoPago
from passlib.context import CryptContext

# Configuración de hash para passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def iniciar_base_de_datos():
    db = SessionLocal()
    try:
        print("🚀 [INICIO] Arrancando script maestro de base de datos...")
        
        # 1. CREAR TABLAS (Si no existen)
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas verificadas.")

        # ==========================================
        # PARTE 1: EL SUPER USUARIO (ADMIN)
        # ==========================================
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        pass_hash = pwd_context.hash("admin123")
        
        if not admin:
            print("👤 Creando usuario 'admin'...")
            nuevo_admin = Usuario(
                username="admin",
                nombre="Administrador",
                email="admin@taller.com",     # ¡Campo obligatorio agregado!
                password_hash=pass_hash,      # ¡Nombre de columna corregido!
                rol="admin",
                permisos="todo",
                activo=True
            )
            db.add(nuevo_admin)
        else:
            print("♻️  El usuario 'admin' ya existe (validado).")

        # ==========================================
        # PARTE 2: CONFIGURACIÓN DEL TALLER
        # ==========================================
        config = db.query(Configuracion).first()
        if not config:
            print("📝 Creando configuración inicial...")
            nueva_config = Configuracion(
                nombre_taller="Mi Taller Mecánico",
                moneda="MXN",
                iva=16.0,
                telefono="555-0000",
                direccion="Ciudad de México"
            )
            db.add(nueva_config)

        # ==========================================
        # PARTE 3: CATÁLOGOS (ESTADOS, CATEGORÍAS)
        # ==========================================
        
        # Estados de Orden (Vital para el Tablero)
        estados = [
            {"nombre": "Pendiente", "color": "#fbbf24"},
            {"nombre": "Diagnóstico", "color": "#60a5fa"},
            {"nombre": "En Reparación", "color": "#f87171"},
            {"nombre": "Terminado", "color": "#34d399"},
            {"nombre": "Entregado", "color": "#9ca3af"},
            {"nombre": "Cancelado", "color": "#ef4444"}
        ]
        for est in estados:
            if not db.query(EstadoOrden).filter(EstadoOrden.nombre == est["nombre"]).first():
                db.add(EstadoOrden(nombre=est["nombre"], descripcion=f"Estado {est['nombre']}", color=est["color"]))

        # Categorías
        categorias = ["Mecánica General", "Eléctrico", "Hojalatería", "Servicio Preventivo"]
        for nombre in categorias:
            if not db.query(Categoria).filter(Categoria.nombre == nombre).first():
                db.add(Categoria(nombre=nombre, descripcion="Servicio general"))

        # Métodos de Pago
        pagos = ["Efectivo", "Tarjeta de Crédito", "Transferencia"]
        for nombre in pagos:
            if not db.query(MetodoPago).filter(MetodoPago.nombre == nombre).first():
                db.add(MetodoPago(nombre=nombre, activo=True))

        # Guardar todo
        db.commit()
        print("✨ [FIN] ¡Base de datos actualizada y lista para usar!")

    except Exception as e:
        print(f"❌ Error crítico en init_db: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    iniciar_base_de_datos()