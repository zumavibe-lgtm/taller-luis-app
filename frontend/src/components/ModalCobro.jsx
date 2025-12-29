import React, { useState, useEffect } from 'react';

const ModalCobro = ({ orden, onClose, onCobroExitoso }) => {
  // Estados para manejar los datos de la ventanita
  const [servicios, setServicios] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo'); // efectivo o tarjeta
  const [procesando, setProcesando] = useState(false);

  // URL BASE DEL SERVIDOR (Ya corregida para producción)
  const API_URL = "https://api-taller-luis.onrender.com";

  // Cargar los servicios cuando se abre la modal
  useEffect(() => {
    if (orden && orden.detalles) {
        setServicios(orden.detalles);
    } else {
        fetchDetalles();
    }
  }, [orden]);

  const fetchDetalles = async () => {
      try {
          // --- AQUÍ USAMOS LA URL DE INTERNET ---
          const res = await fetch(`${API_URL}/ordenes/${orden.id}/detalles`);
          const data = await res.json();
          setServicios(data);
      } catch (error) {
          console.error("Error cargando servicios", error);
      }
  };

  // Calcular totales en vivo
  const calcularTotal = () => {
    return servicios.reduce((suma, item) => suma + Number(item.precio || 0), 0);
  };
  
  const total = calcularTotal();

  // Función para guardar el cobro en Python
  const handleCobrar = async () => {
    setProcesando(true);
    const datosCobro = {
        total_cobrado: total,
        metodo_pago: metodoPago
    };

    try {
        // --- AQUÍ TAMBIÉN USAMOS LA URL DE INTERNET ---
        const response = await fetch(`${API_URL}/ordenes/${orden.id}/cobrar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCobro)
        });

        if (response.ok) {
            alert(`¡Cobro de $${total} registrado con éxito!`);
            
            // Mandamos imprimir el ticket (se abre la ventana de impresión del navegador)
            window.print(); 
            
            // Avisamos a Recepcion.jsx que actualice la lista
            onCobroExitoso();
            onClose(); 
        } else {
            const errorData = await response.json();
            alert("Error: " + errorData.detail);
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    } finally {
        setProcesando(false);
    }
  };

  return (
    // Fondo oscuro
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
        
        {/* Cajita blanca */}
        <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
            width: '500px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto'
        }}>
            
            <h2 style={{borderBottom: '2px solid #333', paddingBottom: '10px', color: '#333'}}>
                Cerrar Orden #{orden.folio_visual || orden.id}
            </h2>

            {/* Lista de servicios */}
            <div style={{marginBottom: '20px'}}>
                <h4 style={{color: '#555'}}>Resumen de Servicios:</h4>
                <ul style={{listStyle: 'none', padding: 0}}>
                    {servicios.map((item, index) => (
                        <li key={index} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '8px 0'}}>
                            <span>{item.falla_detectada} <small style={{color:'#888'}}>({item.tipo})</small></span>
                            <strong>${item.precio}</strong>
                        </li>
                    ))}
                </ul>
                <div style={{textAlign: 'right', fontSize: '1.4em', marginTop: '15px', borderTop:'2px solid #eee', paddingTop:'10px'}}>
                    Total a Pagar: <strong style={{color: '#2e7d32'}}>${total.toFixed(2)}</strong>
                </div>
            </div>

            {/* Selección de pago */}
            <div style={{backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
                <h4 style={{marginTop:0, color: '#1565c0'}}>Método de Pago:</h4>
                <div style={{display:'flex', gap:'20px'}}>
                    <label style={{cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'1.1em'}}>
                        <input 
                            type="radio" 
                            name="pago"
                            value="efectivo" 
                            checked={metodoPago === 'efectivo'} 
                            onChange={(e) => setMetodoPago(e.target.value)} 
                        />
                        💵 Efectivo
                    </label>
                    <label style={{cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'1.1em'}}>
                        <input 
                            type="radio" 
                            name="pago"
                            value="tarjeta" 
                            checked={metodoPago === 'tarjeta'} 
                            onChange={(e) => setMetodoPago(e.target.value)} 
                        />
                        💳 Tarjeta
                    </label>
                </div>
            </div>

            {/* Botones */}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button 
                    onClick={onClose}
                    style={{padding: '12px 20px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold'}}
                >
                    Cancelar
                </button>
                
                <button 
                    onClick={handleCobrar}
                    disabled={procesando}
                    style={{
                        padding: '12px 25px', 
                        background: procesando ? '#666' : '#2e7d32', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: procesando ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.1em',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                >
                    {procesando ? 'Procesando...' : '✅ Cobrar y Cerrar'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ModalCobro;