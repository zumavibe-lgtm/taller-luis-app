import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ModalCobro from '../components/ModalCobro' 

function Recepcion() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('taller')
  
  // Modales
  const [ordenParaCobrar, setOrdenParaCobrar] = useState(null)
  const [ordenVer, setOrdenVer] = useState(null) 
  const [detallesInspeccion, setDetallesInspeccion] = useState(null) 
  
  const navigate = useNavigate()
  const API_URL = "http://localhost:8000" 

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
        const res = await axios.get(`${API_URL}/ordenes/`)
        setOrdenes(res.data)
        // Dejamos el chivato para debuggear el Backend después
        if(res.data.length > 0) {
            console.log("🔍 DATOS:", res.data[0]);
        }
    } catch (error) {
        console.error("Error al cargar ordenes", error)
    } finally {
        setCargando(false)
    }
  }

  // --- FUNCIÓN VER DETALLES (Corregida la fecha) ---
  const abrirDetalles = async (orden) => {
    setOrdenVer(orden);
    setDetallesInspeccion(null); 

    try {
        const res = await axios.get(`${API_URL}/api/inspeccion/${orden.id}`);
        setDetallesInspeccion(res.data);
    } catch (error) {
        console.warn("No se encontró inspección (404).");
        
        // TRUCO: Usamos la fecha de la ORDEN, no la fecha actual
        const fechaOrden = orden.fecha_recepcion || orden.created_at || new Date().toISOString();

        setDetallesInspeccion({
            transmision: '---',
            nivel_gasolina: 0,
            kilometraje: 0,
            danos_previso: '⚠️ No se encontró una hoja de inspección registrada para esta orden.',
            observaciones: 'Sin observaciones.',
            fecha_recepcion: fechaOrden // <--- AQUI ESTÁ EL ARREGLO DE LA FECHA
        });
    }
  };

  // Filtros
  const ordenesEnTaller = ordenes.filter(o => o.estado !== 'terminado' && o.estado !== 'entregado')
  const ordenesParaEntrega = ordenes.filter(o => o.estado === 'terminado')
  const listaVisual = pestañaActiva === 'taller' ? ordenesEnTaller : ordenesParaEntrega

  const alTerminarCobro = () => {
      setOrdenParaCobrar(null); 
      cargarOrdenes(); 
  }

  // --- COMPONENTE FILA (Lógica del primer nombre) ---
  const FilaOrden = ({ orden }) => {
    
    // 1. OBTENER SOLO EL PRIMER NOMBRE
    let nombreCliente = "Cliente Desconocido";
    // Intentamos sacar el nombre del objeto cliente o del campo plano
    const nombreCompleto = orden.cliente?.nombre_completo || orden.nombre_cliente || "";
    
    if (nombreCompleto) {
        // Cortamos en el primer espacio
        nombreCliente = nombreCompleto.split(' ')[0];
    }

    // 2. LÓGICA DE PLACAS Y AUTO
    let infoVehiculo = `ID: ${orden.vehiculo_id}`;
    let placas = null;

    if (orden.vehiculo) {
        infoVehiculo = `${orden.vehiculo.marca} ${orden.vehiculo.modelo}`;
        placas = orden.vehiculo.placas;
    } 

    return (
        <tr style={{ borderBottom: '1px solid #eee', height: '60px' }}>
        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1565c0' }}>
            {orden.folio_visual}
        </td>
        
        <td style={{ padding: '10px' }}>
            {/* VEHÍCULO */}
            <div style={{fontWeight:'bold', color:'#333', marginBottom:'4px'}}>
                {infoVehiculo}
                {placas && (
                    <span style={{
                        fontSize: '0.85em', backgroundColor: '#ffc107', color: '#000', 
                        padding: '2px 6px', borderRadius: '4px', marginLeft: '8px',
                        border: '1px solid #e0a800', verticalAlign: 'text-bottom'
                    }}>
                        {placas}
                    </span>
                )}
            </div>

            {/* CLIENTE (PRIMER NOMBRE) */}
            <div style={{fontSize:'13px', color:'#555', display:'flex', alignItems:'center', gap:'5px'}}>
                👤 <span style={{textTransform: 'uppercase', fontWeight: 'bold'}}>{nombreCliente}</span>
            </div>
        </td>

        <td style={{ padding: '10px' }}>
            <span style={{ 
            padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
            backgroundColor: orden.estado === 'terminado' ? '#c8e6c9' : '#e3f2fd',
            color: orden.estado === 'terminado' ? '#2e7d32' : '#1565c0'
            }}>
            {orden.estado.toUpperCase()}
            </span>
        </td>
        <td style={{ padding: '10px', textAlign: 'right' }}>
            <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                <button 
                    onClick={() => abrirDetalles(orden)}
                    style={{
                        backgroundColor: '#455a64', color: 'white', border: 'none', 
                        padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    👁️ Ver
                </button>

                {orden.estado === 'terminado' ? (
                    <button 
                        onClick={() => setOrdenParaCobrar(orden)}
                        style={{
                            padding: '8px 15px', backgroundColor: '#2e7d32', color: 'white',
                            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold',
                        }}
                    >
                        💰 COBRAR
                    </button>
                ) : (
                    <button 
                        onClick={() => navigate(`/caja/${orden.id}`)} 
                        style={{
                            padding: '8px 15px', backgroundColor: '#1976d2', color: 'white',
                            border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px'
                        }}
                    >
                        📝 Gestionar
                    </button>
                )}
            </div>
        </td>
        </tr>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#1a237e' }}>🖥️ Panel de Recepción (LOCAL)</h1>
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

      {/* PESTAÑAS */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
          <button 
            onClick={() => setPestañaActiva('taller')}
            style={{
                flex: 1, padding: '15px', cursor: 'pointer',
                backgroundColor: pestañaActiva === 'taller' ? 'white' : '#f5f5f5',
                border: 'none', borderBottom: pestañaActiva === 'taller' ? '4px solid #1976d2' : 'none',
                fontWeight: 'bold', color: pestañaActiva === 'taller' ? '#1976d2' : '#666',
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
            }}
          >
              ✅ LISTOS PARA ENTREGA ({ordenesParaEntrega.length})
          </button>
      </div>

      {/* TABLA */}
      {cargando ? <p>Cargando...</p> : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #eee' }}>
                <tr style={{ textAlign: 'left', color: '#555' }}>
                    <th style={{ padding: '15px' }}>Folio</th>
                    <th style={{ padding: '15px' }}>Vehículo / Cliente</th>
                    <th style={{ padding: '15px' }}>Estado</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {listaVisual.map(orden => (
                    <FilaOrden key={orden.id} orden={orden} />
                ))}
                {listaVisual.length === 0 && (
                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No hay ordenes en esta lista.</td></tr>
                )}
                </tbody>
            </table>
          </div>
      )}

      {/* MODAL (DISEÑO RESTAURADO) */}
      {ordenVer && (
        <div style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            backgroundColor:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100
        }}>
            <div style={{backgroundColor:'white', padding:'30px', borderRadius:'10px', maxWidth:'600px', width:'90%', maxHeight:'80vh', overflowY:'auto'}}>
                
                {/* ENCABEZADO CON PLACAS */}
                <h2 style={{marginTop:0, borderBottom:'1px solid #ddd', paddingBottom:'10px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'10px'}}>
                    <span>📋 Hoja: {ordenVer.folio_visual}</span>
                    <span style={{
                        fontSize: '0.6em', backgroundColor: '#ffc107', color: '#000', 
                        padding: '4px 8px', borderRadius: '4px', border: '1px solid #e0a800'
                    }}>
                        PLACAS: {ordenVer.vehiculo?.placas || ordenVer.placas || "SIN PLACAS"}
                    </span>
                </h2>
                
                {detallesInspeccion ? (
                    <div style={{lineHeight:'1.6'}}>
                        {/* DISEÑO ORIGINAL RESTAURADO */}
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
                            <div style={{background:'#f5f5f5', padding:'10px', borderRadius:'5px'}}>
                                <strong>Transmisión:</strong> {detallesInspeccion.transmision}
                            </div>
                            <div style={{background:'#f5f5f5', padding:'10px', borderRadius:'5px'}}>
                                <strong>Gasolina:</strong> {detallesInspeccion.nivel_gasolina}%
                            </div>
                            <div style={{background:'#f5f5f5', padding:'10px', borderRadius:'5px'}}>
                                <strong>Kilometraje:</strong> {detallesInspeccion.kilometraje} km
                            </div>
                        </div>

                        <h3 style={{borderBottom:'2px solid #eee', paddingBottom:'5px'}}>⚠️ Reporte de Daños</h3>
                        <p style={{whiteSpace:'pre-wrap', background:'#ffebee', padding:'10px', borderRadius:'5px', color:'#c62828'}}>
                            {detallesInspeccion.danos_previso || "Sin daños reportados"}
                        </p>

                        <h3 style={{borderBottom:'2px solid #eee', paddingBottom:'5px', marginTop:'20px'}}>📝 Observaciones Completas</h3>
                        <p style={{whiteSpace:'pre-wrap', fontSize:'14px', background:'#f9f9f9', padding:'10px', borderRadius:'5px'}}>
                            {detallesInspeccion.observaciones}
                        </p>

                        <div style={{marginTop:'20px', fontSize:'12px', color:'#666', textAlign:'right'}}>
                            Firma Cliente: <strong>ACEPTADA</strong> <br/>
                            Fecha: {new Date(detallesInspeccion.fecha_recepcion).toLocaleString()}
                        </div>
                    </div>
                ) : (
                    <div style={{textAlign:'center', padding:'20px'}}>
                        <p>⏳ Cargando detalles...</p>
                    </div>
                )}

                <button 
                    onClick={() => setOrdenVer(null)}
                    style={{marginTop:'20px', width:'100%', padding:'15px', background:'#333', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}
                >
                    Cerrar Ventana
                </button>
            </div>
        </div>
      )}

      {/* MODAL COBRO */}
      {ordenParaCobrar && (
          <ModalCobro 
              orden={ordenParaCobrar} 
              onClose={() => setOrdenParaCobrar(null)} 
              onCobroExitoso={alTerminarCobro}
          />
      )}

    </div>
  )
}

export default Recepcion