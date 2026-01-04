import random
from datetime import datetime
from database import SessionLocal, engine
import models

# Aseguramos que las tablas existan
models.Base.metadata.create_all(bind=engine)

def poblar_datos_v3():
    db = SessionLocal()
    print("🌱 Sembrando DATOS COMPLETOS (V3)...")

    # 1. Crear Clientes y Autos
    nombres = ["Roberto Gomez", "Florinda Meza", "Ruben Aguirre", "Maria Antonieta", "Ramon Valdes"]
    autos_lista = [("VW", "Jetta"), ("Nissan", "Tsuru"), ("Chevrolet", "Chevy"), ("Ford", "Ranger")]
    
    clientes_db = []
    
    # Creamos 5 clientes con 1 auto cada uno
    for nombre in nombres:
        c = models.Cliente(nombre_completo=nombre, telefono="555-1234", email="vecindad@mail.com")
        db.add(c)
        db.flush()
        
        marca, modelo = random.choice(autos_lista)
        v = models.Vehiculo(cliente_id=c.id, marca=marca, modelo=modelo, anio=2015, placas=f"XYZ-{random.randint(100,999)}", color="Vario")
        db.add(v)
        db.flush()
        
        clientes_db.append(v) # Guardamos el vehiculo para usarlo abajo

    # 2. CREAR ÓRDENES Y SUS COBROS (INGRESO DE DINERO)
    total_dinero = 0
    
    for i in range(20): # Simulamos 20 ventas hoy
        vehiculo = random.choice(clientes_db)
        monto = random.randint(800, 4500)
        metodo = random.choice(["Efectivo", "Tarjeta", "Transferencia"])
        folio = f"ORD-{random.randint(10000, 99999)}"

        # A) Crear la Orden (Para Estadísticas)
        orden = models.Orden(
            folio_visual=folio,
            cliente_id=vehiculo.cliente_id,
            vehiculo_id=vehiculo.id,
            estado="entregado", 
            total_cobrado=monto,
            saldo_pendiente=0,
            fecha_cierre=datetime.now()
        )
        db.add(orden)
        db.flush() # Para tener el ID de la orden

        # B) Crear el Movimiento de Caja (Para Financiero) <--- ESTO FALTABA
        movimiento = models.MovimientoCaja(
            tipo="INGRESO",
            monto=float(monto),
            metodo_pago=metodo,
            referencia=f"Voucher-{random.randint(100,999)}" if metodo != "Efectivo" else None,
            descripcion=f"Cobro {folio} - Reparación General",
            usuario_id=1,
            orden_id=orden.id, # Vinculamos con la orden
            fecha=datetime.now()
        )
        db.add(movimiento)
        
        total_dinero += monto

    # 3. CREAR GASTOS SUELTOS (Para que la gráfica se mueva)
    gastos = ["Pago Luz", "Comida Taller", "Refacciones Urgentes"]
    for _ in range(5):
        gasto = random.randint(200, 1000)
        mov = models.MovimientoCaja(
            tipo="EGRESO",
            monto=float(gasto),
            metodo_pago="Efectivo",
            descripcion=f"Gasto: {random.choice(gastos)}",
            usuario_id=1,
            fecha=datetime.now()
        )
        db.add(mov)

    db.commit()
    print(f"✅ ¡Listo! Se crearon 20 Órdenes y sus Cobros.")
    print(f"💰 Se inyectaron ${total_dinero} en la pestaña Financiera.")
    db.close()

if __name__ == "__main__":
    poblar_datos_v3()