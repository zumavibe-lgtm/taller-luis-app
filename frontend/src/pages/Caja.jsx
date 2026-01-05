import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

// Ajuste de IP para Windows
const API_URL = "https://api-taller-luis.onrender.com"

function Caja() {
  const navigate = useNavigate()
  const [ordenes, setOrdenes] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  
  // Datos del Cobro
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [referencia, setReferencia] = useState('')
  const [totalCobrar, setTotalCobrar] = useState(0)
  const [procesando, setProcesando] = useState(false)

  // Cargar órdenes "Listas para entrega" (Estado 'terminado')
  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
      const res = await axios.get(`${API_URL}/ordenes/`)
      // FILTRO: Solo mostramos las que ya terminaron mecánica pero no han pagado
      const listas = res.data.filter(o => o.estado === 'terminado')
      setOrdenes(listas)
    } catch (error) {
      console.error("Error cargando órdenes", error)
    }
  }

  const seleccionarOrden = (orden) => {
    setSeleccionada(orden)
    // Aquí podrías sumar refacciones + mano de obra. 
    // Por ahora pondremos un monto manual simulado o lo que venga del backend si ya tuviera total.
    setTotalCobrar(orden.total_cobrado || 0) 
    setMetodoPago('Efectivo')
    setReferencia('')
  }

  const procesarCobro = async (e) => {
    e.preventDefault()
    
    if (metodoPago !== 'Efectivo' && !referencia) {
        alert("⚠️ OJO: Para Tarjeta o Transferencia es OBLIGATORIO poner el número de referencia/voucher.")
        return
    }

    if (totalCobrar <= 0) {
        alert("⚠️ El monto a cobrar debe ser mayor a 0.")
        return
    }

    if(!confirm(`¿Confirmas el cobro de $${totalCobrar} a la orden ${seleccionada.folio_visual}?`)) return;

    setProcesando(true)
    try {
        const payload = {
            total_cobrado: parseFloat(totalCobrar),
            metodo_pago: metodoPago,
            referencia: referencia // Enviamos la referencia (voucher)
        }

        // Llamamos al endpoint de cobrar
        await axios.put(`${API_URL}/ordenes/${seleccionada.id}/cobrar`, payload)
        
        alert("✅ ¡Cobro Exitoso! El auto ha pasado a 'Entregado'.")
        setSeleccionada(null)
        cargarOrdenes() // Recargamos la lista
    } catch (error) {
        console.error(error)
        alert("Error al procesar el cobro.")
    } finally {
        setProcesando(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* --- PANEL IZQUIERDO: LISTA DE ESPERA --- */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">💰 Caja / Tesorería</h2>
            <button onClick={() => navigate('/')} className="text-sm bg-slate-600 px-3 py-1 rounded hover:bg-slate-500">Volver</button>
        </div>
        
        <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Listos para Cobro ({ordenes.length})</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
            {ordenes.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                    <p>No hay vehículos pendientes de cobro.</p>
                </div>
            ) : (
                ordenes.map(orden => (
                    <div 
                        key={orden.id}
                        onClick={() => seleccionarOrden(orden)}
                        className={`p-4 border-b cursor-pointer transition-all hover:bg-blue-50 ${seleccionada?.id === orden.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800">{orden.folio_visual}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">LISTO</span>
                        </div>
                        <p className="text-sm text-gray-600">Vehículo ID: {orden.vehiculo_id} (Cliente ID: {orden.cliente_id})</p>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* --- PANEL DERECHO: CHECKOUT --- */}
      <div className="w-2/3 p-10 flex flex-col justify-center items-center bg-gray-100">
        
        {seleccionada ? (
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <p className="opacity-80 text-sm uppercase tracking-widest mb-1">COBRANDO ORDEN</p>
                    <h1 className="text-3xl font-black">{seleccionada.folio_visual}</h1>
                </div>

                <form onSubmit={procesarCobro} className="p-8 space-y-6">
                    
                    {/* MONTO */}
                    <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm uppercase">Total a Pagar ($)</label>
                        <input 
                            type="number" 
                            className="w-full text-4xl font-black text-center text-slate-800 border-b-4 border-slate-200 focus:border-blue-600 outline-none pb-2 bg-transparent"
                            value={totalCobrar}
                            onChange={e => setTotalCobrar(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    {/* MÉTODO DE PAGO */}
                    <div>
                        <label className="block text-gray-700 font-bold mb-3 text-sm uppercase">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                                <button
                                    type="button"
                                    key={m}
                                    onClick={() => setMetodoPago(m)}
                                    className={`py-3 rounded-lg font-bold border-2 transition-all ${metodoPago === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                >
                                    {m === 'Tarjeta' ? '💳' : m === 'Transferencia' ? '🏦' : '💵'} {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* REFERENCIA (CONDICIONAL) */}
                    {metodoPago !== 'Efectivo' && (
                        <div className="animate-fade-in bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <label className="block text-yellow-800 font-bold mb-1 text-xs uppercase">
                                {metodoPago === 'Tarjeta' ? 'Número de Voucher / Recibo' : 'Clave de Rastreo / Folio'}
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded focus:border-yellow-500 outline-none font-mono text-lg"
                                value={referencia}
                                onChange={e => setReferencia(e.target.value)}
                                placeholder="Ej: 458892"
                            />
                        </div>
                    )}

                    {/* BOTÓN PAGAR */}
                    <button 
                        type="submit" 
                        disabled={procesando}
                        className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-xl shadow-lg hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {procesando ? 'PROCESANDO...' : '✅ FINALIZAR COBRO'}
                    </button>

                </form>
            </div>
        ) : (
            <div className="text-center opacity-30">
                <div className="text-9xl mb-4">🛒</div>
                <h2 className="text-3xl font-bold text-slate-800">Selecciona una orden</h2>
                <p className="text-slate-600">Elige un vehículo de la izquierda para cobrar.</p>
            </div>
        )}

      </div>
    </div>
  )
}

export default Caja