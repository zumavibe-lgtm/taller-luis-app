import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Diagnostico from './pages/Diagnostico'
import Recepcion from './pages/Recepcion'
import NuevaOrden from './pages/NuevaOrden'
import Configuracion from './pages/Configuracion'
import CajaOrden from './pages/CajaOrden'
import Login from './pages/Login'
import AdminUsuarios from './pages/AdminUsuarios' // <--- IMPORT NUEVO

function App() {
  const location = useLocation()
  const esLogin = location.pathname === "/login"

  return (
    <div>
      {!esLogin && <Navbar />}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Dashboard />} />
        <Route path="/diagnostico/:id" element={<Diagnostico />} />
        <Route path="/recepcion" element={<Recepcion />} />
        <Route path="/nueva-orden" element={<NuevaOrden />} />
        <Route path="/config" element={<Configuracion />} />
        <Route path="/caja/:id" element={<CajaOrden />} />
        
        {/* RUTA NUEVA */}
        <Route path="/admin-usuarios" element={<AdminUsuarios />} />
      </Routes>
    </div>
  )
}

export default App