import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const navigate = useNavigate()
  const [credenciales, setCredenciales] = useState({ username: "", password: "" })
  const [error, setError] = useState("")

  const manejarLogin = async (e) => {
    e.preventDefault()
    setError("")

    // FastAPI espera los datos en formato "Form Data", no JSON normal
    const formData = new FormData()
    formData.append("username", credenciales.username)
    formData.append("password", credenciales.password)

    try {
      const res = await axios.post('http://127.0.0.1:8000/token', formData)
      
      // Guardamos el token (el gafete) en la memoria del navegador
      localStorage.setItem("token", res.data.access_token)
      localStorage.setItem("usuario", res.data.username)
      localStorage.setItem("rol", res.data.rol)
      localStorage.setItem("permisos", res.data.permisos)

      // Redirigir según el rol
      if (res.data.rol === "admin") navigate('/config')
      else if (res.data.rol === "mecanico") navigate('/')
      else navigate('/recepcion')

    } catch (err) {
      setError("Usuario o contraseña incorrectos")
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#eceff1' }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '300px', textAlign: 'center' }}>
        <h2 style={{ color: '#1a237e', marginBottom: '20px' }}>🔐 Taller Luis</h2>
        
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
                type="text" placeholder="Usuario (ej: admin)" 
                value={credenciales.username}
                onChange={e => setCredenciales({...credenciales, username: e.target.value})}
                style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <input 
                type="password" placeholder="Contraseña" 
                value={credenciales.password}
                onChange={e => setCredenciales({...credenciales, password: e.target.value})}
                style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '12px', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                INICIAR SESIÓN
            </button>
        </form>
      </div>
    </div>
  )
}

export default Login