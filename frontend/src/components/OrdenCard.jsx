import React from 'react'
import { useNavigate } from 'react-router-dom'

// Este componente ahora es más inteligente y visual
function OrdenCard({ orden, datosVehiculo, datosCliente, nombreMecanico, alClickear }) {
  
  // Colores del semáforo
  const obtenerColorEstado = (estado) => {
    switch(estado) {
      case 'recibido': return '#757575'; // Gris
      case 'diagnostico': return '#f57c00'; // Naranja
      case 'reparacion': return '#1976d2'; // Azul
      case 'terminado': return '#388e3c'; // Verde
      default: return '#000';
    }
  }

  // Texto amigable del estado
  const etiquetasEstado = {
      recibido: "📅 Recibido",
      diagnostico: "🔍 En Diagnóstico",
      reparacion: "🔧 En Reparación",
      terminado: "✅ Listo / Terminado"
  }

  return (
    <div style={{
      borderLeft: `6px solid ${obtenerColorEstado(orden.estado)}`,
      backgroundColor: '#fff',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)', // Sombra más bonita
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'transform 0.2s',
    }}>
      
      {/* --- COLUMNA IZQUIERDA: DATOS DEL CARRO --- */}
      <div>
        {/* TÍTULO PRINCIPAL: EL CARRO */}
        <h3 style={{ margin: '0 0 5px 0', color: '#1a237e', textTransform: 'uppercase' }}>
          {datosVehiculo ? `${datosVehiculo.marca} ${datosVehiculo.modelo}` : `Vehículo ID: ${orden.vehiculo_id}`}
        </h3>

        {/* SUBTÍTULO: PLACAS Y COLOR */}
        <p style={{ margin: '0 0 8px 0', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>
            {datosVehiculo ? `🚗 ${datosVehiculo.placas} | ${datosVehiculo.color}` : "Cargando datos..."}
        </p>

        {/* CLIENTE */}
        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
          👤 Cliente: <strong>{datosCliente ? datosCliente.nombre_completo : "..."}</strong>
        </p>

        {/* MECÁNICO ASIGNADO */}
        <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
           🔧 Mecánico: <strong>{nombreMecanico || "Cualquiera"}</strong>
        </p>

        {/* ETIQUETA DE ESTADO */}
        <span style={{ 
          display: 'inline-block', 
          marginTop: '10px',
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: '#eee', 
          fontSize: '11px',
          fontWeight: 'bold',
          color: obtenerColorEstado(orden.estado)
        }}>
          {etiquetasEstado[orden.estado] || orden.estado.toUpperCase()}
        </span>
      </div>

      {/* --- COLUMNA DERECHA: BOTÓN --- */}
      <button 
        onClick={() => alClickear(orden.id)}
        style={{
          backgroundColor: obtenerColorEstado(orden.estado), // El botón combina con el estado
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        VER ORDEN
      </button>
    </div>
  )
}

export default OrdenCard