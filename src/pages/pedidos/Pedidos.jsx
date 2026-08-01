import { useEffect, useMemo, useState } from "react";
import {
  FaBan,
  FaCheck,
  FaClock,
  FaEye,
  FaMoneyBillWave,
  FaPhone,
  FaSearch,
  FaTrash,
  FaUniversity,
} from "react-icons/fa";

import "../../styles/Pedidos.css";

const STORAGE_KEY = "pedidos";

const ESTADOS = [
  "Pendiente",
  "Confirmado",
  "Reservado",
  "Pagado",
  "Entregado",
  "Cancelado",
];

function leerPedidos() {
  try {
    const contenido = localStorage.getItem(STORAGE_KEY);
    const datos = contenido ? JSON.parse(contenido) : [];

    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No fue posible leer los pedidos:", error);
    return [];
  }
}

function guardarPedidos(pedidos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

function formatearDolares(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fechaConvertida);
}

function normalizarTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function claseEstado(estado = "Pendiente") {
  return normalizarTexto(estado).replaceAll(" ", "-");
}

function obtenerNombreProducto(pedido) {
  const producto = pedido.producto || {};

  return (
    producto.nombre ||
    producto.titulo ||
    `${producto.marca || ""} ${producto.modelo || ""}`.trim() ||
    "Producto sin nombre"
  );
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(leerPedidos);
  const [busqueda, setBusqueda] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState("Todos");
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState(null);

  useEffect(() => {
    guardarPedidos(pedidos);
  }, [pedidos]);

  const resumen = useMemo(() => {
    return {
      pendientes: pedidos.filter(
        (pedido) => pedido.estado === "Pendiente"
      ).length,

      confirmados: pedidos.filter(
        (pedido) =>
          pedido.estado === "Confirmado" ||
          pedido.estado === "Reservado" ||
          pedido.estado === "Pagado"
      ).length,

      entregados: pedidos.filter(
        (pedido) => pedido.estado === "Entregado"
      ).length,

      cancelados: pedidos.filter(
        (pedido) => pedido.estado === "Cancelado"
      ).length,
    };
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return pedidos.filter((pedido) => {
      const coincideEstado =
        estadoSeleccionado === "Todos" ||
        pedido.estado === estadoSeleccionado;

      const contenidoBuscable = [
        pedido.codigoPedido,
        pedido.id,
        pedido.cliente?.nombre,
        pedido.cliente?.whatsapp,
        pedido.cliente?.ciudad,
        pedido.producto?.codigo,
        pedido.producto?.nombre,
        pedido.producto?.titulo,
        pedido.producto?.marca,
        pedido.producto?.modelo,
        pedido.formaPago,
        pedido.estado,
      ]
        .map(normalizarTexto)
        .join(" ");

      const coincideBusqueda =
        !texto || contenidoBuscable.includes(texto);

      return coincideEstado && coincideBusqueda;
    });
  }, [pedidos, busqueda, estadoSeleccionado]);

  function actualizarEstado(idPedido, nuevoEstado) {
    const fechaActualizacion = new Date().toISOString();

    setPedidos((pedidosActuales) =>
      pedidosActuales.map((pedido) =>
        pedido.id === idPedido
          ? {
              ...pedido,
              estado: nuevoEstado,
              fechaActualizacion,
            }
          : pedido
      )
    );

    setPedidoSeleccionado((pedidoActual) =>
      pedidoActual?.id === idPedido
        ? {
            ...pedidoActual,
            estado: nuevoEstado,
            fechaActualizacion,
          }
        : pedidoActual
    );
  }

  function eliminarPedido(idPedido) {
    const confirmar = window.confirm(
      "¿Deseas eliminar este pedido definitivamente?"
    );

    if (!confirmar) {
      return;
    }

    setPedidos((pedidosActuales) =>
      pedidosActuales.filter(
        (pedido) => pedido.id !== idPedido
      )
    );

    if (pedidoSeleccionado?.id === idPedido) {
      setPedidoSeleccionado(null);
    }
  }

  function abrirWhatsApp(pedido) {
    const numero = String(
      pedido.cliente?.whatsapp || ""
    ).replace(/\D/g, "");

    if (!numero) {
      window.alert(
        "Este pedido no tiene un número de WhatsApp."
      );
      return;
    }

    const mensaje = encodeURIComponent(
      `Hola ${
        pedido.cliente?.nombre || ""
      }, te contactamos desde Mr. Rivero Motors sobre el pedido ${
        pedido.codigoPedido || pedido.id
      } del producto ${obtenerNombreProducto(pedido)}.`
    );

    window.open(
      `https://wa.me/${numero}?text=${mensaje}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="pedidos-page">
      <header className="pedidos-header">
        <div>
          <span className="pedidos-etiqueta">
            Gestión comercial
          </span>

          <h1>Pedidos</h1>

          <p>
            Administra las solicitudes de compra realizadas
            por los clientes.
          </p>
        </div>

        <strong className="pedidos-total">
          {pedidos.length}{" "}
          {pedidos.length === 1 ? "pedido" : "pedidos"}
        </strong>
      </header>

      <section className="pedidos-resumen">
        <article className="pedido-card resumen-pendiente">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </article>

        <article className="pedido-card resumen-confirmado">
          <span>En proceso</span>
          <strong>{resumen.confirmados}</strong>
        </article>

        <article className="pedido-card resumen-entregado">
          <span>Entregados</span>
          <strong>{resumen.entregados}</strong>
        </article>

        <article className="pedido-card resumen-cancelado">
          <span>Cancelados</span>
          <strong>{resumen.cancelados}</strong>
        </article>
      </section>

      <section className="pedidos-filtros">
        <label className="pedidos-buscador">
          <FaSearch />

          <input
            type="search"
            value={busqueda}
            placeholder="Buscar por pedido, cliente, WhatsApp o producto..."
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
          />

          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </label>

        <select
          value={estadoSeleccionado}
          onChange={(evento) =>
            setEstadoSeleccionado(evento.target.value)
          }
        >
          <option value="Todos">
            Todos los estados
          </option>

          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </section>

      <section className="pedidos-contenido">
        {pedidosFiltrados.length === 0 ? (
          <div className="pedidos-vacio">
            <FaClock />

            <h2>No hay pedidos para mostrar</h2>

            <p>
              Las compras realizadas desde el catálogo
              aparecerán automáticamente en esta sección.
            </p>
          </div>
        ) : (
          <div className="tabla-pedidos-contenedor">
            <table className="tabla-pedidos">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>
                      <strong>
                        {pedido.codigoPedido ||
                          pedido.id ||
                          "Sin código"}
                      </strong>
                    </td>

                    <td>
                      <div className="pedido-datos">
                        <strong>
                          {pedido.cliente?.nombre ||
                            "Sin nombre"}
                        </strong>

                        <span>
                          {pedido.cliente?.whatsapp ||
                            "Sin WhatsApp"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="pedido-datos">
                        <strong>
                          {obtenerNombreProducto(pedido)}
                        </strong>

                        <span>
                          {pedido.producto?.codigo ||
                            "Sin código"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="pedido-forma-pago">
                        {pedido.formaPago ===
                        "Transferencia" ? (
                          <FaUniversity />
                        ) : (
                          <FaMoneyBillWave />
                        )}

                        {pedido.formaPago || "No definida"}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {formatearDolares(
                          pedido.total ||
                            pedido.producto?.precioVenta ||
                            pedido.producto?.precio
                        )}
                      </strong>
                    </td>

                    <td>
                      <select
                        className={`pedido-estado estado-${claseEstado(
                          pedido.estado
                        )}`}
                        value={pedido.estado || "Pendiente"}
                        onChange={(evento) =>
                          actualizarEstado(
                            pedido.id,
                            evento.target.value
                          )
                        }
                      >
                        {ESTADOS.map((estado) => (
                          <option
                            key={estado}
                            value={estado}
                          >
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      {formatearFecha(
                        pedido.fechaCreacion
                      )}
                    </td>

                    <td>
                      <div className="pedido-acciones">
                        <button
                          type="button"
                          className="accion-ver"
                          title="Ver pedido"
                          onClick={() =>
                            setPedidoSeleccionado(
                              pedido
                            )
                          }
                        >
                          <FaEye />
                        </button>

                        <button
                          type="button"
                          className="accion-confirmar"
                          title="Confirmar pedido"
                          onClick={() =>
                            actualizarEstado(
                              pedido.id,
                              "Confirmado"
                            )
                          }
                        >
                          <FaCheck />
                        </button>

                        <button
                          type="button"
                          className="accion-cancelar"
                          title="Cancelar pedido"
                          onClick={() =>
                            actualizarEstado(
                              pedido.id,
                              "Cancelado"
                            )
                          }
                        >
                          <FaBan />
                        </button>

                        <button
                          type="button"
                          className="accion-eliminar"
                          title="Eliminar pedido"
                          onClick={() =>
                            eliminarPedido(pedido.id)
                          }
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pedidoSeleccionado && (
        <div
          className="pedido-modal-fondo"
          onClick={() => setPedidoSeleccionado(null)}
        >
          <section
            className="pedido-modal"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <button
              type="button"
              className="pedido-modal-cerrar"
              onClick={() =>
                setPedidoSeleccionado(null)
              }
              aria-label="Cerrar"
            >
              ×
            </button>

            <span className="pedidos-etiqueta">
              Detalle del pedido
            </span>

            <h2>
              {pedidoSeleccionado.codigoPedido ||
                pedidoSeleccionado.id}
            </h2>

            <div className="pedido-modal-grid">
              <article>
                <h3>Cliente</h3>

                <p>
                  <strong>Nombre:</strong>{" "}
                  {pedidoSeleccionado.cliente?.nombre ||
                    "Sin nombre"}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {pedidoSeleccionado.cliente
                    ?.whatsapp || "Sin número"}
                </p>

                <p>
                  <strong>Ciudad:</strong>{" "}
                  {pedidoSeleccionado.cliente?.ciudad ||
                    "Sin ciudad"}
                </p>
              </article>

              <article>
                <h3>Producto</h3>

                <p>
                  <strong>Nombre:</strong>{" "}
                  {obtenerNombreProducto(
                    pedidoSeleccionado
                  )}
                </p>

                <p>
                  <strong>Código:</strong>{" "}
                  {pedidoSeleccionado.producto
                    ?.codigo || "Sin código"}
                </p>

                <p>
                  <strong>Total:</strong>{" "}
                  {formatearDolares(
                    pedidoSeleccionado.total ||
                      pedidoSeleccionado.producto
                        ?.precioVenta ||
                      pedidoSeleccionado.producto
                        ?.precio
                  )}
                </p>
              </article>

              <article>
                <h3>Pago</h3>

                <p>
                  <strong>Forma:</strong>{" "}
                  {pedidoSeleccionado.formaPago ||
                    "No definida"}
                </p>

                <p>
                  <strong>Estado:</strong>{" "}
                  {pedidoSeleccionado.estado ||
                    "Pendiente"}
                </p>

                <p>
                  <strong>Fecha:</strong>{" "}
                  {formatearFecha(
                    pedidoSeleccionado.fechaCreacion
                  )}
                </p>
              </article>

              <article>
                <h3>Observaciones</h3>

                <p>
                  {pedidoSeleccionado.observaciones ||
                    "Sin observaciones."}
                </p>
              </article>
            </div>

            <div className="pedido-modal-acciones">
              <button
                type="button"
                className="modal-reservar"
                onClick={() =>
                  actualizarEstado(
                    pedidoSeleccionado.id,
                    "Reservado"
                  )
                }
              >
                Reservar
              </button>

              <button
                type="button"
                onClick={() =>
                  actualizarEstado(
                    pedidoSeleccionado.id,
                    "Pagado"
                  )
                }
              >
                Marcar pagado
              </button>

              <button
                type="button"
                onClick={() =>
                  actualizarEstado(
                    pedidoSeleccionado.id,
                    "Entregado"
                  )
                }
              >
                Marcar entregado
              </button>

              <button
                type="button"
                className="modal-whatsapp"
                onClick={() =>
                  abrirWhatsApp(pedidoSeleccionado)
                }
              >
                <FaPhone />
                Contactar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}