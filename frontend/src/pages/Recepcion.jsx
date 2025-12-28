import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Recepcion() {
  const [ordenes, setOrdenes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    const res = await axios.get('http://127.0.0.1:8000/ordenes/')
    setOrdenes(res.data)
  }

  return (
    <div style={{ padding: '0 20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Panel de Recepción</h1>
        <button 
          onClick={() => navigate('/nueva-orden')}
          style={{
            backgroundColor: '#2e7d32', color: 'white', padding: '10px 20px',
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          + NUEVA ORDEN
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Folio</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Cliente ID</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Vehículo</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Estado</th>
            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Acciones</th> {/* Columna Nueva */}
          </tr>
        </thead>
        <tbody>
          {ordenes.map(orden => (
            <tr key={orden.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', color: '#1565c0' }}>{orden.folio_visual}</td>
              <td style={{ padding: '10px' }}>{orden.cliente_id}</td>
              <td style={{ padding: '10px' }}>{orden.vehiculo_id}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                  backgroundColor: orden.estado === 'recibido' ? '#eee' : '#fff3e0'
                }}>
                  {orden.estado.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '10px' }}>
                <button 
                    onClick={() => navigate(`/caja/${orden.id}`)}
                    style={{
                        padding: '5px 10px', backgroundColor: '#1a237e', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}
                >
                    💰 COTIZAR / COBRAR
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recepcion