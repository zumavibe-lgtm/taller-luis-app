import Sidebar from '../components/Sidebar'

const LayoutPrincipal = ({ children }) => {
  return (
    // 🎨 CAMBIO MAESTRO:
    // En lugar de blanco, usamos un gris cálido 'Stone' (#fafaf9) o un beige muy sutil.
    // Esto quita el "charolazo" del blanco y hace juego con el vino y el olivo.
    <div className="flex min-h-screen bg-[#fafaf9] font-sans text-slate-800">
      
      {/* EL MENÚ LATERAL (Tu Borgoña Premium) */}
      <Sidebar />

      {/* EL CONTENIDO PRINCIPAL */}
      {/* Agregamos 'ml-64' para dejar espacio al menú y padding para que respire */}
      <main className="flex-1 ml-64 p-8 transition-all">
        
        {/* ENCABEZADO SUPERIOR (Opcional, para dar aire) */}
        <div className="max-w-7xl mx-auto">
            {children}
        </div>

      </main>

    </div>
  )
}

export default LayoutPrincipal