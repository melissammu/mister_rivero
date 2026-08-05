import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaBuildingColumns,
  FaCheck,
  FaClock,
  FaCopy,
  FaShieldHalved,
} from "react-icons/fa6";

import { supabase } from "../../lib/supabase";
import { useCarrito } from "../../context/CarritoContext";

import "../../styles/Checkout.css";

function formatearDolares(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function formatearPedido(id = "") {
  if (!id) {
    return "Sin número";
  }

  return String(id)
    .split("-")[0]
    .toUpperCase();
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    usuario,
    pedidoCarrito,
    items = [],
    subtotal = 0,
    envio = 0,
    impuestos = 0,
    total = 0,
    reservaActiva,
    recargarCarrito,
  } = useCarrito();

  const [datosPago, setDatosPago] =
    useState(null);

  const [cargandoPago, setCargandoPago] =
    useState(true);

  const [errorPago, setErrorPago] =
    useState("");

  const [datoCopiado, setDatoCopiado] =
    useState("");

  useEffect(() => {
    let componenteActivo = true;

    async function cargarDatosPago() {
      setCargandoPago(true);
      setErrorPago("");

      try {
        const { data, error } = await supabase
          .from("configuracion_pagos")
          .select(
            `
              id,
              metodo,
              nombre_titular,
              email_zelle,
              telefono_zelle,
              banco,
              instrucciones
            `
          )
          .eq("metodo", "zelle")
          .eq("activo", true)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "Los datos de pago por Zelle todavía no están configurados."
          );
        }

        if (componenteActivo) {
          setDatosPago(data);
        }
      } catch (error) {
        console.error(
          "Error cargando datos de pago:",
          error
        );

        if (componenteActivo) {
          setErrorPago(
            error.message ||
              "No fue posible cargar los datos de pago."
          );
        }
      } finally {
        if (componenteActivo) {
          setCargandoPago(false);
        }
      }
    }

    cargarDatosPago();

    return () => {
      componenteActivo = false;
    };
  }, []);

  useEffect(() => {
    if (usuario?.id) {
      recargarCarrito();
    }
  }, [usuario?.id]);

  const numeroPedido = useMemo(
    () => formatearPedido(pedidoCarrito?.id),
    [pedidoCarrito?.id]
  );

  async function copiarDato(
    etiqueta,
    valor
  ) {
    if (!valor) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(valor)
      );

      setDatoCopiado(etiqueta);

      window.setTimeout(() => {
        setDatoCopiado("");
      }, 1800);
    } catch (error) {
      console.error(
        "No fue posible copiar:",
        error
      );

      window.prompt(
        "Copia este dato:",
        valor
      );
    }
  }

  if (!usuario) {
    return (
      <main className="checkout-pagina">
        <section className="checkout-estado">
          <h1>Debes iniciar sesión</h1>

          <p>
            Inicia sesión para consultar los datos
            del pago.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/iniciar-sesion")
            }
          >
            Iniciar sesión
          </button>
        </section>
      </main>
    );
  }

  if (!pedidoCarrito || items.length === 0) {
    return (
      <main className="checkout-pagina">
        <section className="checkout-estado">
          <h1>No hay una compra activa</h1>

          <p>
            Regresa al catálogo y agrega los
            productos que deseas comprar.
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
      </main>
    );
  }

  return (
    <main className="checkout-pagina">
      <header className="checkout-encabezado">
        <button
          type="button"
          className="checkout-volver"
          onClick={() => navigate("/carrito")}
        >
          <FaArrowLeft />
          Volver al carrito
        </button>

        <span>MR. RIVERO MOTORS</span>

        <h1>Realizar pago</h1>

        <p>
          Completa el pago por Zelle utilizando
          exactamente los datos indicados.
        </p>
      </header>

      {reservaActiva && (
        <div className="checkout-reserva">
          <FaClock />

          <div>
            <strong>Reserva activa</strong>

            <span>
              Tus productos están reservados durante
              10 minutos mientras realizas el pago.
            </span>
          </div>
        </div>
      )}

      {errorPago && (
        <div className="checkout-error">
          {errorPago}
        </div>
      )}

      <section className="checkout-contenido">
        <article className="checkout-pago">
          <div className="checkout-pago-titulo">
            <div>
              <FaBuildingColumns />
            </div>

            <span>
              <small>Método de pago</small>
              <strong>Zelle</strong>
            </span>
          </div>

          {cargandoPago ? (
            <p>Cargando datos bancarios...</p>
          ) : datosPago ? (
            <div className="checkout-datos">
              <div className="checkout-dato">
                <span>Nombre del titular</span>

                <strong>
                  {datosPago.nombre_titular}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    copiarDato(
                      "nombre",
                      datosPago.nombre_titular
                    )
                  }
                >
                  {datoCopiado === "nombre" ? (
                    <FaCheck />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>

              {datosPago.email_zelle && (
                <div className="checkout-dato">
                  <span>Correo asociado a Zelle</span>

                  <strong>
                    {datosPago.email_zelle}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copiarDato(
                        "email",
                        datosPago.email_zelle
                      )
                    }
                  >
                    {datoCopiado === "email" ? (
                      <FaCheck />
                    ) : (
                      <FaCopy />
                    )}
                  </button>
                </div>
              )}

              {datosPago.telefono_zelle && (
                <div className="checkout-dato">
                  <span>Teléfono asociado a Zelle</span>

                  <strong>
                    {datosPago.telefono_zelle}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copiarDato(
                        "telefono",
                        datosPago.telefono_zelle
                      )
                    }
                  >
                    {datoCopiado === "telefono" ? (
                      <FaCheck />
                    ) : (
                      <FaCopy />
                    )}
                  </button>
                </div>
              )}

              {datosPago.banco && (
                <div className="checkout-dato">
                  <span>Banco del titular</span>

                  <strong>
                    {datosPago.banco}
                  </strong>
                </div>
              )}

              <div className="checkout-dato destacado">
                <span>Monto exacto a pagar</span>

                <strong>
                  {formatearDolares(total)}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    copiarDato(
                      "monto",
                      Number(total).toFixed(2)
                    )
                  }
                >
                  {datoCopiado === "monto" ? (
                    <FaCheck />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>

              <div className="checkout-dato">
                <span>Número del pedido</span>

                <strong>{numeroPedido}</strong>

                <button
                  type="button"
                  onClick={() =>
                    copiarDato(
                      "pedido",
                      numeroPedido
                    )
                  }
                >
                  {datoCopiado === "pedido" ? (
                    <FaCheck />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>

              <div className="checkout-instrucciones">
                <strong>Instrucciones</strong>

                <p>
                  {datosPago.instrucciones ||
                    "Coloca el número del pedido en la descripción del pago."}
                </p>
              </div>
            </div>
          ) : null}
        </article>

        <aside className="checkout-resumen">
          <span>Resumen del pedido</span>

          <h2>Tu compra</h2>

          <div>
            <span>Productos</span>
            <strong>{items.length}</strong>
          </div>

          <div>
            <span>Subtotal</span>
            <strong>
              {formatearDolares(subtotal)}
            </strong>
          </div>

          <div>
            <span>Envío</span>
            <strong>
              {Number(envio) > 0
                ? formatearDolares(envio)
                : "Por coordinar"}
            </strong>
          </div>

          <div>
            <span>Impuestos</span>
            <strong>
              {formatearDolares(impuestos)}
            </strong>
          </div>

          <div className="checkout-total">
            <span>Total</span>

            <strong>
              {formatearDolares(total)}
            </strong>
          </div>

          <div className="checkout-seguridad">
            <FaShieldHalved />

            <p>
              Verifica cuidadosamente el nombre y el
              correo antes de enviar el pago.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}