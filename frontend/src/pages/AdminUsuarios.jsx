import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminUsuarios() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  
  // Estado para saber si estamos editando (null = creando, ID = editando)
  const [idEdicion, setIdEdicion] = useState(null)

  // --- FORMULARIO (SIRVE PARA NUEVO Y EDITAR) ---
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    username: "",
    password: "",
    email: "", 
    rol: "mecanico",
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

  // --- PRESETS ---
  const presets = {
    admin: ['ver_taller', 'ver_recepcion', 'ver_caja', 'ver_config', 'admin_usuarios'],
    mecanico: ['ver_taller'],
    caja: ['ver_recepcion', 'ver_caja']
  }

  useEffect(() => {
    cargarUsuarios()
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
    const permisosDelRol = presets[rol] || []
    setNuevoUsuario(prev => ({ ...prev, rol: rol, permisos: permisosDelRol }))
  }

  const togglePermiso = (permisoId) => {
    const { permisos } = nuevoUsuario
    if (permisos.includes(permisoId)) {
        setNuevoUsuario({ ...nuevoUsuario, permisos: permisos.filter(p => p !== permisoId) })
    } else {
        setNuevoUsuario({ ...nuevoUsuario, permisos: [...permisos, permisoId] })
    }
  }

  // --- PREPARAR EDICIÓN ---
  const iniciarEdicion = (usuario) => {
    setIdEdicion(usuario.id)
    setNuevoUsuario({
        nombre: usuario.nombre || "",
        username: usuario.username,
        password: "", // Dejamos vacía por seguridad
        email: usuario.email || "",
        rol: usuario.rol,
        permisos: usuario.permisos || [] // Si el backend devuelve permisos string, habría que parsear
    })
  }

  const cancelarEdicion = () => {
    setIdEdicion(null)
    setNuevoUsuario({ nombre: "", username: "", password: "", email: "", rol: "mecanico", permisos: [] })
    aplicarPreset("mecanico")
  }

  // --- GUARDAR (CREAR O EDITAR) ---
  const guardarUsuario = async (e) => {
    e.preventDefault()
    
    // Validaciones básicas
    if(!nuevoUsuario.username) return alert("El usuario es obligatorio")
    if(!idEdicion && !nuevoUsuario.password) return alert("La contraseña es obligatoria para nuevos usuarios")

    try {
        if (idEdicion) {
            // MODO EDICIÓN (PUT)
            const datosParaEnviar = { ...nuevoUsuario }
            // Si la contraseña está vacía, la quitamos para que no se sobrescriba con vacío
            if (!datosParaEnviar.password) delete datosParaEnviar.password

            await axios.put(`https://api-taller-luis.onrender.com/usuarios/${idEdicion}`, datosParaEnviar)
            alert("✅ Usuario actualizado correctamente")
        } else {
            // MODO CREACIÓN (POST)
            await axios.post('https://api-taller-luis.onrender.com/usuarios/', nuevoUsuario)
            alert("✅ Usuario creado exitosamente")
        }
        
        cargarUsuarios()
        cancelarEdicion()

    } catch (error) {
        alert("Error: " + (error.response?.data?.detail || "Ocurrió un error al guardar"))
    }
  }

  const borrarUsuario = async (id) => {
    if(!confirm("¿Estás seguro de ELIMINAR a este usuario? Esta acción no se puede deshacer.")) return
    try {
        await axios.delete(`https://api-taller-luis.onrender.com/usuarios/${id}`)
        cargarUsuarios()
    } catch (error) {
        alert("Error al eliminar usuario")
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/config')} style={{marginBottom: '10px'}}>← Volver a Config</button>
      <h1 style={{ color: '#1a237e' }}>👥 Gestión de Personal (RH)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ 
            backgroundColor: idEdicion ? '#e3f2fd' : '#f5f5f5', 
            padding: '20px', 
            borderRadius: '10px',
            border: idEdicion ? '2px solid #2196f3' : '1px solid #eee'
        }}>
            <h3 style={{ marginTop: 0 }}>{idEdicion ? "✏️ Editando Empleado" : "+ Nuevo Empleado"}</h3>
            
            <form onSubmit={guardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Nombre Completo" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} style={{ padding: '10px' }} required />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Usuario (Login)" value={nuevoUsuario.username} onChange={e => setNuevoUsuario({...nuevoUsuario, username: e.target.value})} style={{ padding: '10px', flex: 1 }} required />
                    <input type="email" placeholder="Email (Opcional)" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} style={{ padding: '10px', flex: 1 }} />
                </div>

                <input type="text" placeholder={idEdicion ? "Nueva Contraseña (Opcional)" : "Contraseña Inicial"} value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} style={{ padding: '10px' }} />

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

                <button type="submit" style={{ padding: '15px', backgroundColor: idEdicion ? '#ff9800' : '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    {idEdicion ? "GUARDAR CAMBIOS" : "CONTRATAR / CREAR"}
                </button>
                
                {idEdicion && (
                    <button type="button" onClick={cancelarEdicion} style={{ padding: '10px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        CANCELAR EDICIÓN
                    </button>
                )}
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
                        <th style={{ padding: '8px', textAlign:'center' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>
                                <div>{u.nombre}</div>
                                <small style={{color:'#666'}}>{u.username}</small>
                            </td>
                            <td style={{ padding: '8px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '10px', backgroundColor: u.rol === 'admin' ? '#e1bee7' : (u.rol === 'caja' ? '#fff9c4' : '#e0f7fa'), fontSize: '12px' }}>
                                    {u.rol.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '8px', textAlign:'center' }}>
                                <button onClick={() => iniciarEdicion(u)} style={{ marginRight: '10px', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '18px' }}>✏️</button>
                                <button onClick={() => borrarUsuario(u.id)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '18px' }}>🗑️</button>
                            </td>
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