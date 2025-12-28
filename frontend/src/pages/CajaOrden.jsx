import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useReactToPrint } from 'react-to-print'
import TicketImprimible from '../components/TicketImprimible'

function CajaOrden() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // LA REFERENCIA (El cable a la impresora)
  const componentRef = useRef(null)

  const [orden, setOrden] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [vehiculo, setVehiculo] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [preciosEditados, setPreciosEditados] = useState({})

  // CONFIGURACIÓN DE IMPRESIÓN
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Ticket_${id}`,
    onAfterPrint: () => alert("🖨️ ¡Impresión enviada!"),
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // CORREGIDO: URL limpia sin comillas dobles
      const resOrdenes = await axios.get('https://api-taller-luis.onrender.com/ordenes/')
      const miOrden = resOrdenes.data.find(o => o.id == id)
      setOrden(miOrden)

      // CORREGIDO: Template string con backticks (`) correcto
      const resDetalles = await axios.get(`https://api-taller-luis.onrender.com/ordenes/${id}/detalles`)
      setDetalles(resDetalles.data)

      if (miOrden) {
        const resClientes = await axios.get('https://api-taller-luis.onrender.com/clientes/')
        const miCliente = resClientes.data.find(c => c.id == miOrden.cliente_id)
        setCliente(miCliente)

        const resVehiculos = await axios.get('https://api-taller-luis.onrender.com/vehiculos/')
        const miVehiculo = resVehiculos.data.find(v => v.id == miOrden.vehiculo_id)
        setVehiculo(miVehiculo)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const actualizarPrecio = async (detalleId) => {
    const nuevoPrecioStr = preciosEditados[detalleId]
    if (!nuevoPrecioStr) return
    const nuevoPrecio = parseFloat(nuevoPrecioStr)

    try {
        // CORREGIDO: Template string correcto
        await axios.put(`https://api-taller-luis.onrender.com/ordenes/detalles/${detalleId}`, { nuevo_precio: nuevoPrecio })
        alert("✅ Precio actualizado")
        cargarDatos()
        const copia = {...preciosEditados}
        delete copia[detalleId]
        setPreciosEditados(copia)
    } catch (error) { alert("Error al actualizar precio") }
  }

  const calcularTotal = () => {
    return detalles.reduce((suma, item) => suma + item.precio, 0)
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* 1. ESTADO DE CARGA */}
      {cargando ? (
        <p>Cargando datos de la caja...</p>
      ) : (
        /* 2. CONTENIDO PRINCIPAL */
        orden && cliente && vehiculo ? (
            <>
                <button onClick={() => navigate('/recepcion')} style={{ marginBottom: '15px', padding: '10px' }}>← Volver a Recepción</button>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #ccc', paddingBottom:'20px', marginBottom:'20px' }}>
                    <div>
                        <h1 style={{ margin:0, color:'#2e7d32' }}>💰 Caja y Cotización</h1>
                        <h3 style={{ margin:0, color:'#555' }}>{orden.folio_visual}</h3>
                        <p style={{ margin:0 }}>Cliente: <strong>{cliente.nombre_completo}</strong></p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                        <button 
                            onClick={handlePrint}
                            style={{ padding: '15px 30px', backgroundColor: '#212121', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            🖨️ IMPRIMIR TICKET
                        </button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                    <thead style={{ backgroundColor: '#263238', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Descripción</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Precio</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Editar Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{fontWeight:'bold'}}>{item.falla_detectada}</div>
                                    <div style={{fontSize:'12px', color:'#666'}}>{item.sistema_origen}</div>
                                    
                                    {/* ETIQUETA PIEZA CLIENTE */}
                                    {item.es_refaccion_cliente && (
                                        <span style={{ 
                                            display:'inline-block', marginTop:'5px', 
                                            backgroundColor:'#ffccbc', color:'#d84315', 
                                            padding:'2px 8px', borderRadius:'4px', 
                                            fontSize:'11px', fontWeight:'bold' 
                                        }}>
                                            ⚠️ TRAÍDO POR CLIENTE
                                        </span>
                                    )}
                                </td>
                                
                                <td style={{ padding: '15px', textAlign: 'right', fontWeight:'bold' }}>
                                    {item.es_refaccion_cliente ? (
                                        <span style={{color:'#d84315'}}>$0.00</span>
                                    ) : (
                                        <span>${item.precio.toFixed(2)}</span>
                                    )}
                                </td>

                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    {/* SOLO PERMITIMOS EDITAR SI NO ES PIEZA DE CLIENTE */}
                                    {!item.es_refaccion_cliente ? (
                                        <div style={{ display:'flex', gap:'5px', justifyContent:'center' }}>
                                            <input type="number" style={{ width:'70px', padding:'5px' }} value={preciosEditados[item.id] || ""} placeholder={item.precio} onChange={(e) => setPreciosEditados({...preciosEditados, [item.id]: e.target.value})} />
                                            <button onClick={() => actualizarPrecio(item.id)} style={{cursor:'pointer', border:'none', background:'transparent', fontSize:'18px'}}>💾</button>
                                        </div>
                                    ) : (
                                        <small style={{color:'#999', fontStyle:'italic'}}>No editable</small>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ backgroundColor: '#e8f5e9' }}>
                            <td colSpan="3" style={{ padding: '20px', textAlign: 'right', fontWeight: 'bold', fontSize: '20px', color: '#2e7d32' }}>
                                TOTAL: ${calcularTotal().toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </>
        ) : <p>Datos incompletos o error al cargar.</p>
      )}

      {/* 3. ZONA DE IMPRESIÓN */}
      <div style={{ overflow: 'hidden', height: 0, width: 0 }}>
        <div ref={componentRef}>
            {orden && cliente && vehiculo && (
                <TicketImprimible 
                    orden={orden} 
                    cliente={cliente} 
                    vehiculo={vehiculo} 
                    detalles={detalles} 
                />
            )}
        </div>
      </div>

    </div>
  )
}

export default CajaOrden