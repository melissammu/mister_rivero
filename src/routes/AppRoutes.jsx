import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/admin/Dashboard";
import AdminLayout from "../layouts/AdminLayout";

import Motores from "../pages/motores/Motores";
import RegistrarMotor from "../pages/motores/RegistrarMotor";
import Contenedor40 from "../pages/contenedor40/Contenedor40";
import Contenedor80 from "../pages/contenedor80/Contenedor80";
function AppRoutes() {
  return (
    <Routes>

  <Route path="/" element={<Login />} />

  <Route path="/admin" element={<AdminLayout />}>

    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="motores" element={<Motores />} />
    <Route path="motores/nuevo" element={<RegistrarMotor />} />
    <Route path="contenedor40" element={<Contenedor40 />} />
    <Route path="contenedor80" element={<Contenedor80 />} />
    
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />

</Routes>
  );
}

export default AppRoutes;