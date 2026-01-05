import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import OrdenCard from '../components/OrdenCard'

// RECIBIMOS LA FUNCIÓN 'abrirInspeccion' DESDE APP.JSX
function Dashboard({ abrirInspeccion }) {
  const [ordenes, setOrdenes] = useState([])
  
  // Bases de datos auxiliares (Catalogos)
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate() 
  
  // Referencia para saber cuántas órdenes teníamos antes (para la alerta)
  const totalOrdenesRef = useRef(0);
  const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')); // Sonido de alerta

  // ⚠️ URL DE TU COMPUTADORA (NO LA NUBE)
  const API_URL = "https://api-taller-luis.onrender.com"

  // --- 🔒 SEGURIDAD ---
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) navigate('/login')
  }, [])

  // --- CICLO DE VIDA ---
  useEffect(() => {
    cargarTodo(true) // 1. Carga inicial con spinner

    // 2. SISTEMA DE ALERTA AUTOMÁTICA
    // Cada 15 segundos revisa si hay algo nuevo
    const intervalo = setInterval(() => {
        cargarTodo(false) // Carga silenciosa (sin spinner)
    }, 15000);

    return () => clearInterval(intervalo);
  }, [])

  const cargarTodo = async (mostrarSpinner = false) => {
    try {
      if(mostrarSpinner) setCargando(true)
      
      // Hacemos 4 peticiones a LOCALHOST
      const peticiones = [
          axios.get(`${API_URL}/ordenes/`),
          axios.get(`${API_URL}/vehiculos/`),
          axios.get(`${API_URL}/clientes/`),
          axios.get(`${API_URL}/usuarios/`)
      ]

      const [resOrdenes, resVehiculos, resClientes, resUsuarios] = await Promise.all(peticiones)

      // FILTRO: Solo órdenes activas
      const activas = resOrdenes.data.filter(o => o.estado !== 'terminado' && o.estado !== 'entregado')

      // --- 🔔 LÓGICA DE NOTIFICACIÓN ---
      // Si hay MÁS órdenes activas que la última vez, suena la alarma
      if (activas.length > totalOrdenesRef.current && totalOrdenesRef.current !== 0) {
          console.log("🔔 ¡NUEVA ORDEN DETECTADA!");
          intentarNotificar();
      }
      totalOrdenesRef.current = activas.length; // Actualizamos el contador
      // ---------------------------------

      // --- AQUÍ ESTÁ EL CAMBIO DE ORDEN (NUEVO ARRIBA) ---
      // Ordenamos por ID descendente (Mayor a menor)
      const ordenadas = resOrdenes.data.sort((a, b) => b.id - a.id)
      setOrdenes(ordenadas)
      // ----------------------------------------------------

      setVehiculos(resVehiculos.data)
      setClientes(resClientes.data)
      setUsuarios(resUsuarios.data)

    } catch (error) {
      console.error("Error cargando el tablero", error)
    } finally {
      if(mostrarSpinner) setCargando(false)
    }
  }

  const intentarNotificar = () => {
      // 1. Vibración (Solo funciona en celulares Android/Chrome)
      if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
      }
      // 2. Sonido
      try {
          audioRef.current.play().catch(e => console.log("El navegador bloqueó el sonido automático (requiere click previo)"));
      } catch (e) {
          console.error("No se pudo reproducir sonido");
      }
  }

  const irAlDiagnostico = (id) => {
    navigate(`/diagnostico/${id}`)
  }

  // --- FILTRO VISUAL ---
  const ordenesActivas = ordenes.filter(o => o.estado !== 'terminado' && o.estado !== 'entregado')

  // --- FUNCIONES DE BÚSQUEDA ---
  const encontrarVehiculo = (id) => vehiculos.find(v => v.id === id)
  const encontrarCliente = (id) => clientes.find(c => c.id === id)
  const encontrarMecanico = (id) => {
      if (!id) return null
      // Buscamos por username (ej: juan_mecanico)
      const user = usuarios.find(u => u.username === id || u.id === id)
      return user ? user.nombre : "Sin Asignar"
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      
      {/* HEADER ELEGANTE */}
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <h1 style={{ color: '#1e293b', margin: 0, fontSize: '28px', fontWeight: '800' }}>🔧 Tablero de Trabajo</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <p style={{ color: '#64748b', margin: 0 }}>
                Vehículos en pista: <strong style={{color: '#4f46e5'}}>{ordenesActivas.length}</strong>
            </p>
            <button 
                onClick={() => cargarTodo(true)} 
                style={{
                    backgroundColor: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '6px', 
                    cursor: 'pointer', color: '#475569', fontSize: '13px', fontWeight: 'bold'
                }}
            >
                🔄 Actualizar
            </button>
        </div>
      </header>

      {cargando ? (
          <div style={{textAlign:'center', padding: '40px', color: '#64748b'}}>
              <p>⏳ Cargando vehículos...</p>
          </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {ordenesActivas.map(orden => {
            
            const vehiculo = encontrarVehiculo(orden.vehiculo_id)
            const cliente = encontrarCliente(orden.cliente_id)
            const nombreMecanico = encontrarMecanico(orden.mecanico_asignado)

            return (
              <div key={orden.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0'
              }}>
                  {/* BARRA SUPERIOR DE ESTADO */}
                  <div style={{
                      backgroundColor: orden.estado === 'diagnostico' ? '#fff7ed' : '#f0f9ff',
                      padding: '10px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                      <span style={{fontWeight: 'bold', color: '#334155'}}>FOLIO: {orden.folio_visual}</span>
                      <span style={{
                          fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px',
                          color: orden.estado === 'diagnostico' ? '#c2410c' : '#0369a1'
                      }}>
                          {orden.estado}
                      </span>
                  </div>

                  <div style={{padding: '20px'}}>
                      {/* COMPONENTE DE TARJETA (Le pasamos datos limpios) */}
                      <OrdenCard 
                        orden={orden} 
                        datosVehiculo={vehiculo}
                        datosCliente={cliente}
                        nombreMecanico={nombreMecanico}
                        alClickear={irAlDiagnostico} 
                      />
                  </div>
                  
                  {/* BOTÓN DE ACCIÓN RÁPIDA */}
                  <div style={{backgroundColor: '#f8fafc', padding: '10px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px'}}>
                      <button 
                        onClick={() => abrirInspeccion(orden.id)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#4f46e5', // Indigo elegante
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'background 0.2s'
                        }}
                      >
                        📋 Hoja de Recepción
                      </button>
                      
                      <button 
                        onClick={() => irAlDiagnostico(orden.id)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#0f172a', // Slate Dark
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                      >
                        🛠️ Diagnóstico
                      </button>
                  </div>
              </div>
            )
          })}
          
          {ordenesActivas.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                <h3 style={{margin:0, color: '#475569'}}>🎉 ¡Todo Limpio!</h3>
                <p style={{marginTop: '10px'}}>No tienes autos pendientes por revisar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard