import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import FormularioInspeccion from '../components/FormularioInspeccion' 

function NuevaOrden() {
  const navigate = useNavigate()

  // --- ESTADOS DE DATOS ---
  const [placaBusqueda, setPlacaBusqueda] = useState("")
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", email: "" })
  const [vehiculo, setVehiculo] = useState({ marca: "", modelo: "", anio: "", color: "", placas: "" })
  const [mecanicoId, setMecanicoId] = useState("")
  
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
        
        // --- 🔍 DIAGNÓSTICO DE ROLES ---
        console.log("----- LISTA DE TODOS LOS USUARIOS ENCONTRADOS -----");
        resUsuarios.data.forEach(u => {
            console.log(`Usuario: ${u.nombre} | Rol guardado: "${u.rol}"`);
        });
        console.log("---------------------------------------------------");

        // --- EL SUPER FILTRO ---
        // 1. Convertimos a minúsculas
        // 2. Quitamos acentos (á -> a)
        // 3. Buscamos si contiene la palabra "mecanic"
        const soloMecanicos = resUsuarios.data.filter(u => {
            if (!u.rol) return false; // Si no tiene rol, lo ignoramos
            
            // Truco para quitar acentos y hacer minusculas
            const rolLimpio = u.rol.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            // Acepta: "mecanico", "mecanico a", "jefe mecanico", "tecnico mecanico"
            return rolLimpio.includes('mecanic');
        });

        console.log("✅ Mecánicos Aprobados para la lista:", soloMecanicos);

        if (soloMecanicos.length === 0) {
            console.warn("⚠️ El filtro estricto no encontró a nadie. Mostrando TODOS por seguridad.");
            setListaUsuarios(resUsuarios.data); // Plan B: Mostrar todos
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

  // 3. GUARDAR LA ORDEN
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
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-xl mt-6 border border-slate-200">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 border-b pb-4 flex items-center gap-2">
        🚘 Nueva Recepción
      </h2>

      {/* BARRA DE BÚSQUEDA */}
      <div className="flex gap-3 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-inner">
        <input 
          type="text" 
          placeholder="INGRESA PLACAS (EJ: XBN-123)"
          className="flex-1 p-3 border border-slate-300 rounded-md text-xl uppercase font-bold tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          value={placaBusqueda}
          onChange={(e) => setPlacaBusqueda(e.target.value)}
        />
        <button 
          onClick={buscarPlaca}
          className="bg-slate-700 text-white px-8 py-2 rounded-md font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          BUSCAR
        </button>
      </div>

      {mensaje && (
          <div className={`mb-6 p-3 rounded-md text-center font-bold text-sm ${esClienteNuevo ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
              {mensaje}
          </div>
      )}

      <form onSubmit={iniciarRecepcion} className="space-y-6">
        
        {/* SECCIÓN VEHÍCULO */}
        <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Datos del Vehículo</h3>
            <div className="grid grid-cols-2 gap-5">
                <input placeholder="Marca (Ej: Nissan)" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={vehiculo.marca} onChange={e => setVehiculo({...vehiculo, marca: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Modelo (Ej: Versa)" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={vehiculo.modelo} onChange={e => setVehiculo({...vehiculo, modelo: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Año (Ej: 2020)" type="number" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={vehiculo.anio} onChange={e => setVehiculo({...vehiculo, anio: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Color" className="p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={vehiculo.color} onChange={e => setVehiculo({...vehiculo, color: e.target.value})} disabled={!esClienteNuevo} required />
            </div>
        </div>

        {/* SECCIÓN CLIENTE */}
        <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Datos del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input placeholder="Nombre Completo" className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})} disabled={!esClienteNuevo} required />
                <input placeholder="Teléfono / WhatsApp" className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-400 outline-none" value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} disabled={!esClienteNuevo} required />
            </div>
        </div>

        {/* SECCIÓN MECÁNICO */}
        <div className="pt-4 border-t border-slate-100">
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <label className="block text-indigo-900 font-bold mb-2">Asignar Mecánico Responsable</label>
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
                <p className="text-xs text-indigo-400 mt-2">
                    * Solo aparecen usuarios con rol "Mecánico".
                </p>
            </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-lg font-bold text-lg hover:bg-black transition-all shadow-lg mt-8 flex justify-center items-center gap-2">
            🚀 CREAR ORDEN E INICIAR CHECKLIST
        </button>
      </form>
    </div>
  )
}

export default NuevaOrden