import { useState } from "react";
import "../../styles/Dashboard.css";

function Dashboard() {
  const [periodo, setPeriodo] = useState("mes");

  const handlePeriodoChange = (event) => {
    setPeriodo(event.target.value);
  };

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Resumen del negocio</h2>
          <p>Consulta el estado actual de Mr. Rivero Motors.</p>
        </div>

        <div className="dashboard-actions">
          <select
            className="dashboard-filter"
            value={periodo}
            onChange={handlePeriodoChange}
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="anio">Este año</option>
          </select>

          <button className="dashboard-primary-button" type="button">
            Registrar motor
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        <article className="dashboard-card">
          <span className="dashboard-card-icon">🚗</span>
          <p>Total de motores</p>
          <h3>0</h3>
          <small>Motores registrados</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon">🔧</span>
          <p>Total de partes</p>
          <h3>0</h3>
          <small>Partes disponibles</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon">🛒</span>
          <p>Pedidos pendientes</p>
          <h3>0</h3>
          <small>Pedidos por gestionar</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon">💰</span>
          <p>Ganancia estimada</p>
          <h3>$ 0,00</h3>
          <small>
            Período seleccionado:{" "}
            {periodo === "dia" && "Hoy"}
            {periodo === "semana" && "Esta semana"}
            {periodo === "mes" && "Este mes"}
            {periodo === "anio" && "Este año"}
          </small>
        </article>
      </div>

      <div className="dashboard-sections">
        <article className="dashboard-panel">
          <h3>Inventario</h3>

          <div className="dashboard-row">
            <span>Motores disponibles</span>
            <strong>0</strong>
          </div>

          <div className="dashboard-row">
            <span>Motores reservados</span>
            <strong>0</strong>
          </div>

          <div className="dashboard-row">
            <span>Motores vendidos</span>
            <strong>0</strong>
          </div>
        </article>

        <article className="dashboard-panel">
          <h3>Ganancias</h3>

          <div className="dashboard-row">
            <span>Ganancia estimada</span>
            <strong>$ 0,00</strong>
          </div>

          <div className="dashboard-row">
            <span>Ganancia obtenida</span>
            <strong>$ 0,00</strong>
          </div>

          <div className="dashboard-row">
            <span>Ventas del período</span>
            <strong>$ 0,00</strong>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;