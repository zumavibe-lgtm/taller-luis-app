import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()
  
  // Definimos los botones del menú
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
    // 🎨 FONDO CAMBIADO: Usamos 'bg-slate-950' para ese tono Azul Noche Profundo (Tech Navy)
    <div className="h-screen w-64 bg-slate-950 text-slate-300 flex flex-col shadow-2xl fixed left-0 top-0 border-r border-slate-800 z-50">
      
      {/* LOGO / TÍTULO */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
        {/* ÍCONO ROJO VIBRANTE */}
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-red-900/40">
          T
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wide text-white">TALLER APP</h1>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">ONLINE v2.1</p>
          </div>
        </div>
      </div>

      {/* LISTA DE MENÚ */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3 custom-scrollbar">
        {menuItems.map((item) => {
          const activo = location.pathname === item.path
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`group flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden ${
                activo 
                  ? 'bg-slate-800/80 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {/* BARRA LATERAL ROJA (Solo visible si está activo) */}
              {activo && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
              )}

              {/* ÍCONO */}
              <span className={`text-xl transition-transform group-hover:scale-110 ${activo ? 'opacity-100' : 'opacity-70'}`}>
                {item.icono}
              </span>
              
              {/* TEXTO */}
              <span className={`font-semibold text-sm tracking-wide ${activo ? 'text-white' : 'group-hover:text-slate-200'}`}>
                {item.nombre}
              </span>

              {/* FLECHITA SUTIL A LA DERECHA (Solo en hover) */}
              {!activo && (
                 <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-slate-600">›</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* FOOTER DEL MENÚ (Perfil) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-slate-700 transition group">
            <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border-2 border-slate-800 group-hover:border-red-500/50 transition-colors">
                    AD
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Administrador</p>
                <p className="text-[10px] text-slate-500 group-hover:text-red-400 transition-colors">Cerrar Sesión</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar