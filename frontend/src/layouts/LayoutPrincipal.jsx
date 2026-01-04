import Sidebar from '../components/Sidebar'

const LayoutPrincipal = ({ children }) => {
  return (
    <div className="flex bg-slate-100 min-h-screen">
      {/* 1. EL MENÚ FIJO A LA IZQUIERDA */}
      <Sidebar />

      {/* 2. EL CONTENIDO CAMBIANTE A LA DERECHA */}
      {/* ml-64 deja el margen izquierdo para que no se encime el menú */}
      <main className="flex-1 ml-64 p-8 animate-fade-in">
        {children}
      </main>
    </div>
  )
}

export default LayoutPrincipal