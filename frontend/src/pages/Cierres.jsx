import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = "https://api-taller-luis.onrender.com"

function Cierres() {
  const [pestana, setPestana] = useState('diario') // 'diario' o 'mensual'
  
  // Estados Diario
  const [datosDiario, setDatosDiario] = useState(null)
  
  // Estados Mensual
  const [estadoMensual, setEstadoMensual] = useState({ estado: 'CARGANDO', mensaje: '' })
  
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (pestana === 'diario') cargarDiario()
    if (pestana === 'mensual') cargarMensual()
  }, [pestana])

  // --- LÓGICA DIARIO ---
  const cargarDiario = async () => {
    try {
      const res = await axios.get(`${API_URL}/cierres/hoy`)
      setDatosDiario(res.data)
    } catch (error) { console.error(error) }
  }

  const ejecutarCierreDiario = async () => {
    if (!confirm("⚠️ ¿CERRAR EL DÍA?\nEsta acción es irreversible.")) return
    setProcesando(true)
    try {
        await axios.post(`${API_URL}/cierres/diario`)
        alert("✅ Día cerrado correctamente")
        cargarDiario()
    } catch (error) { alert("Error al cerrar día") } 
    finally { setProcesando(false) }
  }

  // --- LÓGICA MENSUAL ---
  const cargarMensual = async () => {
    try {
        const res = await axios.get(`${API_URL}/cierres/mensual/estado`)
        setEstadoMensual(res.data)
    } catch (error) { console.error(error) }
  }

  const ejecutarCierreMensual = async () => {
    if (!confirm("🚨 ¿CONFIRMAS EL CIERRE MENSUAL?\n\nEsto congelará la contabilidad de todo el mes. Asegúrate de que todo esté correcto.")) return
    setProcesando(true)
    try {
        await axios.post(`${API_URL}/cierres/mensual`)
        alert("✅ MES CERRADO EXITOSAMENTE")
        cargarMensual()
    } catch (error) { 
        alert("Error: " + error.response.data.detail) 
    } 
    finally { setProcesando(false) }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-slate-800">🔒 Control de Cierres</h1>
        
        {/* SELECTOR DE PESTAÑAS */}
        <div className="bg-white p-1 rounded-lg border border-slate-300 flex">
            <button 
                onClick={() => setPestana('diario')}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${pestana === 'diario' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                📅 Cierre Diario
            </button>
            <button 
                onClick={() => setPestana('mensual')}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${pestana === 'mensual' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                📆 Cierre Mensual
            </button>
        </div>
      </div>

      {/* =======================================================
          VISTA: CIERRE DIARIO
         ======================================================= */}
      {pestana === 'diario' && datosDiario && (
        <>
            <div className="mb-4 text-right">
                <p className="text-xs font-bold uppercase text-slate-400">Fecha Operativa</p>
                <p className="text-xl font-mono font-bold text-slate-700">
                    {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {!datosDiario || datosDiario.movimientos_pendientes === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center animate-fade-in">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-green-800">Día Cerrado</h2>
                    <p className="text-green-600">No hay movimientos pendientes.</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Tarjetas de Resumen Diario */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
                            <p className="text-slate-400 text-xs font-bold uppercase">Efectivo</p>
                            <h2 className="text-3xl font-black text-slate-800">${datosDiario.total_efectivo.toLocaleString()}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
                            <p className="text-slate-400 text-xs font-bold uppercase">Bancos</p>
                            <h2 className="text-3xl font-black text-slate-800">${(datosDiario.total_tarjeta + datosDiario.total_transferencia).toLocaleString()}</h2>
                        </div>
                        <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
                            <p className="opacity-50 text-xs font-bold uppercase">Total Día</p>
                            <h2 className="text-4xl font-black">${datosDiario.total_ingresos.toLocaleString()}</h2>
                        </div>
                    </div>

                    <button 
                        onClick={ejecutarCierreDiario}
                        disabled={procesando}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                    >
                        {procesando ? 'CERRANDO...' : '🔒 EJECUTAR CIERRE DIARIO'}
                    </button>
                </div>
            )}
        </>
      )}

      {/* =======================================================
          VISTA: CIERRE MENSUAL
         ======================================================= */}
      {pestana === 'mensual' && (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center animate-fade-in">
            <div className="text-6xl mb-6">🗓️</div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Cierre Mensual</h2>
            <p className="text-slate-500 max-w-lg mx-auto mb-8">
                Este proceso recopila toda la información del mes y cierra el periodo contable. 
                Requiere que hoy sea fecha de corte y que el día operativo esté cerrado.
            </p>

            {/* STATUS DEL CIERRE MENSUAL */}
            {estadoMensual.estado === 'CERRADO' && (
                <div className="bg-green-100 text-green-800 p-4 rounded-lg font-bold">
                    ✅ {estadoMensual.mensaje}
                </div>
            )}

            {estadoMensual.estado === 'BLOQUEADO' && (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl max-w-md mx-auto">
                    <p className="text-orange-800 font-bold text-lg mb-2">⛔ No disponible aún</p>
                    <p className="text-orange-700 text-sm">{estadoMensual.mensaje}</p>
                </div>
            )}

            {estadoMensual.estado === 'DISPONIBLE' && (
                <div className="animate-pulse">
                     <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-blue-800 font-bold">
                        ✨ ¡Todo listo! Puedes cerrar el mes ahora.
                    </div>
                    <button 
                        onClick={ejecutarCierreMensual}
                        disabled={procesando}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-xl shadow-xl text-xl transition-transform active:scale-95"
                    >
                        {procesando ? 'PROCESANDO...' : '🚀 EJECUTAR CIERRE MENSUAL'}
                    </button>
                </div>
            )}
        </div>
      )}

    </div>
  )
}

export default Cierres