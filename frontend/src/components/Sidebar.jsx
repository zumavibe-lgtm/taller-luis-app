import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()
  
  // Definimos los botones del menú según tu Plan Maestro
  const menuItems = [
    { path: '/', nombre: 'Dashboard', icono: '📊' },
    { path: '/taller', nombre: 'Taller', icono: '🛠️' },     // (A futuro)
    { path: '/recepcion', nombre: 'Recepción', icono: '📋' },
    { path: '/caja', nombre: 'Caja', icono: '💰' },
    { path: '/cierres', nombre: 'Cierres', icono: '🔒' },   // (A futuro)
    { path: '/reportes', nombre: 'Reportes', icono: '📈' },
    { path: '/catalogos', nombre: 'Catálogos', icono: '📚' }, // (A futuro)
    { path: '/config', nombre: 'Configuración', icono: '⚙️' }, // (A futuro)
    { path: '/usuarios', nombre: 'Usuarios', icono: '👥' },
  ]

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col shadow-2xl fixed left-0 top-0">
      
      {/* LOGO / TÍTULO */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/50">
          T
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide">TALLER APP</h1>
          <p className="text-xs text-slate-400 font-mono">v2.0 ERP</p>
        </div>
      </div>

      {/* LISTA DE MENÚ */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1">
        {menuItems.map((item) => {
          // Detectamos si estamos en esta página para pintarlo de azul
          const activo = location.pathname === item.path
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${
                activo 
                  ? 'bg-slate-800 border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl filter drop-shadow-md">{item.icono}</span>
              <span className="font-medium text-sm tracking-wide">{item.nombre}</span>
            </Link>
          )
        })}
      </nav>

      {/* FOOTER DEL MENÚ */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-700 transition">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500"></div>
            <div>
                <p className="text-xs font-bold text-white">Admin</p>
                <p className="text-[10px] text-green-400">● En línea</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar