import { useState, useEffect } from 'react'
import axios from 'axios'

// Usamos la IP local para evitar problemas de red en Windows
const API_URL = "https://taller-luis-app.onrender.com"

function Catalogos() {
  const [servicios, setServicios] = useState([])
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', precio: '', es_favorito: false })
  const [editandoId, setEditandoId] = useState(null)

  useEffect(() => {
    cargarServicios()
  }, [])

  const cargarServicios = async () => {
    try {
      const res = await axios.get(`${API_URL}/servicios/`)
      // Ordenamos: Primero los Favoritos (true = 1), luego los normales (false = 0)
      const ordenados = res.data.sort((a, b) => Number(b.es_favorito) - Number(a.es_favorito))
      setServicios(ordenados)
    } catch (error) {
      console.error("Error cargando servicios", error)
    }
  }

  const guardarServicio = async (e) => {
    e.preventDefault()
    if (!nuevoServicio.nombre || !nuevoServicio.precio) return alert("Llena todos los campos")

    try {
      const payload = {
        nombre: nuevoServicio.nombre,
        precio_sugerido: parseFloat(nuevoServicio.precio),
        es_favorito: nuevoServicio.es_favorito
      }

      if (editandoId) {
        await axios.put(`${API_URL}/servicios/${editandoId}`, payload)
      } else {
        await axios.post(`${API_URL}/servicios/`, payload)
      }
      
      // Limpiar formulario
      setNuevoServicio({ nombre: '', precio: '', es_favorito: false })
      setEditandoId(null)
      cargarServicios() // Recargar lista
    } catch (error) {
      console.error(error)
      alert("Error al guardar servicio")
    }
  }

  // Función rápida para activar/desactivar estrella sin editar todo
  const toggleFavorito = async (servicio) => {
    try {
        const payload = {
            nombre: servicio.nombre,
            precio_sugerido: servicio.precio_sugerido,
            es_favorito: !servicio.es_favorito // Invertimos el valor actual
        }
        await axios.put(`${API_URL}/servicios/${servicio.id}`, payload)
        cargarServicios()
    } catch (error) {
        console.error("Error cambiando favorito", error)
    }
  }

  const borrarServicio = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return
    try {
      await axios.delete(`${API_URL}/servicios/${id}`)
      cargarServicios()
    } catch (error) {
      console.error(error)
    }
  }

  const iniciarEdicion = (s) => {
    setEditandoId(s.id)
    setNuevoServicio({ nombre: s.nombre, precio: s.precio_sugerido, es_favorito: s.es_favorito })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">📚 Catálogo de Servicios</h1>
        <p className="text-slate-500">Administra los servicios que ofreces. Marca con ⭐ los más usados.</p>
      </div>

      {/* FORMULARIO DE AGREGAR / EDITAR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="font-bold text-slate-700 mb-4">
            {editandoId ? '✏️ Editando Servicio' : '➕ Agregar Nuevo Servicio'}
        </h3>
        
        <form onSubmit={guardarServicio} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Servicio</label>
            <input 
              type="text" 
              className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
              placeholder="Ej: Cambio de Bujías"
              value={nuevoServicio.nombre}
              onChange={e => setNuevoServicio({...nuevoServicio, nombre: e.target.value})}
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio ($)</label>
            <input 
              type="number" 
              className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
              placeholder="0.00"
              value={nuevoServicio.precio}
              onChange={e => setNuevoServicio({...nuevoServicio, precio: e.target.value})}
            />
          </div>
          
          {/* CHECKBOX FAVORITO (Visible al crear) */}
          <div 
            className="flex items-center gap-2 mb-2 cursor-pointer p-2 rounded hover:bg-slate-50"
            onClick={() => setNuevoServicio({...nuevoServicio, es_favorito: !nuevoServicio.es_favorito})}
          >
             <div className={`text-2xl transition-all ${nuevoServicio.es_favorito ? 'grayscale-0 scale-110' : 'grayscale opacity-30'}`}>⭐</div>
             <span className="text-xs font-bold text-slate-500 select-none">Favorito</span>
          </div>

          <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-700 transition h-10 mb-0.5">
            {editandoId ? 'Guardar' : 'AGREGAR'}
          </button>
          
          {editandoId && (
            <button 
                type="button" 
                onClick={() => { setEditandoId(null); setNuevoServicio({nombre:'', precio:'', es_favorito:false}) }} 
                className="bg-gray-200 text-gray-600 px-4 py-2 rounded font-bold h-10 mb-0.5"
            >
                Cancelar
            </button>
          )}
        </form>
      </div>

      {/* LISTA DE SERVICIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase text-center w-16">Fav</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase">Nombre Servicio</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase">Precio Sugerido</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {servicios.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 text-center">
                            <button 
                                onClick={() => toggleFavorito(s)}
                                className={`text-xl transition-transform hover:scale-125 focus:outline-none ${s.es_favorito ? 'opacity-100' : 'opacity-20 grayscale'}`}
                                title="Clic para marcar/desmarcar como favorito"
                            >
                                ⭐
                            </button>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{s.nombre}</td>
                        <td className="p-4 font-mono text-green-600 font-bold">${s.precio_sugerido.toFixed(2)}</td>
                        <td className="p-4 text-right space-x-2">
                            <button onClick={() => iniciarEdicion(s)} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded">Editar</button>
                            <button onClick={() => borrarServicio(s.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded">Borrar</button>
                        </td>
                    </tr>
                ))}
                {servicios.length === 0 && (
                    <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-400 italic">
                            No hay servicios registrados aún. ¡Agrega el primero arriba!
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  )
}

export default Catalogos