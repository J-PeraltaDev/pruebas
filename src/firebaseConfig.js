// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFZwxnJ_26xNEwfyNG0TItxbo9ZKEuCKo",
  authDomain: "login-registro-d81eb.firebaseapp.com",
  projectId: "login-registro-d81eb",
  storageBucket: "login-registro-d81eb.firebasestorage.app",
  messagingSenderId: "578770978679",
  appId: "1:578770978679:web:f7084d5317a7c70fdd8372"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);