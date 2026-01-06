import os  # Para verificar si existe el archivo secreto
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db, engine
from typing import List
from pydantic import BaseModel 
from datetime import datetime 
import models, schemas, auth
import traceback 
from logger import guardar_error_log 
from sqlalchemy import func

# --- CORRECCIÓN: GOOGLE SHEETS A PRUEBA DE FALLOS ---
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    print("✅ Librerías de Google cargadas correctamente.")
except ImportError:
    gspread = None
    print("⚠️ Advertencia: gspread no está instalado. El bot de Sheets no funcionará.")

# VERIFICACIÓN DE CREDENCIALES (Caja Fuerte Render)
if os.path.exists("credentials.json"):
    print("✅ SE ENCONTRÓ EL ARCHIVO 'credentials.json' (Caja Fuerte activa).")
else:
    print("⚠️ NO se encontró 'credentials.json'. Asegúrate de haberlo subido a Secret Files en Render.")
# ----------------------------------------------------

# Revisamos si existen las tablas y si no, las crea.
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de Seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- CONFIGURACIÓN DE PERMISOS (CORS) ---
origenes_permitidos = [
    "http://localhost:5173",
    "https://taller-frontend-arturo.onrender.com", 
    "https://taller-luis-app.onrender.com",        
    "https://taller-luis-app.onrender.com/"        
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 🤖 FUNCIONES DE GOOGLE SHEETS
# ---------------------------------------------------------

# 1. GUARDAR ORDEN NUEVA (Datos Generales + GOLPES)
def guardar_en_sheets(orden_nueva, cliente_nombre, vehiculo_placas):
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        # Render creará este archivo desde tus "Secret Files"
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)
        
        # ID DE TU HOJA DE CÁLCULO
        SHEET_ID = "1y6nW9C8diwITs_lqpH6fjNlVuH90E4oiS5NTXfRm6kc" 
        
        sheet = client.open_by_key(SHEET_ID).get_worksheet(0)  
        
        fila = [
            orden_nueva.folio_visual,      # Columna A: Folio
            str(orden_nueva.creado_en),    # Columna B: Fecha
            cliente_nombre,                # Columna C: Cliente
            vehiculo_placas,               # Columna D: Placas
            orden_nueva.estado,            # Columna E: Estado
            orden_nueva.mecanico_asignado, # Columna F: Mecánico
            # 👇 NUEVAS COLUMNAS AGREGADAS
            orden_nueva.lista_daños,       # Columna G: Golpes
            orden_nueva.notas_golpes       # Columna H: Notas
        ]
        
        sheet.append_row(fila)
        print(f"✅ Orden {orden_nueva.folio_visual} guardada en Sheets (Con Daños)")
        
    except Exception as e:
        print(f"⚠️ Error guardando Orden en Sheets: {e}")

# 2. GUARDAR CHECKLIST / INSPECCIÓN (Detalles técnicos)
def guardar_checklist_sheets(datos, folio_visual):
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)
        
        SHEET_ID = "1y6nW9C8diwITs_lqpH6fjNlVuH90E4oiS5NTXfRm6kc"
        
        sheet = client.open_by_key(SHEET_ID).get_worksheet(0) 
        
        fila = [
            f"CHECKLIST -> {folio_visual}", # Columna A: Referencia
            f"Gasolina: {datos.nivel_gasolina}%", # Columna B
            f"Km: {datos.kilometraje}",      # Columna C
            f"Luces: {'Sí' if datos.luces else 'No'}", # Columna D
            f"Golpes: {'Sí' if datos.golpes else 'No'}", # Columna E
            f"Notas: {datos.notas}"          # Columna F
        ]
        
        sheet.append_row(fila)
        print(f"📝 Checklist de {folio_visual} guardado en Sheets")
        
    except Exception as e:
        print(f"⚠️ Error guardando Checklist en Sheets: {e}")

# ---------------------------------------------------------

@app.get("/")
def read_root():
    return {"mensaje": "API del Taller Mecánico Activa con Google Sheets 🚀"}

# --- 1. CLIENTES (CON REGLA DEL +52) ---
@app.post("/clientes/", response_model=schemas.ClienteResponse)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    
    # 📞 LÓGICA DEL +52 AUTOMÁTICO
    # 1. Quitamos espacios y guiones, dejamos solo números
    telefono_limpio = "".join(filter(str.isdigit, cliente.telefono))
    
    # 2. Si son 10 dígitos (ej: 8181234567), agregamos 52 al inicio
    if len(telefono_limpio) == 10:
        telefono_limpio = "52" + telefono_limpio
    
    nuevo_cliente = models.Cliente(
        nombre_completo=cliente.nombre_completo,
        telefono=telefono_limpio, # Guardamos el limpio con 52
        email=cliente.email,
        es_empresa=cliente.es_empresa,
        rfc=cliente.rfc
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente

@app.get("/clientes/", response_model=List[schemas.ClienteResponse])
def leer_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).all()

# --- 2. VEHÍCULOS ---
@app.post("/vehiculos/", response_model=schemas.VehiculoResponse)
def crear_vehiculo(vehiculo: schemas.VehiculoCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == vehiculo.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    if db.query(models.Vehiculo).filter(models.Vehiculo.placas == vehiculo.placas).first():
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con estas placas")

    nuevo_vehiculo = models.Vehiculo(**vehiculo.model_dump())
    
    db.add(nuevo_vehiculo)
    db.commit()
    db.refresh(nuevo_vehiculo)
    return nuevo_vehiculo

@app.get("/vehiculos/", response_model=List[schemas.VehiculoResponse])
def leer_vehiculos(db: Session = Depends(get_db)):
    return db.query(models.Vehiculo).all()

# ==========================================
# 📚 MÓDULO DE CATÁLOGOS (SERVICIOS)
# ==========================================

@app.get("/servicios/", response_model=list[schemas.Servicio])
def obtener_servicios(db: Session = Depends(get_db)):
    return db.query(models.Servicio).all()

@app.post("/servicios/", response_model=schemas.Servicio)
def crear_servicio(servicio: schemas.ServicioCreate, db: Session = Depends(get_db)):
    nuevo_servicio = models.Servicio(
        nombre=servicio.nombre,
        precio_sugerido=servicio.precio_sugerido,
        es_favorito=servicio.es_favorito
    )
    db.add(nuevo_servicio)
    db.commit()
    db.refresh(nuevo_servicio)
    return nuevo_servicio

@app.put("/servicios/{servicio_id}", response_model=schemas.Servicio)
def actualizar_servicio(servicio_id: int, servicio_actualizado: schemas.ServicioCreate, db: Session = Depends(get_db)):
    servicio = db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    servicio.nombre = servicio_actualizado.nombre
    servicio.precio_sugerido = servicio_actualizado.precio_sugerido
    servicio.es_favorito = servicio_actualizado.es_favorito 
    
    db.commit()
    db.refresh(servicio)
    return servicio

@app.delete("/servicios/{servicio_id}")
def eliminar_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(models.Servicio).filter(models.Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    db.delete(servicio)
    db.commit()
    return {"mensaje": "Servicio eliminado correctamente"}

# --- 3. ÓRDENES (MODIFICADO PARA MAPA Y SHEETS) ---
@app.post("/ordenes/", response_model=schemas.OrdenResponse)
def crear_orden(orden: schemas.OrdenCreate, db: Session = Depends(get_db)):
    # Buscamos si existen
    cliente = db.query(models.Cliente).filter(models.Cliente.id == orden.cliente_id).first()
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == orden.vehiculo_id).first()
    
    if not cliente or not vehiculo:
        raise HTTPException(status_code=404, detail="Cliente o Vehículo no encontrados")
    
    # ✅ CONVERSIÓN DE LA LISTA DE GOLPES A TEXTO (Para que la BD no explote)
    # Ejemplo: ["puerta", "vidrio"] -> "puerta, vidrio"
    daños_texto = ", ".join(orden.lista_daños) if orden.lista_daños else "Sin daños visibles"
    
    nueva_orden = models.Orden(
        cliente_id=orden.cliente_id,
        vehiculo_id=orden.vehiculo_id,
        kilometraje=orden.kilometraje,
        nivel_gasolina=orden.nivel_gasolina,
        estado="recibido", 
        mecanico_asignado=orden.mecanico_asignado,
        
        # 👇 AQUÍ GUARDAMOS LO DEL MAPA
        lista_daños=daños_texto,
        notas_golpes=orden.notas_golpes
    )
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    
    # Generar folio visual
    folio = f"OS-2025-{str(nueva_orden.id).zfill(6)}"
    nueva_orden.folio_visual = folio
    db.commit()

    # --- ENVIAR A GOOGLE SHEETS ---
    if cliente and vehiculo:
        guardar_en_sheets(nueva_orden, cliente.nombre_completo, vehiculo.placas)
    # ------------------------------

    return nueva_orden

@app.get("/ordenes/", response_model=List[schemas.OrdenResponse])
def leer_ordenes(db: Session = Depends(get_db)):
    return db.query(models.Orden).all()

@app.put("/ordenes/{orden_id}/estado")
def actualizar_estado_orden(orden_id: int, nuevo_estado: str, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    estados_validos = ["recibido", "diagnostico", "reparacion", "terminado", "entregado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado no válido")

    if nuevo_estado == "reparacion" and not orden.mecanico_asignado:
        raise HTTPException(status_code=400, detail="Debes asignar un mecánico antes de pasar a reparación.")

    orden.estado = nuevo_estado
    db.commit()
    db.refresh(orden)
    return {"mensaje": "Estado actualizado", "nuevo_estado": orden.estado}

# --- COBRO AVANZADO (ERP) ---
class CobroSchema(BaseModel):
    total_cobrado: float
    metodo_pago: str 
    referencia: str = None 
    usuario_id: int = 1    

@app.put("/ordenes/{orden_id}/cobrar")
def cobrar_orden(orden_id: int, cobro: CobroSchema, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if orden.estado == "entregado":
        raise HTTPException(status_code=400, detail="Esta orden ya fue cobrada y entregada")

    orden.total_cobrado = cobro.total_cobrado
    orden.metodo_pago = cobro.metodo_pago
    orden.fecha_cierre = datetime.now() 
    orden.estado = "entregado"          

    nuevo_movimiento = models.MovimientoCaja(
        tipo="INGRESO",
        monto=cobro.total_cobrado,
        metodo_pago=cobro.metodo_pago,
        referencia=cobro.referencia,
        descripcion=f"Cobro Orden {orden.folio_visual}",
        usuario_id=cobro.usuario_id,
        orden_id=orden.id
    )
    db.add(nuevo_movimiento)

    nueva_auditoria = models.Auditoria(
        usuario_id=cobro.usuario_id,
        accion="COBRO_ORDEN",
        detalle=f"Cobró ${cobro.total_cobrado} ({cobro.metodo_pago}) - Folio: {orden.folio_visual}",
        ip_origen="Caja" 
    )
    db.add(nueva_auditoria)

    try:
        db.commit()
        db.refresh(orden)
        return {"mensaje": "Cobro registrado, contabilidad actualizada y auditoría guardada.", "orden_id": orden.id}
    except Exception as e:
        db.rollback()
        print(f"Error en cobro: {e}")
        raise HTTPException(status_code=500, detail="Error interno al procesar el cobro")

# --- 4. CONFIGURACIÓN (CATÁLOGOS) ---
@app.get("/config/fallas-comunes")
def obtener_catalogo_fallas(db: Session = Depends(get_db)):
    return db.query(models.CatFalla).filter(models.CatFalla.activo == True).all()

@app.post("/config/fallas-comunes")
def crear_falla(falla: schemas.FallaCreate, db: Session = Depends(get_db)):
    try:
        nueva_falla = models.CatFalla(
            nombre_falla=falla.nombre_falla,
            precio_sugerido=falla.precio_sugerido,
            sistema_id=falla.sistema_id,
            activo=True
        )
        db.add(nueva_falla)
        db.commit()
        return {"mensaje": "Falla agregada"}
    except Exception as e:
        db.rollback()
        error_completo = traceback.format_exc()
        guardar_error_log("Crear Falla Común", error_completo)
        raise HTTPException(status_code=500, detail="Error al guardar. Revisa logs.")

@app.put("/config/fallas-comunes/{id}")
def actualizar_falla(id: int, falla: schemas.FallaCreate, db: Session = Depends(get_db)):
    falla_db = db.query(models.CatFalla).filter(models.CatFalla.id == id).first()
    if not falla_db:
        raise HTTPException(status_code=404, detail="Falla no encontrada")
    falla_db.nombre_falla = falla.nombre_falla
    falla_db.precio_sugerido = falla.precio_sugerido
    db.commit()
    return {"mensaje": "Falla actualizada correctamente"}

@app.delete("/config/fallas-comunes/{id}")
def borrar_falla(id: int, db: Session = Depends(get_db)):
    falla = db.query(models.CatFalla).filter(models.CatFalla.id == id).first()
    if not falla:
        raise HTTPException(status_code=404, detail="Falla no encontrada")
    falla.activo = False
    db.commit()
    return {"mensaje": "Falla eliminada"}

# --- 5. DIAGNÓSTICO Y REFACCIONES ---
@app.post("/ordenes/{orden_id}/diagnostico")
def guardar_diagnostico(orden_id: int, diagnostico: schemas.DetalleDiagnosticoCreate, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if orden.estado == "recibido":
        orden.estado = "diagnostico"

    contador = 0
    for falla_id in diagnostico.fallas_ids:
        falla_info = db.query(models.CatFalla).filter(models.CatFalla.id == falla_id).first()
        if falla_info:
            nuevo_detalle = models.OrdenDetalle(
                orden_id=orden_id,
                sistema_origen="Diagnóstico Rápido",
                falla_detectada=falla_info.nombre_falla,
                precio=falla_info.precio_sugerido,
                tipo="falla",
                estado="pendiente" 
            )
            db.add(nuevo_detalle)
            contador += 1
            
    if diagnostico.nota_libre and diagnostico.nota_libre.strip():
        nota_detalle = models.OrdenDetalle(
            orden_id=orden_id,
            sistema_origen="Nota General",
            falla_detectada=diagnostico.nota_libre,
            precio=0.0,
            tipo="nota",
            estado="informativo"
        )
        db.add(nota_detalle)
    
    db.commit()
    return {"mensaje": "Diagnóstico guardado", "items_agregados": contador}

@app.post("/ordenes/{orden_id}/refacciones")
def agregar_refaccion(orden_id: int, refaccion: schemas.RefaccionCreate, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    precio_final = refaccion.precio_unitario
    if refaccion.traido_por_cliente:
        precio_final = 0.0

    nueva_refaccion = models.OrdenDetalle(
        orden_id=orden_id,
        sistema_origen="Refacciones",
        falla_detectada=refaccion.nombre_pieza,
        precio=precio_final,
        tipo="refaccion",
        estado="pendiente",
        es_refaccion_cliente=refaccion.traido_por_cliente
    )
    db.add(nueva_refaccion)
    db.commit()
    return {"mensaje": "Refacción agregada"}

@app.get("/ordenes/{orden_id}/detalles", response_model=List[schemas.OrdenDetalleResponse])
def ver_detalles_orden(orden_id: int, db: Session = Depends(get_db)):
    detalles = db.query(models.OrdenDetalle).filter(models.OrdenDetalle.orden_id == orden_id).order_by(models.OrdenDetalle.id.asc()).all()
    return detalles

@app.put("/ordenes/detalles/{detalle_id}")
def actualizar_precio_detalle(detalle_id: int, datos: schemas.DetallePrecioUpdate, db: Session = Depends(get_db)):
    detalle = db.query(models.OrdenDetalle).filter(models.OrdenDetalle.id == detalle_id).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
    detalle.precio = datos.nuevo_precio
    db.commit()
    return {"mensaje": "Precio actualizado"}

@app.put("/ordenes/detalles/{detalle_id}/estado")
def actualizar_estado_detalle(detalle_id: int, datos: schemas.EstadoDetalleUpdate, db: Session = Depends(get_db)):
    detalle = db.query(models.OrdenDetalle).filter(models.OrdenDetalle.id == detalle_id).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")
    
    detalle.estado = datos.estado
    db.commit()
    return {"mensaje": "Estado actualizado", "nuevo_estado": detalle.estado}

# --- 6. ZONA DE SEGURIDAD ---

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.username == form_data.username).first()
    if not usuario or not auth.verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not usuario.activo:
         raise HTTPException(status_code=400, detail="Usuario inactivo")

    access_token = auth.create_access_token(data={"sub": usuario.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": usuario.username,
        "rol": usuario.rol,
        "permisos": usuario.permisos
    }

@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.Usuario).filter(models.Usuario.username == usuario.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    if isinstance(usuario.permisos, list):
        permisos_str = ",".join(usuario.permisos)
    else:
        permisos_str = str(usuario.permisos)

    hashed_password = auth.get_password_hash(usuario.password)
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        username=usuario.username,
        email=usuario.email if usuario.email else f"{usuario.username}@taller.com",
        password_hash=hashed_password,
        rol=usuario.rol,
        permisos=permisos_str,
        activo=True
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.get("/usuarios/", response_model=List[schemas.UsuarioResponse])
def leer_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).filter(models.Usuario.activo == True).all()

@app.put("/usuarios/{user_id}")
def editar_usuario(user_id: int, datos: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.nombre = datos.nombre
    usuario.email = datos.email
    usuario.rol = datos.rol
    usuario.permisos = ",".join(datos.permisos)
    
    db.commit()
    return {"mensaje": "Usuario actualizado"}

@app.delete("/usuarios/{user_id}")
def eliminar_usuario(user_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.activo = False
    db.commit()
    return {"mensaje": "Usuario eliminado correctamente"}

@app.put("/usuarios/{user_id}/reset-password")
def reset_password(user_id: int, nueva_pass: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.password_hash = auth.get_password_hash(nueva_pass)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}

# --- RUTAS INSPECCIÓN ---
@app.post("/inspeccion/", response_model=schemas.InspeccionResponse)
def crear_inspeccion(inspeccion: schemas.InspeccionCreate, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == inspeccion.orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="La orden para esta inspección no existe")
    
    nueva_inspeccion = models.InspeccionRecepcion(**inspeccion.model_dump())
    
    db.add(nueva_inspeccion)
    db.commit()
    db.refresh(nueva_inspeccion)
    
    # --- ENVIAR CHECKLIST A SHEETS ---
    if orden:
         guardar_checklist_sheets(nueva_inspeccion, orden.folio_visual)
    # ---------------------------------
    
    return nueva_inspeccion

@app.get("/inspeccion/{orden_id}", response_model=schemas.InspeccionResponse)
def obtener_inspeccion(orden_id: int, db: Session = Depends(get_db)):
    inspeccion = db.query(models.InspeccionRecepcion).filter(models.InspeccionRecepcion.orden_id == orden_id).first()
    if not inspeccion:
        raise HTTPException(status_code=404, detail="No se encontró inspección para esta orden")
    return inspeccion

    # ==========================================
# 🔒 MÓDULO DE CIERRES (ERP)
# ==========================================

# 1. PREVISUALIZAR CIERRE
@app.get("/cierres/hoy")
def previsualizar_cierre(db: Session = Depends(get_db)):
    movimientos = db.query(models.MovimientoCaja).filter(
        models.MovimientoCaja.cierre_diario_id == None
    ).all()

    total_efectivo = sum(m.monto for m in movimientos if m.metodo_pago == "Efectivo" and m.tipo == "INGRESO")
    total_tarjeta = sum(m.monto for m in movimientos if m.metodo_pago == "Tarjeta" and m.tipo == "INGRESO")
    total_transfer = sum(m.monto for m in movimientos if m.metodo_pago == "Transferencia" and m.tipo == "INGRESO")
    total_gastos = sum(m.monto for m in movimientos if m.tipo == "EGRESO")

    return {
        "fecha": datetime.now(),
        "total_efectivo": total_efectivo,
        "total_tarjeta": total_tarjeta,
        "total_transferencia": total_transfer,
        "total_ingresos": total_efectivo + total_tarjeta + total_transfer,
        "total_gastos": total_gastos,
        "movimientos_pendientes": len(movimientos)
    }

# 2. EJECUTAR CIERRE DIARIO
@app.post("/cierres/diario")
def ejecutar_cierre_diario(usuario_id: int = 1, db: Session = Depends(get_db)):
    movimientos = db.query(models.MovimientoCaja).filter(
        models.MovimientoCaja.cierre_diario_id == None
    ).all()

    if not movimientos:
        raise HTTPException(status_code=400, detail="No hay movimientos pendientes para cerrar.")

    efectivo = sum(m.monto for m in movimientos if m.metodo_pago == "Efectivo" and m.tipo == "INGRESO")
    tarjeta = sum(m.monto for m in movimientos if m.metodo_pago == "Tarjeta" and m.tipo == "INGRESO")
    transfer = sum(m.monto for m in movimientos if m.metodo_pago == "Transferencia" and m.tipo == "INGRESO")
    gastos = sum(m.monto for m in movimientos if m.tipo == "EGRESO")

    nuevo_cierre = models.CierreDiario(
        total_efectivo=efectivo,
        total_tarjeta=tarjeta,
        total_transferencia=transfer,
        total_ingresos=(efectivo + tarjeta + transfer),
        total_gastos=gastos,
        saldo_final=(efectivo + tarjeta + transfer) - gastos,
        usuario_responsable_id=usuario_id
    )
    db.add(nuevo_cierre)
    db.flush()

    for mov in movimientos:
        mov.cierre_diario_id = nuevo_cierre.id
    
    auditoria = models.Auditoria(
        usuario_id=usuario_id,
        accion="CIERRE_DIARIO",
        detalle=f"Cierre ID {nuevo_cierre.id} - Total: ${nuevo_cierre.total_ingresos}",
        ip_origen="Sistema"
    )
    db.add(auditoria)

    db.commit()
    return {"mensaje": "Cierre Diario Exitoso", "id_cierre": nuevo_cierre.id}

# ==========================================
# 📅 CIERRE MENSUAL
# ==========================================

@app.get("/cierres/mensual/estado")
def verificar_estado_mensual(db: Session = Depends(get_db)):
    hoy = datetime.now()
    config_corte = db.query(models.Configuracion).filter(models.Configuracion.clave == "DIA_CORTE_MENSUAL").first()
    dia_corte = int(config_corte.valor) if config_corte else 28

    cierre_existente = db.query(models.CierreMensual).filter(
        models.CierreMensual.mes == hoy.month,
        models.CierreMensual.anio == hoy.year
    ).first()

    if cierre_existente:
        return {"estado": "CERRADO", "mensaje": f"El mes de {hoy.strftime('%B')} ya fue cerrado."}

    if hoy.day < dia_corte:
        return {"estado": "BLOQUEADO", "mensaje": f"Aún es muy pronto. El corte es el día {dia_corte}."}

    cierre_diario_hoy = db.query(models.CierreDiario).filter(
        func.date(models.CierreDiario.fecha_cierre) == hoy.date()
    ).first()

    if not cierre_diario_hoy:
        return {"estado": "BLOQUEADO", "mensaje": "Primero debes realizar el Cierre Diario de hoy."}

    return {"estado": "DISPONIBLE", "mensaje": "Listo para generar el Cierre Mensual."}

@app.post("/cierres/mensual")
def ejecutar_cierre_mensual(usuario_id: int = 1, db: Session = Depends(get_db)):
    estado = verificar_estado_mensual(db)
    if estado["estado"] != "DISPONIBLE":
        raise HTTPException(status_code=400, detail=estado["mensaje"])

    hoy = datetime.now()
    nuevo_mensual = models.CierreMensual(
        mes=hoy.month,
        anio=hoy.year,
        usuario_responsable_id=usuario_id,
        estado="cerrado"
    )
    db.add(nuevo_mensual)
    
    auditoria = models.Auditoria(
        usuario_id=usuario_id, 
        accion="CIERRE_MENSUAL", 
        detalle=f"Mes {hoy.month}/{hoy.year} cerrado correctamente.",
        ip_origen="Sistema"
    )
    db.add(auditoria)
    
    db.commit()
    return {"mensaje": "Mes cerrado exitosamente. Contabilidad congelada."}

# ==========================================
# ⚙️ MÓDULO DE CONFIGURACIÓN
# ==========================================

@app.get("/config/", response_model=list[schemas.Configuracion])
def obtener_configuraciones(db: Session = Depends(get_db)):
    return db.query(models.Configuracion).all()

@app.post("/config/")
def guardar_configuracion(config: schemas.ConfigCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Configuracion).filter(models.Configuracion.clave == config.clave).first()
    
    if existente:
        existente.valor = config.valor
        db.commit()
        db.refresh(existente)
        return existente
    else:
        nueva = models.Configuracion(clave=config.clave, valor=config.valor, descripcion=config.descripcion)
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return nueva
    
# ==========================================
# 📊 MÓDULO DE REPORTES AVANZADOS
# ==========================================

@app.get("/reportes/financiero")
def reporte_financiero(fecha_inicio: str = None, fecha_fin: str = None, db: Session = Depends(get_db)):
    query = db.query(models.MovimientoCaja)
    
    if fecha_inicio and fecha_fin:
        inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
        fin = datetime.strptime(fecha_fin, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query = query.filter(models.MovimientoCaja.fecha >= inicio, models.MovimientoCaja.fecha <= fin)
    
    movimientos = query.order_by(models.MovimientoCaja.fecha.desc()).all()
    return movimientos

@app.get("/reportes/auditoria")
def reporte_auditoria(limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.Auditoria).order_by(models.Auditoria.fecha.desc()).limit(limit).all()
    return logs

@app.get("/reportes/estadisticas")
def reporte_estadisticas(db: Session = Depends(get_db)):
    total_ventas = db.query(models.Orden).filter(models.Orden.estado == 'entregado').count()
    total_ingresos = db.query(func.sum(models.Orden.total_cobrado)).scalar() or 0
    
    return {
        "total_ordenes_historico": total_ventas,
        "total_ingresos_historico": total_ingresos
    }

# ==========================================
# 🔧 MÓDULO DE TALLER (KANBAN)
# ==========================================

@app.get("/taller/tablero", response_model=List[schemas.OrdenResponse]) 
def tablero_kanban(db: Session = Depends(get_db)):
    return db.query(models.Orden).filter(
        models.Orden.estado.notin_(['entregado', 'cancelado'])
    ).all()

@app.put("/taller/mover/{orden_id}")
def mover_rapido(orden_id: int, nuevo_estado: str, db: Session = Depends(get_db)):
    orden = db.query(models.Orden).filter(models.Orden.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    estados_validos = ['recibido', 'revisión', 'reparacion', 'espera_refacciones', 'listo', 'entregado']
    if nuevo_estado not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado no válido")

    orden.estado = nuevo_estado
    db.commit()
    return {"mensaje": f"Orden movida a {nuevo_estado}"}