import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = "https://api-taller-luis.onrender.com"

function Diagnostico() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Estados de datos
  const [orden, setOrden] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [catalogoServicios, setCatalogoServicios] = useState([]) // Todos los servicios
  const [cargando, setCargando] = useState(true)
  const [mostrarTodosServicios, setMostrarTodosServicios] = useState(false) // Toggle para ver los no favoritos

  // Inputs
  const [notaTecnica, setNotaTecnica] = useState("")
  const [otraReparacion, setOtraReparacion] = useState("") // Por si escribe algo manual
  const [nuevaRefaccion, setNuevaRefaccion] = useState("") // Solo nombre de pieza

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // 1. Cargar Orden
      const resOrden = await axios.get(`${API_URL}/ordenes/`)
      const encontrada = resOrden.data.find(o => o.id == id)
      setOrden(encontrada)

      // 2. Cargar Catálogo de Servicios (Para los botones)
      const resServicios = await axios.get(`${API_URL}/servicios/`)
      setCatalogoServicios(resServicios.data)

      // 3. Cargar Detalles actuales
      recargarDetalles()
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const recargarDetalles = async () => {
      try {
        const res = await axios.get(`${API_URL}/ordenes/${id}/detalles`)
        setDetalles(res.data)
      } catch (e) { console.error(e) }
  }

  // --- ACCIONES ---

  // 1. AGREGAR SERVICIO DESDE BOTÓN (CATÁLOGO)
  const agregarDesdeCatalogo = async (servicio) => {
      try {
          await axios.post(`${API_URL}/ordenes/${id}/refacciones`, {
              nombre_pieza: `(Servicio) ${servicio.nombre}`, 
              precio_unitario: servicio.precio_sugerido, // Guardamos el precio sugerido oculto (el mecánico no lo ve)
              traido_por_cliente: false
          })
          recargarDetalles()
      } catch (e) { alert("Error al agregar servicio") }
  }

  // 2. AGREGAR SERVICIO MANUAL (SI NO ESTÁ EN BOTONES)
  const agregarReparacionManual = async () => {
    if (!otraReparacion.trim()) return
    try {
        await axios.post(`${API_URL}/ordenes/${id}/refacciones`, {
            nombre_pieza: `(Servicio) ${otraReparacion}`, 
            precio_unitario: 0, // Precio pendiente
            traido_por_cliente: false
        })
        setOtraReparacion("")
        recargarDetalles()
    } catch (e) { alert("Error al agregar") }
  }

  // 3. SOLICITAR REFACCIÓN (SOLO NOMBRE)
  const solicitarRefaccion = async () => {
    if (!nuevaRefaccion.trim()) return
    try {
        await axios.post(`${API_URL}/ordenes/${id}/refacciones`, {
            nombre_pieza: nuevaRefaccion,
            precio_unitario: 0, // Precio 0 porque el mecánico no cotiza
            traido_por_cliente: false
        })
        setNuevaRefaccion("")
        recargarDetalles()
    } catch (e) { alert("Error al solicitar pieza") }
  }

  // 4. GUARDAR NOTA
  const guardarNota = async () => {
    if (!notaTecnica.trim()) return
    try {
        await axios.post(`${API_URL}/ordenes/${id}/diagnostico`, {
            fallas_ids: [],
            nota_libre: notaTecnica
        })
        setNotaTecnica("")
        recargarDetalles()
        alert("Nota guardada")
    } catch (e) { alert("Error al guardar nota") }
  }

  // 5. CONTROL KANBAN
  const cambiarEstadoDetalle = async (detalleId, nuevoEstado) => {
    try {
        await axios.put(`${API_URL}/ordenes/detalles/${detalleId}/estado`, { estado: nuevoEstado })
        recargarDetalles()
    } catch (error) { alert("Error al actualizar") }
  }

  // 6. FINALIZAR
  const finalizarOrdenCompleta = async () => {
    if (!confirm("¿Confirmas que el trabajo técnico ha terminado?")) return
    try {
        await axios.put(`${API_URL}/ordenes/${id}/estado?nuevo_estado=terminado`)
        alert("🏁 Vehículo enviado a Recepción para entrega.")
        navigate('/taller')
    } catch (error) { alert("Error al finalizar") }
  }

  // --- FILTROS VISUALES ---
  const serviciosFavoritos = catalogoServicios.filter(s => s.es_favorito)
  const serviciosOtros = catalogoServicios.filter(s => !s.es_favorito)
  
  const tareasActivas = detalles.filter(d => d.tipo !== 'nota' && d.tipo !== 'NOTA')
  const tareasPendientes = tareasActivas.filter(d => d.estado !== 'terminado').length
  const todoListo = tareasActivas.length > 0 && tareasPendientes === 0

  if (cargando || !orden) return <div className="p-20 text-center font-bold text-slate-400">Cargando Taller...</div>

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
      
      {/* HEADER SIMPLE */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/taller')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
            ← Tablero
        </button>
        <div className="text-right">
             <h1 className="text-2xl font-black text-slate-800">{orden.folio_visual}</h1>
             <p className="text-xs text-slate-400 font-bold uppercase">Mecánico: {orden.mecanico_asignado || 'Sin asignar'}</p>
        </div>
      </div>

      {/* ÁREA DE TRABAJO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* COLUMNA 1: SERVICIOS Y MANO DE OBRA */}
          <div className="space-y-6">
              
              {/* BOTONERA DE SERVICIOS FAVORITOS */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">🛠️ Selección Rápida de Servicios</h3>
                  
                  {/* Grid de Botones Favoritos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {serviciosFavoritos.map(servicio => (
                          <button 
                            key={servicio.id}
                            onClick={() => agregarDesdeCatalogo(servicio)}
                            className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 font-bold py-3 px-2 rounded-lg text-sm border border-blue-100 transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center gap-1"
                          >
                              <span>🔧</span>
                              {servicio.nombre}
                          </button>
                      ))}
                      {serviciosFavoritos.length === 0 && <p className="text-xs text-slate-400 col-span-3 text-center">No hay favoritos configurados en Catálogos.</p>}
                  </div>

                  {/* Botones Secundarios (Toggle) */}
                  {serviciosOtros.length > 0 && (
                      <div className="mt-2">
                          <button 
                            onClick={() => setMostrarTodosServicios(!mostrarTodosServicios)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 underline w-full text-center mb-3"
                          >
                              {mostrarTodosServicios ? 'Ocultar otros servicios' : 'Ver otros servicios...'}
                          </button>
                          
                          {mostrarTodosServicios && (
                              <div className="grid grid-cols-2 gap-2 animate-fade-in bg-slate-50 p-3 rounded-lg">
                                  {serviciosOtros.map(servicio => (
                                      <button 
                                        key={servicio.id}
                                        onClick={() => agregarDesdeCatalogo(servicio)}
                                        className="bg-white hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 px-2 rounded border border-slate-200"
                                      >
                                          {servicio.nombre}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}

                  {/* Input Manual (Solo por si acaso) */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="¿Otro servicio no listado?" 
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400"
                        value={otraReparacion}
                        onChange={e => setOtraReparacion(e.target.value)}
                      />
                      <button onClick={agregarReparacionManual} className="bg-slate-200 text-slate-600 px-3 rounded font-bold hover:bg-slate-300 text-lg">+</button>
                  </div>
              </div>

              {/* NOTAS TÉCNICAS */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-2">📝 Notas / Fallas Detectadas</h3>
                  <textarea 
                    className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg h-20 text-sm focus:outline-none"
                    placeholder="Escribe aquí observaciones técnicas..."
                    value={notaTecnica}
                    onChange={e => setNotaTecnica(e.target.value)}
                  ></textarea>
                  <button onClick={guardarNota} className="mt-2 text-yellow-700 font-bold text-xs hover:underline block text-right">
                      Guardar Nota
                  </button>
              </div>
          </div>

          {/* COLUMNA 2: SOLICITUD DE REFACCIONES (SIN PRECIOS) */}
          <div>
              <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 h-full">
                  <h3 className="font-bold text-gray-700 mb-4">🔩 Solicitar Refacciones</h3>
                  <p className="text-xs text-gray-500 mb-4">Ingresa qué piezas necesitas. Recepción se encargará de cotizar y conseguirlas.</p>
                  
                  <div className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        placeholder="Nombre de la pieza (Ej: Filtro de Aire)" 
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-gray-500 outline-none shadow-sm"
                        value={nuevaRefaccion}
                        onChange={e => setNuevaRefaccion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && solicitarRefaccion()}
                    />
                  </div>

                  <button onClick={solicitarRefaccion} className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors shadow-lg">
                      SOLICITAR PIEZA
                  </button>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
                      ℹ️ <strong>Nota:</strong> Al solicitar una pieza, aparecerá como "Pendiente". No podrás marcarla como "Listo" hasta que tengas la pieza física.
                  </div>
              </div>
          </div>
      </div>

      {/* TABLA DE SEGUIMIENTO (SIN PRECIOS) */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-800 p-4 flex justify-between items-center">
              <h3 className="font-bold text-white">📋 Tareas y Refacciones Solicitadas</h3>
              <span className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">Vista de Mecánico</span>
          </div>
          
          <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                  <tr>
                      <th className="p-4">Descripción</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                  {detalles.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-700">
                              {d.falla_detectada}
                          </td>
                          <td className="p-4">
                              {d.falla_detectada.includes('(Servicio)') || d.sistema_origen === 'Nota General' 
                                ? <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-1 rounded border border-blue-100">SERVICIO</span>
                                : <span className="text-gray-600 font-bold text-[10px] bg-gray-100 px-2 py-1 rounded border border-gray-200">REFACCIÓN</span>
                              }
                          </td>
                          <td className="p-4">
                                {d.estado === 'pendiente' && <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">Pendiente ⏳</span>}
                                {d.estado === 'en_proceso' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold animate-pulse">En Proceso 🔧</span>}
                                {d.estado === 'terminado' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Terminado ✅</span>}
                                {d.estado === 'pausado' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">En Espera ✋</span>}
                          </td>
                          <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                    {d.estado === 'pendiente' && (
                                        <button onClick={() => cambiarEstadoDetalle(d.id, 'en_proceso')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">▶ Iniciar</button>
                                    )}
                                    {d.estado === 'en_proceso' && (
                                        <>
                                            <button onClick={() => cambiarEstadoDetalle(d.id, 'pausado')} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">✋</button>
                                            <button onClick={() => cambiarEstadoDetalle(d.id, 'terminado')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">✅ Listo</button>
                                        </>
                                    )}
                                    {d.estado === 'pausado' && (
                                        <button onClick={() => cambiarEstadoDetalle(d.id, 'en_proceso')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">▶ Reanudar</button>
                                    )}
                                    {d.estado === 'terminado' && <span className="text-green-600 font-bold text-xs">Completado</span>}
                                </div>
                          </td>
                      </tr>
                  ))}
                  {detalles.length === 0 && (
                      <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">No hay actividad registrada.</td></tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* FINALIZAR */}
      {tareasActivas.length > 0 && (
          <div className={`p-6 rounded-xl text-center border transition-all ${todoListo ? 'bg-green-50 border-green-400' : 'bg-slate-50 border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-3 ${todoListo ? 'text-green-800' : 'text-slate-400'}`}>
                  {todoListo ? "✅ Todos los trabajos marcados como TERMINADOS" : `⏳ Faltan ${tareasPendientes} servicios por terminar`}
              </h3>
              
              <button 
                disabled={!todoListo} 
                onClick={finalizarOrdenCompleta}
                className={`py-3 px-8 rounded-lg font-black text-lg shadow-md transition-all ${todoListo ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105' : 'bg-slate-300 text-slate-400 cursor-not-allowed'}`}
              >
                  {todoListo ? "🏁 TERMINAR Y ENTREGAR A RECEPCIÓN" : "Finaliza todo para cerrar la orden"}
              </button>
          </div>
      )}

    </div>
  )
}

export default Diagnostico