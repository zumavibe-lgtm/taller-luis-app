from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm # <--- IMPORT NUEVO
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth # <--- IMPORT NUEVO

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

@app.get("/")
def read_root():
    return {"mensaje": "API del Taller Mecánico Activa"}

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

@app.get("/clientes/", response_model=list[schemas.ClienteResponse])
def leer_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).all()

# --- 2. VEHÍCULOS ---
@app.post("/vehiculos/", response_model=schemas.VehiculoResponse)
def crear_vehiculo(vehiculo: schemas.VehiculoCreate, cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    nuevo_vehiculo = models.Vehiculo(
        cliente_id=cliente_id,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anio=vehiculo.anio,
        placas=vehiculo.placas,
        color=vehiculo.color,
        vin=vehiculo.vin
    )
    db.add(nuevo_vehiculo)
    db.commit()
    db.refresh(nuevo_vehiculo)
    return nuevo_vehiculo

@app.get("/vehiculos/", response_model=list[schemas.VehiculoResponse])
def leer_vehiculos(db: Session = Depends(get_db)):
    return db.query(models.Vehiculo).all()

# --- 3. ÓRDENES ---
@app.post("/ordenes/", response_model=schemas.OrdenResponse)
def crear_orden(orden: schemas.OrdenCreate, db: Session = Depends(get_db)):
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
        mecanico_asignado=orden.mecanico_asignado
    )
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    folio = f"OS-2025-{str(nueva_orden.id).zfill(6)}"
    nueva_orden.folio_visual = folio
    db.commit()
    return nueva_orden

@app.get("/ordenes/", response_model=list[schemas.OrdenResponse])
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
    orden.estado = nuevo_estado
    db.commit()
    db.refresh(orden)
    return {"mensaje": "Estado actualizado", "nuevo_estado": orden.estado, "folio": orden.folio_visual}

# --- 4. CONFIGURACIÓN ---
@app.get("/config/fallas-comunes")
def obtener_catalogo_fallas(db: Session = Depends(get_db)):
    return db.query(models.CatFalla).filter(models.CatFalla.activo == True).all()

@app.post("/config/fallas-comunes")
def crear_falla(falla: schemas.FallaCreate, db: Session = Depends(get_db)):
    nueva_falla = models.CatFalla(
        nombre_falla=falla.nombre_falla,
        precio_sugerido=falla.precio_sugerido,
        sistema_id=falla.sistema_id,
        activo=True
    )
    db.add(nueva_falla)
    db.commit()
    return {"mensaje": "Falla agregada"}

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
            tipo="nota",
            estado="informativo"
        )
        db.add(nota_detalle)
    db.commit()
    return {"mensaje": "Diagnóstico guardado exitosamente", "fallas_registradas": contador}

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

@app.get("/ordenes/{orden_id}/detalles")
def ver_detalles_orden(orden_id: int, db: Session = Depends(get_db)):
    detalles = db.query(models.OrdenDetalle).filter(models.OrdenDetalle.orden_id == orden_id).all()
    return detalles

@app.put("/ordenes/detalles/{detalle_id}")
def actualizar_precio_detalle(detalle_id: int, datos: schemas.DetallePrecioUpdate, db: Session = Depends(get_db)):
    detalle = db.query(models.OrdenDetalle).filter(models.OrdenDetalle.id == detalle_id).first()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrada")
    
    detalle.precio = datos.nuevo_precio
    db.commit()
    return {"mensaje": "Precio actualizado correctamente"}

# --- 6. ZONA DE SEGURIDAD (LOGIN Y USUARIOS) ---

# LOGIN (Entregar Gafete / Token)
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.username == form_data.username).first()
    if not usuario or not auth.verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    access_token = auth.create_access_token(data={"sub": usuario.username})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": usuario.username,
        "rol": usuario.rol,
        "permisos": usuario.permisos
    }

# 13. CREAR USUARIO (Solo Admin)
@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Verificar si ya existe el username
    db_user = db.query(models.Usuario).filter(models.Usuario.username == usuario.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    
    # 2. LOGICA INTELIGENTE DE EMAIL:
    # Si el usuario NO escribió email, inventamos uno para que la BD no llore.
    email_final = usuario.email
    if not email_final:
        email_final = f"{usuario.username}@taller.local" # Ej: enrique@taller.local
    
    # Verificar que ese email no esté ocupado tampoco
    db_email = db.query(models.Usuario).filter(models.Usuario.email == email_final).first()
    if db_email:
        raise HTTPException(status_code=400, detail="El email (o el generado automáticamente) ya existe")

    # 3. Guardar
    hashed_password = auth.get_password_hash(usuario.password)
    permisos_str = ",".join(usuario.permisos)

    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        username=usuario.username,
        email=email_final, # <--- Usamos el email procesado
        password_hash=hashed_password,
        rol=usuario.rol,
        permisos=permisos_str,
        activo=True
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# LISTAR USUARIOS
@app.get("/usuarios/", response_model=list[schemas.UsuarioResponse])
def leer_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()

# RESETEAR CONTRASEÑA
@app.put("/usuarios/{user_id}/reset-password")
def reset_password(user_id: int, nueva_pass: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.password_hash = auth.get_password_hash(nueva_pass)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}