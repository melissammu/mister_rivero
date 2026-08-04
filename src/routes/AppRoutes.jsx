import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Dashboard from "../pages/admin/Dashboard";
import AdminLayout from "../layouts/AdminLayout";

import Motores from "../pages/motores/Motores";
import RegistrarMotor from "../pages/motores/RegistrarMotor";
import Contenedor40 from "../pages/contenedor40/Contenedor40";
import Contenedor80 from "../pages/contenedor80/Contenedor80";
import Partes from "../pages/partes/Partes";
import Pedidos from "../pages/pedidos/Pedidos";

import CatalogoPublico from "../pages/catalogo/CatalogoPublico";
import ProductoDetalle from "../pages/catalogo/ProductoDetalle";
import RegistroUsuario from "../pages/authUsuario/RegistroUsuario";
import LoginUsuario from "../pages/authUsuario/LoginUsuario";
import Carrito from "../pages/carrito/Carrito";
export default function AppRoutes() {
  return (
    <Routes>
      {/* ==============================
          RUTAS PÚBLICAS
      ============================== */}

      <Route
        path="/"
        element={<Login />}
      />
      <Route
  path="/carrito"
  element={<Carrito />}
/>
      <Route
        path="/catalogo"
        element={<CatalogoPublico />}
      />

      <Route
        path="/catalogo/producto/:tipo/:id"
        element={<ProductoDetalle />}
      />

      {/* ==============================
          PANEL ADMINISTRATIVO
      ============================== */}
            <Route
        path="/admin"
        element={<AdminLayout />}
      >
        
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />
        
        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="motores"
          element={<Motores />}
        />

        <Route
          path="motores/nuevo"
          element={<RegistrarMotor />}
        />

        <Route
          path="contenedor40"
          element={<Contenedor40 />}
        />

        <Route
          path="contenedor80"
          element={<Contenedor80 />}
        />

        <Route
          path="partes"
          element={<Partes />}
        />
       </Route>
       
       <Route
         path="pedidos"
         element={<Pedidos />}
        />

      {/* ==============================
          RUTA NO ENCONTRADA
      ============================== */}
      <Route path="/crear-cuenta" element={<RegistroUsuario />} />
      <Route path="/iniciar-sesion" element={<LoginUsuario />} />
<Route
  path="/checkout"
  element={
    <div style={{ padding: "40px" }}>
      Próximamente: entrega y pago
    </div>
  }
/>
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}