import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const LayoutPrincipal = ({ children }) => {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    // Fondo Stone 100 (#f5f5f4)
    <div className="flex min-h-screen bg-[#f5f5f4] font-sans text-slate-800">
      
      {/* 1. MENÚ LATERAL (Le pasamos el control de abrir/cerrar) */}
      <Sidebar 
        isOpen={menuAbierto} 
        closeMenu={() => setMenuAbierto(false)} 
      />

      {/* 2. OVERLAY OSCURO (Sombra negra cuando abres el menú en celular) */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* 3. CONTENIDO PRINCIPAL */}
      {/* En PC (md) dejamos margen izquierdo (ml-64). En Celular NO (ml-0) */}
      <main className="flex-1 md:ml-64 transition-all duration-300 w-full">
        
        {/* BARRA SUPERIOR MÓVIL (Solo visible en celular) */}
        <div className="md:hidden bg-[#8C2B32] text-white p-4 flex items-center justify-between shadow-md mb-4 sticky top-0 z-30">
            <h1 className="font-black text-lg tracking-wide">TALLER APP</h1>
            <button 
                onClick={() => setMenuAbierto(true)}
                className="text-2xl focus:outline-none"
            >
                ☰
            </button>
        </div>

        {/* CONTENIDO REAL */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
        </div>

      </main>

    </div>
  )
}

export default LayoutPrincipal