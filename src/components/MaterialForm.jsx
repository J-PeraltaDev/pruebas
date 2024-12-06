import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";  // Esto se mantiene si ya lo tienes configurado
import { getDatabase, ref, push, set, onValue } from "firebase/database";  // Importa todo correctamente
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const MaterialForm = () => {
    const [material, setMaterial] = useState({
        nombre: "",
        costo: "",
        cantidad: "",
        unidadMedida: "",
    });
    const [user, setUser] = useState(null);
    const [materials, setMaterials] = useState([]); // Estado para guardar los materiales del usuario
    const navigate = useNavigate();

    const unidadesMedida = ["kilogramos", "litros", "mililitros", "gramos", "unidades", "no se"];

    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
        });
    }, []);

    // con este codigo se guarda el id de materiales en users tambien
    // const handleSaveMaterial = (e) => {
    //     e.preventDefault();
    
    //     if (!user) {
    //         alert("Usuario no autenticado.");
    //         return;
    //     }
    
    //     // Referencia a la base de datos de materiales fuera de la carpeta de usuarios
    //     const materialsRef = ref(database, 'materiales');
    
    //     // Crear un objeto para el nuevo material con el userID
    //     const newMaterial = {
    //         nombre: material.nombre,
    //         cantidad: material.cantidad,
    //         costo: material.costo,
    //         unidadMedida: material.unidadMedida,
    //         userID: user.uid // Asociamos el material con el ID del usuario
    //     };
    
    //     // Usamos push para generar un ID único para el material
    //     push(materialsRef, newMaterial)
    //         .then((snapshot) => {
    //             const materialID = snapshot.key; // ID generado para el material
    
    //             // Guardamos el material con su estructura en la carpeta `materiales`
    //             const materialRef = ref(database, `materiales/${materialID}`);
    //             set(materialRef, newMaterial)
    //                 .then(() => {
    //                     // También asociamos este material con el usuario
    //                     const userMaterialsRef = ref(database, `users/${user.uid}/materiales/${materialID}`);
    //                     set(userMaterialsRef, true)
    //                         .then(() => {
    //                             alert("Material guardado correctamente");
    //                             setMaterial({ nombre: "", costo: "", cantidad: "", unidadMedida: "" });
    //                         })
    //                         .catch((error) => {
    //                             alert("Error al guardar la referencia del material para el usuario: " + error.message);
    //                         });
    //                 })
    //                 .catch((error) => {
    //                     alert("Error al guardar el material: " + error.message);
    //                 });
    //         })
    //         .catch((error) => {
    //             alert("Error al guardar el material en la base de datos: " + error.message);
    //         });
    // };


    const handleSaveMaterial = (e) => {
        e.preventDefault();
    
        if (!user) {
            alert("Usuario no autenticado.");
            return;
        }
    
        // Referencia a la base de datos de materiales fuera de la carpeta de usuarios
        const materialsRef = ref(database, 'materiales');
    
        // Crear un objeto para el nuevo material con el userID
        const newMaterial = {
            nombre: material.nombre,
            cantidad: material.cantidad,
            costo: material.costo,
            unidadMedida: material.unidadMedida,
            userID: user.uid // Asociamos el material con el ID del usuario
        };
    
        // Usamos push para generar un ID único para el material
        push(materialsRef, newMaterial)
            .then((snapshot) => {
                const materialID = snapshot.key; // ID generado para el material
    
                // Guardamos el material con su estructura en la carpeta `materiales`
                const materialRef = ref(database, `materiales/${materialID}`);
                set(materialRef, newMaterial)
                    .then(() => {
                        alert("Material guardado correctamente");
                        setMaterial({ nombre: "", costo: "", cantidad: "", unidadMedida: "" });
                    })
                    .catch((error) => {
                        alert("Error al guardar el material: " + error.message);
                    });
            })
            .catch((error) => {
                alert("Error al guardar el material en la base de datos: " + error.message);
            });
    };
    
    
    

    const handleViewMaterials = () => {
        if (!user) {
            alert("Usuario no autenticado.");
            return;
        }

        const materialsRef = ref(database, `users/${user.uid}/materiales`);

        onValue(materialsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const materialsArray = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key]
                }));
                setMaterials(materialsArray);
            } else {
                setMaterials([]);
            }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMaterial((prevMaterial) => ({
            ...prevMaterial,
            [name]: name === "costo" || name === "cantidad" ? parseFloat(value) : value,
        }));
    };

    return (
        <div className="container">
            <h2>Registrar Material</h2>
            <form onSubmit={handleSaveMaterial}>
                <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    value={material.nombre}
                    onChange={handleChange}
                    required
                />
                <input
                    type="number"
                    name="costo"
                    placeholder="Costo"
                    value={material.costo}
                    onChange={handleChange}
                    step="0.01"
                    required
                />
                <input
                    type="number"
                    name="cantidad"
                    placeholder="Cantidad"
                    value={material.cantidad}
                    onChange={handleChange}
                    required
                />
                <label>
                    Unidad de medida:
                    <select
                        name="unidadMedida"
                        value={material.unidadMedida}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona una unidad</option>
                        {unidadesMedida.map((unidad) => (
                            <option key={unidad} value={unidad}>
                                {unidad}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit">Guardar Material</button>
                <button type="button" onClick={() => navigate("/material-list")}>Ver mis materiales</button>
                <button type="button" onClick={() => navigate("/home")} style={{ backgroundColor: "#9b9b9b" }}>Volver</button>
            </form>
        </div>
    );
};

export default MaterialForm;
