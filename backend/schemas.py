from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- USUARIOS ---
class UsuarioBase(BaseModel):
    username: str
    nombre: str
    email: Optional[str] = None
    rol: str
    permisos: Any 

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre: str
    email: Optional[str] = None
    rol: str
    permisos: Any

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
    cliente_id: int

class VehiculoResponse(VehiculoCreate):
    id: int
    cliente_id: int
    class Config:
        from_attributes = True

# --- FALLAS ---
class FallaCreate(BaseModel):
    nombre_falla: str
    precio_sugerido: float
    sistema_id: int

# --- ÓRDENES (AQUÍ ESTÁ LA MAGIA QUE FALTABA) ---
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
    kilometraje: int
    mecanico_asignado: str
    total_cobrado: float = 0.0
    metodo_pago: Optional[str] = None
    creado_en: datetime

    # --- ESTAS SON LAS 2 LÍNEAS NUEVAS QUE ARREGLAN TODO ---
    # Esto permite que viajen los objetos completos, no solo los IDs
    cliente: Optional[ClienteResponse] = None
    vehiculo: Optional[VehiculoResponse] = None
    # -------------------------------------------------------

    class Config:
        from_attributes = True

# --- DETALLES ---
class DetalleDiagnosticoCreate(BaseModel):
    fallas_ids: List[int]
    nota_libre: Optional[str] = None

class RefaccionCreate(BaseModel):
    nombre_pieza: str
    precio_unitario: float
    traido_por_cliente: bool = False

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

# --- SCHEMAS PARA LA INSPECCIÓN ---

class InspeccionBase(BaseModel):
    orden_id: int  
    version: Optional[str] = None
    transmision: str
    combustible: str
    puertas: int
    estado_procedencia: str
    doc_factura: bool = False
    doc_tarjeta_circulacion: bool = False
    ext_pintura: str
    ext_llantas: str
    ext_calaveras: str
    ext_refaccion: str
    int_asientos_bien: bool = True
    int_aire_acondicionado: bool = True
    mec_niveles_aceite: str
    mec_frenos: str
    acc_num_llaves: int = 1
    nombre_receptor: str

class InspeccionCreate(InspeccionBase):
    pass 

class InspeccionResponse(InspeccionBase):
    id: int
    fecha_ingreso: datetime
    
    class Config:
        from_attributes = True