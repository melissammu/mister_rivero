import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/Contenedor40.css";
import "../../styles/Motores.css";
import { supabase } from "../../lib/supabase";

const STORAGE_KEY = "motores";

const destinos = [
  {
    value: "contenedor40",
    label: "Contenedor 40",
  },
  {
    value: "contenedor80",
    label: "Contenedor 80",
  },
  {
    value: "detal",
    label: "Motor al detal",
  },
];

const estados = [
  "Disponible",
  "Reservado",
  "Vendido",
];

function formatearDolares(valor) {
  const numero = Number(valor) || 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numero);
}

function normalizarUbicacion(valor = "") {
  return String(valor)
    .toLowerCase()
    .trim()
    .replaceAll(" ", "")
    .replaceAll("_", "")
    .replaceAll("-", "");
}

function normalizarTexto(valor = "") {
  return String(valor)
    .toLowerCase()
    .trim();
}

function obtenerProductosGuardados() {
  try {
    const guardados =
      localStorage.getItem(STORAGE_KEY);

    if (!guardados) {
      return [];
    }

    const productos = JSON.parse(guardados);

    return Array.isArray(productos)
      ? productos
      : [];
  } catch (error) {
    console.error(
      "Error leyendo los motores:",
      error
    );

    return [];
  }
}

function obtenerImagenes(producto) {
  const posiblesImagenes = [
    ...(Array.isArray(producto?.imagenes)
      ? producto.imagenes
      : []),

    ...(Array.isArray(producto?.fotos)
      ? producto.fotos
      : []),

    producto?.imagen,
    producto?.foto,
  ];

  return posiblesImagenes
    .map((imagen) => {
      if (!imagen) {
        return "";
      }

      if (typeof imagen === "string") {
        return imagen;
      }

      return (
        imagen.preview ||
        imagen.url ||
        imagen.src ||
        ""
      );
    })
    .filter(Boolean);
}

function obtenerImagenPrincipal(producto) {
  return obtenerImagenes(producto)[0] || "";
}

function obtenerPrecioCompra(producto) {
  return (
    Number(
      producto?.precioCompra ??
        producto?.precio_compra ??
        0
    ) || 0
  );
}

function obtenerPrecioVenta(producto) {
  return (
    Number(
      producto?.precioVenta ??
        producto?.precio_venta ??
        producto?.precio ??
        0
    ) || 0
  );
}

function obtenerEstado(producto) {
  return producto?.estado || "Disponible";
}

function esMotorAlDetal(producto) {
  const ubicacion = normalizarUbicacion(
    producto?.ubicacion ||
      producto?.destino ||
      ""
  );

  /*
    Los registros antiguos que no tengan ubicación
    se muestran como motores al detal.
  */
  if (!ubicacion) {
    return true;
  }

  return [
    "detal",
    "pordetal",
    "motordetal",
    "motoraldetal",
    "motoresaldetal",
    "individual",
    "motorindividual",
  ].includes(ubicacion);
}

export default function Motores() {
  const navigate = useNavigate();

  const [productos, setProductos] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("Todos");

  const [indiceImagen, setIndiceImagen] =
    useState(0);

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState(null);

  const [modalActivo, setModalActivo] =
    useState(null);

  const [
    destinoTransferencia,
    setDestinoTransferencia,
  ] = useState("");

  const [
    formularioEdicion,
    setFormularioEdicion,
  ] = useState({
    codigo: "",
    marca: "",
    modelo: "",
    anio: "",
    descripcion: "",
    precioCompra: "",
    precioVenta: "",
    estado: "Disponible",
  });

  useEffect(() => {
    setProductos(
      obtenerProductosGuardados()
    );
  }, []);

  function guardarProductos(
    nuevosProductos
  ) {
    setProductos(nuevosProductos);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nuevosProductos)
    );
  }

  const motoresAlDetal = useMemo(() => {
    return productos.filter(
      esMotorAlDetal
    );
  }, [productos]);

  const motoresFiltrados = useMemo(() => {
    const texto =
      normalizarTexto(busqueda);

    return motoresAlDetal.filter(
      (producto) => {
        const coincideBusqueda =
          normalizarTexto(
            producto.codigo
          ).includes(texto) ||
          normalizarTexto(
            producto.marca
          ).includes(texto) ||
          normalizarTexto(
            producto.modelo
          ).includes(texto) ||
          normalizarTexto(
            producto.anio ||
              producto.año
          ).includes(texto);

        const estadoProducto =
          normalizarTexto(
            obtenerEstado(producto)
          );

        const coincideEstado =
          filtroEstado === "Todos" ||
          estadoProducto ===
            normalizarTexto(
              filtroEstado
            );

        return (
          coincideBusqueda &&
          coincideEstado
        );
      }
    );
  }, [
    motoresAlDetal,
    busqueda,
    filtroEstado,
  ]);

  const totalVenta =
    motoresAlDetal.reduce(
      (total, producto) =>
        total +
        obtenerPrecioVenta(producto),
      0
    );

  const totalCompra =
    motoresAlDetal.reduce(
      (total, producto) =>
        total +
        obtenerPrecioCompra(producto),
      0
    );

  const gananciaEstimada =
    totalVenta - totalCompra;

  function cerrarModal() {
    setModalActivo(null);
    setProductoSeleccionado(null);
    setDestinoTransferencia("");
    setIndiceImagen(0);
  }

  function irARegistrarMotor() {
    navigate("/admin/motores/nuevo");
  }

  function abrirVer(producto) {
    setProductoSeleccionado(producto);
    setModalActivo("ver");
  }

  function abrirGaleria(producto) {
    const imagenesDisponibles =
      obtenerImagenes(producto);

    if (
      imagenesDisponibles.length === 0
    ) {
      window.alert(
        "Este motor no tiene fotografías registradas."
      );

      return;
    }

    setProductoSeleccionado(producto);
    setIndiceImagen(0);
    setModalActivo("galeria");
  }

  function abrirEditar(producto) {
    setProductoSeleccionado(producto);

    setFormularioEdicion({
      codigo: producto.codigo || "",
      marca: producto.marca || "",
      modelo: producto.modelo || "",
      anio:
        producto.anio ||
        producto.año ||
        "",
      descripcion:
        producto.descripcion || "",
      precioCompra:
        producto.precioCompra ??
        producto.precio_compra ??
        "",
      precioVenta:
        producto.precioVenta ??
        producto.precio_venta ??
        producto.precio ??
        "",
      estado:
        producto.estado ||
        "Disponible",
    });

    setModalActivo("editar");
  }

  function abrirTransferir(producto) {
    setProductoSeleccionado(producto);
    setDestinoTransferencia("");
    setModalActivo("transferir");
  }

  function abrirEliminar(producto) {
    setProductoSeleccionado(producto);
    setModalActivo("eliminar");
  }

  function actualizarCampo(evento) {
    const { name, value } =
      evento.target;

    setFormularioEdicion(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  }

  function guardarEdicion(evento) {
    evento.preventDefault();

    if (!productoSeleccionado) {
      return;
    }

    if (
      !formularioEdicion.marca.trim() ||
      !formularioEdicion.modelo.trim()
    ) {
      window.alert(
        "La marca y el modelo son obligatorios."
      );

      return;
    }

    const actualizados =
      productos.map((producto) => {
        if (
          producto.id !==
          productoSeleccionado.id
        ) {
          return producto;
        }

        return {
          ...producto,
          ...formularioEdicion,

          precioCompra:
            Number(
              formularioEdicion.precioCompra
            ) || 0,

          precioVenta:
            Number(
              formularioEdicion.precioVenta
            ) || 0,

          anio:
            formularioEdicion.anio
              ? Number(
                  formularioEdicion.anio
                )
              : "",

          actualizadoEn:
            new Date().toISOString(),
        };
      });

    guardarProductos(actualizados);
    cerrarModal();

    window.alert(
      "Motor actualizado correctamente."
    );
  }

  function transferirMotor() {
    if (!productoSeleccionado) {
      return;
    }

    if (!destinoTransferencia) {
      window.alert(
        "Selecciona el destino del motor."
      );

      return;
    }

    const ubicacionActual =
      normalizarUbicacion(
        productoSeleccionado.ubicacion ||
          productoSeleccionado.destino
      ) || "detal";

    if (
      normalizarUbicacion(
        destinoTransferencia
      ) === ubicacionActual
    ) {
      window.alert(
        "El motor ya se encuentra en esa ubicación."
      );

      return;
    }

    const fechaActual =
      new Date().toISOString();

    const registroTransferencia = {
      origen: ubicacionActual,
      destino:
        destinoTransferencia,
      fecha: fechaActual,
    };

    const actualizados =
      productos.map((producto) => {
        if (
          producto.id !==
          productoSeleccionado.id
        ) {
          return producto;
        }

        return {
          ...producto,

          ubicacion:
            destinoTransferencia,

          destino:
            destinoTransferencia,

          actualizadoEn:
            fechaActual,

          historialTransferencias: [
            ...(producto.historialTransferencias ||
              []),

            registroTransferencia,
          ],
        };
      });

    guardarProductos(actualizados);
    cerrarModal();

    window.alert(
      "Motor transferido correctamente."
    );
  }

  function eliminarMotor() {
    if (!productoSeleccionado) {
      return;
    }

    const actualizados =
      productos.filter(
        (producto) =>
          producto.id !==
          productoSeleccionado.id
      );

    guardarProductos(actualizados);
    cerrarModal();

    window.alert(
      "Motor eliminado correctamente."
    );
  }

  const imagenesSeleccionadas =
    productoSeleccionado
      ? obtenerImagenes(
          productoSeleccionado
        )
      : [];

  function imagenAnterior() {
    setIndiceImagen((indiceActual) => {
      if (
        imagenesSeleccionadas.length ===
        0
      ) {
        return 0;
      }

      return indiceActual === 0
        ? imagenesSeleccionadas.length -
            1
        : indiceActual - 1;
    });
  }

  function imagenSiguiente() {
    setIndiceImagen((indiceActual) => {
      if (
        imagenesSeleccionadas.length ===
        0
      ) {
        return 0;
      }

      return (
        (indiceActual + 1) %
        imagenesSeleccionadas.length
      );
    });
  }

  return (
    <main className="contenedor40-page">
      <header className="contenedor40-header">
        <div>
          <span className="contenedor40-etiqueta">
            Inventario individual
          </span>

          <h1>Motores al detal</h1>

          <p>
            Consulta, edita, transfiere y
            administra los motores para venta
            individual.
          </p>
        </div>

        <div className="motores-header-acciones">
          <div className="contenedor40-badge">
            {motoresAlDetal.length}{" "}
            {motoresAlDetal.length === 1
              ? "motor"
              : "motores"}
          </div>

          <button
            type="button"
            className="motores-boton-registrar"
            onClick={irARegistrarMotor}
          >
            <span>＋</span>
            Registrar motor
          </button>
        </div>
      </header>

      <section className="contenedor40-resumen">
        <article className="resumen-card">
          <span>Total de motores</span>

          <strong>
            {motoresAlDetal.length}
          </strong>
        </article>

        <article className="resumen-card">
          <span>Valor de compra</span>

          <strong>
            {formatearDolares(
              totalCompra
            )}
          </strong>
        </article>

        <article className="resumen-card">
          <span>Valor de venta</span>

          <strong>
            {formatearDolares(
              totalVenta
            )}
          </strong>
        </article>

        <article className="resumen-card">
          <span>Ganancia estimada</span>

          <strong>
            {formatearDolares(
              gananciaEstimada
            )}
          </strong>
        </article>
      </section>

      <section className="contenedor40-filtros">
        <div className="campo-busqueda">
          <span aria-hidden="true">
            🔎
          </span>

          <input
            type="search"
            placeholder="Buscar por código, marca, modelo o año..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(
                evento.target.value
              )
            }
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(evento) =>
            setFiltroEstado(
              evento.target.value
            )
          }
        >
          <option value="Todos">
            Todos los estados
          </option>

          {estados.map((estado) => (
            <option
              key={estado}
              value={estado}
            >
              {estado}
            </option>
          ))}
        </select>
      </section>

      {motoresFiltrados.length === 0 ? (
        <section className="contenedor40-vacio">
          <div>⚙️</div>

          <h2>
            No hay motores para mostrar
          </h2>

          <p>
            Registra un motor nuevo, transfiere
            uno desde un contenedor o cambia
            los filtros de búsqueda.
          </p>

          <button
            type="button"
            className="motores-boton-registrar"
            onClick={irARegistrarMotor}
          >
            ＋ Registrar motor
          </button>
        </section>
      ) : (
        <section className="contenedor40-lista">
          {motoresFiltrados.map(
            (producto, indice) => {
              const imagen =
                obtenerImagenPrincipal(
                  producto
                );

              const estadoProducto =
                obtenerEstado(producto);

              const claseEstado =
                normalizarTexto(
                  estadoProducto
                ).replaceAll(
                  " ",
                  "-"
                );

              return (
                <article
                  className="motor-lista"
                  key={
                    producto.id ||
                    producto.codigo ||
                    indice
                  }
                >
                  <div className="motor-lista-imagen">
                    <button
                      type="button"
                      className="boton-imagen-motor"
                      onClick={() =>
                        abrirGaleria(
                          producto
                        )
                      }
                      aria-label={`Ver fotografías de ${
                        producto.marca ||
                        "motor"
                      } ${
                        producto.modelo ||
                        ""
                      }`}
                    >
                      {imagen ? (
                        <img
                          src={imagen}
                          alt={`${
                            producto.marca ||
                            "Motor"
                          } ${
                            producto.modelo ||
                            ""
                          }`}
                        />
                      ) : (
                        <div className="motor-sin-imagen">
                          Sin imagen
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="motor-lista-info">
                    <span className="motor-lista-codigo">
                      {producto.codigo ||
                        "Sin código"}
                    </span>

                    <h2>
                      {producto.marca ||
                        "Sin marca"}{" "}
                      {producto.modelo ||
                        "Sin modelo"}
                    </h2>

                    <p>
                      Año:{" "}
                      {producto.anio ||
                        producto.año ||
                        "No especificado"}
                    </p>
                  </div>

                  <div className="motor-lista-estado">
                    <span
                      className={`estado estado-${claseEstado}`}
                    >
                      {estadoProducto}
                    </span>
                  </div>

                  <div className="motor-lista-precio">
                    <span>Compra</span>

                    <strong>
                      {formatearDolares(
                        obtenerPrecioCompra(
                          producto
                        )
                      )}
                    </strong>
                  </div>

                  <div className="motor-lista-precio">
                    <span>Venta</span>

                    <strong>
                      {formatearDolares(
                        obtenerPrecioVenta(
                          producto
                        )
                      )}
                    </strong>
                  </div>

                  <div className="motor-lista-acciones">
                    <button
                      type="button"
                      className="accion-moderna accion-transferir"
                      onClick={() =>
                        abrirTransferir(
                          producto
                        )
                      }
                    >
                      <span>⇄</span>
                      Transferir
                    </button>

                    <button
                      type="button"
                      className="accion-moderna accion-editar"
                      onClick={() =>
                        abrirEditar(
                          producto
                        )
                      }
                    >
                      <span>✎</span>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="accion-moderna accion-eliminar"
                      onClick={() =>
                        abrirEliminar(
                          producto
                        )
                      }
                    >
                      <span>⌫</span>
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}

      {modalActivo &&
        productoSeleccionado && (
          <div
            className="modal-fondo"
            onMouseDown={cerrarModal}
          >
            <div
              className="modal-contenido"
              onMouseDown={(evento) =>
                evento.stopPropagation()
              }
            >
              <button
                type="button"
                className="modal-cerrar"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                ×
              </button>

              {modalActivo ===
                "galeria" && (
                <>
                  <h2>
                    Fotografías del motor
                  </h2>

                  <div className="galeria-principal">
                    <button
                      type="button"
                      onClick={
                        imagenAnterior
                      }
                      aria-label="Imagen anterior"
                    >
                      ‹
                    </button>

                    <img
                      src={
                        imagenesSeleccionadas[
                          indiceImagen
                        ]
                      }
                      alt={`Motor ${
                        productoSeleccionado.marca ||
                        ""
                      } ${
                        productoSeleccionado.modelo ||
                        ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={
                        imagenSiguiente
                      }
                      aria-label="Imagen siguiente"
                    >
                      ›
                    </button>
                  </div>

                  <p className="galeria-contador">
                    {indiceImagen + 1} de{" "}
                    {
                      imagenesSeleccionadas.length
                    }
                  </p>
                </>
              )}

              {modalActivo === "ver" && (
                <>
                  <h2>
                    Detalles del motor
                  </h2>

                  <div className="detalle-lista">
                    <p>
                      <strong>
                        Código:
                      </strong>{" "}
                      {productoSeleccionado.codigo ||
                        "Sin código"}
                    </p>

                    <p>
                      <strong>
                        Marca:
                      </strong>{" "}
                      {productoSeleccionado.marca ||
                        "Sin marca"}
                    </p>

                    <p>
                      <strong>
                        Modelo:
                      </strong>{" "}
                      {productoSeleccionado.modelo ||
                        "Sin modelo"}
                    </p>

                    <p>
                      <strong>Año:</strong>{" "}
                      {productoSeleccionado.anio ||
                        productoSeleccionado.año ||
                        "No especificado"}
                    </p>

                    <p>
                      <strong>
                        Estado:
                      </strong>{" "}
                      {obtenerEstado(
                        productoSeleccionado
                      )}
                    </p>

                    <p>
                      <strong>
                        Precio de compra:
                      </strong>{" "}
                      {formatearDolares(
                        obtenerPrecioCompra(
                          productoSeleccionado
                        )
                      )}
                    </p>

                    <p>
                      <strong>
                        Precio de venta:
                      </strong>{" "}
                      {formatearDolares(
                        obtenerPrecioVenta(
                          productoSeleccionado
                        )
                      )}
                    </p>

                    <p>
                      <strong>
                        Descripción:
                      </strong>{" "}
                      {productoSeleccionado.descripcion ||
                        "Sin descripción registrada"}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="boton-principal"
                    onClick={cerrarModal}
                  >
                    Cerrar
                  </button>
                </>
              )}

              {modalActivo ===
                "editar" && (
                <>
                  <h2>Editar motor</h2>

                  <form
                    className="formulario-edicion"
                    onSubmit={
                      guardarEdicion
                    }
                  >
                    <label>
                      Código

                      <input
                        type="text"
                        name="codigo"
                        value={
                          formularioEdicion.codigo
                        }
                        onChange={
                          actualizarCampo
                        }
                      />
                    </label>

                    <div className="formulario-dos-columnas">
                      <label>
                        Marca

                        <input
                          type="text"
                          name="marca"
                          value={
                            formularioEdicion.marca
                          }
                          onChange={
                            actualizarCampo
                          }
                          required
                        />
                      </label>

                      <label>
                        Modelo

                        <input
                          type="text"
                          name="modelo"
                          value={
                            formularioEdicion.modelo
                          }
                          onChange={
                            actualizarCampo
                          }
                          required
                        />
                      </label>
                    </div>

                    <div className="formulario-dos-columnas">
                      <label>
                        Año

                        <input
                          type="number"
                          name="anio"
                          min="1900"
                          max="2100"
                          value={
                            formularioEdicion.anio
                          }
                          onChange={
                            actualizarCampo
                          }
                        />
                      </label>

                      <label>
                        Estado

                        <select
                          name="estado"
                          value={
                            formularioEdicion.estado
                          }
                          onChange={
                            actualizarCampo
                          }
                        >
                          {estados.map(
                            (estado) => (
                              <option
                                key={
                                  estado
                                }
                                value={
                                  estado
                                }
                              >
                                {estado}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    </div>

                    <div className="formulario-dos-columnas">
                      <label>
                        Precio de compra USD

                        <input
                          type="number"
                          name="precioCompra"
                          min="0"
                          step="0.01"
                          value={
                            formularioEdicion.precioCompra
                          }
                          onChange={
                            actualizarCampo
                          }
                        />
                      </label>

                      <label>
                        Precio de venta USD

                        <input
                          type="number"
                          name="precioVenta"
                          min="0"
                          step="0.01"
                          value={
                            formularioEdicion.precioVenta
                          }
                          onChange={
                            actualizarCampo
                          }
                          required
                        />
                      </label>
                    </div>

                    <label>
                      Descripción

                      <textarea
                        name="descripcion"
                        rows="4"
                        value={
                          formularioEdicion.descripcion
                        }
                        onChange={
                          actualizarCampo
                        }
                      />
                    </label>

                    <div className="modal-botones">
                      <button
                        type="button"
                        className="boton-secundario"
                        onClick={
                          cerrarModal
                        }
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="boton-principal"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </form>
                </>
              )}

              {modalActivo ===
                "transferir" && (
                <>
                  <h2>
                    Transferir motor
                  </h2>

                  <p>
                    Vas a transferir el
                    motor{" "}
                    <strong>
                      {productoSeleccionado.codigo ||
                        productoSeleccionado.modelo}
                    </strong>
                  </p>

                  <label className="campo-transferencia">
                    Nuevo destino

                    <select
                      value={
                        destinoTransferencia
                      }
                      onChange={(evento) =>
                        setDestinoTransferencia(
                          evento.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Seleccionar destino
                      </option>

                      {destinos
                        .filter(
                          (destino) =>
                            destino.value !==
                            "detal"
                        )
                        .map(
                          (destino) => (
                            <option
                              key={
                                destino.value
                              }
                              value={
                                destino.value
                              }
                            >
                              {
                                destino.label
                              }
                            </option>
                          )
                        )}
                    </select>
                  </label>

                  <div className="modal-botones">
                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={
                        cerrarModal
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="boton-principal"
                      onClick={
                        transferirMotor
                      }
                    >
                      Confirmar transferencia
                    </button>
                  </div>
                </>
              )}

              {modalActivo ===
                "eliminar" && (
                <>
                  <h2>Eliminar motor</h2>

                  <p>
                    ¿Estás segura de eliminar
                    el motor{" "}
                    <strong>
                      {productoSeleccionado.codigo ||
                        productoSeleccionado.modelo}
                    </strong>
                    ?
                  </p>

                  <p className="advertencia-eliminar">
                    Esta acción eliminará el
                    registro del inventario.
                  </p>

                  <div className="modal-botones">
                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={
                        cerrarModal
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="boton-confirmar-eliminar"
                      onClick={
                        eliminarMotor
                      }
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </main>
  );
}