import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Usuario, Configuracion, EstadoOrden, Categoria, MetodoPago
from passlib.context import CryptContext

# Configuración
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_total():
    db = SessionLocal()
    try:
        print("☢️  INICIANDO RESET TOTAL DE BASE DE DATOS...")
        
        # 1. BORRAR TODO (Adiós datos zombies)
        Base.metadata.drop_all(bind=engine)
        print("🗑️  Tablas antiguas eliminadas.")

        # 2. CREAR TABLAS NUEVAS (Limpiesitas)
        Base.metadata.create_all(bind=engine)
        print("✨ Tablas nuevas creadas.")

        # 3. CREAR ADMIN
        print("👤 Creando Admin...")
        nuevo_admin = Usuario(
            username="admin",
            nombre="Administrador",
            email="admin@taller.com",
            password_hash=pwd_context.hash("admin123"),
            rol="admin",
            permisos="todo",
            activo=True
        )
        db.add(nuevo_admin)

        # 4. CREAR CONFIGURACIÓN
        print("📝 Creando Configuración...")
        db.add(Configuracion(nombre_taller="Mi Taller", moneda="MXN", iva=16.0))

        # 5. CREAR ESTADOS (¡Los que el Frontend espera!)
        print("🎨 Creando Estados...")
        estados = [
            {"nombre": "Pendiente", "color": "#fbbf24"},
            {"nombre": "Diagnóstico", "color": "#60a5fa"},
            {"nombre": "En Reparación", "color": "#f87171"},
            {"nombre": "Terminado", "color": "#34d399"},
            {"nombre": "Entregado", "color": "#9ca3af"},
            {"nombre": "Cancelado", "color": "#ef4444"}
        ]
        for est in estados:
            db.add(EstadoOrden(nombre=est["nombre"], descripcion=est["nombre"], color=est["color"]))

        # 6. CREAR CATEGORÍAS
        print("🔧 Creando Categorías...")
        cats = ["Mecánica General", "Eléctrico", "Hojalatería", "Preventivo"]
        for c in cats:
            db.add(Categoria(nombre=c, descripcion="Servicio"))

        # 7. MÉTODOS PAGO
        print("💰 Creando Métodos de Pago...")
        pagos = ["Efectivo", "Tarjeta", "Transferencia"]
        for p in pagos:
            db.add(MetodoPago(nombre=p, activo=True))

        db.commit()
        print("✅ ¡RESET COMPLETADO! El sistema está nuevo y limpio.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_total()