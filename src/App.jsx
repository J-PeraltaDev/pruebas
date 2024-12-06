import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import MaterialForm from "./components/MaterialForm";
import MaterialList from "./components/MaterialList";
import CreateProduct from "./components/CreateProduct";
import ProductList from "./components/ProductList";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/materialForm" element={<MaterialForm />} />
      <Route path="/material-list" element={<MaterialList />} />
      <Route path="/createProduct" element={<CreateProduct />} /> 
      <Route path="/productList" element={<ProductList />} />
    </Routes>
  );
}



export default App;