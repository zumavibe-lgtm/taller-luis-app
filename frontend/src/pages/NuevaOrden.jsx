import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import FormularioInspeccion from '../components/FormularioInspeccion' 
import MapaCoche from '../components/MapaCoche'

function NuevaOrden() {
  const navigate = useNavigate()

  // --- ESTADOS DE DATOS ---
  const [placaBusqueda, setPlacaBusqueda] = useState("")
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", email: "" })
  const [vehiculo, setVehiculo] = useState({ marca: "", modelo: "", anio: "", color: "", placas: "" })
  const [mecanicoId, setMecanicoId] = useState("")
  
  // ESTADO PARA LOS DAÑOS (GOLPES)
  const [daños, setDaños] = useState([]) 
  const [notasGolpes, setNotasGolpes] = useState("")

  // --- CATALOGOS ---
  const [listaClientes, setListaClientes] = useState([])
  const [listaVehiculos, setListaVehiculos] = useState([])
  const [listaUsuarios, setListaUsuarios] = useState([]) 

  // --- ESTADOS DE CONTROL ---
  const [esClienteNuevo, setEsClienteNuevo] = useState(true)
  const [mensaje, setMensaje] = useState("")
  const [mostrarChecklist, setMostrarChecklist] = useState(false)
  const [ordenCreadaId, setOrdenCreadaId] = useState(null)

  const API_URL = "https://api-taller-luis.onrender.com"

  // 1. CARGAMOS LOS DATOS AL INICIAR
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const resVehiculos = await axios.get(`${API_URL}/vehiculos/`)
        const resClientes = await axios.get(`${API_URL}/clientes/`)
        const resUsuarios = await axios.get(`${API_URL}/usuarios/`)
        
        setListaVehiculos(resVehiculos.data)
        setListaClientes(resClientes.data)
        
        // FILTRO DE MECÁNICOS
        const soloMecanicos = resUsuarios.data.filter(u => {
            if (!u.rol) return false;
            const rolLimpio = u.rol.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return rolLimpio.includes('mecanic');
        });

        if (soloMecanicos.length === 0) {
            setListaUsuarios(resUsuarios.data); 
        } else {
            setListaUsuarios(soloMecanicos);
        }

      } catch (error) {
        console.error("Error cargando catálogos.", error)
      }
    }
    cargarCatalogos()
  }, [])

  // 2. BUSCAR POR PLACA
  const buscarPlaca = () => {
    const placaLimpia = placaBusqueda.trim().toUpperCase()
    const vehiculoEncontrado = listaVehiculos.find(v => v.placas.toUpperCase() === placaLimpia)

    if (vehiculoEncontrado) {
      setVehiculo(vehiculoEncontrado)
      const clienteEncontrado = listaClientes.find(c => c.id === vehiculoEncontrado.cliente_id)
      if (clienteEncontrado) {
        setCliente(clienteEncontrado)
        setCliente({
            ...clienteEncontrado,
            nombre: clienteEncontrado.nombre_completo || clienteEncontrado.nombre 
        })
      }
      setEsClienteNuevo(false)
      setMensaje("✅ Cliente Frecuente Encontrado")
    } else {
      setVehiculo({ ...vehiculo, placas: placaLimpia })
      setCliente({ nombre: "", telefono: "", email: "" })
      setEsClienteNuevo(true)
      setMensaje("⚠️ Vehículo no registrado. Ingresa los datos.")
    }
  }

  // 3. FUNCIÓN PARA MARCAR/DESMARCAR GOLPES
  const toggleDaño = (parte) => {
    if (daños.includes(parte)) {
        setDaños(daños.filter(d => d !== parte))
    } else {
        setDaños([...daños, parte])
    }
  }

  // 4. GUARDAR LA ORDEN
  const iniciarRecepcion = async (e) => {
    e.preventDefault()
    if (!mecanicoId) return alert("⚠️ Debes asignar un mecánico responsable.")

    try {
      let clienteIdFinal = null
      let vehiculoIdFinal = null

      if (esClienteNuevo) {
        const resCliente = await axios.post(`${API_URL}/clientes/`, {
            nombre_completo: cliente.nombre, 
            telefono: cliente.telefono,
            email: cliente.email || "sin@email.com"
        })
        clienteIdFinal = resCliente.data.id

        const resVehiculo = await axios.post(`${API_URL}/vehiculos/`, {
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio: parseInt(vehiculo.anio),
            placas: vehiculo.placas,
            color: vehiculo.color,
            cliente_id: clienteIdFinal
        })
        vehiculoIdFinal = resVehiculo.data.id
      } else {
        clienteIdFinal = cliente.id
        vehiculoIdFinal = vehiculo.id
      }

      const resOrden = await axios.post(`${API_URL}/ordenes/`, {
        cliente_id: clienteIdFinal,
        vehiculo_id: vehiculoIdFinal,
        kilometraje: 0, 
        nivel_gasolina: 0,
        mecanico_asignado: mecanicoId
      })

      setOrdenCreadaId(resOrden.data.id)
      setMostrarChecklist(true) 

    } catch (error) {
      console.error("Error creando orden", error)
      alert("Error al crear la orden. Revisa la consola (F12).")
    }
  }

  const alTerminarChecklist = () => {
    setMostrarChecklist(false)
    navigate('/') 
  }

  if (mostrarChecklist) {
      return (
          <FormularioInspeccion 
              ordenId={ordenCreadaId} 
              alTerminar={alTerminarChecklist} 
          />
      )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white shadow-xl rounded-xl mt-6 border border-slate-200">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
        🚘 Nueva Recepción
      </h2>

      {/* 1. BARRA DE BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-inner">
        <input 
          type="text" 
          placeholder="INGRESA PLACAS (EJ: XBN-123)"
          className="flex-1 p-3 border border-slate-300 rounded-md text-lg uppercase font-bold tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          value={placaBusqueda}
          onChange={(e) => setPlacaBusqueda(e.target.value)}
        />
        <button 
          onClick={buscarPlaca}
          className="bg-slate-700 text-white px-8 py-3 rounded-md font-semibold hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
        >
          BUSCAR
        </button>
      </div>

      {mensaje && (
          <div className={`mb-6 p-3 rounded-md text-center font-bold text-sm ${esClienteNuevo ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
              {mensaje}
          </div>
      )}

      <form onSubmit={iniciarRecepcion} className="space-y-8">
        
        {/* 2. DATOS DEL VEHÍCULO */}
        <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               🚗 Datos del Vehículo
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <input placeholder="Marca" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none w-full" value={vehiculo.marca} onChange={e => setVehiculo({...vehiculo, marca: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Modelo" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none w-full" value={vehiculo.modelo} onChange={e => setVehiculo({...vehiculo, modelo: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Año" type="number" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none w-full" value={vehiculo.anio} onChange={e => setVehiculo({...vehiculo, anio: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Color" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none w-full" value={vehiculo.color} onChange={e => setVehiculo({...vehiculo, color: e.target.value})} disabled={!esClienteNuevo} required />
            </div>
        </div>

        {/* 3. DATOS DEL CLIENTE (Movidito arriba como pediste) */}
        <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
               👤 Datos del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Nombre Completo" className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Teléfono / WhatsApp" className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} disabled={!esClienteNuevo} required />
            </div>
        </div>

        {/* 4. ASIGNAR MECÁNICO */}
        <div className="pt-4 border-t border-slate-100">
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <label className="block text-indigo-900 font-bold mb-2 uppercase text-xs tracking-wider">🛠️ Mecánico Responsable</label>
                <select 
                    className="w-full p-3 border border-indigo-200 rounded-md bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={mecanicoId} 
                    onChange={(e) => setMecanicoId(e.target.value)} 
                    required
                >
                    <option value="">-- Seleccionar --</option>
                    {listaUsuarios.map(u => (
                        <option key={u.id} value={u.username}>
                            {u.nombre}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* 5. MAPA INTERACTIVO (GOLPES) - Ahora al final */}
        <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 text-center md:text-left">
                📸 Inspección Visual (Golpes)
            </h3>
            
            {/* Contenedor Flex centrado para móvil, fila para PC */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                
                {/* EL MAPA (Centrado) */}
                <div className="w-full md:w-auto flex justify-center bg-slate-50 rounded-xl py-4 px-2 shadow-inner border border-slate-100">
                    <MapaCoche seleccionados={daños} toggleParte={toggleDaño} />
                </div>

                {/* LISTA DE DAÑOS Y NOTAS */}
                <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 w-full shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700 text-sm uppercase">Detalle de Daños:</h4>
                        
                        {/* 🗑️ BOTÓN DE LIMPIAR / SIN DAÑOS */}
                        <button 
                            type="button" 
                            onClick={() => setDaños([])}
                            className="text-xs text-slate-400 hover:text-red-500 font-bold underline transition-colors"
                        >
                            🗑️ Limpiar / Sin Daños
                        </button>
                    </div>
                    
                    {daños.length === 0 ? (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-100 flex items-center justify-center gap-2 mb-4">
                            ✨ Vehículo sin daños visibles.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {daños.map(d => (
                                <span key={d} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 uppercase flex items-center gap-1 shadow-sm">
                                    ⚠️ {d.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* CAMPO EXTRA: Notas */}
                    <div className="mt-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas Adicionales</label>
                        <textarea 
                            className="w-full p-3 rounded border border-slate-300 text-sm focus:ring-2 focus:ring-red-200 outline-none transition-all"
                            rows="3"
                            placeholder="Ej: Rayón profundo en puerta derecha, calavera rota..."
                            value={notasGolpes}
                            onChange={(e) => setNotasGolpes(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>

        {/* 6. BOTÓN FINAL */}
        <button type="submit" className="w-full bg-[#8C2B32] text-white p-4 rounded-lg font-bold text-lg hover:bg-[#7a252b] transition-all shadow-lg flex justify-center items-center gap-2 transform active:scale-[0.98]">
            🚀 CREAR ORDEN E INICIAR CHECKLIST
        </button>
      </form>
    </div>
  )
}

export default NuevaOrden