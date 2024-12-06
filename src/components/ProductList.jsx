import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, onValue, remove, update } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState({});
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingMaterials, setEditingMaterials] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            // Cargar productos
            const productsRef = ref(database, 'productos');
            onValue(productsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const userProducts = Object.keys(data)
                        .filter(key => data[key].userID === user.uid)
                        .map(key => ({
                            id: key,
                            ...data[key]
                        }));
                    setProducts(userProducts);
                } else {
                    setProducts([]);
                }
            });

            // Cargar materiales
            const materialsRef = ref(database, 'materiales');
            onValue(materialsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setMaterials(data);
                }
            });
        }
    }, []);

    const handleDelete = (id) => {
        const productRef = ref(database, `productos/${id}`);
        remove(productRef)
            .then(() => alert("Producto eliminado correctamente"))
            .catch((error) => alert("Error al eliminar producto: " + error.message));
    };

    const handleEdit = (product) => {
        setEditingProduct({ ...product });
        setEditingMaterials({ ...product.materiales }); // Copiar materiales seleccionados para edición
    };

    const handleMaterialChange = (materialId, newQuantity) => {
        setEditingMaterials((prev) => ({
            ...prev,
            [materialId]: newQuantity === "" ? "" : newQuantity, // Permite valores vacíos sin eliminar el material
        }));
    };    

    const handleToggleMaterial = (materialId, isSelected) => {
        setEditingMaterials((prev) => {
            if (isSelected) {
                return { ...prev, [materialId]: prev[materialId] || 1 }; // Mantiene el valor anterior o asigna 1
            } else {
                const { [materialId]: _, ...rest } = prev;
                return rest; // Elimina el material
            }
        });
    };    

    const recalculatePrice = () => {
        if (editingProduct && editingMaterials) {
            const totalCost = Object.entries(editingMaterials).reduce((acc, [materialId, cantidadNecesaria]) => {
                const material = materials[materialId];
                if (!material) return acc;
                const costoPorUnidad = material.costo / material.cantidad;
                const costoMaterial = costoPorUnidad * cantidadNecesaria;
                return acc + costoMaterial;
            }, 0);

            const unitCost = totalCost;
            const profitMarginDecimal = parseFloat(editingProduct.rentabilidad) / 100;
            const salePrice = unitCost * (1 + profitMarginDecimal);
            const totalProfit = (salePrice - unitCost) * parseFloat(editingProduct.ventasAproximadas);

            setEditingProduct((prev) => ({
                ...prev,
                costoUnitario: unitCost.toFixed(2),
                precioVenta: salePrice.toFixed(2),
                gananciaTotal: totalProfit.toFixed(2),
            }));
        }
    };

    const handleUpdate = () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user && editingProduct) {
            const productRef = ref(database, `productos/${editingProduct.id}`);
            update(productRef, {
                nombre: editingProduct.nombre,
                ventasAproximadas: editingProduct.ventasAproximadas,
                rentabilidad: editingProduct.rentabilidad,
                costoUnitario: editingProduct.costoUnitario,
                precioVenta: editingProduct.precioVenta,
                materiales: editingMaterials // Actualizar materiales editados
            })
                .then(() => {
                    alert("Producto actualizado correctamente");
                    setEditingProduct(null); // Reset editing state
                    setEditingMaterials({});
                })
                .catch((error) => alert("Error al actualizar producto: " + error.message));
        }
    };

    return (
        <div className="container">
            <h2>Mis Productos</h2>
            <button onClick={() => navigate("/createProduct")}>Regresar</button>
            <div className="grid-container">
                {products.length === 0 ? (
                    <p>No tienes productos guardados.</p>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="card">
                            <h3>{product.nombre}</h3>
                            <p>Ventas Aproximadas: {product.ventasAproximadas}</p>
                            <p>Rentabilidad: {product.rentabilidad}%</p>
                            <p>Costo Unitario: ${product.costoUnitario}</p>
                            <p>Precio de Venta: ${product.precioVenta}</p>
                            <button onClick={() => handleEdit(product)}>Editar</button>
                            <button onClick={() => handleDelete(product.id)}>Eliminar</button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para editar producto */}
            {editingProduct && (
                <div className="modal">
                    <h2>Editar Producto</h2>
                    <input
                        type="text"
                        value={editingProduct.nombre}
                        onChange={(e) => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
                    />
                    <input
                        type="number"
                        value={editingProduct.ventasAproximadas}
                        onChange={(e) => {
                            setEditingProduct({ ...editingProduct, ventasAproximadas: e.target.value });
                            recalculatePrice();
                        }}
                    />
                    <input
                        type="number"
                        value={editingProduct.rentabilidad}
                        onChange={(e) => {
                            setEditingProduct({ ...editingProduct, rentabilidad: e.target.value });
                            recalculatePrice();
                        }}
                    />
                    <h3>Materiales</h3>
                    {Object.entries(materials).map(([materialId, material]) => (
                        <div key={materialId}>
                            <input
                                type="checkbox"
                                checked={!!editingMaterials[materialId]}
                                onChange={(e) => handleToggleMaterial(materialId, e.target.checked)}
                            />
                            <span>{material.nombre}</span>
                            {/* Mostrar el input solo si el checkbox está activo */}
                            {editingMaterials[materialId] !== undefined && (
                                <input
                                    type="number"
                                    value={editingMaterials[materialId]}
                                    onChange={(e) => {
                                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                                        handleMaterialChange(materialId, value);
                                    }}
                                    min="0" // Evitar valores negativos
                                    placeholder="Cantidad"
                                />
                            )}
                        </div>
                    ))}
                    <p>Costo Unitario: ${editingProduct.costoUnitario}</p>
                    <p>Precio de Venta: ${editingProduct.precioVenta}</p>
                    <p>Ganancia Total Estimada: ${editingProduct.gananciaTotal}</p>
                    <button onClick={handleUpdate}>Guardar</button>
                    <button onClick={() => {
                        setEditingProduct(null);
                        setEditingMaterials({});
                    }}>
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductList;
