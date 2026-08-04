import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaCartShopping,
  FaMinus,
  FaPlus,
  FaShieldHalved,
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(convertirNumero(valor));
}

function obtenerNombreProducto(producto = {}) {
  const marca = producto.marca || "";
  const modelo = producto.modelo || "";

  return (
    producto.nombre_producto ||
    producto.nombre ||
    producto.titulo ||
    `${marca} ${modelo}`.trim() ||
    producto.descripcion ||
    "Producto"
  );
}

function obtenerReferenciaProducto(producto = {}) {
  return (
    producto.producto_id ||
    producto.codigo ||
    producto.code ||
    producto.numero_serie ||
    producto.numeroSerie ||
    "Sin referencia"
  );
}

function obtenerPrecioProducto(producto = {}) {
  return convertirNumero(
    producto.precio_unitario ??
      producto.precio_venta ??
      producto.precioVenta ??
      producto.precio ??
      0
  );
}

function obtenerTipoProducto(producto = {}) {
  return String(
    producto.tipo_producto ||
      producto.tipo ||
      producto.categoria ||
      ""
  )
    .trim()
    .toLowerCase();
}

function esMotorProducto(producto = {}) {
  const tipo = obtenerTipoProducto(producto);

  return (
    tipo === "motor" ||
    tipo === "motores" ||
    tipo === "engine"
  );
}

function agregarImagen(resultado, imagen) {
  if (!imagen) {
    return;
  }

  if (typeof imagen === "string") {
    const url = imagen.trim();

    if (url && !resultado.includes(url)) {
      resultado.push(url);
    }

    return;
  }

  if (typeof imagen === "object") {
    const url =
      imagen.url ||
      imagen.publicUrl ||
      imagen.public_url ||
      imagen.src ||
      imagen.imagen;

    if (
      typeof url === "string" &&
      url.trim() &&
      !resultado.includes(url.trim())
    ) {
      resultado.push(url.trim());
    }
  }
}

function obtenerImagenProducto(producto = {}) {
  const imagenes = [];

  if (Array.isArray(producto.imagenes)) {
    producto.imagenes.forEach((imagen) =>
      agregarImagen(imagenes, imagen)
    );
  } else if (typeof producto.imagenes === "string") {
    try {
      const lista = JSON.parse(producto.imagenes);

      if (Array.isArray(lista)) {
        lista.forEach((imagen) =>
          agregarImagen(imagenes, imagen)
        );
      } else {
        agregarImagen(imagenes, producto.imagenes);
      }
    } catch {
      agregarImagen(imagenes, producto.imagenes);
    }
  }

  if (Array.isArray(producto.fotos)) {
    producto.fotos.forEach((imagen) =>
      agregarImagen(imagenes, imagen)
    );
  }

  [
    producto.imagen_url,
    producto.imagenUrl,
    producto.imagen_principal,
    producto.imagenPrincipal,
    producto.imagen,
    producto.foto,
  ].forEach((imagen) =>
    agregarImagen(imagenes, imagen)
  );

  return imagenes[0] || "";
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Carrito() {
  const navigate = useNavigate();

  const {
    items = [],
    pedidoCarrito = null,

    cantidadProductos = 0,
    subtotal = 0,
    envio = 0,
    impuestos = 0,
    total = 0,

    cargando = false,
    procesando = false,
    errorCarrito = "",

    cambiarCantidad,
    eliminarDelCarrito,
    iniciarReserva,
    limpiarErrorCarrito,
  } = useCarrito();

  const productosCarrito = Array.isArray(items)
    ? items
    : [];

  function volverAlCatalogo() {
    navigate("/catalogo");
  }

  async function manejarCambiarCantidad(
    itemId,
    nuevaCantidad
  ) {
    if (!itemId || procesando) {
      return;
    }

    try {
      await cambiarCantidad(
        itemId,
        Math.max(1, nuevaCantidad)
      );
    } catch (error) {
      console.error(
        "No fue posible cambiar la cantidad:",
        error
      );
    }
  }

  async function manejarEliminar(
    itemId,
    nombre
  ) {
    if (!itemId || procesando) {
      return;
    }

    const confirmar = window.confirm(
      `¿Quieres eliminar "${nombre}" del carrito?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await eliminarDelCarrito(itemId);
    } catch (error) {
      console.error(
        "No fue posible eliminar el producto:",
        error
      );
    }
  }

  async function realizarCompra() {
    if (productosCarrito.length === 0) {
      window.alert(
        "Agrega al menos un producto antes de realizar la compra."
      );

      return;
    }

    try {
      await iniciarReserva();

      navigate("/checkout", {
        state: {
          pedidoId: pedidoCarrito?.id || null,
        },
      });
    } catch (error) {
      console.error(
        "No fue posible iniciar la compra:",
        error
      );
    }
  }

  if (cargando) {
    return (
      <main className="carrito-pagina">
        <section className="carrito-vacio">
          <div className="carrito-vacio-icono">
            <FaCartShopping />
          </div>

          <h2>Cargando carrito...</h2>

          <p>
            Estamos consultando los productos de tu compra.
          </p>
        </section>
      </main>
    );
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
            <span>MR. RIVERO MOTORS</span>

            <h1>Mi carrito</h1>

            <p>
              {cantidadProductos === 1
                ? "1 producto seleccionado"
                : `${cantidadProductos} productos seleccionados`}
            </p>
          </div>
        </div>
      </header>

      {errorCarrito && (
        <div className="carrito-mensaje">
          <span>{errorCarrito}</span>

          <button
            type="button"
            onClick={limpiarErrorCarrito}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {productosCarrito.length === 0 ? (
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

              const nombre =
                obtenerNombreProducto(producto);

              const referencia =
                obtenerReferenciaProducto(producto);

              const imagen =
                obtenerImagenProducto(producto);

              const precioUnitario =
                obtenerPrecioProducto(producto);

              const cantidad = Math.max(
                1,
                convertirNumero(producto.cantidad)
              );

              const productoEsMotor =
                esMotorProducto(producto);

              const subtotalProducto =
                convertirNumero(
                  producto.subtotal ??
                    precioUnitario * cantidad
                );

              const tipoVisual = productoEsMotor
                ? "Motor"
                : "Autoparte";

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
                        <FaCartShopping />
                      </div>
                    )}
                  </div>

                  <div className="carrito-item-informacion">
                    <span className="carrito-item-tipo">
                      {tipoVisual}
                    </span>

                    <h2>{nombre}</h2>

                    <span className="carrito-item-codigo">
                      Referencia: {referencia}
                    </span>

                    {producto.descripcion && (
                      <p className="carrito-item-descripcion">
                        {producto.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="carrito-item-precio-bloque">
                    <span>Precio unitario</span>

                    <strong>
                      {formatearDolares(
                        precioUnitario
                      )}
                    </strong>
                  </div>

                  <div className="carrito-item-cantidad-bloque">
                    <span>Cantidad</span>

                    {productoEsMotor ? (
                      <strong>1</strong>
                    ) : (
                      <div className="carrito-cantidad">
                        <button
                          type="button"
                          onClick={() =>
                            manejarCambiarCantidad(
                              itemId,
                              cantidad - 1
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

                        <strong>{cantidad}</strong>

                        <button
                          type="button"
                          onClick={() =>
                            manejarCambiarCantidad(
                              itemId,
                              cantidad + 1
                            )
                          }
                          disabled={procesando}
                          aria-label="Aumentar cantidad"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="carrito-item-subtotal-bloque">
                    <span>Subtotal</span>

                    <strong>
                      {formatearDolares(
                        subtotalProducto
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="carrito-eliminar"
                    onClick={() =>
                      manejarEliminar(
                        itemId,
                        nombre
                      )
                    }
                    disabled={procesando}
                    aria-label={`Eliminar ${nombre}`}
                  >
                    <FaTrashCan />
                    <span>Eliminar</span>
                  </button>
                </article>
              );
            })}
          </div>

          <aside className="carrito-resumen">
            <span className="carrito-resumen-etiqueta">
              Resumen del pedido
            </span>

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
                {convertirNumero(envio) > 0
                  ? formatearDolares(envio)
                  : "Por coordinar"}
              </strong>
            </div>

            <div className="carrito-resumen-fila">
              <span>Impuestos</span>

              <strong>
                {formatearDolares(impuestos)}
              </strong>
            </div>

            <div className="carrito-resumen-separador" />

            <div className="carrito-resumen-total">
              <span>Total</span>

              <strong>
                {formatearDolares(total)}
              </strong>
            </div>

            <button
              type="button"
              className="carrito-comprar"
              onClick={realizarCompra}
              disabled={
                procesando ||
                productosCarrito.length === 0
              }
            >
              <FaShieldHalved />

              {procesando
                ? "Procesando..."
                : "Proceder al pago"}
            </button>

            <p className="carrito-resumen-aviso">
              La reserva comienza únicamente al proceder
              al pago.
            </p>

            <button
              type="button"
              className="carrito-seguir"
              onClick={volverAlCatalogo}
            >
              Seguir comprando
            </button>

            <div className="carrito-compra-segura">
              <FaShieldHalved />

              <div>
                <strong>Compra segura</strong>

                <span>
                  Tus productos continúan disponibles hasta
                  que comiences el proceso de pago.
                </span>
              </div>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}