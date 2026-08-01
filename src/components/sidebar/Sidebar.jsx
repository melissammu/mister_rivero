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
  FaCogs,
} from "react-icons/fa";

import "../../styles/Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">
          <FaCogs />
        </span>

        <div>
          <h2>MR. RIVERO</h2>
          <p>MOTORS</p>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/admin/dashboard">
          <FaChartLine />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/motores">
          <FaCar />
          <span>Motores</span>
        </NavLink>

        <NavLink to="/admin/partes">
          <FaTools />
          <span>Partes</span>
        </NavLink>
        <NavLink to="/admin/pedidos">
  <FaShoppingCart />
  <span>Pedidos</span>
</NavLink>

        <NavLink to="/admin/contenedor40">
          <FaBoxOpen />
          <span>Contenedor 40</span>
        </NavLink>

        <NavLink to="/admin/contenedor80">
          <FaBoxOpen />
          <span>Contenedor 80</span>
        </NavLink>

        <NavLink to="/admin/pedidos">
          <FaShoppingCart />
          <span>Pedidos</span>
        </NavLink>

        <NavLink to="/admin/usuarios">
          <FaUsers />
          <span>Usuarios</span>
        </NavLink>

        <NavLink to="/admin/reportes">
          <FaFileAlt />
          <span>Reportes</span>
        </NavLink>

        <NavLink to="/admin/configuracion">
          <FaCog />
          <span>Configuración</span>
        </NavLink>
      </nav>

      <button className="sidebar-logout" type="button">
        <FaSignOutAlt />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}

export default Sidebar;