import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './CreateProduct.css';

const UNIDAD_CONVERSION = {
    kilogramos: 1000,
    gramos: 1,
    litros: 1000,
    mililitros: 1,
    unidades: 1,
};

const CreateProduct = () => {
    const [materials, setMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState({});
    const [productName, setProductName] = useState("");
    const [approxSales, setApproxSales] = useState("");
    const [profitMargin, setProfitMargin] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            const materialsRef = ref(database, 'materiales');
            onValue(materialsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
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
        }
    }, []);

    const handleSelectMaterial = (material, isChecked, quantity = '', unit = '') => {
        setSelectedMaterials(prev => {
            if (!isChecked) {
                const { [material.id]: _, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [material.id]: { ...material, cantidadNecesaria: quantity, unidadSeleccionada: unit }
            };
        });
    };

    const handleCreateProduct = () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert("Usuario no autenticado");
            return;
        }

        if (Object.keys(selectedMaterials).length === 0) {
            alert("Por favor selecciona al menos un material para crear el producto y especifica las cantidades.");
            return;
        }
        if (!productName || !approxSales || !profitMargin) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const totalCost = Object.entries(selectedMaterials).reduce((acc, [materialId, materialInfo]) => {
            const material = materials.find((m) => m.id === materialId);
            if (!material) return acc;

            const conversionRate =
                UNIDAD_CONVERSION[materialInfo.unidadSeleccionada] /
                UNIDAD_CONVERSION[material.unidadMedida];
            const baseCostPerUnit = parseFloat(material.costo) / parseFloat(material.cantidad);
            const requiredQuantity = parseFloat(materialInfo.cantidadNecesaria || 0) * conversionRate;

            if (isNaN(baseCostPerUnit) || isNaN(requiredQuantity)) {
                console.error("Error en los datos del material:", material, materialInfo);
                return acc;
            }

            return acc + baseCostPerUnit * requiredQuantity;
        }, 0);

        const unitCost = totalCost;
        const profitMarginDecimal = parseFloat(profitMargin) / 100;
        const salePrice = unitCost * (1 + profitMarginDecimal);

        if (isNaN(unitCost) || isNaN(salePrice)) {
            console.error("Error en los cálculos de costo o precio:", { unitCost, salePrice });
            alert("Error en los cálculos, revisa los datos ingresados.");
            return;
        }

        const newProduct = {
            nombre: productName,
            ventasAproximadas: parseFloat(approxSales),
            rentabilidad: profitMargin,
            costoUnitario: unitCost.toFixed(2),
            precioVenta: salePrice.toFixed(2),
            gananciaTotal: ((salePrice - unitCost) * parseFloat(approxSales)).toFixed(2),
            userID: user.uid,
            materiales: selectedMaterials,
        };

        const productsRef = ref(database, 'productos');
        push(productsRef, newProduct)
            .then(() => {
                alert(`Producto "${productName}" creado con éxito.`);
                setProductName("");
                setApproxSales("");
                setProfitMargin("");
                setSelectedMaterials({});
                navigate("/createProduct");
            })
            .catch((error) => {
                console.error("Error al guardar el producto en Firebase:", error);
                alert("Hubo un error al crear el producto. Inténtalo nuevamente.");
            });
    };

    return (
        <div className="container">
            <h2>Crear Producto</h2>
            <label>
                Nombre del Producto:
                <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                />
            </label>
            <label>
                Cantidad Aproximada de Ventas:
                <input
                    type="number"
                    value={approxSales}
                    onChange={(e) => setApproxSales(e.target.value)}
                    required
                />
            </label>
            <label>
                Porcentaje de Rentabilidad:
                <input
                    type="number"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                    required
                />
            </label>
            <p>Selecciona los materiales necesarios para la fabricación de UNA UNIDAD de tu producto:</p>
            <div className="materials-grid">
                {materials.map((material) => (
                    <div
                        key={material.id}
                        className={`material-card ${selectedMaterials[material.id] ? "selected" : ""}`}
                    >
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                onChange={(e) =>
                                    handleSelectMaterial(
                                        material,
                                        e.target.checked,
                                        selectedMaterials[material.id]?.cantidadNecesaria || '',
                                        selectedMaterials[material.id]?.unidadSeleccionada || ''
                                    )
                                }
                                checked={!!selectedMaterials[material.id]}
                            />
                        </div>
                        <div className="material-info">
                            <h4>{material.nombre}</h4>
                            <p>Costo: ${material.costo}</p>
                            <p>Cantidad: {material.cantidad} {material.unidadMedida}</p>
                        </div>
                        {selectedMaterials[material.id] && (
                            <div className="material-controls">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={selectedMaterials[material.id]?.cantidadNecesaria || ''}
                                    placeholder="Cantidad"
                                    onChange={(e) =>
                                        handleSelectMaterial(
                                            material,
                                            true,
                                            e.target.value,
                                            selectedMaterials[material.id]?.unidadSeleccionada || ''
                                        )
                                    }
                                />
                                <select
                                    value={selectedMaterials[material.id]?.unidadSeleccionada || ''}
                                    onChange={(e) =>
                                        handleSelectMaterial(
                                            material,
                                            true,
                                            selectedMaterials[material.id]?.cantidadNecesaria || '',
                                            e.target.value
                                        )
                                    }
                                >
                                    {Object.keys(UNIDAD_CONVERSION).map((unidad) => (
                                        <option key={unidad} value={unidad}>
                                            {unidad}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button onClick={handleCreateProduct} className="create-product-button">
                Crear Producto
            </button>
            <button onClick={() => navigate("/home")} className="back-button">
                Regresar
            </button>
        </div>
    );
};

export default CreateProduct;
