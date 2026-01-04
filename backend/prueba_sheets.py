import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json
import os

def probar_conexion():
    print("\n--- 🕵️ INICIANDO DIAGNÓSTICO DE GOOGLE SHEETS ---")
    
    # 1. VERIFICAR DONDE ESTAMOS
    directorio_actual = os.getcwd()
    print(f"📂 Carpeta actual: {directorio_actual}")
    
    ruta_credenciales = os.path.join(directorio_actual, "credentials.json")
    
    if os.path.exists(ruta_credenciales):
        print("✅ Archivo 'credentials.json' ENCONTRADO.")
    else:
        print("❌ ERROR FATAL: No encuentro 'credentials.json'.")
        print(f"   Debes poner el archivo aquí: {ruta_credenciales}")
        return

    # 2. LEER EL CORREO DEL ROBOT
    try:
        with open("credentials.json") as f:
            datos = json.load(f)
            email_robot = datos.get('client_email', 'No encontrado')
            print(f"\n🤖 EL CORREO DEL ROBOT ES:\n   👉 {email_robot} 👈")
            print("\n⚠️ IMPORTANTE: Ve a tu Google Sheet, dale 'Compartir' y pega ese correo como EDITOR.")
    except Exception as e:
        print(f"❌ El archivo credentials.json parece estar dañado: {e}")
        return

    # 3. INTENTAR CONECTAR
    print("\n--- INTENTANDO CONECTAR CON GOOGLE... ---")
    try:
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
        client = gspread.authorize(creds)
        print("✅ Credenciales aceptadas por Google.")

        # ID DE TU HOJA
        SHEET_ID = "1y6nW9C8diwITs_lqpH6fjNlVuH90E4oiS5NTXfRm6kc" 
        
        # Intentamos abrir la primera hoja por índice (0)
        sheet = client.open_by_key(SHEET_ID).get_worksheet(0)
        print(f"✅ ¡ÉXITO TOTAL! Conectado a la hoja: '{sheet.title}'")
        
        # Prueba de escritura
        sheet.append_row(["PRUEBA DE CONEXIÓN", "SI FUNCIONA", "ARTURO"])
        print("✅ Se escribió una fila de prueba en tu Excel.")

    except Exception as e:
        print("\n❌ FALLÓ LA CONEXIÓN. Aquí está el error exacto:")
        print(e)

if __name__ == "__main__":
    probar_conexion()