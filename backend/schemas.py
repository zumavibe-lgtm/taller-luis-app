from pydantic import BaseModel
from typing import List, Optional
from typing import List

# --- USUARIOS (LOGIN Y GESTIÓN) ---
class UsuarioCreate(BaseModel):
    nombre: str
    username: str
    password: str
    rol: str
    email: Optional[str] = None # <--- AQUÍ ESTÁ LA CLAVE: Puede ser nulo
    permisos: List[str] = []

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    username: str
    rol: str
    permisos: str # Se devuelve como string separado por comas
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
    folio_visual: Optional[str]
    estado: str
    saldo_pendiente: float
    cliente_id: int
    vehiculo_id: int
    mecanico_asignado: Optional[str]
    class Config:
        from_attributes = True

# --- DIAGNÓSTICO Y REFACCIONES ---
class DetalleDiagnosticoCreate(BaseModel):
    fallas_ids: List[int]
    nota_libre: Optional[str] = None

class RefaccionCreate(BaseModel):
    nombre_pieza: str
    precio_unitario: float
    traido_por_cliente: bool = False

# --- NUEVO: PARA ACTUALIZAR PRECIOS EN CAJA ---
class DetallePrecioUpdate(BaseModel):
    nuevo_precio: float
# ----------------------------------------------

# --- CATÁLOGOS ---
class FallaCreate(BaseModel):
    nombre_falla: str
    precio_sugerido: float
    sistema_id: int = 2