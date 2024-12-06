import React, { useEffect, useState } from "react";
import { auth, database } from "../firebaseConfig";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [hasMaterials, setHasMaterials] = useState(false); // Estado para verificar si el usuario tiene materiales
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const userRef = ref(database, `users/${user.uid}`);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              setUserName(data.name);
            } else {
              console.log("No se encontraron datos para este usuario.");
            }
          })
          .catch((error) => {
            console.error("Error al obtener los datos:", error);
          });

        // Verificar si el usuario tiene al menos un material
        const materialsRef = ref(database, `materiales`);
        get(materialsRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const materialsData = snapshot.val();
              const userMaterials = Object.values(materialsData).filter(
                (material) => material.userID === user.uid
              );
              setHasMaterials(userMaterials.length > 0);
            }
          })
          .catch((error) => {
            console.error("Error al obtener los materiales:", error);
          });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleCreateProduct = () => {
    if (hasMaterials) {
      navigate("/createProduct");
    } else {
      alert("Debes crear al menos un material antes de crear un producto.");
    }
  };

  return (
    <div className="container">
      {user ? (
        <h1>Hola, {userName || "Cargando nombre..."}</h1>
      ) : (
        <h1>Cargando...</h1>
      )}
      <button
        onClick={() => auth.signOut().then(() => navigate("/login"))}
        style={{ backgroundColor: "#dc3545" }}
      >
        Cerrar sesión
      </button>
      <button
        onClick={() => navigate("/materialForm")}
        style={{ backgroundColor: "#28a745" }}
      >
        Agregar Material
      </button>
      <button
        onClick={handleCreateProduct}
        style={{ backgroundColor: "#007bff" }}
      >
        Crear Producto
      </button>
    </div>
  );
};

export default Home;
