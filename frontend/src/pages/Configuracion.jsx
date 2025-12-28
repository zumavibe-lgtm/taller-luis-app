import { useEffect, useState } from 'react'
import axios from 'axios'

function Configuracion() {
  const [fallas, setFallas] = useState([])
  
  // Estado del formulario
  const [nuevaFalla, setNuevaFalla] = useState({ nombre: "", precio: "" })
  
  // Estado para saber si estamos editando (Guarda el ID que se edita)
  const [idEdicion, setIdEdicion] = useState(null)

  useEffect(() => {
    cargarFallas()
  }, [])

  const cargarFallas = async () => {
    const res = await axios.get('http://127.0.0.1:8000/config/fallas-comunes')
    setFallas(res.data)
  }

  // Cargar datos en el formulario para editar
  const iniciarEdicion = (falla) => {
    setNuevaFalla({ 
        nombre: falla.nombre_falla, 
        precio: falla.precio_sugerido 
    })
    setIdEdicion(falla.id) // Activamos modo edición
  }

  // Cancelar edición y limpiar
  const cancelarEdicion = () => {
    setNuevaFalla({ nombre: "", precio: "" })
    setIdEdicion(null) // Volvemos a modo agregar
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    if (!nuevaFalla.nombre || !nuevaFalla.precio) return alert("Llena ambos campos")

    try {
        if (idEdicion) {
            // MODO EDICIÓN (PUT)
            await axios.put(`http://127.0.0.1:8000/config/fallas-comunes/${idEdicion}`, {
                nombre_falla: nuevaFalla.nombre,
                precio_sugerido: parseFloat(nuevaFalla.precio),
                sistema_id: 2
            })
            alert("✅ Servicio actualizado correctamente")
        } else {
            // MODO CREACIÓN (POST)
            await axios.post('http://127.0.0.1:8000/config/fallas-comunes', {
                nombre_falla: nuevaFalla.nombre,
                precio_sugerido: parseFloat(nuevaFalla.precio),
                sistema_id: 2
            })
            alert("✅ Servicio agregado al catálogo")
        }

        // Limpiar todo después de guardar
        cancelarEdicion()
        cargarFallas()

    } catch (error) {
        console.error(error)
        alert("Error al guardar")
    }
  }

  const borrarFalla = async (id) => {
    if(!confirm("¿Seguro que quieres borrar este servicio?")) return
    try {
        await axios.delete(`http://127.0.0.1:8000/config/fallas-comunes/${id}`)
        cargarFallas()
    } catch (error) {
        alert("Error al borrar")
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#1a237e' }}>⚙️ Configuración del Taller</h1>
      <p>Administra la "Lista Negra" y precios sugeridos.</p>

      {/* FORMULARIO INTELIGENTE (AGREGAR / EDITAR) */}
      <div style={{ 
          backgroundColor: idEdicion ? '#e3f2fd' : '#f5f5f5', // Cambia de color si editas
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: idEdicion ? '2px solid #2196f3' : '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0 }}>
            {idEdicion ? "✏️ Editando Servicio" : "+ Agregar Nuevo Servicio"}
        </h3>
        
        <form onSubmit={manejarEnvio} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre del Servicio:</label>
                <input 
                    type="text" placeholder="Ej: Cambio de Bujías"
                    value={nuevaFalla.nombre}
                    onChange={e => setNuevaFalla({...nuevaFalla, nombre: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Precio ($):</label>
                <input 
                    type="number" placeholder="0.00"
                    value={nuevaFalla.precio}
                    onChange={e => setNuevaFalla({...nuevaFalla, precio: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            
            {/* BOTÓN GUARDAR / ACTUALIZAR */}
            <button type="submit" style={{ 
                padding: '12px 20px', 
                backgroundColor: idEdicion ? '#ff9800' : '#2196f3', // Azul o Naranja
                color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
            }}>
                {idEdicion ? "GUARDAR CAMBIOS" : "AGREGAR"}
            </button>

            {/* BOTÓN CANCELAR (Solo aparece si editas) */}
            {idEdicion && (
                <button type="button" onClick={cancelarEdicion} style={{ 
                    padding: '12px 20px', backgroundColor: '#9e9e9e',
                    color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' 
                }}>
                    CANCELAR
                </button>
            )}
        </form>
      </div>

      {/* TABLA DE SERVICIOS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <thead>
            <tr style={{ backgroundColor: '#37474f', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Servicio / Falla</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Precio Sugerido</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {fallas.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #ddd', backgroundColor: 'white' }}>
                    <td style={{ padding: '10px' }}>{f.nombre_falla}</td>
                    <td style={{ padding: '10px', color: 'green', fontWeight: 'bold' }}>${f.precio_sugerido}</td>
                    <td style={{ padding: '10px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        
                        {/* BOTÓN EDITAR */}
                        <button 
                            onClick={() => iniciarEdicion(f)}
                            style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ✏️ Editar
                        </button>

                        {/* BOTÓN BORRAR */}
                        <button 
                            onClick={() => borrarFalla(f.id)}
                            style={{ backgroundColor: '#e53935', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            🗑️ Borrar
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>

    </div>
  )
}

export default Configuracion