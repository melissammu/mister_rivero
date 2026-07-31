import "../../styles/Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div>
        <h1>Panel de Administración</h1>
        <p>Gestión de motores, piezas y contenedores</p>
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