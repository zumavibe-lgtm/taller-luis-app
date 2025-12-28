import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Diagnostico() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Datos Generales
  const [orden, setOrden] = useState(null)
  const [cargando, setCargando] = useState(true)
  
  // Diagnóstico (Fallas)
  const [fallasComunes, setFallasComunes] = useState([])
  const [fallasSeleccionadas, setFallasSeleccionadas] = useState([])
  const [notaExtra, setNotaExtra] = useState("")

  // Refacciones (Solicitudes)
  const [listaDetalles, setListaDetalles] = useState([]) 
  const [nuevaRefaccion, setNuevaRefaccion] = useState({
    nombre_pieza: "",
    traido_por_cliente: false
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const resOrdenes = await axios.get('https://api-taller-luis.onrender.com/ordenes/')
      const ordenEncontrada = resOrdenes.data.find(o => o.id == id)
      setOrden(ordenEncontrada)

      const resFallas = await axios.get('https://api-taller-luis.onrender.com/config/fallas-comunes')
      setFallasComunes(resFallas.data)

      recargarDetalles()
    } catch (error) { console.error(error) } finally { setCargando(false) }
  }

  const recargarDetalles = async () => {
    try {
        const res = await axios.get(`https://api-taller-luis.onrender.com/ordenes/${id}/detalles`)
        setListaDetalles(res.data)
    } catch (error) { console.error("Error cargando detalles") }
  }

  // --- FUNCIONES ---
  const toggleFalla = (fallaId) => {
    if (fallasSeleccionadas.includes(fallaId)) {
      setFallasSeleccionadas(fallasSeleccionadas.filter(id => id !== fallaId))
    } else {
      setFallasSeleccionadas([...fallasSeleccionadas, fallaId])
    }
  }

  const iniciarDiagnostico = async () => {
    try {
        await axios.put(`https://api-taller-luis.onrender.com/ordenes/${id}/estado?nuevo_estado=diagnostico`)
        setOrden({...orden, estado: 'diagnostico'})
    } catch (error) { alert("Error cambiando estado") }
  }

  const guardarDiagnostico = async () => {
    if (fallasSeleccionadas.length === 0 && notaExtra.trim() === "") return alert("Selecciona fallas o escribe nota.")
    try {
        await axios.post(`https://api-taller-luis.onrender.com/ordenes/${id}/diagnostico`, {
            fallas_ids: fallasSeleccionadas,
            nota_libre: notaExtra
        })
        alert("✅ Diagnóstico enviado a Recepción")
        setFallasSeleccionadas([]) 
        setNotaExtra("")
        recargarDetalles() 
    } catch (error) { alert("Error al guardar") }
  }

  const cambiarEstadoDetalle = async (detalleId, nuevoEstado) => {
    try {
        await axios.put(`https://api-taller-luis.onrender.com/ordenes/detalles/${detalleId}/estado`, {
            estado: nuevoEstado
        })
        recargarDetalles()
    } catch (error) {
        console.error(error)
        alert("Error al actualizar el estado de la tarea")
    }
  }

  const agregarRefaccion = async (e) => {
    e.preventDefault()
    if (!nuevaRefaccion.nombre_pieza) return alert("Escribe el nombre de la pieza")
    
    try {
        await axios.post(`https://api-taller-luis.onrender.com/ordenes/${id}/refacciones`, {
            nombre_pieza: nuevaRefaccion.nombre_pieza,
            precio_unitario: 0, 
            traido_por_cliente: nuevaRefaccion.traido_por_cliente
        })
        setNuevaRefaccion({ nombre_pieza: "", traido_por_cliente: false })
        recargarDetalles()
        alert("🔧 Pieza solicitada a almacén/recepción")
    } catch (error) { alert("Error agregando pieza") }
  }

  // --- LÓGICA DEL BOTÓN MAESTRO (FINALIZAR TODO) ---
  const finalizarOrdenCompleta = async () => {
    const confirmacion = confirm("¿Estás seguro que el vehículo está 100% listo para entrega?");
    if (!confirmacion) return;

    try {
        // Cambiamos el estado de la orden a 'terminado'
        await axios.put(`https://api-taller-luis.onrender.com/ordenes/${id}/estado?nuevo_estado=terminado`)
        alert("🏁 ¡Excelente trabajo! Vehículo marcado como TERMINADO.");
        navigate('/'); // Nos regresa al Dashboard
    } catch (error) {
        alert("Error al finalizar la orden.");
    }
  }

  // Verificamos si TODO está terminado (y si hay al menos una tarea)
  const todoListo = listaDetalles.length > 0 && listaDetalles.every(d => d.estado === 'terminado');

  if (cargando) return <p style={{padding: '20px'}}>Cargando...</p>
  if (!orden) return <p style={{padding: '20px'}}>Orden no encontrada</p>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      <button onClick={() => navigate('/')} style={{ marginBottom: '15px', padding: '10px' }}>← Volver</button>

      <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '10px', marginBottom: '20px', borderLeft: '5px solid #2196f3' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#1565c0' }}>{orden.folio_visual}</h1>
        <p style={{margin:0}}><strong>Estado Orden:</strong> {orden.estado.toUpperCase()}</p>
      </div>

      {orden.estado === 'recibido' && (
        <button onClick={iniciarDiagnostico} style={{ width: '100%', padding: '15px', backgroundColor: '#ff9800', color: 'white', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '8px', marginBottom: '30px' }}>
            🛠️ COMENZAR DIAGNÓSTICO
        </button>
      )}

      {/* SECCIÓN 1: FALLAS */}
      <h3>1. Reporte Técnico (Fallas):</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {fallasComunes.map(falla => {
            const seleccionado = fallasSeleccionadas.includes(falla.id)
            return (
                <button key={falla.id} onClick={() => toggleFalla(falla.id)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: seleccionado ? '#ffebee' : 'white', color: seleccionado ? '#c62828' : '#333', borderColor: seleccionado ? '#c62828' : '#ddd', cursor: 'pointer' }}>
                    {falla.nombre_falla}
                </button>
            )
        })}
      </div>
      <textarea rows="3" placeholder="Notas técnicas..." value={notaExtra} onChange={(e) => setNotaExtra(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      <button onClick={guardarDiagnostico} style={{ width: '100%', padding: '10px', backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', marginBottom: '30px' }}>
        💾 GUARDAR REPORTE TÉCNICO
      </button>

      {/* SECCIÓN 2: SOLICITUD DE PIEZAS */}
      <div style={{ backgroundColor: '#fff3e0', padding: '20px', borderRadius: '10px', border: '1px solid #ffe0b2', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, color: '#e65100' }}>2. Solicitar Piezas / Refacciones</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>Ingresa las piezas necesarias. Recepción se encargará de cotizarlas.</p>
        
        <form onSubmit={agregarRefaccion} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px' }}>Pieza Necesaria:</label>
                <input type="text" placeholder="Ej: Bomba de Agua" value={nuevaRefaccion.nombre_pieza} onChange={e => setNuevaRefaccion({...nuevaRefaccion, nombre_pieza: e.target.value})} style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#d84315' }}>
                    <input type="checkbox" checked={nuevaRefaccion.traido_por_cliente} onChange={e => setNuevaRefaccion({...nuevaRefaccion, traido_por_cliente: e.target.checked})} style={{ marginRight: '5px' }} />
                    Cliente ya la trajo
                </label>
            </div>

            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                + SOLICITAR
            </button>
        </form>
      </div>

      {/* SECCIÓN 3: RESUMEN TÉCNICO */}
      <h3>📋 Resumen de Trabajo Realizado:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <thead>
            <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Concepto</th>
                <th style={{ padding: '10px' }}>Tipo</th>
                <th style={{ padding: '10px' }}>Estatus Actual</th>
                <th style={{ padding: '10px' }}>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {listaDetalles.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>
                        {d.falla_detectada}
                        {d.es_refaccion_cliente && <span style={{ marginLeft: '5px', fontSize: '10px', backgroundColor: '#ffccbc', padding: '2px 5px', borderRadius: '4px' }}>CLIENTE</span>}
                    </td>
                    <td style={{ padding: '10px' }}>{d.tipo.toUpperCase()}</td>
                    
                    <td style={{ padding: '10px' }}>
                        {d.estado === 'pendiente' && <span style={{backgroundColor: '#e0e0e0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>Pendiente ⏳</span>}
                        {d.estado === 'en_proceso' && <span style={{backgroundColor: '#bbdefb', color: '#0d47a1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight:'bold'}}>En Proceso 🔧</span>}
                        {d.estado === 'terminado' && <span style={{backgroundColor: '#c8e6c9', color: '#1b5e20', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight:'bold'}}>Terminado ✅</span>}
                        {d.estado === 'pausado' && <span style={{backgroundColor: '#ffecb3', color: '#ff6f00', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'}}>En Espera ✋</span>}
                    </td>

                    <td style={{ padding: '10px' }}>
                        <div style={{display: 'flex', gap: '5px'}}>
                            {d.estado === 'pendiente' && (
                                <button onClick={() => cambiarEstadoDetalle(d.id, 'en_proceso')} style={{border:'1px solid #2196f3', background:'white', color:'#2196f3', borderRadius:'4px', cursor:'pointer', padding:'2px 8px'}}>▶ Iniciar</button>
                            )}
                            {d.estado === 'en_proceso' && (
                                <>
                                    <button onClick={() => cambiarEstadoDetalle(d.id, 'pausado')} style={{border:'1px solid #ff9800', background:'white', color:'#ff9800', borderRadius:'4px', cursor:'pointer', padding:'2px 8px'}}>✋</button>
                                    <button onClick={() => cambiarEstadoDetalle(d.id, 'terminado')} style={{border:'none', background:'#4caf50', color:'white', borderRadius:'4px', cursor:'pointer', padding:'4px 8px'}}>✅ Terminar</button>
                                </>
                            )}
                            {d.estado === 'pausado' && (
                                <button onClick={() => cambiarEstadoDetalle(d.id, 'en_proceso')} style={{border:'none', background:'#2196f3', color:'white', borderRadius:'4px', cursor:'pointer', padding:'4px 8px'}}>▶ Reanudar</button>
                            )}
                             {d.estado === 'terminado' && (
                                <small style={{color:'#4caf50', fontWeight:'bold'}}>Completo</small>
                            )}
                        </div>
                    </td>
                </tr>
            ))}
            {listaDetalles.length === 0 && <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Sin actividad registrada.</td></tr>}
        </tbody>
      </table>

      {/* --- BOTÓN MAESTRO: SOLO APARECE SI TODO ESTÁ TERMINADO --- */}
      {todoListo && (
        <div style={{ marginTop: '40px', textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '10px', border: '2px solid #4caf50' }}>
            <h3 style={{ color: '#2e7d32', marginTop: 0 }}>🎉 ¡Todas las tareas completadas!</h3>
            <p>Si ya no hay nada más que hacerle a este carro, finaliza la orden para avisar a Recepción.</p>
            <button 
                onClick={finalizarOrdenCompleta}
                style={{
                    backgroundColor: '#1b5e20', color: 'white', fontSize: '20px', fontWeight: 'bold',
                    padding: '20px 40px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
            >
                🏁 FINALIZAR VEHÍCULO
            </button>
        </div>
      )}

    </div>
  )
}

export default Diagnostico