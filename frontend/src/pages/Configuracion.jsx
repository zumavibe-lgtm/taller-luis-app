import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = "https://taller-luis-app.onrender.com"

function Configuracion() {
  const [diaCorte, setDiaCorte] = useState("28") // Valor por defecto
  const [diasLaborales, setDiasLaborales] = useState({
    Lunes: true, Martes: true, Miercoles: true, 
    Jueves: true, Viernes: true, Sabado: true, Domingo: false
  })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarConfig()
  }, [])

  const cargarConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/`)
      const configs = res.data
      
      // 1. Cargar Día de Corte
      const corte = configs.find(c => c.clave === "DIA_CORTE_MENSUAL")
      if (corte) setDiaCorte(corte.valor)

      // 2. Cargar Días Laborales
      const dias = configs.find(c => c.clave === "DIAS_LABORALES")
      if (dias) {
        // Convertimos el string "Lunes,Martes" a objeto {Lunes: true...}
        const listaDias = dias.valor.split(',')
        const objetoDias = {
            Lunes: listaDias.includes('Lunes'),
            Martes: listaDias.includes('Martes'),
            Miercoles: listaDias.includes('Miercoles'),
            Jueves: listaDias.includes('Jueves'),
            Viernes: listaDias.includes('Viernes'),
            Sabado: listaDias.includes('Sabado'),
            Domingo: listaDias.includes('Domingo'),
        }
        setDiasLaborales(objetoDias)
      }
    } catch (error) {
      console.error("Error cargando config", error)
    }
  }

  const guardarCambios = async () => {
    setGuardando(true)
    try {
        // 1. Guardar Día de Corte
        await axios.post(`${API_URL}/config/`, {
            clave: "DIA_CORTE_MENSUAL",
            valor: diaCorte,
            descripcion: "Día del mes para realizar el corte administrativo"
        })

        // 2. Guardar Días Laborales (Convertimos objeto a string "Lunes,Martes...")
        const listaString = Object.keys(diasLaborales).filter(dia => diasLaborales[dia]).join(',')
        
        await axios.post(`${API_URL}/config/`, {
            clave: "DIAS_LABORALES",
            valor: listaString,
            descripcion: "Días operativos del taller"
        })

        alert("✅ Configuración guardada correctamente")
    } catch (error) {
        console.error(error)
        alert("Error al guardar configuración")
    } finally {
        setGuardando(false)
    }
  }

  const toggleDia = (dia) => {
    setDiasLaborales({...diasLaborales, [dia]: !diasLaborales[dia]})
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">⚙️ Configuración Maestra</h1>
        <p className="text-slate-500">Define las reglas operativas del taller.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* TARJETA 1: CIERRE MENSUAL */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg text-2xl">📅</div>
                  <h3 className="font-bold text-slate-700 text-lg">Cierre Mensual</h3>
              </div>
              
              <p className="text-sm text-slate-500 mb-4">
                  Selecciona el día límite para el corte administrativo. <br/>
                  (Ej: Si pones 28, el sistema pedirá cierre el día 28 de cada mes).
              </p>

              <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Día de Corte:</span>
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={diaCorte}
                    onChange={(e) => setDiaCorte(e.target.value)}
                    className="w-20 p-2 text-center text-xl font-bold border-2 border-slate-200 rounded focus:border-blue-500 outline-none"
                  />
              </div>
          </div>

          {/* TARJETA 2: DÍAS LABORALES */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg text-2xl">🛠️</div>
                  <h3 className="font-bold text-slate-700 text-lg">Días Laborales</h3>
              </div>

              <p className="text-sm text-slate-500 mb-4">
                  Marca los días que abre el taller. Esto ayuda al sistema a calcular días inhábiles para reportes y cierres.
              </p>

              <div className="flex flex-wrap gap-2">
                  {Object.keys(diasLaborales).map(dia => (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                            diasLaborales[dia] 
                            ? 'bg-slate-800 text-white shadow-lg' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {dia.substring(0, 3)}
                      </button>
                  ))}
              </div>
              <p className="mt-4 text-xs font-mono text-slate-400">
                  {/* Vista previa de lo que se guardará */}
                  Estado: {Object.keys(diasLaborales).filter(d => diasLaborales[d]).join(', ')}
              </p>
          </div>

      </div>

      {/* BOTÓN DE GUARDAR */}
      <div className="mt-8 text-right">
          <button 
            onClick={guardarCambios}
            disabled={guardando}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
              {guardando ? 'GUARDANDO...' : '💾 GUARDAR CONFIGURACIÓN'}
          </button>
      </div>

    </div>
  )
}

export default Configuracion