from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- USUARIOS ---
class UsuarioBase(BaseModel):
    username: str
    nombre: str
    email: Optional[str] = None
    rol: str
    permisos: List[str] = []

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre: str
    email: Optional[str] = None
    rol: str
    permisos: List[str]

class UsuarioResponse(UsuarioBase):
    id: int
    activo: bool
    class Config:
        from_attributes = True

# --- TOKEN ---
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
    email: Optional[str] = None
    es_empresa: bool = False
    rfc: Optional[str] = None

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
    vin: Optional[str] = None

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
    mecanico_asignado: str
    # Valores default para evitar el error 500 si los campos están vacíos
    total_cobrado: float = 0.0
    metodo_pago: Optional[str] = None
    creado_en: datetime
    class Config:
        from_attributes = True

# --- EXTRAS ---
class DetallePrecioUpdate(BaseModel):
    nuevo_precio: float

class EstadoDetalleUpdate(BaseModel):
    estado: str

class OrdenDetalleResponse(BaseModel):
    id: int
    orden_id: int
    falla_detectada: str
    tipo: str
    estado: str
    precio: float
    es_refaccion_cliente: bool
    class Config:
        from_attributes = True