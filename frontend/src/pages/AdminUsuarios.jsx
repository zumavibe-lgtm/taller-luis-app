import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminUsuarios() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  
  // --- FORMULARIO NUEVO USUARIO ---
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    username: "",
    password: "",
    email: "", // Agregamos el email
    rol: "mecanico", // Default
    permisos: []
  })

  // --- DEFINICIÓN DE PERMISOS POSIBLES ---
  const listaPermisos = [
    { id: 'ver_taller', label: '🔧 Ver Taller (Mecánico)' },
    { id: 'ver_recepcion', label: '🖥️ Ver Recepción' },
    { id: 'ver_caja', label: '💰 Usar Caja / Cobrar' },
    { id: 'ver_config', label: '⚙️ Configuración' },
    { id: 'admin_usuarios', label: '👥 Administrar Usuarios' }
  ]

  // --- PRESETS (LO QUE SE MARCA SOLO AL ELEGIR ROL) ---
  const presets = {
    admin: ['ver_taller', 'ver_recepcion', 'ver_caja', 'ver_config', 'admin_usuarios'],
    mecanico: ['ver_taller'],
    caja: ['ver_recepcion', 'ver_caja']
  }

  useEffect(() => {
    cargarUsuarios()
    // Al cargar, aplicamos los permisos del rol default (mecanico)
    aplicarPreset('mecanico')
  }, [])

  const cargarUsuarios = async () => {
    try {
        const res = await axios.get('https://api-taller-luis.onrender.com/usuarios/')
        setUsuarios(res.data)
    } catch (error) { console.error(error) }
  }

  // --- LÓGICA DE ROLES Y PERMISOS ---
  const cambiarRol = (e) => {
    const rolSeleccionado = e.target.value
    setNuevoUsuario({ ...nuevoUsuario, rol: rolSeleccionado })
    aplicarPreset(rolSeleccionado)
  }

  const aplicarPreset = (rol) => {
    // Sobrescribe los permisos con los del preset
    const permisosDelRol = presets[rol] || []
    setNuevoUsuario(prev => ({ ...prev, rol: rol, permisos: permisosDelRol }))
  }

  const togglePermiso = (permisoId) => {
    const { permisos } = nuevoUsuario
    if (permisos.includes(permisoId)) {
        // Si ya está, lo quitamos
        setNuevoUsuario({ ...nuevoUsuario, permisos: permisos.filter(p => p !== permisoId) })
    } else {
        // Si no está, lo agregamos
        setNuevoUsuario({ ...nuevoUsuario, permisos: [...permisos, permisoId] })
    }
  }

  // --- GUARDAR ---
  const crearUsuario = async (e) => {
    e.preventDefault()
    if(!nuevoUsuario.nombre || !nuevoUsuario.username || !nuevoUsuario.password) return alert("Faltan datos")

    try {
        await axios.post('https://api-taller-luis.onrender.com/usuarios/', nuevoUsuario)
        alert("✅ Usuario creado exitosamente")
        cargarUsuarios()
        // Resetear form
        setNuevoUsuario({ 
            nombre: "", username: "", password: "", email: "", rol: "mecanico", permisos: [] 
        })
        aplicarPreset("mecanico")
    } catch (error) {
        alert("Error: " + (error.response?.data?.detail || "No se pudo crear"))
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/config')} style={{marginBottom: '10px'}}>← Volver</button>
      <h1 style={{ color: '#1a237e' }}>👥 Gestión de Personal (RH)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ marginTop: 0 }}>+ Nuevo Empleado</h3>
            <form onSubmit={crearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Nombre Completo" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} style={{ padding: '10px' }} required />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Usuario (Login)" value={nuevoUsuario.username} onChange={e => setNuevoUsuario({...nuevoUsuario, username: e.target.value})} style={{ padding: '10px', flex: 1 }} required />
                    <input type="email" placeholder="Email (Opcional)" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} style={{ padding: '10px', flex: 1 }} />
                </div>

                <input type="password" placeholder="Contraseña Inicial" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} style={{ padding: '10px' }} required />

                <label style={{ fontWeight: 'bold', marginTop: '10px' }}>Rol Principal:</label>
                <select value={nuevoUsuario.rol} onChange={cambiarRol} style={{ padding: '10px' }}>
                    <option value="mecanico">👨‍🔧 Mecánico</option>
                    <option value="caja">💰 Caja / Recepción</option>
                    <option value="admin">🚀 Administrador</option>
                </select>

                <label style={{ fontWeight: 'bold', marginTop: '10px' }}>Permisos Específicos:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', backgroundColor: 'white', padding: '10px', borderRadius: '5px' }}>
                    {listaPermisos.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={nuevoUsuario.permisos.includes(p.id)}
                                onChange={() => togglePermiso(p.id)}
                                style={{ marginRight: '5px' }}
                            />
                            {p.label}
                        </label>
                    ))}
                </div>

                <button type="submit" style={{ padding: '15px', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    CONTRATAR / CREAR
                </button>
            </form>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div>
            <h3>Personal Activo</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#ddd', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Nombre</th>
                        <th style={{ padding: '8px' }}>Rol</th>
                        <th style={{ padding: '8px' }}>Usuario</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{u.nombre}</td>
                            <td style={{ padding: '8px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '10px', backgroundColor: u.rol === 'admin' ? '#e1bee7' : (u.rol === 'caja' ? '#fff9c4' : '#e0f7fa'), fontSize: '12px' }}>
                                    {u.rol.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '8px', color: '#666' }}>{u.username}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  )
}

export default AdminUsuarios