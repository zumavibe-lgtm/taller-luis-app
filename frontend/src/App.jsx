import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'

// --- LAYOUT PRINCIPAL ---
import LayoutPrincipal from './layouts/LayoutPrincipal'

// --- PÁGINAS ---
import Dashboard from './pages/Dashboard'
import Recepcion from './pages/Recepcion'
import NuevaOrden from './pages/NuevaOrden'
import Diagnostico from './pages/Diagnostico'
import Caja from './pages/Caja' 
import CajaOrden from './pages/CajaOrden' 
import Reportes from './pages/Reportes' 
import Cierres from './pages/Cierres'
import Catalogos from './pages/Catalogos'
import Configuracion from './pages/Configuracion' 
import AdminUsuarios from './pages/AdminUsuarios'
import Login from './pages/Login'

// 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE: Importamos la pantalla real
import Taller from './pages/Taller' 

// Componentes extra
import FormularioInspeccion from './components/FormularioInspeccion'

function App() {
  // Estado para el Modal de Inspección (Checklist rápido)
  const [mostrarInspeccion, setMostrarInspeccion] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)

  // Función para abrir el modal desde el Dashboard
  const abrirInspeccion = (id) => {
    setOrdenSeleccionada(id)
    setMostrarInspeccion(true)
  }

  return (
    <div>
      <Routes>
        
        {/* RUTA LOGIN (Sin menú lateral) */}
        <Route path="/login" element={<Login />} />
        
        {/* --- RUTAS DEL SISTEMA (Con menú lateral) --- */}
        
        {/* 1. DASHBOARD */}
        <Route path="/" element={
          <LayoutPrincipal>
            <Dashboard abrirInspeccion={abrirInspeccion} />
          </LayoutPrincipal>
        } />
        
        {/* 2. RECEPCIÓN */}
        <Route path="/recepcion" element={
          <LayoutPrincipal>
            <Recepcion />
          </LayoutPrincipal>
        } />
        <Route path="/nueva-orden" element={
          <LayoutPrincipal>
            <NuevaOrden />
          </LayoutPrincipal>
        } />

        {/* 3. TALLER Y DIAGNÓSTICO */}
        {/* 👇 AQUÍ CORREGIMOS: Ya no muestra texto, muestra el Tablero Kanban */}
        <Route path="/taller" element={
          <LayoutPrincipal>
            <Taller />
          </LayoutPrincipal>
        } />

        <Route path="/diagnostico/:id" element={
          <LayoutPrincipal>
            <Diagnostico />
          </LayoutPrincipal>
        } />

        {/* 4. CAJA */}
        <Route path="/caja" element={
          <LayoutPrincipal>
            <Caja /> 
          </LayoutPrincipal>
        } />
        <Route path="/caja/:id" element={
          <LayoutPrincipal>
            <CajaOrden />
          </LayoutPrincipal>
        } />

        {/* 5. REPORTES Y CIERRES */}
        <Route path="/reportes" element={
          <LayoutPrincipal>
            <Reportes />
          </LayoutPrincipal>
        } />
        <Route path="/cierres" element={
          <LayoutPrincipal>
            <Cierres />
          </LayoutPrincipal>
        } />

        {/* 6. CATÁLOGOS Y CONFIGURACIÓN */}
        <Route path="/catalogos" element={
          <LayoutPrincipal>
            <Catalogos />
          </LayoutPrincipal>
        } />
        <Route path="/config" element={
          <LayoutPrincipal>
            <Configuracion />
          </LayoutPrincipal>
        } />

        {/* 7. USUARIOS */}
        <Route path="/admin-usuarios" element={
          <LayoutPrincipal>
            <AdminUsuarios />
          </LayoutPrincipal>
        } />
        <Route path="/usuarios" element={
          <LayoutPrincipal>
            <AdminUsuarios />
          </LayoutPrincipal>
        } />

      </Routes>

      {/* --- MODAL FLOTANTE DE INSPECCIÓN --- */}
      {mostrarInspeccion && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl">
            <FormularioInspeccion 
              ordenId={ordenSeleccionada} 
              alTerminar={() => setMostrarInspeccion(false)} 
            />
            <button 
              onClick={() => setMostrarInspeccion(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 text-xl font-bold bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-600"
            >
              CERRAR X
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App