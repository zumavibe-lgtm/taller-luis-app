import logging
import os
from datetime import datetime

# Esto crea la carpeta 'logs' si no existe, para que no te de error
if not os.path.exists('logs'):
    os.makedirs('logs')

# Configuración: Esto dice "Guarda todo en un archivo con la fecha de hoy"
nombre_log = f"logs/errores_{datetime.now().strftime('%Y-%m-%d')}.txt"

logging.basicConfig(
    filename=nombre_log,
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def guardar_error_log(origen, error_real):
    """
    origen: En qué parte del sistema falló (ej: "Guardar Servicio")
    error_real: El mensaje técnico feo que te da Python
    """
    mensaje = f"FALLA EN: {origen} | DETALLE: {error_real}"
    logging.error(mensaje)
    print(f"🔴 ERROR GUARDADO EN LOG: {mensaje}") # Esto te lo muestra en la consola negra también