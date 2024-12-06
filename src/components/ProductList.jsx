import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, onValue, remove, update } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './ProductList.css';

const UNIDAD_CONVERSION = {
    kilogramos: 1000,
    gramos: 1,
    litros: 1000,
    mililitros: 1,
    unidades: 1,
};

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
                            ...data[key],
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

    const recalculatePrice = (updatedMaterials = editingMaterials) => {
        if (editingProduct && updatedMaterials) {
            let totalCost = 0;
    
            Object.entries(updatedMaterials).forEach(([materialId, materialInfo]) => {
                const material = materials[materialId];
                if (!material) return;
    
                const requiredQuantity = parseFloat(materialInfo.cantidadNecesaria);
                const selectedUnit = materialInfo.unidadSeleccionada;
    
                if (
                    isNaN(requiredQuantity) ||
                    requiredQuantity <= 0 ||
                    !selectedUnit ||
                    !UNIDAD_CONVERSION[selectedUnit] ||
                    !UNIDAD_CONVERSION[material.unidadMedida]
                ) {
                    console.warn(`Datos inválidos para el material: ${materialId}`);
                    return;
                }
    
                const conversionRate =
                    UNIDAD_CONVERSION[selectedUnit] /
                    UNIDAD_CONVERSION[material.unidadMedida];
    
                if (conversionRate <= 0 || isNaN(conversionRate)) {
                    console.error(`Error en la conversión de unidades: ${selectedUnit} -> ${material.unidadMedida}`);
                    return;
                }
    
                const baseCostPerUnit = material.costo / material.cantidad;
    
                console.log(`
                    Material: ${material.nombre},
                    Cantidad Necesaria: ${requiredQuantity},
                    Unidad Seleccionada: ${selectedUnit},
                    Tasa de Conversión: ${conversionRate},
                    Costo Base por Unidad: ${baseCostPerUnit}
                `);
    
                totalCost += baseCostPerUnit * requiredQuantity * conversionRate;
            });
    
            console.log(`Costo Total Calculado: ${totalCost}`);
    
            const profitMarginDecimal = parseFloat(editingProduct.rentabilidad) / 100 || 0;
            const salePrice = totalCost * (1 + profitMarginDecimal);
            const totalProfit =
                (salePrice - totalCost) * parseFloat(editingProduct.ventasAproximadas || 0);
    
            setEditingProduct((prev) => ({
                ...prev,
                costoUnitario: totalCost.toFixed(2),
                precioVenta: salePrice.toFixed(2),
                gananciaTotal: totalProfit.toFixed(2),
            }));
        }
    };
    
    
    const handleMaterialChange = (materialId, quantity, unit) => {
        setEditingMaterials((prev) => ({
            ...prev,
            [materialId]: { ...prev[materialId], cantidadNecesaria: quantity, unidadSeleccionada: unit },
        }));
    };
    
    const handleToggleMaterial = (materialId, isSelected) => {
        setEditingMaterials((prev) => {
            if (isSelected) {
                return {
                    ...prev,
                    [materialId]: prev[materialId] || {
                        cantidadNecesaria: "",
                        unidadSeleccionada: materials[materialId]?.unidadMedida || "",
                    },
                };
            } else {
                const { [materialId]: _, ...rest } = prev;
                return rest;
            }
        });
    };    

    const handleUpdateProductField = (field, value) => {
        const updatedProduct = { ...editingProduct, [field]: value };
        setEditingProduct(updatedProduct);
        recalculatePrice();
    };

    const handleUpdate = () => {
        console.log("Datos iniciales de materiales:", materials);
        console.log("Materiales seleccionados para edición:", editingMaterials);


        if (!editingProduct || !editingMaterials || !materials) {
            console.error("Datos incompletos para calcular el producto.");
            return;
        }
    
        let totalCost = 0;
    
        Object.entries(editingMaterials).forEach(([materialId, materialInfo]) => {
            const material = materials[materialId];
            if (!material || !materialInfo.cantidadNecesaria || !materialInfo.unidadSeleccionada) {
                console.warn(`Datos inválidos para el material: ${materialId}`);
                return;
            }
    
            const conversionRate =
                UNIDAD_CONVERSION[materialInfo.unidadSeleccionada] /
                UNIDAD_CONVERSION[material.unidadMedida];
            const baseCostPerUnit = material.costo / material.cantidad;
            const requiredQuantity = parseFloat(materialInfo.cantidadNecesaria);
    
            if (isNaN(requiredQuantity) || isNaN(baseCostPerUnit) || isNaN(conversionRate)) {
                console.warn(`Cálculo inválido para material: ${material.nombre}`);
                return;
            }
    
            totalCost += baseCostPerUnit * requiredQuantity * conversionRate;
        });
    
        const profitMarginDecimal = parseFloat(editingProduct.rentabilidad) / 100 || 0;
        const salePrice = totalCost * (1 + profitMarginDecimal);
        const totalProfit =
            (salePrice - totalCost) * parseFloat(editingProduct.ventasAproximadas || 0);
    
        const updatedProduct = {
            ...editingProduct,
            costoUnitario: totalCost.toFixed(2),
            precioVenta: salePrice.toFixed(2),
            gananciaTotal: totalProfit.toFixed(2),
        };
    
        const productRef = ref(database, `productos/${editingProduct.id}`);
        update(productRef, {
            ...updatedProduct,
            materiales: editingMaterials,
        })
            .then(() => {
                alert("Producto actualizado correctamente");
                setEditingProduct(null); // Reset editing state
                setEditingMaterials({});
            })
            .catch((error) => alert("Error al actualizar producto: " + error.message));
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
                            <p>Ganancia Total Estimada: ${product.gananciaTotal}</p>
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
                        onChange={(e) => handleUpdateProductField("nombre", e.target.value)}
                    />
                    <input
                        type="number"
                        value={editingProduct.ventasAproximadas}
                        onChange={(e) => handleUpdateProductField("ventasAproximadas", e.target.value)}
                    />
                    <input
                        type="number"
                        value={editingProduct.rentabilidad}
                        onChange={(e) => handleUpdateProductField("rentabilidad", e.target.value)}
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
                            {editingMaterials[materialId] && (
                                <>
                                    <input
                                        type="number"
                                        value={editingMaterials[materialId]?.cantidadNecesaria || ''}
                                        onChange={(e) => handleMaterialChange(
                                            materialId,
                                            e.target.value,
                                            editingMaterials[materialId]?.unidadSeleccionada
                                        )}
                                        placeholder="Cantidad"
                                    />
                                    <select
                                        value={editingMaterials[materialId]?.unidadSeleccionada || ''}
                                        onChange={(e) => handleMaterialChange(
                                            materialId,
                                            editingMaterials[materialId]?.cantidadNecesaria,
                                            e.target.value
                                        )}
                                    >
                                        {Object.keys(UNIDAD_CONVERSION).map((unidad) => (
                                            <option key={unidad} value={unidad}>
                                                {unidad}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}
                        </div>
                    ))}
                    <button onClick={handleUpdate}>Guardar</button>
                    <button onClick={() => setEditingProduct(null)}>Cancelar</button>
                </div>
            )}
        </div>
    );
};

export default ProductList;