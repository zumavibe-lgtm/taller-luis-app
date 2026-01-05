import sys
import os

# Aseguramos que Python encuentre los módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, Configuracion, EstadoOrden, Categoria, MetodoPago

def poblar_configuracion():
    db = SessionLocal()
    try:
        print("🛠️  Poblando catálogos básicos...")
        # Aseguramos que las tablas existan
        Base.metadata.create_all(bind=engine)

        # 1. Configuración del Taller
        config = db.query(Configuracion).first()
        if not config:
            print("📝 Creando configuración por defecto...")
            nueva_config = Configuracion(
                nombre_taller="Mi Taller Mecánico",
                moneda="MXN",
                iva=16.0,
                telefono="555-0000",
                direccion="Ciudad de México"
            )
            db.add(nueva_config)

        # 2. Estados de Orden (CRUCIAL para que no truene el tablero)
        estados = [
            {"nombre": "Pendiente", "color": "#fbbf24"}, # Amarillo
            {"nombre": "Diagnóstico", "color": "#60a5fa"}, # Azul
            {"nombre": "En Reparación", "color": "#f87171"}, # Rojo
            {"nombre": "Terminado", "color": "#34d399"}, # Verde
            {"nombre": "Entregado", "color": "#9ca3af"}, # Gris
            {"nombre": "Cancelado", "color": "#ef4444"}  # Rojo oscuro
        ]
        
        for est in estados:
            existe = db.query(EstadoOrden).filter(EstadoOrden.nombre == est["nombre"]).first()
            if not existe:
                db.add(EstadoOrden(nombre=est["nombre"], descripcion=f"Estado {est['nombre']}", color=est["color"]))

        # 3. Categorías
        categorias = ["Mecánica General", "Eléctrico", "Hojalatería", "Servicio Preventivo"]
        for nombre in categorias:
            existe = db.query(Categoria).filter(Categoria.nombre == nombre).first()
            if not existe:
                db.add(Categoria(nombre=nombre, descripcion="Servicio general"))

        # 4. Métodos de Pago
        pagos = ["Efectivo", "Tarjeta de Crédito", "Transferencia"]
        for nombre in pagos:
            existe = db.query(MetodoPago).filter(MetodoPago.nombre == nombre).first()
            if not existe:
                db.add(MetodoPago(nombre=nombre, activo=True))

        db.commit()
        print("✅ ¡Datos de configuración cargados correctamente!")

    except Exception as e:
        print(f"❌ Error poblando datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_configuracion()