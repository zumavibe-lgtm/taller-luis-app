import { Link, useLocation } from 'react-router-dom'

const Sidebar = ({ isOpen, closeMenu }) => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/', nombre: 'Dashboard', icono: '📊' },
    { path: '/recepcion', nombre: 'Recepción', icono: '📋' },
    { path: '/taller', nombre: 'Taller', icono: '🛠️' },
    { path: '/caja', nombre: 'Caja', icono: '💰' },
    { path: '/cierres', nombre: 'Cierres', icono: '🔒' },
    { path: '/reportes', nombre: 'Reportes', icono: '📈' },
    { path: '/catalogos', nombre: 'Catálogos', icono: '📚' },
    { path: '/config', nombre: 'Configuración', icono: '⚙️' },
    { path: '/usuarios', nombre: 'Usuarios', icono: '👥' },
  ]

  return (
    <>
      {/* LÓGICA RESPONSIVA CSS:
         - fixed: Siempre fijo.
         - md:translate-x-0: En PC siempre visible.
         - -translate-x-full: En celular escondido a la izquierda por defecto.
         - ${isOpen ? 'translate-x-0' : ...}: Si damos click, se muestra en celular.
      */}
      <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#8C2B32] text-white flex flex-col shadow-2xl border-r border-[#7a252b]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
      `}>
        
        {/* LOGO / HEADER */}
        <div className="p-6 flex items-center justify-between border-b border-[#a33d45]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl font-black text-[#8C2B32] shadow-lg">
              T
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wide text-white">TALLER APP</h1>
              <div className="flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-[#556b2f] rounded-full animate-pulse"></span>
                 <p className="text-[10px] text-red-100 font-bold tracking-widest uppercase opacity-80">Premium v2.0</p>
              </div>
            </div>
          </div>

          {/* BOTÓN CERRAR (Solo visible en celular) */}
          <button 
            onClick={closeMenu} 
            className="md:hidden text-red-200 hover:text-white text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* LISTA DE MENÚ */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-4 custom-scrollbar">
          {menuItems.map((item) => {
            const activo = location.pathname === item.path
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => {
                    // Si estamos en celular, cerramos el menú al dar clic en una opción
                    if(window.innerWidth < 768) closeMenu() 
                }}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative ${
                  activo 
                    ? 'bg-white text-[#8C2B32] shadow-lg translate-x-1' 
                    : 'text-red-100 hover:bg-[#7a252b] hover:text-white'
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${activo ? 'text-[#8C2B32]' : 'text-red-200 group-hover:text-white'}`}>
                  {item.icono}
                </span>
                
                <span className={`font-bold text-sm tracking-wide ${activo ? 'font-black' : 'font-medium'}`}>
                  {item.nombre}
                </span>

                {activo && (
                    <span className="ml-auto text-xs font-bold text-[#556b2f]">●</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER (Usuario) */}
        <div className="p-4 border-t border-[#a33d45] bg-[#7a252b]/30">
          <div className="bg-[#7a252b] border border-[#8C2B32] rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-[#6b2025] transition group shadow-inner">
              <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-black text-[#8C2B32] border-2 border-red-100">
                      AD
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#556b2f] border-2 border-[#7a252b] rounded-full"></div>
              </div>
              
              <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white group-hover:underline decoration-white">Administrador</p>
                  <p className="text-[10px] text-red-200 opacity-80">Sesión Activa</p>
              </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar