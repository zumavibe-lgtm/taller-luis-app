import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_URL = "https://taller-luis-app.onrender.com"

function Taller() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarTablero()
    // Auto-recargar cada 30 seg por si llegan autos nuevos
    const intervalo = setInterval(cargarTablero, 30000)
    return () => clearInterval(intervalo)
  }, [])

  const cargarTablero = async () => {
    try {
      // Usamos el endpoint que ya corregimos en el backend
      const res = await axios.get(`${API_URL}/taller/tablero`)
      setOrdenes(res.data)
      setCargando(false)
    } catch (error) {
      console.error("Error cargando tablero", error)
      setCargando(false)
    }
  }

  const mover = async (id, nuevoEstado) => {
    // 1. Actualización visual inmediata (Optimista)
    const backup = [...ordenes]
    const actualizados = ordenes.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o)
    setOrdenes(actualizados)

    // 2. Petición al Backend
    try {
        await axios.put(`${API_URL}/taller/mover/${id}?nuevo_estado=${nuevoEstado}`)
    } catch (error) {
        alert("No se pudo mover la orden")
        setOrdenes(backup) // Si falla, regresamos al estado anterior
    }
  }

  // --- COMPONENTE DE TARJETA (El cuadrito del auto) ---
  const Tarjeta = ({ data }) => (
    <div className="bg-white p-3 rounded-xl shadow-sm mb-3 border border-slate-200 hover:shadow-md transition-all group">
        
        {/* Encabezado: Folio y Fecha */}
        <div className="flex justify-between items-center mb-2">
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                {data.folio_visual || `ID-${data.id}`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
                {new Date(data.creado_en).toLocaleDateString()}
            </span>
        </div>

        {/* Datos del Auto */}
        <h4 className="font-black text-slate-800 text-sm leading-tight">
            {data.vehiculo ? `${data.vehiculo.marca} ${data.vehiculo.modelo}` : 'Auto Genérico'}
        </h4>
        <p className="text-xs text-slate-500 mb-3 truncate">
             {data.cliente ? data.cliente.nombre_completo : 'Cliente'}
        </p>
        
        {/* Botón Diagnóstico */}
        <div className="mb-3">
            <Link 
                to={`/diagnostico/${data.id}`} 
                className="block w-full bg-blue-50 text-blue-600 text-center text-xs font-bold py-1.5 rounded hover:bg-blue-100 border border-blue-100 transition-colors"
            >
                📝 Ver Diagnóstico
            </Link>
        </div>

        {/* Flechas de Movimiento */}
        <div className="flex justify-between pt-2 border-t border-slate-100 opacity-40 group-hover:opacity-100 transition-opacity">
             {/* Botón ATRÁS */}
             {data.estado !== 'recibido' ? (
                 <button 
                    onClick={() => mover(data.id, data.estado === 'listo' ? 'revisión' : 'recibido')} 
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                 >
                    ⬅ Regresar
                 </button>
             ) : <div></div>}

             {/* Botón AVANZAR */}
             {data.estado !== 'listo' ? (
                 <button 
                    onClick={() => mover(data.id, data.estado === 'recibido' ? 'revisión' : 'listo')} 
                    className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1"
                 >
                    Avanzar ➡
                 </button>
             ) : <div></div>}
        </div>
    </div>
  )

  if (cargando) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Cargando tablero...</div>

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-end mb-4 px-1">
            <div>
                <h1 className="text-2xl font-black text-slate-800">🛠️ Taller Mecánico</h1>
                <p className="text-slate-500 text-sm">Arrastra o mueve las órdenes según su progreso.</p>
            </div>
            <button onClick={cargarTablero} className="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">
                🔄 Actualizar
            </button>
        </div>

        {/* --- COLUMNAS DEL TABLERO --- */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden pb-2">
            
            {/* 1. POR HACER (Recibidos) */}
            <div className="bg-slate-100 rounded-xl flex flex-col h-full border border-slate-200">
                <div className="p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between">
                    <h3 className="font-bold text-slate-600 text-sm">📥 POR REVISAR</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 rounded-full text-xs font-bold">
                        {ordenes.filter(o => o.estado === 'recibido').length}
                    </span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                    {ordenes.filter(o => o.estado === 'recibido').map(o => <Tarjeta key={o.id} data={o}/>)}
                    {ordenes.filter(o => o.estado === 'recibido').length === 0 && (
                        <div className="text-center p-10 text-slate-300 italic text-xs">Sin pendientes</div>
                    )}
                </div>
            </div>

            {/* 2. EN PROCESO (Diagnóstico y Reparación) */}
<div className="bg-blue-50 rounded-xl flex flex-col h-full border border-blue-100">
    <div className="p-3 border-b border-blue-100 bg-blue-50 rounded-t-xl flex justify-between">
        <h3 className="font-bold text-blue-700 text-sm">🔧 EN REPARACIÓN</h3>
        <span className="bg-blue-200 text-blue-700 px-2 rounded-full text-xs font-bold">
            {/* AGREGAMOS 'diagnostico' AQUÍ 👇 */}
            {ordenes.filter(o => ['diagnostico', 'revisión', 'reparacion', 'espera_refacciones'].includes(o.estado)).length}
        </span>
    </div>
    <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
        {/* Y AGREGAMOS 'diagnostico' TAMBIÉN AQUÍ 👇 */}
        {ordenes.filter(o => ['diagnostico', 'revisión', 'reparacion', 'espera_refacciones'].includes(o.estado)).map(o => <Tarjeta key={o.id} data={o}/>)}
    </div>
</div>

            {/* 3. LISTOS */}
            <div className="bg-green-50 rounded-xl flex flex-col h-full border border-green-100">
                <div className="p-3 border-b border-green-100 bg-green-50 rounded-t-xl flex justify-between">
                    <h3 className="font-bold text-green-700 text-sm">✅ LISTOS PARA ENTREGA</h3>
                    <span className="bg-green-200 text-green-700 px-2 rounded-full text-xs font-bold">
                        {ordenes.filter(o => o.estado === 'listo').length}
                    </span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                    {ordenes.filter(o => o.estado === 'listo').map(o => <Tarjeta key={o.id} data={o}/>)}
                </div>
            </div>

        </div>
    </div>
  )
}

export default Taller