import React from 'react'

const TicketImprimible = ({ orden, cliente, vehiculo, detalles }) => {
  // Si falta algún dato, mostramos un aviso en blanco
  if (!orden || !cliente || !vehiculo) return <div style={{padding:20}}>Faltan datos para imprimir...</div>

  const total = detalles.reduce((suma, item) => suma + item.precio, 0)
  const fecha = new Date().toLocaleDateString('es-MX')

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '300px', fontFamily: 'Courier New, monospace', fontSize: '12px', color: 'black', backgroundColor: 'white' }}>
      
      {/* ENCABEZADO */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: '0 0 5px 0' }}>🚀 TALLER LUIS</h2>
        <p style={{ margin: 0 }}>Av. Principal #123, Apodaca</p>
        <p style={{ margin: 0 }}>Tel: 81-1234-5678</p>
      </div>

      <hr style={{ borderTop: '1px dashed black' }} />

      {/* DATOS GENERALES */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ margin: '2px 0' }}><strong>Folio:</strong> {orden.folio_visual}</p>
        <p style={{ margin: '2px 0' }}><strong>Fecha:</strong> {fecha}</p>
        <p style={{ margin: '2px 0' }}><strong>Cliente:</strong> {cliente.nombre_completo}</p>
        <p style={{ margin: '2px 0' }}><strong>Vehículo:</strong> {vehiculo.marca} {vehiculo.modelo}</p>
      </div>

      <hr style={{ borderTop: '1px dashed black' }} />

      {/* DETALLES DE LA ORDEN */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
            <tr style={{borderBottom: '1px solid black'}}>
                <th style={{textAlign:'left', width:'10%'}}>Cant</th>
                <th style={{textAlign:'left'}}>Desc</th>
                <th style={{textAlign:'right'}}>Imp</th>
            </tr>
        </thead>
        <tbody>
            {detalles.map((d, index) => (
                <tr key={index}>
                    <td style={{verticalAlign: 'top', paddingTop:'5px'}}>1</td>
                    
                    {/* DESCRIPCIÓN + NOTA DE CLIENTE */}
                    <td style={{verticalAlign: 'top', paddingTop:'5px'}}>
                        {d.falla_detectada}
                        {d.es_refaccion_cliente && (
                            <div style={{fontSize: '10px', fontStyle: 'italic', fontWeight:'bold'}}>
                                (Pieza de Cliente)
                            </div>
                        )}
                    </td>

                    {/* PRECIO */}
                    <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop:'5px' }}>
                        ${d.precio.toFixed(2)}
                    </td>
                </tr>
            ))}
        </tbody>
      </table>

      <hr style={{ borderTop: '1px dashed black' }} />

      {/* TOTALES */}
      <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
        TOTAL: ${total.toFixed(2)}
      </div>
      
      {/* NOTA AL PIE */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px' }}>
        <p>¡Gracias por su preferencia!</p>
        <p>Garantía de servicio: 30 días</p>
      </div>

    </div>
  )
}

export default TicketImprimible