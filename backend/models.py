from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String)
    permisos = Column(String)
    activo = Column(Boolean, default=True)

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String)
    telefono = Column(String)
    email = Column(String)
    es_empresa = Column(Boolean, default=False)
    rfc = Column(String, nullable=True)
    vehiculos = relationship("Vehiculo", back_populates="cliente")

class Vehiculo(Base):
    __tablename__ = "vehiculos"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    marca = Column(String)
    modelo = Column(String)
    anio = Column(Integer)
    placas = Column(String, unique=True)
    vin = Column(String, nullable=True)
    color = Column(String)
    cliente = relationship("Cliente", back_populates="vehiculos")

class CatSistema(Base):
    __tablename__ = "cat_sistemas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    activo = Column(Boolean, default=True)
    fallas = relationship("CatFalla", back_populates="sistema")

class CatFalla(Base):
    __tablename__ = "cat_fallas_comunes"
    id = Column(Integer, primary_key=True, index=True)
    sistema_id = Column(Integer, ForeignKey("cat_sistemas.id"))
    nombre_falla = Column(String)
    precio_sugerido = Column(Float)
    activo = Column(Boolean, default=True)
    sistema = relationship("CatSistema", back_populates="fallas")

    # --- NUEVA CLASE PARA EL CATÁLOGO DE SERVICIOS ---
class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    precio_sugerido = Column(Float)
    es_favorito = Column(Boolean, default=False) # <--- Aquí está la estrellita ⭐

class Orden(Base):
    __tablename__ = "ordenes"
    id = Column(Integer, primary_key=True, index=True)
    folio_visual = Column(String, unique=True)
    sucursal_id = Column(Integer, default=1)
    
    # Llaves foráneas (los números)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    
    # --- AQUÍ ESTÁ LA MAGIA QUE FALTABA ---
    # Estas líneas conectan los IDs con las tablas reales
    cliente = relationship("Cliente")
    vehiculo = relationship("Vehiculo")
    # --------------------------------------

    inspeccion = relationship("InspeccionRecepcion", back_populates="orden", uselist=False)
    
    # Estado de la orden
    estado = Column(String, default='recibido')
    
    kilometraje = Column(Integer)
    nivel_gasolina = Column(Integer)
    mecanico_asignado = Column(String, default="Sin Asignar")
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Campos de cobro
    saldo_pendiente = Column(Float, default=0.0)
    total_cobrado = Column(Float, default=0.0)
    metodo_pago = Column(String, nullable=True)
    fecha_cierre = Column(DateTime, nullable=True)

class OrdenDetalle(Base):
    __tablename__ = "orden_detalles"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"))
    sistema_origen = Column(String) 
    falla_detectada = Column(String) 
    tipo = Column(String)
    estado = Column(String, default='pendiente')
    precio = Column(Float, default=0.0)
    aprobado_cliente = Column(Boolean, default=False)
    es_refaccion_cliente = Column(Boolean, default=False) 
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

class InspeccionRecepcion(Base):
    __tablename__ = "inspecciones_recepcion"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"))
    
    # Datos Generales
    version = Column(String)
    transmision = Column(String)
    combustible = Column(String)
    puertas = Column(Integer)
    estado_procedencia = Column(String)
    
    # Documentación
    doc_factura = Column(Boolean, default=False)
    doc_tarjeta_circulacion = Column(Boolean, default=False)
    doc_seguro = Column(Boolean, default=False)

    # Inspección Exterior
    ext_pintura = Column(String)
    ext_llantas = Column(String)
    ext_calaveras = Column(String)
    ext_refaccion = Column(String)
    
    # Inspección Interior
    int_asientos_bien = Column(Boolean, default=True)
    int_tablero_alertas = Column(String, nullable=True)
    int_aire_acondicionado = Column(Boolean, default=True)
    
    # Mecánica Básica
    mec_niveles_aceite = Column(String)
    mec_frenos = Column(String)
    
    # Equipamiento
    acc_num_llaves = Column(Integer, default=1)
    acc_gato = Column(Boolean, default=False)
    
    # Firmas
    observaciones = Column(String, nullable=True)
    nombre_receptor = Column(String)
    fecha_ingreso = Column(DateTime, default=datetime.utcnow)

    # Relación con la orden
    orden = relationship("Orden", back_populates="inspeccion")

    # ==========================================
# 🧱 MÓDULO ERP Y CONTABILIDAD (NUEVO V2)
# ==========================================

# 1. LA CAJA NEGRA (AUDITORÍA)
class Auditoria(Base):
    __tablename__ = "auditoria"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    accion = Column(String)     # Ej: "ELIMINAR_ORDEN", "COBRO_CAJA", "CAMBIO_PRECIO"
    detalle = Column(String)    # Ej: "Orden #45 cambió de $500 a $400"
    fecha = Column(DateTime, default=datetime.now)
    ip_origen = Column(String, nullable=True) # Para saber desde qué compu se hizo

    usuario = relationship("Usuario")

# 2. CONFIGURACIONES GLOBALES (DÍAS HÁBILES, FESTIVOS, ETC.)
class Configuracion(Base):
    __tablename__ = "configuraciones"

    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String, unique=True, index=True) # Ej: "DIA_CORTE_MENSUAL", "DIAS_HABILES"
    valor = Column(String)      # Ej: "28", "L,M,X,J,V,S"
    descripcion = Column(String, nullable=True)

# 3. CIERRE DIARIO (EL CANDADO)
class CierreDiario(Base):
    __tablename__ = "cierres_diarios"

    id = Column(Integer, primary_key=True, index=True)
    fecha_cierre = Column(DateTime, default=datetime.now)
    
    # Totales congelados
    total_efectivo = Column(Float, default=0.0)
    total_tarjeta = Column(Float, default=0.0)
    total_transferencia = Column(Float, default=0.0)
    total_ingresos = Column(Float, default=0.0) # Suma de todo
    total_gastos = Column(Float, default=0.0)   # Gastos de caja chica
    
    saldo_final = Column(Float, default=0.0)
    
    usuario_responsable_id = Column(Integer, ForeignKey("usuarios.id"))
    comentarios = Column(String, nullable=True)

    usuario = relationship("Usuario")

# 4. CIERRE MENSUAL (EL CORTE ADMINISTRATIVO)
class CierreMensual(Base):
    __tablename__ = "cierres_mensuales"

    id = Column(Integer, primary_key=True, index=True)
    mes = Column(Integer) # 1 = Enero, 12 = Diciembre
    anio = Column(Integer) # 2026
    fecha_ejecucion = Column(DateTime, default=datetime.now)
    
    usuario_responsable_id = Column(Integer, ForeignKey("usuarios.id"))
    estado = Column(String, default="cerrado") # abierto, cerrado

    usuario = relationship("Usuario")

# 5. MOVIMIENTOS DE CAJA (EL FLUJO DE DINERO DETALLADO)
class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True, index=True)
    
    tipo = Column(String) # "INGRESO" (Cobro orden) o "EGRESO" (Gasto luz/agua)
    monto = Column(Float)
    metodo_pago = Column(String) # Efectivo, Tarjeta, Transferencia
    referencia = Column(String, nullable=True) # Voucher o Clave de rastreo
    
    descripcion = Column(String) # "Cobro Orden #105" o "Pago de Luz CFE"
    fecha = Column(DateTime, default=datetime.now)
    
    # Relaciones
    usuario_id = Column(Integer, ForeignKey("usuarios.id")) # Quién hizo el movimiento
    orden_id = Column(Integer, ForeignKey("ordenes.id"), nullable=True) # Si viene de una orden
    cierre_diario_id = Column(Integer, ForeignKey("cierres_diarios.id"), nullable=True) # A qué cierre pertenece

    usuario = relationship("Usuario")
    orden = relationship("Orden")
    cierre = relationship("CierreDiario")