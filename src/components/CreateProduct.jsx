import React, { useEffect, useState } from 'react';
import { database } from "../firebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

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

    const handleSelectMaterial = (material, isChecked, quantity = '') => {
        setSelectedMaterials(prev => {
            if (!isChecked) {
                const { [material.id]: _, ...rest } = prev;  // Remove the material from the selected materials
                return rest;
            }

            // No immediate conversion to number, handle it as string to allow for decimal input
            return {
                ...prev,
                [material.id]: { ...material, cantidadNecesaria: quantity }
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
    
        // Calcular el costo total ajustado para fabricar una unidad del producto
        const totalCost = Object.entries(selectedMaterials).reduce((acc, [materialId, materialInfo]) => {
            const material = materials.find((m) => m.id === materialId); // Buscar información del material
            if (!material) return acc; // Si el material no está disponible, lo ignoramos
    
            // Convertir valores a flotantes para evitar problemas
            const costoPorUnidad = parseFloat(material.costo) / parseFloat(material.cantidad); // Costo por unidad del material
            const cantidadNecesaria = parseFloat(materialInfo.cantidadNecesaria || 0); // Cantidad necesaria para el producto
    
            if (isNaN(costoPorUnidad) || isNaN(cantidadNecesaria)) {
                console.error("Error en los datos del material:", material, materialInfo);
                return acc;
            }
    
            const costoMaterial = costoPorUnidad * cantidadNecesaria; // Costo proporcional del material
            return acc + costoMaterial;
        }, 0);
    
        // Costo unitario y precio de venta
        const unitCost = totalCost;
        const profitMarginDecimal = parseFloat(profitMargin) / 100;
        const salePrice = unitCost * (1 + profitMarginDecimal);
    
        // Validar cálculos
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
            <p>Selecciona los materiales necesarios para la fabricación de tu producto:</p>
            <div className="materials-list">
                {materials.map((material) => (
                    <div key={material.id} className="material-card">
                        <input
                            type="checkbox"
                            onChange={(e) => handleSelectMaterial(material, e.target.checked, selectedMaterials[material.id]?.cantidadNecesaria || '')}
                            checked={!!selectedMaterials[material.id]}
                        />
                        <label>{material.nombre} - {material.cantidad} {material.unidadMedida}</label>
                        {selectedMaterials[material.id] && (
                            <input
                                type="text"
                                min="0"
                                step="0.01"  // Allow finer control for decimals
                                value={selectedMaterials[material.id]?.cantidadNecesaria || ''}
                                onChange={(e) => handleSelectMaterial(material, true, e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />
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
            <button onClick={() => navigate("/productList")} className="view-products-button">
                Ver Productos
            </button>
        </div>
    );
};

export default CreateProduct;
