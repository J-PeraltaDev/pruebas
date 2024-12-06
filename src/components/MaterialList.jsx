
import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, onValue, remove, update } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './MaterialList.css';

const MaterialList = () => {
    const [materials, setMaterials] = useState([]);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            // Nueva referencia a `materiales/`
            const materialsRef = ref(database, 'materiales');
            const unsubscribe = onValue(materialsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Filtra los materiales que pertenecen al usuario actual
                    const userMaterials = Object.keys(data)
                        .filter(key => data[key].userID === user.uid)
                        .map(key => ({
                            id: key,
                            ...data[key]
                        }));
                    setMaterials(userMaterials);
                } else {
                    setMaterials([]);
                }
            });

            return () => unsubscribe();
        }
    }, []);

    const handleDelete = (id) => {
        const materialRef = ref(database, `materiales/${id}`);
        remove(materialRef)
            .then(() => alert("Material eliminado correctamente"))
            .catch((error) => alert("Error al eliminar: " + error.message));
    };

    const handleEdit = (material) => {
        setEditingMaterial(material);
    };

    const handleUpdate = () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user && editingMaterial) {
            const materialRef = ref(database, `materiales/${editingMaterial.id}`);
            update(materialRef, {
                nombre: editingMaterial.nombre,
                costo: editingMaterial.costo,
                cantidad: editingMaterial.cantidad,
                unidadMedida: editingMaterial.unidadMedida
            })
                .then(() => {
                    alert("Material actualizado correctamente");
                    setEditingMaterial(null); // Resetear estado de edición
                })
                .catch((error) => alert("Error al actualizar material: " + error.message));
        }
    };

    return (
        <div className="container">
            <h2>Mis Materiales</h2>
            <button onClick={() => navigate("/materialForm")}>Regresar</button>
            <div className="grid-container">
                {materials.length === 0 ? (
                    <p>No tienes materiales guardados.</p>
                ) : (
                    materials.map((material) => (
                        <div key={material.id} className="card">
                            <h3>{material.nombre}</h3>
                            <p>Costo: {material.costo}</p>
                            <p>Cantidad: {material.cantidad}</p>
                            <p>Unidad: {material.unidadMedida}</p>
                            <button onClick={() => handleEdit(material)}>Editar</button>
                            <button onClick={() => handleDelete(material.id)}>Eliminar</button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para editar el material */}
            {editingMaterial && (
                <div className="modal">
                    <h2>Editar Material</h2>
                    <input
                        type="text"
                        value={editingMaterial.nombre}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, nombre: e.target.value })}
                    />
                    <input
                        type="number"
                        value={editingMaterial.costo}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, costo: parseFloat(e.target.value) })}
                    />
                    <input
                        type="number"
                        value={editingMaterial.cantidad}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, cantidad: e.target.value })}
                    />
                    <select
                        value={editingMaterial.unidadMedida}
                        onChange={(e) => setEditingMaterial({ ...editingMaterial, unidadMedida: e.target.value })}
                    >
                        <option value="kilogramos">Kilogramos</option>
                        <option value="litros">Litros</option>
                        <option value="mililitros">Mililitros</option>
                        <option value="gramos">Gramos</option>
                        <option value="unidades">Unidades</option>
                        <option value="no se">No se</option>
                    </select>
                    <button onClick={handleUpdate}>Guardar</button>
                    <button onClick={() => setEditingMaterial(null)}>Cancelar</button>
                </div>
            )}
        </div>
    );
};

export default MaterialList;
