import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
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
    // 🎨 FONDO BLANCO LIMPIO (Unified Look)
    <div className="h-screen w-64 bg-white flex flex-col shadow-xl fixed left-0 top-0 border-r border-slate-200 z-50">
      
      {/* LOGO / TÍTULO */}
      <div className="p-6 flex items-center gap-3">
        {/* ÍCONO ROJO (El toque de color) */}
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-red-200">
          T
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wide text-slate-800">TALLER APP</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Gestión Total</p>
        </div>
      </div>

      {/* LISTA DE MENÚ */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3 custom-scrollbar">
        {menuItems.map((item) => {
          const activo = location.pathname === item.path
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 relative ${
                activo 
                  ? 'bg-red-50 text-red-700 font-bold shadow-sm' // ACTIVO: Fondo rojo muy suave, letras rojas
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium' // INACTIVO: Gris suave
              }`}
            >
              {/* ÍCONO */}
              <span className={`text-xl transition-transform group-hover:scale-110 ${activo ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icono}
              </span>
              
              {/* TEXTO */}
              <span className="text-sm tracking-wide">
                {item.nombre}
              </span>

              {/* PUNTO ROJO (Solo si activo) */}
              {activo && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-600"></span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* FOOTER (Usuario) */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white hover:shadow-md transition group">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                AD
            </div>
            <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-700">Administrador</p>
                <p className="text-[10px] text-slate-400 group-hover:text-red-500 transition-colors">● En línea</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar