import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaCar,
  FaTools,
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

import "../../styles/Sidebar.css";

function Sidebar({
  menuAbierto,
  cerrarMenu,
}) {
  const cerrarAlNavegar = () => {
    cerrarMenu();
  };

  return (
    <aside
      className={`sidebar ${
        menuAbierto ? "sidebar-open" : ""
      }`}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            MR
          </div>

          <div>
            <h2>MR. RIVERO</h2>
            <p>MOTORS</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
        >
          <FaTimes />
        </button>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/admin/dashboard"
          onClick={cerrarAlNavegar}
        >
          <FaChartLine />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/motores"
          onClick={cerrarAlNavegar}
        >
          <FaCar />
          <span>Motores</span>
        </NavLink>

        <NavLink
          to="/admin/partes"
          onClick={cerrarAlNavegar}
        >
          <FaTools />
          <span>Partes</span>
        </NavLink>

        <NavLink
          to="/admin/contenedor40"
          onClick={cerrarAlNavegar}
        >
          <FaBoxOpen />
          <span>Contenedor 40</span>
        </NavLink>

        <NavLink
          to="/admin/contenedor80"
          onClick={cerrarAlNavegar}
        >
          <FaBoxOpen />
          <span>Contenedor 80</span>
        </NavLink>

        <NavLink
          to="/admin/pedidos"
          onClick={cerrarAlNavegar}
        >
          <FaShoppingCart />
          <span>Pedidos</span>
        </NavLink>

        <NavLink
          to="/admin/usuarios"
          onClick={cerrarAlNavegar}
        >
          <FaUsers />
          <span>Usuarios</span>
        </NavLink>

        <NavLink
          to="/admin/reportes"
          onClick={cerrarAlNavegar}
        >
          <FaFileAlt />
          <span>Reportes</span>
        </NavLink>

        <NavLink
          to="/admin/configuracion"
          onClick={cerrarAlNavegar}
        >
          <FaCog />
          <span>Configuración</span>
        </NavLink>
      </nav>

      <button
        type="button"
        className="sidebar-logout"
      >
        <FaSignOutAlt />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}

export default Sidebar;