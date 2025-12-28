import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  
  // Leemos quién está conectado
  const rolUsuario = localStorage.getItem("rol") // 'admin', 'mecanico', etc.
  const usuarioNombre = localStorage.getItem("usuario")

  const cerrarSesion = () => {
    localStorage.clear() // Borramos token
    navigate('/login')
  }

  return (
    <nav style={{ 
      backgroundColor: '#1a237e', 
      color: 'white', 
      marginBottom: '20px', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column' // <--- ESTO HACE QUE SEAN DOS FILAS
    }}>
      
      {/* --- FILA 1: TÍTULO Y SALUDO --- */}
      <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', // Una línea divisoria sutil
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
      }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
          🚀 Taller Luis <span style={{fontSize:'14px', fontWeight:'normal', color:'#bbdefb', marginLeft: '10px'}}>| Hola, {usuarioNombre}</span>
        </div>
      </div>
      
      {/* --- FILA 2: BOTONES DE NAVEGACIÓN --- */}
      <div style={{ 
          padding: '10px 20px', 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'center',
          flexWrap: 'wrap', // Si son muchos botones, bajan de línea en celular
          backgroundColor: '#151b60' // Un azul un pelito más oscuro para diferenciar
      }}>
        
        {/* BOTONES PÚBLICOS */}
        <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', borderRadius: '4px', border: '1px solid transparent', transition: '0.3s' }}>
            👨‍🔧 Taller
        </Link>
        
        <Link to="/recepcion" style={{ color: '#ffeb3b', textDecoration: 'none', fontWeight: 'bold', padding: '5px 10px' }}>
            🖥️ Recepción
        </Link>

        {/* SOLO ADMIN VE ESTOS BOTONES */}
        {rolUsuario === 'admin' && (
            <>
                <Link to="/config" style={{ color: '#b3e5fc', textDecoration: 'none', padding: '5px 10px' }}>
                    ⚙️ Config
                </Link>
                <Link to="/admin-usuarios" style={{ color: '#e1bee7', textDecoration: 'none', fontWeight: 'bold', padding: '5px 10px' }}>
                    👥 Usuarios
                </Link>
            </>
        )}

        {/* EMPUJAMOS EL BOTÓN DE SALIR A LA DERECHA */}
        <div style={{ marginLeft: 'auto' }}>
            <button 
                onClick={cerrarSesion}
                style={{ 
                    backgroundColor: 'transparent', border: '1px solid #ef5350', 
                    color: '#ef5350', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '12px'
                }}
            >
                Cerrar Sesión
            </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar