import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, push, set, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const MaterialForm = () => {
    const [material, setMaterial] = useState({
        nombre: "",
        costo: "",
        cantidad: "",
        unidadMedida: "kilogramos",
    });
    const [user, setUser] = useState(null);
    const [materials, setMaterials] = useState([]); 
    const navigate = useNavigate();

    const unidadesMedida = ["kilogramos", "gramos", "litros", "mililitros", "unidades"];

    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser || null);
        });
    }, []);

    const handleSaveMaterial = (e) => {
        e.preventDefault();

        if (!user) {
            alert("Usuario no autenticado.");
            return;
        }

        const { nombre, costo, cantidad, unidadMedida } = material;

        // Validaciones
        if (!nombre || isNaN(costo) || isNaN(cantidad) || costo <= 0 || cantidad <= 0 || !unidadMedida) {
            alert("Por favor, completa todos los campos con valores válidos.");
            return;
        }

        const materialsRef = ref(database, 'materiales');
        const newMaterial = {
            nombre,
            costo: parseFloat(costo),
            cantidad: parseFloat(cantidad),
            unidadMedida,
            userID: user.uid,
        };

        push(materialsRef, newMaterial)
            .then(() => {
                alert("Material guardado correctamente.");
                setMaterial({ nombre: "", costo: "", cantidad: "", unidadMedida: "kilogramos" });
            })
            .catch((error) => {
                alert("Error al guardar el material: " + error.message);
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
                    ...data[key],
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
