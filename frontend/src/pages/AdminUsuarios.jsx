import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function AdminUsuarios() {
  const navigate = useNavigate()
  const 'https://api-taller-luis.onrender.com' = ''https://api-taller-luis.onrender.com'' // Constante para la URL

  const [usuarios, setUsuarios] = useState([])
  
  // Estado para saber si estamos editando (si es null, estamos creando)
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null)

  // --- FORMULARIO ---
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
        const res = await axios.get(`${'https://api-taller-luis.onrender.com'}/usuarios/`)
        setUsuarios(res.data)
    } catch (error) { console.error(error) }
  }

  // --- LÓGICA DE FORMULARIO ---
  const cambiarRol = (e) => {
    const rolSeleccionado = e.target.value
    setNuevoUsuario({ ...nuevoUsuario, rol: rolSeleccionado })
    // Solo aplicamos preset si NO estamos editando para no borrar permisos personalizados
    if (!usuarioEnEdicion) {
        aplicarPreset(rolSeleccionado)
    }
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

  // --- CRUD: CREAR O EDITAR ---
  const manejarSubmit = async (e) => {
    e.preventDefault()
    
    // VALIDACIÓN BÁSICA
    if(!nuevoUsuario.nombre || !nuevoUsuario.username) return alert("Faltan datos")
    
    // Si es nuevo, requerimos contraseña. Si es edición, no.
    if(!usuarioEnEdicion && !nuevoUsuario.password) return alert("Falta la contraseña")

    try {
        const token = localStorage.getItem('token')
        const config = { headers: { Authorization: `Bearer ${token}` }}

        if (usuarioEnEdicion) {
            // --- MODO EDICIÓN (PUT) ---
            await axios.put(`${'https://api-taller-luis.onrender.com'}/usuarios/${usuarioEnEdicion}`, {
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol,
                permisos: nuevoUsuario.permisos // El backend espera lista de strings
            }, config)
            alert("✅ Usuario actualizado")
        } else {
            // --- MODO CREACIÓN (POST) ---
            await axios.post(`${'https://api-taller-luis.onrender.com'}/usuarios/`, nuevoUsuario, config)
            alert("✅ Usuario creado exitosamente")
        }

        cargarUsuarios()
        limpiarFormulario()

    } catch (error) {
        alert("Error: " + (error.response?.data?.detail || "Ocurrió un error"))
    }
  }

  // --- PREPARAR EDICIÓN ---
  const cargarDatosEdicion = (usuario) => {
      setUsuarioEnEdicion(usuario.id)
      // Convertimos el string de permisos "a,b,c" a array ["a","b","c"]
      const arrayPermisos = usuario.permisos ? usuario.permisos.split(',') : []
      
      setNuevoUsuario({
          nombre: usuario.nombre,
          username: usuario.username, // El username no se suele editar por seguridad, pero lo mostramos
          email: usuario.email || "",
          rol: usuario.rol,
          password: "", // La contraseña no se edita aquí
          permisos: arrayPermisos
      })
  }

  const limpiarFormulario = () => {
      setUsuarioEnEdicion(null)
      setNuevoUsuario({ 
          nombre: "", username: "", password: "", email: "", rol: "mecanico", permisos: [] 
      })
      aplicarPreset("mecanico")
  }

  // --- ELIMINAR ---
  const eliminarUsuario = async (id) => {
      if(!window.confirm("¿Seguro que quieres eliminar a este usuario?")) return

      try {
        const token = localStorage.getItem('token')
        await axios.delete(`${'https://api-taller-luis.onrender.com'}/usuarios/${id}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        })
        alert("🗑️ Usuario eliminado")
        cargarUsuarios()
      } catch (error) {
          alert("Error al eliminar")
      }
  }

  // --- RESET PASSWORD ---
  const resetearPassword = async (id) => {
      const nuevaPass = prompt("Ingresa la NUEVA contraseña para este usuario:")
      if (!nuevaPass) return 

      try {
        const token = localStorage.getItem('token')
        await axios.put(`${'https://api-taller-luis.onrender.com'}/usuarios/${id}/reset-password?nueva_pass=${nuevaPass}`, {}, { 
            headers: { Authorization: `Bearer ${token}` } 
        })
        alert("🔑 Contraseña actualizada correctamente")
      } catch (error) {
        alert("Error al cambiar contraseña")
      }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/config')} style={{marginBottom: '10px', padding:'5px 10px', cursor:'pointer'}}>← Volver</button>
      <h1 style={{ color: '#1a237e' }}>👥 Gestión de Personal (RH)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div style={{ backgroundColor: usuarioEnEdicion ? '#e3f2fd' : '#f5f5f5', padding: '20px', borderRadius: '10px', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0, color: usuarioEnEdicion ? '#1565c0' : 'black' }}>
                {usuarioEnEdicion ? '✏️ Editando Empleado' : '+ Nuevo Empleado'}
            </h3>
            
            <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{fontSize:'12px', fontWeight:'bold'}}>Nombre Completo</label>
                <input type="text" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} style={{ padding: '8px' }} required />
                
                <label style={{fontSize:'12px', fontWeight:'bold'}}>Usuario (Login)</label>
                {/* El username es readOnly si estamos editando para evitar problemas */}
                <input type="text" value={nuevoUsuario.username} readOnly={!!usuarioEnEdicion} onChange={e => setNuevoUsuario({...nuevoUsuario, username: e.target.value})} style={{ padding: '8px', backgroundColor: usuarioEnEdicion ? '#e0e0e0' : 'white' }} required />
                
                <label style={{fontSize:'12px', fontWeight:'bold'}}>Email</label>
                <input type="email" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} style={{ padding: '8px' }} />

                {/* SOLO MOSTRAMOS PASSWORD SI ES NUEVO */}
                {!usuarioEnEdicion && (
                    <>
                        <label style={{fontSize:'12px', fontWeight:'bold'}}>Contraseña Inicial</label>
                        <input type="password" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} style={{ padding: '8px' }} required />
                    </>
                )}

                <label style={{ fontWeight: 'bold', marginTop: '10px' }}>Rol Principal:</label>
                <select value={nuevoUsuario.rol} onChange={cambiarRol} style={{ padding: '10px' }}>
                    <option value="mecanico">👨‍🔧 Mecánico</option>
                    <option value="caja">💰 Caja / Recepción</option>
                    <option value="admin">🚀 Administrador</option>
                </select>

                <label style={{ fontWeight: 'bold', marginTop: '10px' }}>Permisos Específicos:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', maxHeight:'200px', overflowY:'auto' }}>
                    {listaPermisos.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', fontSize: '13px', cursor: 'pointer' }}>
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

                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: usuarioEnEdicion ? '#1565c0' : '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {usuarioEnEdicion ? '💾 ACTUALIZAR' : '✅ CONTRATAR'}
                    </button>
                    
                    {usuarioEnEdicion && (
                        <button type="button" onClick={limpiarFormulario} style={{ padding: '12px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div>
            <h3>Personal Activo</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ backgroundColor: '#263238', color:'white', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Nombre</th>
                        <th style={{ padding: '10px' }}>Rol / Usuario</th>
                        <th style={{ padding: '10px', textAlign:'center' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee', backgroundColor: 'white' }}>
                            <td style={{ padding: '10px' }}>
                                <strong>{u.nombre}</strong><br/>
                                <span style={{fontSize:'11px', color:'#666'}}>{u.email}</span>
                            </td>
                            <td style={{ padding: '10px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: u.rol === 'admin' ? '#e1bee7' : (u.rol === 'caja' ? '#fff9c4' : '#e0f7fa'), fontSize: '11px', fontWeight:'bold', border: '1px solid #ccc' }}>
                                    {u.rol.toUpperCase()}
                                </span>
                                <div style={{fontSize:'12px', marginTop:'4px'}}>@{u.username}</div>
                            </td>
                            <td style={{ padding: '10px', textAlign:'center' }}>
                                <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                    <button 
                                        onClick={() => cargarDatosEdicion(u)}
                                        title="Editar Datos"
                                        style={{ border:'1px solid #1976d2', background:'white', cursor:'pointer', borderRadius:'4px', padding:'5px' }}
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => resetearPassword(u.id)}
                                        title="Cambiar Contraseña"
                                        style={{ border:'1px solid #ffa000', background:'white', cursor:'pointer', borderRadius:'4px', padding:'5px' }}
                                    >
                                        🔑
                                    </button>
                                    <button 
                                        onClick={() => eliminarUsuario(u.id)}
                                        title="Eliminar Usuario"
                                        style={{ border:'1px solid #d32f2f', background:'white', cursor:'pointer', borderRadius:'4px', padding:'5px' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
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