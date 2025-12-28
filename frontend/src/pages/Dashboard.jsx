import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom' // Importamos el navegador
import OrdenCard from '../components/OrdenCard'

function Dashboard() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate() // Hook para cambiar de pantalla

  // --- 🔒 SEGURIDAD: VERIFICAR SI HAY GAFETE (TOKEN) ---
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
        // Si no hay token, lo mandamos a la pantalla de Login
        navigate('/login')
    }
  }, [])
  // ----------------------------------------------------

  useEffect(() => {
    cargarOrdenes()
  }, [])

  const cargarOrdenes = async () => {
    try {
      const res = await axios.get('https://api-taller-luis.onrender.com/ordenes/')
      setOrdenes(res.data)
    } catch (error) {
      console.error("Error cargando órdenes", error)
    } finally {
      setCargando(false)
    }
  }

  // Función modificada: Ahora NAVEGA a la otra pantalla
  const irAlDiagnostico = (id) => {
    navigate(`/diagnostico/${id}`)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#1a237e', margin: 0 }}>Mis Órdenes</h1>
        <p style={{ color: '#555' }}>Tablero del Mecánico</p>
      </header>

      {cargando ? <p>Cargando...</p> : (
        <div>
          {ordenes.map(orden => (
            <OrdenCard 
              key={orden.id} 
              orden={orden} 
              alClickear={irAlDiagnostico} 
            />
          ))}
          
          {ordenes.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                No hay órdenes asignadas o pendientes.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard