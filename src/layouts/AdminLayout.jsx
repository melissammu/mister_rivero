import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/sidebar/Sidebar";
import Navbar from "../components/navbar/Navbar";

import "../styles/AdminLayout.css";

function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const abrirMenu = () => {
    setMenuAbierto(true);
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <div className="admin-layout">
      <Sidebar
        menuAbierto={menuAbierto}
        cerrarMenu={cerrarMenu}
      />

      {menuAbierto && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={cerrarMenu}
          aria-label="Cerrar menú"
        />
      )}

      <div className="admin-main">
        <Navbar abrirMenu={abrirMenu} />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;