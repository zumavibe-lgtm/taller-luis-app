from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

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

class Orden(Base):
    __tablename__ = "ordenes"
    id = Column(Integer, primary_key=True, index=True)
    folio_visual = Column(String, unique=True)
    sucursal_id = Column(Integer, default=1)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    
    # Estado de la orden (recibido, diagnostico, entregado, etc.)
    estado = Column(String, default='recibido')
    
    kilometraje = Column(Integer)
    nivel_gasolina = Column(Integer)
    mecanico_asignado = Column(String, default="Sin Asignar")
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # --- NUEVOS CAMPOS PARA EL COBRO (AGREGADOS) ---
    saldo_pendiente = Column(Float, default=0.0) # Cuanto falta por pagar
    total_cobrado = Column(Float, default=0.0)   # Cuanto se cobró al final
    metodo_pago = Column(String, nullable=True)  # 'efectivo', 'tarjeta'
    fecha_cierre = Column(DateTime, nullable=True) # Fecha exacta del cobro
    # -----------------------------------------------

class OrdenDetalle(Base):
    __tablename__ = "orden_detalles"
    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"))
    sistema_origen = Column(String) 
    falla_detectada = Column(String) 
    tipo = Column(String) # falla, nota, refaccion
    estado = Column(String, default='pendiente')
    precio = Column(Float, default=0.0)
    aprobado_cliente = Column(Boolean, default=False)
    es_refaccion_cliente = Column(Boolean, default=False) 
    creado_en = Column(DateTime(timezone=True), server_default=func.now())