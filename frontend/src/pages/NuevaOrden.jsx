import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function NuevaOrden() {
  const navigate = useNavigate()
  
  // --- ESTADOS (La memoria de la pantalla) ---
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [listaMecanicos, setListaMecanicos] = useState([]) // <--- NUEVO: Lista para guardar mecánicos reales
  
  // Opción: ¿Es cliente nuevo?
  const [esNuevoCliente, setEsNuevoCliente] = useState(false)

  // Datos para buscar (Si el cliente ya existe)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [busquedaVehiculo, setBusquedaVehiculo] = useState("")

  // Datos para registrar (Si es NUEVO)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre_completo: "", telefono: "", email: "sin@email.com", rfc: "" })
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ marca: "", modelo: "", anio: 2020, placas: "", color: "", vin: "" })

  // Datos de la Orden (Lo que siempre se necesita)
  const [formData, setFormData] = useState({
    cliente_id: '',
    vehiculo_id: '',
    kilometraje: '',
    nivel_gasolina: 50,
    mecanico_asignado: ''
  })

  // Al iniciar, cargamos la lista de clientes, vehiculos Y MECÁNICOS
  useEffect(() => {
    cargarCatalogos()
  }, [])

  const cargarCatalogos = async () => {
    try {
      // 1. Cargar Clientes
      const resC = await axios.get('https://api-taller-luis.onrender.com/clientes/')
      setClientes(resC.data)

      // 2. Cargar Vehículos
      const resV = await axios.get('https://api-taller-luis.onrender.com/vehiculos/')
      setVehiculos(resV.data)

      // 3. Cargar Usuarios (Mecánicos) <--- NUEVO CÓDIGO AQUI
      const resU = await axios.get('https://api-taller-luis.onrender.com/usuarios/')
      
      // Filtramos: Solo queremos ver Mecánicos o Admins en la lista
      // (Si aún no usas roles en la BD, mostrará a todos)
      const soloMecanicos = resU.data.filter(usuario => 
        usuario.rol === 'mecanico' || usuario.rol === 'admin' || !usuario.rol
      );
      setListaMecanicos(soloMecanicos);

    } catch (error) { console.error("Error cargando datos:", error) }
  }

  // --- LÓGICA DE BÚSQUEDA (Igual que antes) ---
  const manejarBusquedaCliente = (e) => {
    const texto = e.target.value
    setBusquedaCliente(texto)
    const encontrado = clientes.find(c => c.nombre_completo === texto)
    if (encontrado) setFormData({ ...formData, cliente_id: encontrado.id })
    else setFormData({ ...formData, cliente_id: '' })
  }

  const manejarBusquedaVehiculo = (e) => {
    const texto = e.target.value
    setBusquedaVehiculo(texto)
    const encontrado = vehiculos.find(v => `${v.marca} ${v.modelo} - ${v.placas}` === texto)
    if (encontrado) setFormData({ ...formData, vehiculo_id: encontrado.id })
    else setFormData({ ...formData, vehiculo_id: '' })
  }

  // --- LÓGICA MAGICA: CREAR TODO (Cliente -> Vehículo -> Orden) ---
  const manejarEnvio = async (e) => {
    e.preventDefault()
    
    let idFinalCliente = formData.cliente_id
    let idFinalVehiculo = formData.vehiculo_id

    try {
        // CASO 1: Es Cliente Nuevo
        if (esNuevoCliente) {
            // 1. Crear Cliente
            const resC = await axios.post('https://api-taller-luis.onrender.com/clientes/', {
                ...nuevoCliente, es_empresa: false
            })
            idFinalCliente = resC.data.id

            // 2. Crear Vehículo (Usando el ID del cliente nuevo)
            const resV = await axios.post(`https://api-taller-luis.onrender.com/vehiculos/?cliente_id=${idFinalCliente}`, nuevoVehiculo)
            idFinalVehiculo = resV.data.id
        }

        // Validar que tengamos IDs antes de crear la orden
        if (!idFinalCliente || !idFinalVehiculo) {
            alert("⚠️ Faltan datos del cliente o vehículo.")
            return
        }

        // 3. Crear la Orden
        const datosOrden = {
            cliente_id: idFinalCliente,
            vehiculo_id: idFinalVehiculo,
            kilometraje: formData.kilometraje || 0,
            nivel_gasolina: formData.nivel_gasolina,
            mecanico_asignado: formData.mecanico_asignado || null // Mandamos null si no selecciona nadie
        }

        await axios.post('https://api-taller-luis.onrender.com/ordenes/', datosOrden)
        alert("✅ ¡Orden y registros creados exitosamente!")
        navigate('/recepcion')

    } catch (error) {
        console.error(error)
        alert("Error al crear. Revisa que no falten datos obligatorios.")
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '30px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '10px', backgroundColor: 'white', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#1a237e', marginTop: 0 }}>📝 Recepción de Vehículo</h2>
      
      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* --- SECCIÓN 1: CLIENTE --- */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', color: '#d32f2f' }}>
                <input 
                    type="checkbox" 
                    checked={esNuevoCliente} 
                    onChange={(e) => setEsNuevoCliente(e.target.checked)} 
                    style={{ width: '20px', height: '20px' }}
                />
                ¿Es Cliente Nuevo?
            </label>

            {!esNuevoCliente ? (
                // MODO BÚSQUEDA
                <div style={{ marginTop: '15px' }}>
                    <label>🔍 Buscar Cliente Existente:</label>
                    <input list="lista-clientes" type="text" placeholder="Escribe el nombre..." value={busquedaCliente} onChange={manejarBusquedaCliente} style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
                    <datalist id="lista-clientes">
                        {clientes.map(c => <option key={c.id} value={c.nombre_completo} />)}
                    </datalist>
                </div>
            ) : (
                // MODO REGISTRO
                <div style={{ display: 'grid', gap: '10px', marginTop: '15px', backgroundColor: '#fafafa', padding: '10px', borderRadius: '5px' }}>
                    <input type="text" placeholder="Nombre Completo" value={nuevoCliente.nombre_completo} onChange={e => setNuevoCliente({...nuevoCliente, nombre_completo: e.target.value})} style={{ padding: '8px' }} required />
                    <input type="text" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} style={{ padding: '8px' }} required />
                </div>
            )}
        </div>

        {/* --- SECCIÓN 2: VEHÍCULO --- */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            {!esNuevoCliente ? (
                // MODO BÚSQUEDA
                <div>
                    <label>🚗 Buscar Vehículo del Cliente:</label>
                    <input list="lista-vehiculos" type="text" placeholder="Escribe placas o modelo..." value={busquedaVehiculo} onChange={manejarBusquedaVehiculo} style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
                    <datalist id="lista-vehiculos">
                        {vehiculos.map(v => <option key={v.id} value={`${v.marca} ${v.modelo} - ${v.placas}`} />)}
                    </datalist>
                </div>
            ) : (
                // MODO REGISTRO
                <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>Datos del Vehículo Nuevo:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#fafafa', padding: '10px', borderRadius: '5px' }}>
                        <input type="text" placeholder="Marca (Ej: Nissan)" value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})} style={{ padding: '8px' }} />
                        <input type="text" placeholder="Modelo (Ej: Tsuru)" value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})} style={{ padding: '8px' }} />
                        <input type="number" placeholder="Año (Ej: 2015)" value={nuevoVehiculo.anio} onChange={e => setNuevoVehiculo({...nuevoVehiculo, anio: e.target.value})} style={{ padding: '8px' }} />
                        <input type="text" placeholder="Placas" value={nuevoVehiculo.placas} onChange={e => setNuevoVehiculo({...nuevoVehiculo, placas: e.target.value.toUpperCase()})} style={{ padding: '8px' }} />
                        <input type="text" placeholder="Color" value={nuevoVehiculo.color} onChange={e => setNuevoVehiculo({...nuevoVehiculo, color: e.target.value})} style={{ padding: '8px' }} />
                    </div>
                </div>
            )}
        </div>

        {/* --- SECCIÓN 3: DETALLES DE ORDEN --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
                <label>Kilometraje:</label>
                <input type="number" placeholder="Ej: 125000" value={formData.kilometraje} onChange={e => setFormData({...formData, kilometraje: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
            </div>
            <div>
                <label>Gasolina ({formData.nivel_gasolina}%):</label>
                <input type="range" min="0" max="100" step="10" value={formData.nivel_gasolina} onChange={e => setFormData({...formData, nivel_gasolina: e.target.value})} style={{ width: '100%', marginTop: '15px' }} />
            </div>
        </div>

        {/* --- AQUI ESTA EL CAMBIO VISUAL DE LOS MECANICOS --- */}
        <div>
            <label>🔧 Asignar Mecánico (Opcional):</label>
            <select 
                value={formData.mecanico_asignado} 
                onChange={e => setFormData({...formData, mecanico_asignado: e.target.value})} 
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
                <option value="">-- Cualquiera disponible --</option>
                {/* Ahora mapeamos la lista real que trajimos de internet */}
                {listaMecanicos.map(mecanico => (
                    <option key={mecanico.id} value={mecanico.id}>
                        {mecanico.nombre}
                    </option>
                ))}
            </select>
        </div>

        {/* BOTONES */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => navigate('/recepcion')} style={{ flex: 1, padding: '15px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: '15px', backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {esNuevoCliente ? "REGISTRAR Y CREAR" : "CREAR ORDEN"}
            </button>
        </div>

      </form>
    </div>
  )
}

export default NuevaOrden