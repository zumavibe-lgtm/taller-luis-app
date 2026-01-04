import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = "https://taller-luis-app.onrender.com"

function Reportes() {
  const [pestana, setPestana] = useState('financiero') // financiero | auditoria | estadisticas
  const [cargando, setCargando] = useState(false)

  // --- VARIABLES SEPARADAS (Para evitar choques y pantallazos blancos) ---
  const [listaFinanciera, setListaFinanciera] = useState([]) 
  const [listaAuditoria, setListaAuditoria] = useState([])
  const [objEstadisticas, setObjEstadisticas] = useState(null)

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    cargarDatos()
  }, [pestana, fechaInicio, fechaFin])

  const cargarDatos = async () => {
    setCargando(true)
    try {
        if (pestana === 'financiero') {
            const res = await axios.get(`${API_URL}/reportes/financiero?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
            setListaFinanciera(res.data || []) // Aseguramos que siempre sea lista
        } 
        else if (pestana === 'auditoria') {
            const res = await axios.get(`${API_URL}/reportes/auditoria`)
            setListaAuditoria(res.data || [])
        } 
        else if (pestana === 'estadisticas') {
            const res = await axios.get(`${API_URL}/reportes/estadisticas`)
            setObjEstadisticas(res.data || { total_ordenes_historico: 0, total_ingresos_historico: 0 })
        }
    } catch (error) {
        console.error("Error cargando reporte", error)
    } finally {
        setCargando(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-800">📊 Centro de Reportes</h1>
            <p className="text-slate-500">Análisis detallado de la operación.</p>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="bg-white p-1 rounded-lg border border-slate-300 flex shadow-sm">
            <button 
                onClick={() => setPestana('financiero')} 
                className={`px-4 py-2 rounded font-bold text-sm transition-all ${pestana === 'financiero' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                💰 Financiero
            </button>
            <button 
                onClick={() => setPestana('auditoria')} 
                className={`px-4 py-2 rounded font-bold text-sm transition-all ${pestana === 'auditoria' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                🕵️ Auditoría
            </button>
            <button 
                onClick={() => setPestana('estadisticas')} 
                className={`px-4 py-2 rounded font-bold text-sm transition-all ${pestana === 'estadisticas' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                📈 Estadísticas
            </button>
        </div>
      </div>

      {/* FILTROS DE FECHA (Solo visible en Financiero) */}
      {pestana === 'financiero' && (
        <div className="flex items-center gap-4 mb-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase">Desde</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="p-2 rounded border border-slate-300 font-bold text-slate-700" />
            </div>
            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase">Hasta</label>
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="p-2 rounded border border-slate-300 font-bold text-slate-700" />
            </div>
            <button onClick={cargarDatos} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow-sm">
                🔍 Buscar
            </button>
        </div>
      )}

      {/* ÁREA DE CONTENIDO (CON CARGANDO) */}
      {cargando ? (
         <div className="p-20 text-center text-slate-400 font-bold animate-pulse">
            Consultando base de datos...
         </div>
      ) : (
         <>
            {/* 1. TABLA FINANCIERA */}
            {pestana === 'financiero' && (
                <div className="animate-fade-in">
                    {/* Tarjetas Resumen */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase">Ingresos</p>
                            <p className="text-2xl font-black text-green-600">
                                +${listaFinanciera.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase">Gastos</p>
                            <p className="text-2xl font-black text-red-500">
                                -${listaFinanciera.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + m.monto, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl shadow-lg text-white">
                            <p className="text-xs font-bold opacity-50 uppercase">Balance</p>
                            <p className="text-2xl font-black">
                                ${ (listaFinanciera.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + m.monto, 0) - listaFinanciera.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + m.monto, 0)).toLocaleString() }
                            </p>
                        </div>
                    </div>

                    {/* Tabla de Datos */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Descripción</th>
                                    <th className="p-4">Método</th>
                                    <th className="p-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {listaFinanciera.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-500">
                                            {new Date(m.fecha).toLocaleDateString()} <span className="text-xs opacity-50">{new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">
                                            {m.descripcion}
                                            {m.referencia && <span className="block text-xs text-blue-500 font-mono mt-0.5">{m.referencia}</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                m.metodo_pago === 'Efectivo' ? 'bg-green-100 text-green-700' : 
                                                m.metodo_pago === 'Tarjeta' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {m.metodo_pago}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-bold font-mono ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-500'}`}>
                                            {m.tipo === 'INGRESO' ? '+' : '-'}${m.monto.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {listaFinanciera.length === 0 && (
                                    <tr><td colSpan="4" className="p-10 text-center text-slate-400">Sin movimientos en estas fechas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. TABLA AUDITORÍA */}
            {pestana === 'auditoria' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Hora</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {listaAuditoria.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-500">{new Date(log.fecha).toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-300">
                                            {log.accion}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">{log.detalle}</td>
                                </tr>
                            ))}
                             {listaAuditoria.length === 0 && (
                                <tr><td colSpan="3" className="p-10 text-center text-slate-400">Sin registros de auditoría.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* 3. ESTADÍSTICAS */}
            {pestana === 'estadisticas' && objEstadisticas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <div className="text-4xl mb-2">🚗</div>
                        <h3 className="text-xl font-bold text-slate-700">Autos Atendidos</h3>
                        <p className="text-5xl font-black text-slate-800 mt-4">
                            {objEstadisticas.total_ordenes_historico}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Órdenes cerradas históricas</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <div className="text-4xl mb-2">💵</div>
                        <h3 className="text-xl font-bold text-slate-700">Ingresos Totales</h3>
                        <p className="text-5xl font-black text-green-600 mt-4">
                            ${(objEstadisticas.total_ingresos_historico || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Acumulado histórico</p>
                    </div>
                </div>
            )}
         </>
      )}

    </div>
  )
}

export default Reportes