import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/Contenedor40.css";
import "../../styles/Partes.css";

const STORAGE_KEY = "partes";

const ESTADOS = [
  "Disponible",
  "Reservado",
  "Vendido",
];

function normalizarTexto(valor = "") {
  return String(valor)
    .toLowerCase()
    .trim();
}

function formatearDolares(valor) {
  const numero = Number(valor) || 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numero);
}

function obtenerPartesGuardadas() {
  try {
    const contenido = localStorage.getItem(
      STORAGE_KEY
    );

    if (!contenido) {
      return [];
    }

    const lista = JSON.parse(contenido);

    return Array.isArray(lista)
      ? lista
      : [];
  } catch (error) {
    console.error(
      "Error al cargar las autopartes:",
      error
    );

    return [];
  }
}

function obtenerImagenes(parte) {
  const imagenesEncontradas = [
    ...(Array.isArray(parte?.imagenes)
      ? parte.imagenes
      : []),

    ...(Array.isArray(parte?.fotos)
      ? parte.fotos
      : []),

    parte?.imagenPrincipal,
    parte?.imagen,
    parte?.foto,
  ];

  return imagenesEncontradas
    .map((imagen) => {
      if (!imagen) {
        return "";
      }

      if (typeof imagen === "string") {
        return imagen;
      }

      return (
        imagen.url ||
        imagen.preview ||
        imagen.src ||
        ""
      );
    })
    .filter(Boolean);
}

function obtenerImagenPrincipal(parte) {
  return obtenerImagenes(parte)[0] || "";
}

function obtenerNombreParte(parte) {
  return (
    parte?.nombre?.trim() ||
    parte?.titulo?.trim() ||
    parte?.modelo?.trim() ||
    parte?.categoria?.trim() ||
    "Autoparte sin nombre"
  );
}

function obtenerDescripcion(parte) {
  return (
    parte?.descripcion?.trim() ||
    "Sin descripción registrada"
  );
}

function obtenerPrecioCompra(parte) {
  return (
    Number(
      parte?.precioCompra ??
        parte?.precio_compra ??
        0
    ) || 0
  );
}

function obtenerPrecioVenta(parte) {
  return (
    Number(
      parte?.precioVenta ??
        parte?.precio_venta ??
        parte?.precio ??
        0
    ) || 0
  );
}

function obtenerEstado(parte) {
  return parte?.estado || "Disponible";
}

function crearClaseEstado(estado) {
  return normalizarTexto(estado)
    .replaceAll(" ", "-")
    .replaceAll("á", "a")
    .replaceAll("é", "e")
    .replaceAll("í", "i")
    .replaceAll("ó", "o")
    .replaceAll("ú", "u");
}

export default function Partes() {
  const navigate = useNavigate();

  const [partes, setPartes] = useState([]);
  const [busqueda, setBusqueda] =
    useState("");
  const [filtroEstado, setFiltroEstado] =
    useState("Todos");

  const [
    parteSeleccionada,
    setParteSeleccionada,
  ] = useState(null);

  const [modalActivo, setModalActivo] =
    useState(null);

  const [indiceImagen, setIndiceImagen] =
    useState(0);

  const [
    formularioEdicion,
    setFormularioEdicion,
  ] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    marca: "",
    modelo: "",
    anio: "",
    descripcion: "",
    precioCompra: "",
    precioVenta: "",
    estado: "Disponible",
  });

  useEffect(() => {
    setPartes(obtenerPartesGuardadas());
  }, []);

  function guardarPartes(nuevaLista) {
    setPartes(nuevaLista);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nuevaLista)
    );
  }

  const partesFiltradas = useMemo(() => {
    const texto =
      normalizarTexto(busqueda);

    return partes.filter((parte) => {
      const coincideBusqueda =
        normalizarTexto(
          parte.codigo
        ).includes(texto) ||
        normalizarTexto(
          obtenerNombreParte(parte)
        ).includes(texto) ||
        normalizarTexto(
          parte.categoria
        ).includes(texto) ||
        normalizarTexto(
          parte.marca
        ).includes(texto) ||
        normalizarTexto(
          parte.modelo
        ).includes(texto) ||
        normalizarTexto(
          parte.descripcion
        ).includes(texto) ||
        normalizarTexto(
          parte.anio || parte.año
        ).includes(texto);

      const coincideEstado =
        filtroEstado === "Todos" ||
        normalizarTexto(
          obtenerEstado(parte)
        ) ===
          normalizarTexto(
            filtroEstado
          );

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [
    partes,
    busqueda,
    filtroEstado,
  ]);

  const totalCompra = useMemo(() => {
    return partes.reduce(
      (total, parte) =>
        total +
        obtenerPrecioCompra(parte),
      0
    );
  }, [partes]);

  const totalVenta = useMemo(() => {
    return partes.reduce(
      (total, parte) =>
        total +
        obtenerPrecioVenta(parte),
      0
    );
  }, [partes]);

  const gananciaEstimada =
    totalVenta - totalCompra;

  const imagenesSeleccionadas =
    parteSeleccionada
      ? obtenerImagenes(
          parteSeleccionada
        )
      : [];

  function irARegistrarParte() {
    navigate("/admin/motores/nuevo");
  }

  function cerrarModal() {
    setParteSeleccionada(null);
    setModalActivo(null);
    setIndiceImagen(0);
  }

  function abrirGaleria(parte) {
    const imagenes =
      obtenerImagenes(parte);

    if (imagenes.length === 0) {
      window.alert(
        "Esta autoparte no tiene fotografías registradas."
      );

      return;
    }

    setParteSeleccionada(parte);
    setIndiceImagen(0);
    setModalActivo("galeria");
  }

  function abrirEditar(parte) {
    setParteSeleccionada(parte);

    setFormularioEdicion({
      codigo: parte.codigo || "",

      nombre:
        parte.nombre ||
        parte.titulo ||
        parte.modelo ||
        "",

      categoria:
        parte.categoria || "",

      marca:
        parte.marca || "",

      modelo:
        parte.modelo || "",

      anio:
        parte.anio ||
        parte.año ||
        "",

      descripcion:
        parte.descripcion || "",

      precioCompra:
        parte.precioCompra ??
        parte.precio_compra ??
        "",

      precioVenta:
        parte.precioVenta ??
        parte.precio_venta ??
        parte.precio ??
        "",

      estado:
        parte.estado ||
        "Disponible",
    });

    setModalActivo("editar");
  }

  function abrirEliminar(parte) {
    setParteSeleccionada(parte);
    setModalActivo("eliminar");
  }

  function actualizarCampo(evento) {
    const { name, value } =
      evento.target;

    setFormularioEdicion(
      (formularioAnterior) => ({
        ...formularioAnterior,
        [name]: value,
      })
    );
  }

  function guardarEdicion(evento) {
    evento.preventDefault();

    if (!parteSeleccionada) {
      return;
    }

    if (
      !formularioEdicion.nombre.trim()
    ) {
      window.alert(
        "Debes escribir el nombre de la autoparte."
      );

      return;
    }

    if (
      !formularioEdicion.categoria.trim()
    ) {
      window.alert(
        "Debes seleccionar una categoría."
      );

      return;
    }

    if (
      Number(
        formularioEdicion.precioVenta
      ) <= 0
    ) {
      window.alert(
        "El precio de venta debe ser mayor que cero."
      );

      return;
    }

    const partesActualizadas =
      partes.map((parte) => {
        const mismoRegistro =
          parte.id ===
            parteSeleccionada.id ||
          (
            !parte.id &&
            parte.codigo ===
              parteSeleccionada.codigo
          );

        if (!mismoRegistro) {
          return parte;
        }

        return {
          ...parte,

          codigo:
            formularioEdicion.codigo.trim(),

          nombre:
            formularioEdicion.nombre.trim(),

          categoria:
            formularioEdicion.categoria.trim(),

          marca:
            formularioEdicion.marca.trim(),

          modelo:
            formularioEdicion.modelo.trim(),

          anio:
            formularioEdicion.anio
              ? Number(
                  formularioEdicion.anio
                )
              : null,

          descripcion:
            formularioEdicion.descripcion.trim(),

          precioCompra:
            Number(
              formularioEdicion.precioCompra
            ) || 0,

          precioVenta:
            Number(
              formularioEdicion.precioVenta
            ) || 0,

          estado:
            formularioEdicion.estado,

          fechaActualizacion:
            new Date().toISOString(),
        };
      });

    guardarPartes(partesActualizadas);
    cerrarModal();

    window.alert(
      "Autoparte actualizada correctamente."
    );
  }

  function eliminarParte() {
    if (!parteSeleccionada) {
      return;
    }

    const partesActualizadas =
      partes.filter((parte) => {
        const mismoRegistro =
          parte.id ===
            parteSeleccionada.id ||
          (
            !parte.id &&
            parte.codigo ===
              parteSeleccionada.codigo
          );

        return !mismoRegistro;
      });

    guardarPartes(partesActualizadas);
    cerrarModal();

    window.alert(
      "Autoparte eliminada correctamente."
    );
  }

  function imagenAnterior() {
    setIndiceImagen((indiceActual) => {
      if (
        imagenesSeleccionadas.length ===
        0
      ) {
        return 0;
      }

      if (indiceActual === 0) {
        return (
          imagenesSeleccionadas.length -
          1
        );
      }

      return indiceActual - 1;
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
    <main className="contenedor40-page partes-page">
      <header className="contenedor40-header">
        <div>
          <span className="contenedor40-etiqueta">
            Inventario individual
          </span>

          <h1>Autopartes</h1>

          <p>
            Consulta, edita y administra las
            autopartes disponibles para venta
            individual.
          </p>
        </div>

        <div className="partes-header-acciones">
          <div className="contenedor40-badge">
            {partes.length}{" "}
            {partes.length === 1
              ? "autoparte"
              : "autopartes"}
          </div>

          <button
            type="button"
            className="partes-boton-registrar"
            onClick={irARegistrarParte}
          >
            <span>＋</span>
            Registrar autoparte
          </button>
        </div>
      </header>

      <section className="contenedor40-resumen">
        <article className="resumen-card">
          <span>
            Total de autopartes
          </span>

          <strong>
            {partes.length}
          </strong>
        </article>

        <article className="resumen-card">
          <span>
            Valor de compra
          </span>

          <strong>
            {formatearDolares(
              totalCompra
            )}
          </strong>
        </article>

        <article className="resumen-card">
          <span>
            Valor de venta
          </span>

          <strong>
            {formatearDolares(
              totalVenta
            )}
          </strong>
        </article>

        <article className="resumen-card">
          <span>
            Ganancia estimada
          </span>

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
            value={busqueda}
            placeholder="Buscar por código, nombre, descripción, categoría, marca o modelo..."
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

          {ESTADOS.map((estado) => (
            <option
              key={estado}
              value={estado}
            >
              {estado}
            </option>
          ))}
        </select>
      </section>

      {partesFiltradas.length === 0 ? (
        <section className="contenedor40-vacio">
          <div className="partes-vacio-icono">
            🔩
          </div>

          <h2>
            No hay autopartes para mostrar
          </h2>

          <p>
            Registra una autoparte nueva o
            cambia los filtros de búsqueda.
          </p>

          <button
            type="button"
            className="partes-boton-registrar"
            onClick={irARegistrarParte}
          >
            ＋ Registrar autoparte
          </button>
        </section>
      ) : (
        <section className="contenedor40-lista">
          {partesFiltradas.map(
            (parte, indice) => {
              const imagen =
                obtenerImagenPrincipal(
                  parte
                );

              const estado =
                obtenerEstado(parte);

              const claseEstado =
                crearClaseEstado(estado);

              return (
                <article
                  className="motor-lista parte-lista"
                  key={
                    parte.id ||
                    parte.codigo ||
                    indice
                  }
                >
                  <div className="motor-numero">
                    #{indice + 1}
                  </div>

                  <div className="motor-lista-imagen parte-lista-imagen">
                    <button
                      type="button"
                      className="boton-imagen-parte"
                      onClick={() =>
                        abrirGaleria(parte)
                      }
                      aria-label={`Ver imágenes de ${obtenerNombreParte(
                        parte
                      )}`}
                    >
                      {imagen ? (
                        <img
                          src={imagen}
                          alt={obtenerNombreParte(
                            parte
                          )}
                        />
                      ) : (
                        <div className="motor-sin-imagen">
                          Sin imagen
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="motor-lista-info parte-lista-info">
                    <span className="motor-lista-codigo">
                      {parte.codigo ||
                        "Sin código"}
                    </span>

                    <h2>
                      {obtenerNombreParte(
                        parte
                      )}
                    </h2>

                    <p className="parte-dato">
                      <strong>
                        Categoría:
                      </strong>{" "}
                      {parte.categoria ||
                        "Sin categoría"}
                    </p>

                    {(parte.marca ||
                      parte.modelo) && (
                      <p className="parte-dato">
                        <strong>
                          Marca / modelo:
                        </strong>{" "}
                        {parte.marca ||
                          "Sin marca"}{" "}
                        {parte.modelo || ""}
                      </p>
                    )}

                    <p className="parte-descripcion">
                      <strong>
                        Descripción:
                      </strong>{" "}
                      {obtenerDescripcion(
                        parte
                      )}
                    </p>
                  </div>

                  <div className="motor-lista-estado">
                    <span
                      className={`estado estado-${claseEstado}`}
                    >
                      {estado}
                    </span>
                  </div>

                  <div className="motor-lista-precio">
                    <span>
                      Compra
                    </span>

                    <strong>
                      {formatearDolares(
                        obtenerPrecioCompra(
                          parte
                        )
                      )}
                    </strong>
                  </div>

                  <div className="motor-lista-precio">
                    <span>
                      Venta
                    </span>

                    <strong>
                      {formatearDolares(
                        obtenerPrecioVenta(
                          parte
                        )
                      )}
                    </strong>
                  </div>

                  <div className="motor-lista-acciones partes-acciones">
                    <button
                      type="button"
                      className="accion-moderna accion-editar"
                      onClick={() =>
                        abrirEditar(parte)
                      }
                    >
                      <span>✎</span>
                      Editar
                    </button>

                    <button
                      type="button"
                      className="accion-moderna accion-eliminar"
                      onClick={() =>
                        abrirEliminar(parte)
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
        parteSeleccionada && (
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
                    {obtenerNombreParte(
                      parteSeleccionada
                    )}
                  </h2>

                  <p className="descripcion-galeria">
                    {obtenerDescripcion(
                      parteSeleccionada
                    )}
                  </p>

                  <div className="galeria-partes">
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
                      alt={obtenerNombreParte(
                        parteSeleccionada
                      )}
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

                  <p className="galeria-contador-partes">
                    {indiceImagen + 1} de{" "}
                    {
                      imagenesSeleccionadas.length
                    }
                  </p>
                </>
              )}

              {modalActivo ===
                "editar" && (
                <>
                  <h2>
                    Editar autoparte
                  </h2>

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

                    <label>
                      Nombre de la autoparte

                      <input
                        type="text"
                        name="nombre"
                        value={
                          formularioEdicion.nombre
                        }
                        onChange={
                          actualizarCampo
                        }
                        required
                      />
                    </label>

                    <div className="formulario-dos-columnas">
                      <label>
                        Categoría

                        <input
                          type="text"
                          name="categoria"
                          value={
                            formularioEdicion.categoria
                          }
                          onChange={
                            actualizarCampo
                          }
                          required
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
                          {ESTADOS.map(
                            (estado) => (
                              <option
                                key={estado}
                                value={estado}
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
                        />
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
                        placeholder="Describe la autoparte"
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
                "eliminar" && (
                <>
                  <h2>
                    Eliminar autoparte
                  </h2>

                  <p>
                    ¿Estás segura de eliminar{" "}
                    <strong>
                      {obtenerNombreParte(
                        parteSeleccionada
                      )}
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
                        eliminarParte
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