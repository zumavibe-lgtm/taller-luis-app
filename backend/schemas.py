from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- USUARIOS (LOGIN Y GESTIÓN) ---
class UsuarioCreate(BaseModel):
    nombre: str
    username: str
    password: str
    rol: str
    email: Optional[str] = None
    permisos: List[str] = []

class UsuarioUpdate(BaseModel):
    nombre: str
    email: str
    rol: str
    permisos: List[str]

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    username: str
    email: Optional[str]
    rol: str
    permisos: str 
    activo: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    rol: str
    permisos: str

# --- CLIENTES ---
class ClienteCreate(BaseModel):
    nombre_completo: str
    telefono: str
    email: str
    es_empresa: bool
    rfc: str

class ClienteResponse(ClienteCreate):
    id: int
    class Config:
        from_attributes = True

# --- VEHÍCULOS ---
class VehiculoCreate(BaseModel):
    marca: str
    modelo: str
    anio: int
    placas: str
    color: str
    vin: str

class VehiculoResponse(VehiculoCreate):
    id: int
    cliente_id: int
    class Config:
        from_attributes = True

# --- ÓRDENES ---
class OrdenCreate(BaseModel):
    cliente_id: int
    vehiculo_id: int
    kilometraje: int
    nivel_gasolina: int
    mecanico_asignado: Optional[str] = "Sin Asignar"

class OrdenResponse(BaseModel):
    id: int
    folio_visual: Optional[str] = None
    cliente_id: int
    vehiculo_id: int
    estado: str
    mecanico_asignado: Optional[str] = "Sin Asignar"
    # IMPORTANTE: Ponles 0.0 o None por defecto
    total_cobrado: float = 0.0 
    metodo_pago: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True

# --- DETALLES (SERVICIOS Y REFACCIONES) ---
# Este es vital para que el frontend vea los estados
class OrdenDetalleResponse(BaseModel):
    id: int
    orden_id: int
    sistema_origen: str
    falla_detectada: str
    precio: float
    tipo: str       # 'falla', 'refaccion', 'nota'
    estado: str     # 'pendiente', 'autorizado', 'terminado'
    es_refaccion_cliente: bool # Para saber si poner ($0)
    
    class Config:
        from_attributes = True

class DetalleDiagnosticoCreate(BaseModel):
    fallas_ids: List[int]
    nota_libre: Optional[str] = None

class RefaccionCreate(BaseModel):
    nombre_pieza: str
    precio_unitario: float
    traido_por_cliente: bool = False

# --- ACTUALIZACIONES ---
class DetallePrecioUpdate(BaseModel):
    nuevo_precio: float

class EstadoDetalleUpdate(BaseModel):
    estado: str

# --- CATÁLOGOS ---
class FallaCreate(BaseModel):
    nombre_falla: str
    precio_sugerido: float
    sistema_id: int = 2