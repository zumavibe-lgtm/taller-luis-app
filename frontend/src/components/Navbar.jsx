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
      backgroundColor: '#1a237e', padding: '15px 20px', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      color: 'white', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        🚀 Taller Luis <span style={{fontSize:'12px', fontWeight:'normal', color:'#bbdefb'}}>| Hola, {usuarioNombre}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        
        {/* BOTONES PÚBLICOS (Depende de permisos, pero simplificado por rol) */}
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>👨‍🔧 Taller</Link>
        
        <Link to="/recepcion" style={{ color: '#ffeb3b', textDecoration: 'none', fontWeight: 'bold' }}>🖥️ Recepción</Link>

        {/* SOLO ADMIN VE ESTOS BOTONES */}
        {rolUsuario === 'admin' && (
            <>
                <Link to="/config" style={{ color: '#b3e5fc', textDecoration: 'none' }}>⚙️ Config</Link>
                <Link to="/admin-usuarios" style={{ color: '#e1bee7', textDecoration: 'none', fontWeight: 'bold' }}>👥 Usuarios</Link>
            </>
        )}

        <button 
            onClick={cerrarSesion}
            style={{ 
                backgroundColor: 'transparent', border: '1px solid #ef5350', 
                color: '#ef5350', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' 
            }}
        >
            Salir
        </button>

      </div>
    </nav>
  )
}

export default Navbar