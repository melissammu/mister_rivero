import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaBoxOpen,
  FaCartShopping,
  FaClock,
  FaMinus,
  FaPlus,
  FaRotateRight,
  FaShieldHalved,
  FaTrash,
  FaTriangleExclamation,
} from "react-icons/fa6";

import { useNavigate } from "react-router-dom";

import { useCarrito } from "../../context/CarritoContext";
import "../../styles/Carrito.css";

function formatearDolares(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function obtenerSegundosRestantes(fechaVencimiento) {
  if (!fechaVencimiento) {
    return 0;
  }

  const vencimiento = new Date(
    fechaVencimiento
  ).getTime();

  const diferencia =
    vencimiento - Date.now();

  return Math.max(
    0,
    Math.floor(diferencia / 1000)
  );
}

function formatearContador(segundos) {
  const minutos = Math.floor(
    segundos / 60
  );

  const segundosRestantes =
    segundos % 60;

  return `${String(minutos).padStart(
    2,
    "0"
  )}:${String(segundosRestantes).padStart(
    2,
    "0"
  )}`;
}

export default function Carrito() {
  const navigate = useNavigate();

  const {
    usuario,
    pedidoCarrito,
    items,
    cargando,
    procesando,
    cantidadProductos,
    subtotal,
    total,
    cambiarCantidad,
    eliminarDelCarrito,
    iniciarReserva,
    recargarCarrito,
  } = useCarrito();

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  const [segundosRestantes, setSegundosRestantes] =
    useState(0);

  const [mensaje, setMensaje] =
    useState("");

  const reservaActiva =
    pedidoCarrito?.estado ===
      "pago_pendiente" &&
    segundosRestantes > 0;

  const reservaVencida =
    pedidoCarrito?.estado ===
      "expirado" ||
    (pedidoCarrito?.estado ===
      "pago_pendiente" &&
      segundosRestantes === 0);

  useEffect(() => {
    setSegundosRestantes(
      obtenerSegundosRestantes(
        pedidoCarrito?.reservado_hasta
      )
    );
  }, [
    pedidoCarrito?.reservado_hasta,
  ]);

  useEffect(() => {
    if (
      pedidoCarrito?.estado !==
        "pago_pendiente" ||
      !pedidoCarrito.reservado_hasta
    ) {
      return undefined;
    }

    const intervalo = window.setInterval(
      () => {
        const restantes =
          obtenerSegundosRestantes(
            pedidoCarrito.reservado_hasta
          );

        setSegundosRestantes(restantes);

        if (restantes === 0) {
          window.clearInterval(intervalo);

          window.setTimeout(() => {
            recargarCarrito();
          }, 1200);
        }
      },
      1000
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    pedidoCarrito?.estado,
    pedidoCarrito?.reservado_hasta,
    recargarCarrito,
  ]);

  const claseContador = useMemo(() => {
    if (segundosRestantes <= 60) {
      return "carrito-contador peligro";
    }

    if (segundosRestantes <= 120) {
      return "carrito-contador alerta";
    }

    if (segundosRestantes <= 300) {
      return "carrito-contador atencion";
    }

    return "carrito-contador";
  }, [segundosRestantes]);

  async function confirmarReserva() {
    setMensaje("");

    try {
      await iniciarReserva();
      setMostrarConfirmacion(false);
    } catch (error) {
      console.error(
        "Error iniciando la reserva:",
        error
      );

      if (
        error.message ===
        "USUARIO_NO_AUTENTICADO"
      ) {
        navigate("/iniciar-sesion", {
          state: {
            desde: "/carrito",
          },
        });

        return;
      }

      if (
        error.message ===
        "CARRITO_VACIO"
      ) {
        setMensaje(
          "El carrito está vacío."
        );

        return;
      }

      setMensaje(
        error.message ||
          "No fue posible iniciar la reserva."
      );
    }
  }

  async function actualizarCantidad(
    item,
    nuevaCantidad
  ) {
    if (reservaActiva) {
      setMensaje(
        "No puedes modificar el carrito mientras la reserva está activa."
      );

      return;
    }

    try {
      await cambiarCantidad(
        item.id,
        nuevaCantidad
      );
    } catch (error) {
      console.error(
        "Error actualizando cantidad:",
        error
      );

      setMensaje(
        "No fue posible actualizar la cantidad."
      );
    }
  }

  async function eliminarItem(itemId) {
    if (reservaActiva) {
      setMensaje(
        "No puedes eliminar productos mientras la reserva está activa."
      );

      return;
    }

    try {
      await eliminarDelCarrito(itemId);
    } catch (error) {
      console.error(
        "Error eliminando producto:",
        error
      );

      setMensaje(
        "No fue posible eliminar el producto."
      );
    }
  }

  if (cargando) {
    return (
      <main className="carrito-page">
        <section className="carrito-cargando">
          <FaCartShopping />
          <p>Cargando tu carrito...</p>
        </section>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="carrito-page">
        <section className="carrito-vacio">
          <FaShieldHalved />

          <h1>Inicia sesión</h1>

          <p>
            Debes iniciar sesión para consultar
            y administrar tu carrito.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/iniciar-sesion", {
                state: {
                  desde: "/carrito",
                },
              })
            }
          >
            Iniciar sesión
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="carrito-page">
      <header className="carrito-header">
        <button
          type="button"
          className="carrito-volver"
          onClick={() =>
            navigate("/catalogo")
          }
        >
          <FaArrowLeft />
          Seguir comprando
        </button>

        <div>
          <span>MR. RIVERO MOTORS</span>
          <h1>Mi carrito</h1>

          <p>
            {cantidadProductos}{" "}
            {cantidadProductos === 1
              ? "producto seleccionado"
              : "productos seleccionados"}
          </p>
        </div>

        <div className="carrito-header-icono">
          <FaCartShopping />
          <strong>
            {cantidadProductos}
          </strong>
        </div>
      </header>

      {reservaActiva && (
        <section className={claseContador}>
          <div>
            <FaClock />

            <span>
              Tiempo restante para completar
              el pago
            </span>
          </div>

          <strong>
            {formatearContador(
              segundosRestantes
            )}
          </strong>

          <p>
            Tus productos están reservados.
            Cuando el contador llegue a cero,
            volverán a estar disponibles.
          </p>
        </section>
      )}

      {reservaVencida && (
        <section className="carrito-reserva-vencida">
          <FaTriangleExclamation />

          <div>
            <h2>La reserva venció</h2>

            <p>
              Los productos volvieron al
              estante por falta de pago.
              Comprueba su disponibilidad antes
              de reservarlos nuevamente.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarConfirmacion(true)
            }
          >
            <FaRotateRight />
            Reservar nuevamente
          </button>
        </section>
      )}

      {mensaje && (
        <div className="carrito-mensaje">
          {mensaje}

          <button
            type="button"
            onClick={() => setMensaje("")}
          >
            ×
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <section className="carrito-vacio">
          <FaBoxOpen />

          <h2>Tu carrito está vacío</h2>

          <p>
            Explora nuestros motores y
            autopartes disponibles.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/catalogo")
            }
          >
            Ver catálogo
          </button>
        </section>
      ) : (
        <div className="carrito-layout">
          <section className="carrito-lista">
            {items.map((item) => (
              <article
                key={item.id}
                className={
                  reservaVencida
                    ? "carrito-item vencido"
                    : "carrito-item"
                }
              >
                <div className="carrito-item-imagen">
                  <FaBoxOpen />
                </div>

                <div className="carrito-item-info">
                  <span className="carrito-item-tipo">
                    {item.tipo_producto ===
                    "motor"
                      ? "Motor"
                      : "Autoparte"}
                  </span>

                  <h3>
                    {item.nombre_producto}
                  </h3>

                  <small>
                    Referencia:{" "}
                    {item.producto_id}
                  </small>

                  {reservaVencida && (
                    <p className="carrito-item-aviso">
                      Disponible nuevamente en
                      el estante por falta de
                      pago.
                    </p>
                  )}
                </div>

                <div className="carrito-item-precio">
                  <span>Precio unitario</span>

                  <strong>
                    {formatearDolares(
                      item.precio_unitario
                    )}
                  </strong>
                </div>

                <div className="carrito-cantidad">
                  <span>Cantidad</span>

                  {item.tipo_producto ===
                  "motor" ? (
                    <strong>1</strong>
                  ) : (
                    <div>
                      <button
                        type="button"
                        disabled={
                          reservaActiva ||
                          item.cantidad <= 1
                        }
                        onClick={() =>
                          actualizarCantidad(
                            item,
                            item.cantidad - 1
                          )
                        }
                      >
                        <FaMinus />
                      </button>

                      <strong>
                        {item.cantidad}
                      </strong>

                      <button
                        type="button"
                        disabled={reservaActiva}
                        onClick={() =>
                          actualizarCantidad(
                            item,
                            item.cantidad + 1
                          )
                        }
                      >
                        <FaPlus />
                      </button>
                    </div>
                  )}
                </div>

                <div className="carrito-item-subtotal">
                  <span>Subtotal</span>

                  <strong>
                    {formatearDolares(
                      item.subtotal
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className="carrito-eliminar"
                  disabled={reservaActiva}
                  onClick={() =>
                    eliminarItem(item.id)
                  }
                  aria-label="Eliminar producto"
                >
                  <FaTrash />
                </button>
              </article>
            ))}
          </section>

          <aside className="carrito-resumen">
            <span>Resumen del pedido</span>

            <h2>Tu compra</h2>

            <div className="carrito-resumen-fila">
              <span>Subtotal</span>
              <strong>
                {formatearDolares(subtotal)}
              </strong>
            </div>

            <div className="carrito-resumen-fila">
              <span>Envío</span>
              <strong>
                Por coordinar
              </strong>
            </div>

            <div className="carrito-resumen-fila">
              <span>Impuestos</span>
              <strong>
                {formatearDolares(
                  pedidoCarrito?.impuestos
                )}
              </strong>
            </div>

            <div className="carrito-resumen-total">
              <span>Total</span>

              <strong>
                {formatearDolares(total)}
              </strong>
            </div>

            {!reservaActiva && (
              <button
                type="button"
                className="carrito-pagar"
                disabled={procesando}
                onClick={() =>
                  setMostrarConfirmacion(true)
                }
              >
                <FaShieldHalved />

                {reservaVencida
                  ? "Reservar nuevamente"
                  : "Proceder al pago"}
              </button>
            )}

            {reservaActiva && (
              <button
                type="button"
                className="carrito-pagar"
                onClick={() =>
                  navigate("/pago")
                }
              >
                Continuar con el pago
              </button>
            )}

            <p className="carrito-seguridad">
              La reserva comienza únicamente
              al proceder al pago.
            </p>
          </aside>
        </div>
      )}

      {mostrarConfirmacion && (
        <div
          className="carrito-modal-fondo"
          onMouseDown={() =>
            setMostrarConfirmacion(false)
          }
        >
          <section
            className="carrito-modal"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <div className="carrito-modal-icono">
              <FaClock />
            </div>

            <span>Reserva de compra</span>

            <h2>
              Tendrás 10 minutos para pagar
            </h2>

            <p>
              Al continuar, los productos se
              reservarán exclusivamente para ti
              durante diez minutos.
            </p>

            <div className="carrito-modal-aviso">
              <FaTriangleExclamation />

              <p>
                Si el pago no se confirma antes
                de terminar el contador, la
                reserva vencerá y los productos
                volverán a estar disponibles.
              </p>
            </div>

            <div className="carrito-modal-acciones">
              <button
                type="button"
                className="carrito-modal-cancelar"
                onClick={() =>
                  setMostrarConfirmacion(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="carrito-modal-confirmar"
                disabled={procesando}
                onClick={confirmarReserva}
              >
                {procesando
                  ? "Reservando..."
                  : "Reservar y continuar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}