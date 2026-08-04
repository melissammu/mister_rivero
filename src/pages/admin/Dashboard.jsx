import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/Dashboard.css";

const RESUMEN_INICIAL = {
  totalMotores: 0,
  totalPartes: 0,
  pedidosPendientes: 0,
  gananciaEstimada: 0,
  motoresDisponibles: 0,
  motoresReservados: 0,
  motoresVendidos: 0,
  gananciaObtenida: 0,
};

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

function convertirNumero(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function obtenerFechaLimite(periodo) {
  const fecha = new Date();

  if (periodo === "dia") {
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }

  if (periodo === "semana") {
    fecha.setDate(fecha.getDate() - 7);
    return fecha;
  }

  if (periodo === "mes") {
    fecha.setMonth(fecha.getMonth() - 1);
    return fecha;
  }

  if (periodo === "anio") {
    fecha.setFullYear(fecha.getFullYear() - 1);
    return fecha;
  }

  return null;
}

function productoPerteneceAlPeriodo(producto, periodo) {
  const fechaLimite = obtenerFechaLimite(periodo);

  if (!fechaLimite) {
    return true;
  }

  const fechaProducto =
    producto?.fechaRegistro ||
    producto?.fecha_registro ||
    producto?.created_at ||
    producto?.fechaActualizacion ||
    producto?.fecha_actualizacion;

  /*
   * Los registros antiguos que no tengan fecha seguirán apareciendo
   * para que el dashboard no los pierda.
   */
  if (!fechaProducto) {
    return true;
  }

  const fecha = new Date(fechaProducto);

  if (Number.isNaN(fecha.getTime())) {
    return true;
  }

  return fecha >= fechaLimite;
}

function obtenerPrecioCompra(producto) {
  return convertirNumero(
    producto?.precio_compra ??
      producto?.precioCompra ??
      producto?.costo_total ??
      producto?.costoTotal
  );
}

function obtenerPrecioVenta(producto) {
  return convertirNumero(
    producto?.precio_venta ??
      producto?.precioVenta ??
      producto?.precio
  );
}

function esMotor(producto) {
  return normalizarTexto(producto?.tipo) === "motor";
}

function esParte(producto) {
  const tipo = normalizarTexto(producto?.tipo);

  return ["parte", "partes", "autoparte", "autopartes", "pieza"].includes(
    tipo
  );
}

function obtenerEstado(producto) {
  return normalizarTexto(producto?.estado || "disponible");
}

function formatearDolares(valor) {
  return convertirNumero(valor).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function nombrePeriodo(periodo) {
  const nombres = {
    dia: "Hoy",
    semana: "Esta semana",
    mes: "Este mes",
    anio: "Este año",
  };

  return nombres[periodo] || "Este mes";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState("mes");
  const [resumen, setResumen] = useState(RESUMEN_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState("");

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setErrorDashboard("");

    try {
      /*
       * Se seleccionan todas las columnas para que funcione con los
       * nombres antiguos y nuevos que existen actualmente en el proyecto.
       */
const { data: productosData, error: productosError } = await supabase
  .from("productos")
  .select("*");

console.log("Productos del Dashboard:", productosData);
console.log("Error del Dashboard:", productosError);
      if (productosError) {
        throw productosError;
      }

      /*
       * Los pedidos se consultan aparte. Si la tabla está vacía,
       * simplemente se mostrará cero.
       */
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedido_items")
        .select("*");

      if (pedidosError) {
        console.warn(
          "No fue posible consultar pedido_items:",
          pedidosError.message
        );
      }

      const productos = Array.isArray(productosData)
        ? productosData
        : [];

      const pedidos = Array.isArray(pedidosData) ? pedidosData : [];

      const productosDelPeriodo = productos.filter((producto) =>
        productoPerteneceAlPeriodo(producto, periodo)
      );

      const motores = productos.filter(esMotor);
      const partes = productos.filter(esParte);

      const motoresDisponibles = motores.filter(
        (producto) => obtenerEstado(producto) === "disponible"
      ).length;

      const motoresReservados = motores.filter(
        (producto) => obtenerEstado(producto) === "reservado"
      ).length;

      const motoresVendidos = motores.filter(
        (producto) => obtenerEstado(producto) === "vendido"
      ).length;

      const pedidosPendientes = pedidos.filter((pedido) => {
        const estado = normalizarTexto(
          pedido?.estado || pedido?.status || "pendiente"
        );

        return [
          "",
          "pendiente",
          "nuevo",
          "por gestionar",
          "procesando",
        ].includes(estado);
      }).length;

      /*
       * Ganancia estimada:
       * suma de precio de venta menos precio de compra de productos
       * que todavía no han sido vendidos.
       */
      const gananciaEstimada = productosDelPeriodo
        .filter((producto) => obtenerEstado(producto) !== "vendido")
        .reduce((total, producto) => {
          const ganancia =
            obtenerPrecioVenta(producto) - obtenerPrecioCompra(producto);

          return total + Math.max(ganancia, 0);
        }, 0);

      /*
       * Ganancia obtenida:
       * únicamente productos cuyo estado sea vendido.
       */
      const gananciaObtenida = productosDelPeriodo
        .filter((producto) => obtenerEstado(producto) === "vendido")
        .reduce((total, producto) => {
          const ganancia =
            obtenerPrecioVenta(producto) - obtenerPrecioCompra(producto);

          return total + Math.max(ganancia, 0);
        }, 0);

      setResumen({
        totalMotores: motores.length,
        totalPartes: partes.length,
        pedidosPendientes,
        gananciaEstimada,
        motoresDisponibles,
        motoresReservados,
        motoresVendidos,
        gananciaObtenida,
      });
    } catch (error) {
      console.error("Error cargando el dashboard:", error);

      setErrorDashboard(
        error?.message ||
          "No fue posible cargar el resumen del negocio."
      );

      setResumen(RESUMEN_INICIAL);
    } finally {
      setCargando(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  function handlePeriodoChange(evento) {
    setPeriodo(evento.target.value);
  }

  function mostrarValor(valor) {
    return cargando ? "..." : valor;
  }

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Resumen del negocio</h2>

          <p>
            Consulta el estado actual de Mr. Rivero Motors.
          </p>
        </div>

        <div className="dashboard-actions">
          <select
            className="dashboard-filter"
            value={periodo}
            onChange={handlePeriodoChange}
            aria-label="Seleccionar período"
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="anio">Este año</option>
          </select>

          <button
            className="dashboard-primary-button"
            type="button"
           onClick={() => navigate("/admin/motores/nuevo")}
          >
            Registrar producto
          </button>
        </div>
      </div>

      {errorDashboard && (
        <div className="dashboard-error" role="alert">
          <span>{errorDashboard}</span>

          <button type="button" onClick={cargarDashboard}>
            Reintentar
          </button>
        </div>
      )}

      <div className="dashboard-cards">
        <article className="dashboard-card">
          <span className="dashboard-card-icon" aria-hidden="true">
            🚗
          </span>

          <p>Total de motores</p>

          <h3>{mostrarValor(resumen.totalMotores)}</h3>

          <small>Motores registrados</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon" aria-hidden="true">
            🔧
          </span>

          <p>Total de partes</p>

          <h3>{mostrarValor(resumen.totalPartes)}</h3>

          <small>Partes registradas</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon" aria-hidden="true">
            🛒
          </span>

          <p>Pedidos pendientes</p>

          <h3>{mostrarValor(resumen.pedidosPendientes)}</h3>

          <small>Pedidos por gestionar</small>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-card-icon" aria-hidden="true">
            💰
          </span>

          <p>Ganancia estimada</p>

          <h3>
            {cargando
              ? "..."
              : formatearDolares(resumen.gananciaEstimada)}
          </h3>

          <small>Período seleccionado: {nombrePeriodo(periodo)}</small>
        </article>
      </div>

      <div className="dashboard-sections">
        <article className="dashboard-panel">
          <h3>Inventario</h3>

          <div className="dashboard-row">
            <span>Motores disponibles</span>

            <strong>
              {mostrarValor(resumen.motoresDisponibles)}
            </strong>
          </div>

          <div className="dashboard-row">
            <span>Motores reservados</span>

            <strong>
              {mostrarValor(resumen.motoresReservados)}
            </strong>
          </div>

          <div className="dashboard-row">
            <span>Motores vendidos</span>

            <strong>
              {mostrarValor(resumen.motoresVendidos)}
            </strong>
          </div>
        </article>

        <article className="dashboard-panel">
          <h3>Ganancias</h3>

          <div className="dashboard-row">
            <span>Ganancia estimada</span>

            <strong>
              {cargando
                ? "..."
                : formatearDolares(resumen.gananciaEstimada)}
            </strong>
          </div>

          <div className="dashboard-row">
            <span>Ganancia obtenida</span>

            <strong>
              {cargando
                ? "..."
                : formatearDolares(resumen.gananciaObtenida)}
            </strong>
          </div>

          <div className="dashboard-row">
            <span>Período</span>

            <strong>{nombrePeriodo(periodo)}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}