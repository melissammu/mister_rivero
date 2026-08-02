import { FaBars } from "react-icons/fa";
import "../../styles/Navbar.css";

function Navbar({ abrirMenu }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-button"
          onClick={abrirMenu}
          aria-label="Abrir menú"
        >
          <FaBars />
        </button>

        <div className="navbar-title">
          <h1>Panel de Administración</h1>
          <p>Gestión de motores, partes y contenedores</p>
        </div>
      </div>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <strong>Administrador</strong>
          <span>Mr. Rivero Motors</span>
        </div>

        <div className="navbar-avatar">
          MR
        </div>
      </div>
    </header>
  );
}

export default Navbar;