
// Importar las funciones necesarias desde el SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Importa Realtime Database

// Configuración de Firebase para la aplicación web
const firebaseConfig = {
  apiKey: "AIzaSyDR5yj4fqG2z9T2LjsZ9xLYBRirhUuT11E",
  authDomain: "calculadora-6ea00.firebaseapp.com",
  projectId: "calculadora-6ea00",
  storageBucket: "calculadora-6ea00.appspot.com", // Corrige esto (el dominio termina en .appspot.com)
  messagingSenderId: "321990304174",
  appId: "1:321990304174:web:849aae229079733151683f",
  databaseURL: "https://calculadora-6ea00-default-rtdb.firebaseio.com" // Agrega la URL de la Realtime Database
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app); // Exporta la base de datos para usarla en otros archivos


