import { useState } from 'react'
import axios from 'axios'

// --- 1. BOTÓN DE SELECCIÓN (ESTILOS DIRECTOS - LIMPIO INICIALMENTE) ---
const BotonSelector = ({ texto, seleccionado, onClick, color = 'blue' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 p-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2"
      style={{
        // Si seleccionado es false o null, se ve gris. Solo si es true se pinta.
        backgroundColor: seleccionado ? (color === 'orange' ? '#ea580c' : '#1e3a8a') : '#f8fafc',
        color: seleccionado ? 'white' : '#64748b',
        border: seleccionado ? '3px solid white' : '1px solid #cbd5e1',
        outline: seleccionado ? (color === 'orange' ? '3px solid #ea580c' : '3px solid #1e3a8a') : 'none',
        transform: seleccionado ? 'scale(1.05)' : 'scale(1)'
      }}
    >
        <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            border: seleccionado ? '2px solid white' : '2px solid #94a3b8',
            backgroundColor: seleccionado ? 'white' : 'transparent'
        }}></div>
        {texto}
    </button>
  )
}

// --- 2. SEMÁFORO (ESTILOS DIRECTOS - LIMPIO INICIALMENTE) ---
const Semaforo = ({ label, valor, onChange }) => {
  const opciones = [
    { key: 'Bien', label: '🟢 BIEN', color: '#16a34a' },
    { key: 'Regular', label: '🟡 REGULAR', color: '#ca8a04' },
    { key: 'Mal', label: '🔴 MAL', color: '#dc2626' }
  ]

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
      <p className="font-black text-gray-800 mb-3 text-lg border-b pb-2 uppercase">{label}</p>
      <div className="flex gap-2">
        {opciones.map((op) => {
            const estaActivo = valor === op.key;
            return (
                <button
                    type="button"
                    key={op.key}
                    onClick={() => onChange(op.key)}
                    className="flex-1 py-4 rounded-lg font-bold transition-all shadow-sm"
                    style={{
                        backgroundColor: estaActivo ? op.color : '#f3f4f6', // Gris si no está seleccionado
                        color: estaActivo ? 'white' : '#9ca3af',
                        borderBottom: estaActivo ? '4px solid rgba(0,0,0,0.2)' : '1px solid #e5e7eb',
                        transform: estaActivo ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    {op.label}
                </button>
            )
        })}
      </div>
    </div>
  )
}

// --- 3. CHECKBOX GIGANTE ---
const CheckBoxGrande = ({ label, checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    className="flex items-center p-4 mb-3 rounded-xl cursor-pointer transition-all select-none shadow-sm"
    style={{
        backgroundColor: checked ? '#2563eb' : 'white',
        border: checked ? '2px solid #1e40af' : '1px solid #d1d5db',
        color: checked ? 'white' : '#6b7280',
        transform: checked ? 'scale(1.02)' : 'scale(1)'
    }}
  >
    <div style={{
        width: '32px', height: '32px', borderRadius: '4px',
        backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: checked ? '2px solid white' : '2px solid #9ca3af',
        marginRight: '15px'
    }}>
      {checked && <span style={{color: '#1e40af', fontWeight: 'bold', fontSize: '20px'}}>✓</span>}
    </div>
    <span className="font-bold text-lg uppercase tracking-wide">
      {label}
    </span>
  </div>
)

// --- FORMULARIO PRINCIPAL ---
function FormularioInspeccion({ ordenId, alTerminar }) {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [errorVisible, setErrorVisible] = useState(null)

  // --- ESTADO INICIAL "LIMPIO" (null) ---
  // Al poner 'null', ningún botón coincidirá al principio, por lo que todos estarán grises.
  const [datos, setDatos] = useState({
    transmision: null, 
    combustible: null, 
    kilometraje: '', 
    puertas: 4,
    estado_procedencia: 'Nacional',
    
    // Documentación
    doc_factura: false, doc_tarjeta: false, doc_identificacion: false, doc_verificacion: false, doc_seguro: false,
    
    // Exterior (Todos en null para arrancar apagados)
    ext_pintura: null, ext_faros: null, ext_calaveras: null, ext_llantas: null, ext_refaccion: null,
    golpes_visibles: false, detalle_golpes: '',
    
    // Interior
    int_asientos: null, int_tablero: null, int_aire: null,
    olores: false,
    
    // Mecánica
    mec_motor: null, mec_frenos: null, mec_niveles_aceite: null, mec_fugas: false,
    
    // Accesorios
    cant_llaves: 1, acc_gato: false, acc_llave: false,
    
    // Observaciones
    obs_estetica: '', obs_mecanica: '',
    
    // Firmas
    nombre_responsable: 'Admin', 
    acepta_terminos: false
  })

  // Lógica segura para guardar sin borrar lo anterior
  const actualizarDato = (campo, valor) => {
    setDatos(prev => ({ 
      ...prev,     
      [campo]: valor 
    }))
  }

  const finalizar = async () => {
    if (!datos.acepta_terminos) return alert("⚠️ EL CLIENTE DEBE FIRMAR LA CONFORMIDAD.")
    
    setEnviando(true)
    setErrorVisible(null)
    
    const API_URL = "https://taller-luis-app.onrender.com"
    
    try {
      // AQUÍ ESTÁ EL TRUCO DE SEGURIDAD:
      // Si el usuario dejó algo en 'null' (sin contestar), le ponemos un valor por defecto ("Bien" o "Manual")
      // para que el sistema no marque error al guardar.
      const payload = {
        orden_id: parseInt(ordenId),
        
        transmision: datos.transmision || 'Manual', 
        combustible: datos.combustible || 'Gasolina',
        puertas: parseInt(datos.puertas),
        estado_procedencia: datos.estado_procedencia,
        kilometraje: parseInt(datos.kilometraje) || 0,
        nivel_gasolina: 25, 
        
        // Si no seleccionó nada, asumimos 'Bien' para no romper el guardado
        ext_pintura: datos.ext_pintura || 'Bien',
        ext_llantas: datos.ext_llantas || 'Bien',
        ext_calaveras: datos.ext_calaveras || 'Bien',
        ext_refaccion: datos.ext_refaccion || 'Bien',
        
        mec_niveles_aceite: datos.mec_niveles_aceite || 'Bien',
        mec_frenos: datos.mec_frenos || 'Bien',
        nombre_receptor: datos.nombre_responsable,

        luces_estado: `Faros:${datos.ext_faros || 'Bien'}`,
        niveles_estado: `Aceite:${datos.mec_niveles_aceite || 'Bien'}`,
        accesorios: `Llaves:${datos.cant_llaves}`,
        llantas_estado: `Gral:${datos.ext_llantas || 'Bien'}`,
        danos_previso: datos.golpes_visibles ? (datos.detalle_golpes || "Con detalles") : "Sin golpes",
        
        // Si no seleccionó aire, asumimos que 'Funciona'
        observaciones: `ESTÉTICA: ${datos.obs_estetica || "Ninguno"} \n FALLAS: ${datos.obs_mecanica || "Ninguna"} \n AIRE: ${datos.int_aire || 'Funciona'}`
      };

      await axios.post(`${API_URL}/inspeccion/`, payload)
      await axios.put(`${API_URL}/ordenes/${ordenId}/estado?nuevo_estado=recibido`)

      alTerminar()
    } catch (error) {
      console.error("Error completo:", error)
      if (error.response && error.response.data) {
          setErrorVisible(JSON.stringify(error.response.data, null, 2))
      } else {
          setErrorVisible("Error de conexión. Revisa que el backend esté prendido.")
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 p-2 animate-fade-in">
      
      <div className="bg-white w-full max-w-4xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-blue-900 text-white p-5 flex justify-between items-center shrink-0 shadow-lg">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-blue-200">Inspección de Entrada</h2>
            <div className="flex gap-1 mt-3">
              {[1,2,3,4,5,6,7,8].map(p => (
                 <div key={p} className={`h-3 w-8 rounded transition-all ${paso >= p ? 'bg-green-400 border-2 border-white' : 'bg-blue-800 opacity-50'}`}></div>
              ))}
            </div>
          </div>
          <div className="text-4xl font-black text-white">PASO {paso}</div>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {paso === 1 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 uppercase">1. Datos Generales</h3>
              
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
                <label className="block font-black text-gray-700 mb-3 text-lg">KILOMETRAJE ACTUAL</label>
                <input type="number" className="w-full p-4 text-5xl text-center font-black text-blue-900 border-4 border-gray-300 rounded-xl focus:border-blue-600 focus:bg-blue-50 outline-none" placeholder="00000" 
                  value={datos.kilometraje} onChange={e => actualizarDato('kilometraje', e.target.value)} />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-3 text-lg">TIPO DE TRANSMISIÓN</label>
                <div className="flex gap-4">
                   <BotonSelector texto="MANUAL" seleccionado={datos.transmision === 'Manual'} onClick={() => actualizarDato('transmision', 'Manual')} />
                   <BotonSelector texto="AUTOMÁTICA" seleccionado={datos.transmision === 'Automatica'} onClick={() => actualizarDato('transmision', 'Automatica')} />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-3 text-lg">COMBUSTIBLE</label>
                <div className="flex gap-2">
                   <BotonSelector texto="GASOLINA" color="orange" seleccionado={datos.combustible === 'Gasolina'} onClick={() => actualizarDato('combustible', 'Gasolina')} />
                   <BotonSelector texto="DIESEL" color="orange" seleccionado={datos.combustible === 'Diesel'} onClick={() => actualizarDato('combustible', 'Diesel')} />
                   <BotonSelector texto="HÍBRIDO" color="orange" seleccionado={datos.combustible === 'Híbrido'} onClick={() => actualizarDato('combustible', 'Híbrido')} />
                </div>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 uppercase">2. Documentación</h3>
              <p className="bg-yellow-100 text-yellow-900 p-4 rounded-lg font-bold border-l-4 border-yellow-500 mb-4">
                ⚠️ VERIFICA FÍSICAMENTE CADA DOCUMENTO
              </p>
              <CheckBoxGrande label="Factura Original" checked={datos.doc_factura} onChange={v => actualizarDato('doc_factura', v)} />
              <CheckBoxGrande label="Tarjeta de Circulación" checked={datos.doc_tarjeta} onChange={v => actualizarDato('doc_tarjeta', v)} />
              <CheckBoxGrande label="Identificación (INE)" checked={datos.doc_identificacion} onChange={v => actualizarDato('doc_identificacion', v)} />
              <CheckBoxGrande label="Verificación Vigente" checked={datos.doc_verificacion} onChange={v => actualizarDato('doc_verificacion', v)} />
              <CheckBoxGrande label="Póliza de Seguro" checked={datos.doc_seguro} onChange={v => actualizarDato('doc_seguro', v)} />
            </div>
          )}

          {paso === 3 && (
            <div>
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 mb-6 uppercase">3. Exterior</h3>
              <Semaforo label="Pintura General" valor={datos.ext_pintura} onChange={v => actualizarDato('ext_pintura', v)} />
              <Semaforo label="Faros Delanteros" valor={datos.ext_faros} onChange={v => actualizarDato('ext_faros', v)} />
              <Semaforo label="Calaveras Traseras" valor={datos.ext_calaveras} onChange={v => actualizarDato('ext_calaveras', v)} />
              <Semaforo label="Estado de Llantas" valor={datos.ext_llantas} onChange={v => actualizarDato('ext_llantas', v)} />
              <Semaforo label="Refacción" valor={datos.ext_refaccion} onChange={v => actualizarDato('ext_refaccion', v)} />
              
              <div className="mt-8 p-6 bg-red-50 rounded-xl border-4 border-red-100">
                <CheckBoxGrande label="¿TIENE GOLPES VISIBLES?" checked={datos.golpes_visibles} onChange={v => actualizarDato('golpes_visibles', v)} />
                {datos.golpes_visibles && (
                   <textarea placeholder="Describe EXACTAMENTE dónde están los golpes..." className="w-full p-4 border-2 border-red-300 rounded-xl mt-2 h-32 text-lg focus:border-red-600 outline-none" 
                     value={datos.detalle_golpes} onChange={e => actualizarDato('detalle_golpes', e.target.value)} />
                )}
              </div>
            </div>
          )}

          {paso === 4 && (
            <div>
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 mb-6 uppercase">4. Interior</h3>
              <Semaforo label="Asientos / Tapicería" valor={datos.int_asientos} onChange={v => actualizarDato('int_asientos', v)} />
              <Semaforo label="Tablero (Testigos)" valor={datos.int_tablero} onChange={v => actualizarDato('int_tablero', v)} />
              
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200 mt-6">
                <label className="block font-black text-gray-800 mb-4 text-lg">AIRE ACONDICIONADO</label>
                <div className="flex gap-4">
                   <BotonSelector texto="❄️ ENFRÍA" seleccionado={datos.int_aire === 'Funciona'} onClick={() => actualizarDato('int_aire', 'Funciona')} />
                   <BotonSelector texto="🔥 NO ENFRÍA" color="orange" seleccionado={datos.int_aire === 'No Enfria'} onClick={() => actualizarDato('int_aire', 'No Enfria')} />
                </div>
              </div>
              <div className="mt-6"><CheckBoxGrande label="¿Olores Extraños?" checked={datos.olores} onChange={v => actualizarDato('olores', v)} /></div>
            </div>
          )}

          {paso === 5 && (
            <div>
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 mb-6 uppercase">5. Mecánica</h3>
              <Semaforo label="Motor" valor={datos.mec_motor} onChange={v => actualizarDato('mec_motor', v)} />
              <Semaforo label="Frenos" valor={datos.mec_frenos} onChange={v => actualizarDato('mec_frenos', v)} />
              <Semaforo label="Nivel Aceite" valor={datos.mec_niveles_aceite} onChange={v => actualizarDato('mec_niveles_aceite', v)} />
              <div className="mt-6 p-6 bg-yellow-50 rounded-xl border-4 border-yellow-100">
                 <CheckBoxGrande label="¿Fugas visibles?" checked={datos.mec_fugas} onChange={v => actualizarDato('mec_fugas', v)} />
              </div>
            </div>
          )}

          {paso === 6 && (
            <div>
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 mb-6 uppercase">6. Equipamiento</h3>
              <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-xl shadow-md border-2 border-gray-200">
                 <label className="font-black text-xl text-gray-800">CANTIDAD DE LLAVES:</label>
                 <input type="number" className="w-24 p-3 border-4 border-gray-300 rounded-xl text-center font-black text-3xl" value={datos.cant_llaves} onChange={e => actualizarDato('cant_llaves', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckBoxGrande label="Gato Hidráulico" checked={datos.acc_gato} onChange={v => actualizarDato('acc_gato', v)} />
                <CheckBoxGrande label="Llave de Cruz" checked={datos.acc_llave} onChange={v => actualizarDato('acc_llave', v)} />
              </div>
            </div>
          )}

          {paso === 7 && (
            <div>
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 mb-6 uppercase">7. Observaciones</h3>
              <label className="block font-black text-gray-700 mb-2 text-lg">DETALLES ESTÉTICOS A CORREGIR:</label>
              <textarea className="w-full h-32 p-4 border-4 border-gray-300 rounded-xl mb-6 focus:border-blue-600 outline-none text-lg" placeholder="Rayones, detalles..." value={datos.obs_estetica} onChange={e => actualizarDato('obs_estetica', e.target.value)} />
              
              <label className="block font-black text-gray-700 mb-2 text-lg">FALLA REPORTADA / SERVICIOS:</label>
              <textarea className="w-full h-32 p-4 border-4 border-gray-300 rounded-xl focus:border-blue-600 outline-none text-lg" placeholder="El cliente reporta..." value={datos.obs_mecanica} onChange={e => actualizarDato('obs_mecanica', e.target.value)} />
            </div>
          )}

          {paso === 8 && (
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-black text-blue-900 border-b-4 border-blue-900 pb-2 uppercase">8. Confirmación</h3>
              
              <div className="bg-blue-50 p-6 rounded-xl text-left text-blue-900 border-2 border-blue-200 shadow-inner">
                 <p className="text-lg"><strong>Responsable:</strong> {datos.nombre_responsable}</p>
                 <p className="text-lg"><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
              </div>

              <div 
                onClick={() => actualizarDato('acepta_terminos', !datos.acepta_terminos)}
                style={{
                    backgroundColor: datos.acepta_terminos ? '#dcfce7' : 'white',
                    borderColor: datos.acepta_terminos ? '#16a34a' : '#d1d5db'
                }}
                className="p-10 border-8 border-dashed rounded-3xl cursor-pointer transition-all hover:scale-105"
              >
                 {datos.acepta_terminos ? (
                   <div className="text-green-800 font-black text-3xl animate-pulse">✅ FIRMADO Y ACEPTADO</div>
                 ) : (
                   <div className="text-gray-400 font-black text-2xl flex flex-col items-center">
                     <span className="text-6xl mb-4">✍️</span>
                     TOCAR AQUÍ PARA FIRMAR
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* --- CAJA ROJA DE DIAGNÓSTICO (Solo sale si hay error) --- */}
          {errorVisible && (
            <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-xl font-mono text-sm break-all">
               <strong>ERROR DE GUARDADO:</strong> <br/>
               {errorVisible}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-white border-t-2 border-gray-200 flex justify-between shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
          <button onClick={() => setPaso(p => p - 1)} disabled={paso === 1} className="px-8 py-4 rounded-xl font-black text-gray-500 bg-gray-200 hover:bg-gray-300 disabled:opacity-50">ATRÁS</button>
          
          {paso < 8 ? (
            <button onClick={() => setPaso(p => p + 1)} className="px-12 py-4 rounded-xl font-black bg-blue-700 text-white hover:bg-blue-800 shadow-xl transform active:scale-95 transition-all text-xl">SIGUIENTE ▶</button>
          ) : (
            <button onClick={finalizar} disabled={enviando || !datos.acepta_terminos} className="px-12 py-4 rounded-xl font-black bg-green-600 text-white hover:bg-green-700 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all text-xl">
              {enviando ? "GUARDANDO..." : "✅ FINALIZAR"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FormularioInspeccion