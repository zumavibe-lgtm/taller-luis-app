import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Importamos el Router
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos la App para activar la navegación */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)