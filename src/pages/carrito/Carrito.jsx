import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCartShopping,
  FaMinus,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

import { useCarrito } from "../../context/CarritoContext";
import "../../styles/Carrito.css";

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function convertirNumero(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function formatearDolares(valor) {
  return convertirNumero(valor).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function obtenerNombreProducto(producto = {}) {
  const marca = producto.marca || "";
  const modelo = producto.modelo || "";

  return (
    producto.nombre ||
    producto.titulo ||
    `${marca} ${modelo}`.trim() ||
    producto.descripcion ||
    "Producto"
  );
}

function obtenerImagenProducto(producto = {}) {
  if (
    Array.isArray(producto.imagenes) &&
    producto.imagenes.length > 0
  ) {
    return producto.imagenes[0];
  }

  if (
    Array.isArray(producto.fotos) &&
    producto.fotos.length > 0
  ) {
    return producto.fotos[0];
  }

  return (
    producto.imagenPrincipal ||
    producto.imagen_principal ||
    producto.imagen ||
    producto.foto ||
    ""
  );
}

function obtenerCodigoProducto(producto = {}) {
  return (
    producto.codigo ||
    producto.code ||
    producto.numero_serie ||
    producto.numeroSerie ||
    "Sin código"
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Carrito() {
  const navigate = useNavigate();

  const {
  carrito = [],
  itemsCarrito = [],
  cantidadProductos = 0,
  subtotal = 0,
  costoEnvio = 0,
  totalCarrito = 0,
  carritoVacio = true,

  aumentarCantidad,
  disminuirCantidad,
  eliminarDelCarrito,
  vaciarCarrito,

  mensajeCarrito = "",
  limpiarMensaje,

  procesando = false,
  obtenerIdProducto,
  obtenerPrecioProducto,
  obtenerStockProducto,
  esMotor,
} = useCarrito();
const productosCarrito = Array.isArray(carrito)
  ? carrito
  : Array.isArray(itemsCarrito)
    ? itemsCarrito
    : [];

  function volverAlCatalogo() {
    navigate("/catalogo");
  }
function realizarCompra() {
  if (productosCarrito.length === 0) {
    window.alert(
      "Agrega al menos un producto antes de realizar la compra."
    );
    return;
  }

  navigate("/checkout");
}

  return (
    <main className="carrito-pagina">
      <header className="carrito-encabezado">
        <button
          type="button"
          className="carrito-volver"
          onClick={volverAlCatalogo}
        >
          <FaArrowLeft />
          Seguir comprando
        </button>

        <div className="carrito-titulo">
          <FaCartShopping />

          <div>
            <h1>Mi carrito</h1>

            <p>
              {cantidadProductos === 1
                ? "1 producto"
                : `${cantidadProductos} productos`}
            </p>
          </div>
        </div>

        {!carritoVacio && (
          <button
            type="button"
            className="carrito-vaciar"
            onClick={() => {
              const confirmar = window.confirm(
                "¿Quieres eliminar todos los productos del carrito?"
              );

              if (confirmar) {
                vaciarCarrito();
              }
            }}
          >
            Vaciar carrito
          </button>
        )}
      </header>

      {mensajeCarrito && (
        <div className="carrito-mensaje">
          <span>{mensajeCarrito}</span>

          <button
            type="button"
            onClick={limpiarMensaje}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

        {productosCarrito.length === 0 ?  (
        <section className="carrito-vacio">
          <div className="carrito-vacio-icono">
            <FaCartShopping />
          </div>

          <h2>Tu carrito está vacío</h2>

          <p>
            Explora el catálogo de motores y autopartes
            disponibles.
          </p>

          <button
            type="button"
            onClick={volverAlCatalogo}
          >
            Ver catálogo
          </button>
        </section>
      ) : (
        <section className="carrito-contenido">
          <div className="carrito-lista">
            {productosCarrito.map((producto) => {

              const itemId = producto.id;
              const idProducto =
              
                obtenerIdProducto(producto);

              const nombre =
                obtenerNombreProducto(producto);

              const imagen =
                obtenerImagenProducto(producto);
                

              const codigo =
                obtenerCodigoProducto(producto);

              const precioUnitario =
                obtenerPrecioProducto(producto);

              const cantidad =
                convertirNumero(producto.cantidad);

              const stock =
                obtenerStockProducto(producto);

              const productoEsMotor =
                esMotor(producto);

              const subtotalProducto =
                precioUnitario * cantidad;

              return (
                <article
                  key={itemId}
                  className="carrito-item"
                >
                  <div className="carrito-item-imagen">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={nombre}
                      />
                    ) : (
                      <div className="carrito-sin-imagen">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="carrito-item-informacion">
                    <span className="carrito-item-codigo">
                      {codigo}
                    </span>

                    <h2>{nombre}</h2>

                    {producto.descripcion && (
                      <p className="carrito-item-descripcion">
                        {producto.descripcion}
                      </p>
                    )}

                    <strong className="carrito-item-precio">
                      {formatearDolares(
                        precioUnitario
                      )}
                    </strong>

                    <div className="carrito-item-detalles">
                      <span>
                        Estado:{" "}
                        <strong>
                          {producto.estado ||
                            "Disponible"}
                        </strong>
                      </span>

                      {!productoEsMotor && (
                        <span>
                          Stock disponible:{" "}
                          <strong>{stock}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="carrito-item-controles">
                    {productoEsMotor ? (
                      <div className="carrito-cantidad-unica">
                        Cantidad: 1
                      </div>
                    ) : (
                      <div className="carrito-cantidad">
                        <button
                          type="button"
                          onClick={() =>
                            disminuirCantidad(
                              idProducto
                            )
                          }
                          disabled={
                            procesando ||
                            cantidad <= 1
                          }
                          aria-label="Disminuir cantidad"
                        >
                          <FaMinus />
                        </button>

                        <span>{cantidad}</span>

                        <button
                          type="button"
                          onClick={() =>
                            aumentarCantidad(
                              idProducto
                            )
                          }
                          disabled={
                            procesando ||
                            cantidad >= stock
                          }
                          aria-label="Aumentar cantidad"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    )}

                    <strong className="carrito-item-subtotal">
                      {formatearDolares(
                        subtotalProducto
                      )}
                    </strong>

                    <button
                      type="button"
                      className="carrito-eliminar"
                      onClick={async () => {
  try {
    await eliminarDelCarrito(itemId);
  } catch (error) {
    console.error(
      "Error eliminando producto:",
      error
    );
  }
}}
                      disabled={procesando}
                    >
                      <FaTrashCan />
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="carrito-resumen">
            <h2>Resumen de compra</h2>

            <div className="carrito-resumen-fila">
              <span>
                Productos ({cantidadProductos})
              </span>

              <strong>
                {formatearDolares(subtotal)}
              </strong>
            </div>

            <div className="carrito-resumen-fila">
              <span>Envío</span>

              <strong>
                {costoEnvio > 0
                  ? formatearDolares(costoEnvio)
                  : "Por calcular"}
              </strong>
            </div>

            <div className="carrito-resumen-separador" />

            <div className="carrito-resumen-total">
              <span>Total</span>

              <strong>
                {formatearDolares(totalCarrito)}
              </strong>
            </div>

            <p className="carrito-resumen-aviso">
              El costo del envío se calculará según la
              forma de entrega seleccionada. También podrás
              elegir retirar gratuitamente en el local.
            </p>

            <button
              type="button"
              className="carrito-comprar"
              onClick={realizarCompra}
              disabled={procesando || carritoVacio}
            >
              {procesando
                ? "Procesando..."
                : "Realizar compra"}
            </button>

            <button
              type="button"
              className="carrito-seguir"
              onClick={volverAlCatalogo}
            >
              Seguir comprando
            </button>

            <div className="carrito-compra-segura">
              <strong>Compra segura</strong>

              <span>
                Los productos no cambian a reservado hasta
                que comiences el proceso de pago.
              </span>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}