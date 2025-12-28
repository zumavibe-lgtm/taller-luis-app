import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import OrdenCard from '../components/OrdenCard'

function Dashboard() {
  const [ordenes, setOrdenes] = useState([])
  
  // Bases de datos auxiliares (Catalogos)
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])

  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate() 

  // --- 🔒 SEGURIDAD ---
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) navigate('/login')
  }, [])
  // -------------------

  useEffect(() => {
    cargarTodo()
  }, [])

  const cargarTodo = async () => {
    try {
      setCargando(true)
      
      // Hacemos 4 peticiones al mismo tiempo para tener toda la info
      // URLS LIMPIAS Y CORRECTAS
      const peticiones = [
          axios.get('https://api-taller-luis.onrender.com/ordenes/'),
          axios.get('https://api-taller-luis.onrender.com/vehiculos/'),
          axios.get('https://api-taller-luis.onrender.com/clientes/'),
          axios.get('https://api-taller-luis.onrender.com/usuarios/')
      ]

      // Esperamos a que lleguen todas
      const [resOrdenes, resVehiculos, resClientes, resUsuarios] = await Promise.all(peticiones)

      // Guardamos en la memoria
      setOrdenes(resOrdenes.data)
      setVehiculos(resVehiculos.data)
      setClientes(resClientes.data)
      setUsuarios(resUsuarios.data)

    } catch (error) {
      console.error("Error cargando el tablero", error)
    } finally {
      setCargando(false)
    }
  }

  const irAlDiagnostico = (id) => {
    navigate(`/diagnostico/${id}`)
  }

  // --- 🧹 FILTRO MÁGICO ---
  // El mecánico NO quiere ver carros terminados, solo los pendientes.
  // Filtramos las ordenes que NO sean 'terminado' ni 'entregado'.
  const ordenesActivas = ordenes.filter(o => o.estado !== 'terminado' && o.estado !== 'entregado')

  // --- FUNCIONES DE BÚSQUEDA (CRUCE DE DATOS) ---
  const encontrarVehiculo = (id) => vehiculos.find(v => v.id === id)
  const encontrarCliente = (id) => clientes.find(c => c.id === id)
  const encontrarMecanico = (id) => {
      if (!id) return null
      const user = usuarios.find(u => u.id === id)
      return user ? user.username : null
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ color: '#1a237e', margin: 0 }}>🔧 Tablero de Taller</h1>
        <p style={{ color: '#666', marginTop: '5px' }}>
            Autos pendientes de reparación: <strong>{ordenesActivas.length}</strong>
        </p>
      </header>

      {cargando ? <p style={{textAlign:'center'}}>Cargando tablero...</p> : (
        <div>
          {ordenesActivas.map(orden => {
            // Preparamos los datos completos para la tarjeta
            const vehiculo = encontrarVehiculo(orden.vehiculo_id)
            const cliente = encontrarCliente(orden.cliente_id)
            const nombreMecanico = encontrarMecanico(orden.mecanico_asignado)

            return (
                <OrdenCard 
                  key={orden.id} 
                  orden={orden} 
                  datosVehiculo={vehiculo}
                  datosCliente={cliente}
                  nombreMecanico={nombreMecanico}
                  alClickear={irAlDiagnostico} 
                />
            )
          })}
          
          {ordenesActivas.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
                <h3>🎉 ¡Todo Limpio!</h3>
                <p>No tienes autos pendientes en el taller.</p>
                <p style={{fontSize: '12px'}}>Los autos terminados los ve Recepción.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard