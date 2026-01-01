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

# --- IMPORTACIONES PARA GOOGLE SHEETS ---
import gspread
from oauth2client.service_account import ServiceAccountCredentials
# ----------------------------------------

# Revisamos si existen las tablas y si no, las crea.
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de Seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- CONFIGURACIÓN DE PERMISOS (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 🤖 FUNCIONES DE GOOGLE SHEETS
# ---------------------------------------------------------

# 1. GUARDAR ORDEN NUEVA (Datos Generales)
def guardar_en_sheets(orden_nueva, cliente_nombre, vehiculo_placas):
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)
        
        # ID DE TU HOJA DE CÁLCULO
        SHEET_ID = "1y6nW9C8diwITs_lqpH6fjNlVuH90E4oiS5NTXfRm6kc" 
        
        sheet = client.open_by_key(SHEET_ID).get_worksheet(0)  # Agarra la pestaña #1 por posición  # Pestaña 1
        
        fila = [
            orden_nueva.folio_visual,      # Columna A: Folio
            str(orden_nueva.creado_en),    # Columna B: Fecha
            cliente_nombre,                # Columna C: Cliente
            vehiculo_placas,               # Columna D: Placas
            orden_nueva.estado,            # Columna E: Estado
            orden_nueva.mecanico_asignado  # Columna F: Mecánico
        ]
        
        sheet.append_row(fila)
        print(f"✅ Orden {orden_nueva.folio_visual} guardada en Sheets")
        
    except Exception as e:
        print(f"⚠️ Error guardando Orden en Sheets: {e}")

# 2. GUARDAR CHECKLIST / INSPECCIÓN (Detalles técnicos)
def guardar_checklist_sheets(datos, folio_visual):
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)
        
        SHEET_ID = "1y6nW9C8diwITs_lqpH6fjNlVuH90E4oiS5NTXfRm6kc"
        
        # Intentamos guardar en la misma hoja (o podrías cambiar .sheet1 por .get_worksheet(1) para otra pestaña)
        sheet = client.open_by_key(SHEET_ID).get_worksheet(0)  # Agarra la pestaña #1 por posición 
        
        # Preparamos la fila con etiqueta de "CHECKLIST" para diferenciarla
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

# --- 1. CLIENTES ---
@app.post("/clientes/", response_model=schemas.ClienteResponse)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    nuevo_cliente = models.Cliente(
        nombre_completo=cliente.nombre_completo,
        telefono=cliente.telefono,
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

# --- 3. ÓRDENES (MODIFICADO PARA SHEETS) ---
@app.post("/ordenes/", response_model=schemas.OrdenResponse)
def crear_orden(orden: schemas.OrdenCreate, db: Session = Depends(get_db)):
    # Buscamos si existen
    cliente = db.query(models.Cliente).filter(models.Cliente.id == orden.cliente_id).first()
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == orden.vehiculo_id).first()
    
    if not cliente or not vehiculo:
        raise HTTPException(status_code=404, detail="Cliente o Vehículo no encontrados")
    
    nueva_orden = models.Orden(
        cliente_id=orden.cliente_id,
        vehiculo_id=orden.vehiculo_id,
        kilometraje=orden.kilometraje,
        nivel_gasolina=orden.nivel_gasolina,
        estado="recibido", 
        mecanico_asignado=orden.mecanico_asignado,
    )
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    
    # Generar folio visual
    folio = f"OS-2025-{str(nueva_orden.id).zfill(6)}"
    nueva_orden.folio_visual = folio
    db.commit()

    # --- ENVIAR A GOOGLE SHEETS (ORDEN NUEVA) ---
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

# --- COBRO ---
class CobroSchema(BaseModel):
    total_cobrado: float
    metodo_pago: str 

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

    db.commit()
    db.refresh(orden)
    
    return {"mensaje": "Cobro registrado exitosamente", "orden_id": orden.id}

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
    # Enviamos los datos a Google Sheets usando el Folio de la orden
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