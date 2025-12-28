import React from 'react'

// Este componente recibe los datos de UNA orden y los dibuja bonito
function OrdenCard({ orden, alClickear }) {
  
  // Definimos colores según el estado para que sea visual
  const obtenerColorEstado = (estado) => {
    switch(estado) {
      case 'recibido': return '#757575'; // Gris
      case 'diagnostico': return '#f57c00'; // Naranja
      case 'reparacion': return '#1976d2'; // Azul
      case 'terminado': return '#388e3c'; // Verde
      default: return '#000';
    }
  }

  return (
    <div style={{
      borderLeft: `6px solid ${obtenerColorEstado(orden.estado)}`,
      backgroundColor: '#fff',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      {/* Columna Izquierda: Datos */}
      <div>
        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
          {orden.folio_visual}
        </h3>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Vehículo ID: <strong>{orden.vehiculo_id}</strong>
        </p>
        {/* --- AGREGA ESTO --- */}
<p style={{ margin: '5px 0', fontSize: '14px', color: '#000' }}>
  🔧 Mecánico: <strong>{orden.mecanico_asignado || "Sin Asignar"}</strong>
</p>
{/* ------------------- */}
        <span style={{ 
          display: 'inline-block', 
          marginTop: '8px',
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: '#eee', 
          fontSize: '12px',
          fontWeight: 'bold',
          color: obtenerColorEstado(orden.estado)
        }}>
          {orden.estado.toUpperCase()}
        </span>
      </div>

      {/* Columna Derecha: Botón de Acción */}
      <button 
        onClick={() => alClickear(orden.id)}
        style={{
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        VER
      </button>
    </div>
  )
}

export default OrdenCard