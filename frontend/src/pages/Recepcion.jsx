import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Recepcion() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // Pestaña activa: 'taller' (En proceso) o 'entrega' (Terminados)
  const [pestañaActiva, setPestañaActiva] = useState('taller')
  
  const navigate = useNavigate()

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
        const res = await axios.get('https://api-taller-luis.onrender.com/ordenes/')
        setOrdenes(res.data)
    } catch (error) {
        console.error("Error al cargar", error)
    } finally {
        setCargando(false)
    }
  }

  // --- FILTROS DE LISTAS ---
  // 1. En Taller: Todo lo que NO esté terminado ni entregado/pagado
  const ordenesEnTaller = ordenes.filter(o => o.estado !== 'terminado' && o.estado !== 'entregado' && o.estado !== 'pagado')
  
  // 2. Por Entregar: Solo lo que el mecánico ya marcó como TERMINADO
  const ordenesParaEntrega = ordenes.filter(o => o.estado === 'terminado')

  // Elegimos qué lista mostrar según la pestaña
  const listaVisual = pestañaActiva === 'taller' ? ordenesEnTaller : ordenesParaEntrega

  // --- COMPONENTE DE TARJETA SIMPLE PARA LA LISTA ---
  const FilaOrden = ({ orden }) => (
    <tr style={{ borderBottom: '1px solid #eee', height: '50px' }}>
      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1565c0' }}>
          {orden.folio_visual}
      </td>
      <td style={{ padding: '10px' }}>
          {/* Aquí idealmente cruzaríamos datos con cliente/vehículo como en el Dashboard, 
              pero por ahora mostramos los IDs o el dato crudo si el backend lo mandara poblado */}
          <div style={{fontWeight:'bold'}}>Vehículo ID: {orden.vehiculo_id}</div>
          <div style={{fontSize:'12px', color:'#666'}}>Cliente ID: {orden.cliente_id}</div>
      </td>
      <td style={{ padding: '10px' }}>
        <span style={{ 
          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
          backgroundColor: orden.estado === 'terminado' ? '#c8e6c9' : '#e3f2fd',
          color: orden.estado === 'terminado' ? '#2e7d32' : '#1565c0'
        }}>
          {orden.estado.toUpperCase()}
        </span>
      </td>
      <td style={{ padding: '10px', textAlign: 'right' }}>
        {orden.estado === 'terminado' ? (
            // BOTÓN PARA COBRAR (SOLO EN PESTAÑA DE ENTREGA)
            <button 
                onClick={() => navigate(`/caja/${orden.id}`)}
                style={{
                    padding: '8px 15px', backgroundColor: '#2e7d32', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                💰 COBRAR Y ENTREGAR
            </button>
        ) : (
            // BOTÓN PARA GESTIONAR (EN TALLER)
            <button 
                onClick={() => navigate(`/caja/${orden.id}`)} // Por ahora lleva a la misma, luego separaremos si quieres
                style={{
                    padding: '8px 15px', backgroundColor: '#1976d2', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px'
                }}
            >
                📝 Gestionar / Cotizar
            </button>
        )}
      </td>
    </tr>
  )

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER Y BOTÓN NUEVA ORDEN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#1a237e' }}>🖥️ Panel de Recepción</h1>
        <button 
          onClick={() => navigate('/nueva-orden')}
          style={{
            backgroundColor: '#ff6f00', color: 'white', padding: '12px 20px',
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
          }}
        >
          + NUEVA ORDEN
        </button>
      </div>

      {/* --- PESTAÑAS (TABS) --- */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
          <button 
            onClick={() => setPestañaActiva('taller')}
            style={{
                flex: 1, padding: '15px', cursor: 'pointer',
                backgroundColor: pestañaActiva === 'taller' ? 'white' : '#f5f5f5',
                border: 'none', borderBottom: pestañaActiva === 'taller' ? '4px solid #1976d2' : 'none',
                fontWeight: 'bold', color: pestañaActiva === 'taller' ? '#1976d2' : '#666',
                fontSize: '16px'
            }}
          >
              🚜 EN TALLER ({ordenesEnTaller.length})
          </button>
          
          <button 
            onClick={() => setPestañaActiva('entrega')}
            style={{
                flex: 1, padding: '15px', cursor: 'pointer',
                backgroundColor: pestañaActiva === 'entrega' ? '#e8f5e9' : '#f5f5f5',
                border: 'none', borderBottom: pestañaActiva === 'entrega' ? '4px solid #2e7d32' : 'none',
                fontWeight: 'bold', color: pestañaActiva === 'entrega' ? '#2e7d32' : '#666',
                fontSize: '16px'
            }}
          >
              ✅ LISTOS PARA ENTREGA ({ordenesParaEntrega.length})
          </button>
      </div>

      {/* TABLA DINÁMICA */}
      {cargando ? <p>Cargando información...</p> : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #eee' }}>
                <tr style={{ textAlign: 'left', color: '#555' }}>
                    <th style={{ padding: '15px' }}>Folio</th>
                    <th style={{ padding: '15px' }}>Vehículo / Cliente</th>
                    <th style={{ padding: '15px' }}>Estado</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Acción Requerida</th>
                </tr>
                </thead>
                <tbody>
                {listaVisual.map(orden => (
                    <FilaOrden key={orden.id} orden={orden} />
                ))}
                
                {listaVisual.length === 0 && (
                    <tr>
                        <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                            {pestañaActiva === 'taller' 
                                ? "👏 No hay autos pendientes en reparación." 
                                : "⏳ No hay autos listos para cobrar todavía."}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
          </div>
      )}
    </div>
  )
}

export default Recepcion