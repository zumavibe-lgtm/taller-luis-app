import React from 'react'

const MapaCoche = ({ seleccionados, toggleParte }) => {
  
  // Función auxiliar para saber si una parte está dañada
  const estaDañado = (id) => seleccionados.includes(id)

  // Función para pintar LAMINA (Gris o Rojo)
  const color = (id) => estaDañado(id) ? '#ef4444' : '#e5e7eb'

  // Función especial para pintar VIDRIOS (Azulito o Rojo)
  // Si está sano: #bae6fd (Azul cielo). Si está dañado: #ef4444 (Rojo)
  const colorVidrio = (id) => estaDañado(id) ? '#ef4444' : '#bae6fd'

  // Estilo común para todas las piezas
  const estiloPieza = "stroke-slate-400 stroke-1 hover:fill-red-200 cursor-pointer transition-all duration-300"
  
  // Estilo para los vidrios (Borde azul más fuerte)
  const estiloVidrio = "stroke-blue-400 stroke-1 hover:fill-red-300 cursor-pointer transition-all duration-300"

  return (
    <div className="flex flex-col items-center justify-center py-4 bg-white rounded-xl shadow-sm border border-slate-100">
      
      <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
        Selecciona las áreas dañadas
      </h3>

      {/* EL LIENZO DEL COCHE (SVG) */}
      <svg 
        width="280" 
        height="450" 
        viewBox="0 0 280 450" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xl"
      >
        
        {/* --- 1. DEFENSA DELANTERA (Bumper) --- */}
        <path
          d="M60 50 Q140 20 220 50 L220 70 L60 70 Z"
          fill={color('facia_delantera')}
          className={estiloPieza}
          onClick={() => toggleParte('facia_delantera')}
        />

        {/* --- 2. COFRE (Hood) --- */}
        <path
          d="M60 75 L220 75 L205 160 L75 160 Z"
          fill={color('cofre')}
          className={estiloPieza}
          onClick={() => toggleParte('cofre')}
        />

        {/* --- 3. PARABRISAS (Ahora es Clickable) --- */}
        <path
          d="M75 165 L205 165 L195 190 L85 190 Z"
          fill={colorVidrio('parabrisas')} 
          className={estiloVidrio}
          onClick={() => toggleParte('parabrisas')}
        />

        {/* --- 4. TECHO (Roof) --- */}
        <rect
          x="85" y="195" width="110" height="95" rx="5"
          fill={color('techo')}
          className={estiloPieza}
          onClick={() => toggleParte('techo')}
        />

        {/* --- 5. VIDRIO TRASERO (Entre techo y cajuela) --- */}
        <path
          d="M85 290 L195 290 L200 310 L80 310 Z"
          fill={colorVidrio('vidrio_trasero')}
          className={estiloVidrio}
          onClick={() => toggleParte('vidrio_trasero')}
        />

        {/* --- 6. CAJUELA (Trunk) --- */}
        <path
          d="M80 310 L200 310 L210 380 L70 380 Z"
          fill={color('cajuela')}
          className={estiloPieza}
          onClick={() => toggleParte('cajuela')}
        />

        {/* --- 7. DEFENSA TRASERA --- */}
        <path
          d="M70 385 L210 385 Q140 415 70 385 Z"
          fill={color('facia_trasera')}
          className={estiloPieza}
          onClick={() => toggleParte('facia_trasera')}
        />

        {/* ===================================================
            LADO IZQUIERDO (Conductor)
           =================================================== */}

        {/* Salpicadera Delantera Izq */}
        <path d="M30 70 L55 70 L70 160 L30 140 Z" fill={color('salpicadera_izq')} className={estiloPieza} onClick={() => toggleParte('salpicadera_izq')} />
        
        {/* Puerta Delantera Izq */}
        <path d="M30 145 L80 165 L80 240 L30 240 Z" fill={color('puerta_del_izq')} className={estiloPieza} onClick={() => toggleParte('puerta_del_izq')} />
        
        {/* 🪟 CRISTAL Delantero Izq (Encima de la puerta) */}
        <path d="M60 170 L80 170 L80 230 L55 230 Z" fill={colorVidrio('cristal_del_izq')} className={estiloVidrio} onClick={() => toggleParte('cristal_del_izq')} />

        {/* Puerta Trasera Izq */}
        <path d="M30 245 L80 245 L80 300 L40 330 Z" fill={color('puerta_tras_izq')} className={estiloPieza} onClick={() => toggleParte('puerta_tras_izq')} />
        
        {/* 🪟 CRISTAL Trasero Izq */}
        <path d="M60 250 L80 250 L80 295 L55 295 Z" fill={colorVidrio('cristal_tras_izq')} className={estiloVidrio} onClick={() => toggleParte('cristal_tras_izq')} />

         {/* Costado Trasero Izq */}
         <path d="M40 335 L80 305 L70 380 L50 380 Z" fill={color('costado_izq')} className={estiloPieza} onClick={() => toggleParte('costado_izq')} />


        {/* ===================================================
            LADO DERECHO (Copiloto)
           =================================================== */}

        {/* Salpicadera Delantera Der */}
        <path d="M250 70 L225 70 L210 160 L250 140 Z" fill={color('salpicadera_der')} className={estiloPieza} onClick={() => toggleParte('salpicadera_der')} />
        
        {/* Puerta Delantera Der */}
        <path d="M250 145 L200 165 L200 240 L250 240 Z" fill={color('puerta_del_der')} className={estiloPieza} onClick={() => toggleParte('puerta_del_der')} />
        
        {/* 🪟 CRISTAL Delantero Der */}
        <path d="M220 170 L200 170 L200 230 L225 230 Z" fill={colorVidrio('cristal_del_der')} className={estiloVidrio} onClick={() => toggleParte('cristal_del_der')} />

        {/* Puerta Trasera Der */}
        <path d="M250 245 L200 245 L200 300 L240 330 Z" fill={color('puerta_tras_der')} className={estiloPieza} onClick={() => toggleParte('puerta_tras_der')} />
        
        {/* 🪟 CRISTAL Trasero Der */}
        <path d="M220 250 L200 250 L200 295 L225 295 Z" fill={colorVidrio('cristal_tras_der')} className={estiloVidrio} onClick={() => toggleParte('cristal_tras_der')} />

        {/* Costado Trasero Der */}
        <path d="M240 335 L200 305 L210 380 L230 380 Z" fill={color('costado_der')} className={estiloPieza} onClick={() => toggleParte('costado_der')} />


        {/* --- LLANTAS (Negras por defecto, Rojas si dañadas) --- */}
        <rect x="10" y="90" width="15" height="40" rx="4" fill={estaDañado('llanta_del_izq') ? '#ef4444' : '#334155'} onClick={() => toggleParte('llanta_del_izq')} className="cursor-pointer"/>
        <rect x="255" y="90" width="15" height="40" rx="4" fill={estaDañado('llanta_del_der') ? '#ef4444' : '#334155'} onClick={() => toggleParte('llanta_del_der')} className="cursor-pointer"/>
        <rect x="10" y="270" width="15" height="40" rx="4" fill={estaDañado('llanta_tras_izq') ? '#ef4444' : '#334155'} onClick={() => toggleParte('llanta_tras_izq')} className="cursor-pointer"/>
        <rect x="255" y="270" width="15" height="40" rx="4" fill={estaDañado('llanta_tras_der') ? '#ef4444' : '#334155'} onClick={() => toggleParte('llanta_tras_der')} className="cursor-pointer"/>

      </svg>

      {/* LEYENDA ACTUALIZADA */}
      <div className="flex gap-4 mt-4 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-200 border border-slate-400 rounded-sm"></span> Lámina
        </div>
        <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-200 border border-blue-400 rounded-sm"></span> Vidrio
        </div>
        <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 border border-red-600 rounded-sm"></span> Dañado
        </div>
      </div>

    </div>
  )
}

export default MapaCoche