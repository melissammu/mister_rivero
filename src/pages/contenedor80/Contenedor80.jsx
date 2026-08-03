import { useEffect, useMemo, useState } from "react";
import "../../styles/Contenedor80.css";
const STORAGE_KEY = "motores";
import { supabase } from "../../lib/supabase";

const ESTADOS = ["Disponible", "Reservado", "Vendido"];

const DESTINOS = [
  { value: "contenedor40", label: "Contenedor 40" },
  { value: "contenedor80", label: "Contenedor 80" },
  { value: "detal", label: "Motor al detal" },
];

function formatearDolares(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

function normalizarTexto(valor = "") {
  return String(valor)
    .toLowerCase()
    .trim()
    .replaceAll(" ", "")
    .replaceAll("_", "")
    .replaceAll("-", "");
}
function abrirGaleria(motor) {
  const imagenesDisponibles = obtenerImagenes(motor);

  if (imagenesDisponibles.length === 0) {
    alert("Este motor no tiene fotografías registradas.");
    return;
  }

  setMotorSeleccionado(motor);
  setIndiceImagen(0);
  setModal("galeria");
}
function obtenerProductos() {
  try {
    const datos = localStorage.getItem(STORAGE_KEY);

    if (!datos) {
      return [];
    }

    const productos = JSON.parse(datos);

    return Array.isArray(productos) ? productos : [];
  } catch (error) {
    console.error("Error al cargar los productos:", error);
    return [];
  }
}

function obtenerId(producto) {
  return producto.id || producto.codigo;
}

function obtenerImagen(producto) {
  if (producto.imagen) return producto.imagen;
  if (producto.foto) return producto.foto;

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

  return null;
}

export default function Contenedor80() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [modal, setModal] = useState("");
  const [motorSeleccionado, setMotorSeleccionado] =
    useState(null);

  const [destinoTransferencia, setDestinoTransferencia] =
    useState("");

  const [formulario, setFormulario] = useState({
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
    setProductos(obtenerProductos());
  }, []);

  function guardarProductos(nuevosProductos) {
    setProductos(nuevosProductos);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nuevosProductos)
    );
  }

  const motoresContenedor80 = useMemo(() => {
    return productos.filter((producto) => {
      const ubicacion = normalizarTexto(
        producto.ubicacion ||
          producto.destino ||
          producto.contenedor ||
          producto.area
      );

      const categoria = normalizarTexto(
        producto.categoria || producto.tipo || "motor"
      );

      const esMotor =
        categoria === "motor" ||
        categoria === "motores" ||
        !producto.categoria;

      return ubicacion === "contenedor80" && esMotor;
    });
  }, [productos]);

  const motoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return motoresContenedor80.filter((motor) => {
      const contenido = [
        motor.codigo,
        motor.marca,
        motor.modelo,
        motor.anio,
        motor.descripcion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideBusqueda =
        texto === "" || contenido.includes(texto);

      const estado = motor.estado || "Disponible";

      const coincideEstado =
        filtroEstado === "Todos" ||
        estado.toLowerCase() === filtroEstado.toLowerCase();

      return coincideBusqueda && coincideEstado;
    });
  }, [motoresContenedor80, busqueda, filtroEstado]);

  const totalCompra = useMemo(() => {
    return motoresContenedor80.reduce(
      (total, motor) =>
        total + Number(motor.precioCompra || 0),
      0
    );
  }, [motoresContenedor80]);

  const totalVenta = useMemo(() => {
    return motoresContenedor80.reduce(
      (total, motor) =>
        total +
        Number(
          motor.precioVenta ||
            motor.precio ||
            0
        ),
      0
    );
  }, [motoresContenedor80]);

  const gananciaEstimada = totalVenta - totalCompra;

  function cerrarModal() {
    setModal("");
    setMotorSeleccionado(null);
    setDestinoTransferencia("");
  }

  function abrirVer(motor) {
    setMotorSeleccionado(motor);
    setModal("ver");
  }
function abrirGaleria(motor) {
  const imagenesDisponibles = obtenerImagenes(motor);

  if (imagenesDisponibles.length === 0) {
    alert("Este motor no tiene fotografías registradas.");
    return;
  }

  setMotorSeleccionado(motor);
  setIndiceImagen(0);
  setModal("galeria");
}
  function abrirEditar(motor) {
    setMotorSeleccionado(motor);

    setFormulario({
      codigo: motor.codigo || "",
      marca: motor.marca || "",
      modelo: motor.modelo || "",
      anio: motor.anio || "",
      descripcion: motor.descripcion || "",
      precioCompra: motor.precioCompra || "",
      precioVenta:
        motor.precioVenta ||
        motor.precio ||
        "",
      estado: motor.estado || "Disponible",
    });

    setModal("editar");
  }

  function abrirTransferir(motor) {
    setMotorSeleccionado(motor);
    setDestinoTransferencia("");
    setModal("transferir");
  }

  function abrirEliminar(motor) {
    setMotorSeleccionado(motor);
    setModal("eliminar");
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((datosAnteriores) => ({
      ...datosAnteriores,
      [name]: value,
    }));
  }

  function guardarEdicion(evento) {
    evento.preventDefault();

    if (!motorSeleccionado) return;

    if (!formulario.marca.trim()) {
      alert("Debes escribir la marca.");
      return;
    }

    if (!formulario.modelo.trim()) {
      alert("Debes escribir el modelo.");
      return;
    }

    if (
      formulario.precioVenta === "" ||
      Number(formulario.precioVenta) < 0
    ) {
      alert("Debes escribir un precio de venta válido.");
      return;
    }

    const idSeleccionado = obtenerId(motorSeleccionado);

    const productosActualizados = productos.map(
      (producto) => {
        if (obtenerId(producto) !== idSeleccionado) {
          return producto;
        }

        return {
          ...producto,
          codigo: formulario.codigo.trim(),
          marca: formulario.marca.trim(),
          modelo: formulario.modelo.trim(),
          anio: formulario.anio
            ? Number(formulario.anio)
            : "",
          descripcion: formulario.descripcion.trim(),
          precioCompra:
            Number(formulario.precioCompra) || 0,
          precioVenta:
            Number(formulario.precioVenta) || 0,
          estado: formulario.estado,
          actualizadoEn: new Date().toISOString(),
        };
      }
    );

    guardarProductos(productosActualizados);
    cerrarModal();

    alert("Motor actualizado correctamente.");
  }

async function transferirMotor() {
  if (!motorSeleccionado) {
    alert("Selecciona un motor.");
    return;
  }

  if (!destinoTransferencia) {
    alert("Selecciona un destino.");
    return;
  }

  if (destinoTransferencia === "contenedor80") {
    alert("El motor ya se encuentra en el Contenedor 80.");
    return;
  }

  const idSeleccionado = obtenerId(motorSeleccionado);

  if (!idSeleccionado) {
    alert("No se encontró el identificador del motor.");
    return;
  }

  const destinoSupabase =
    destinoTransferencia === "por-detal" ||
    destinoTransferencia === "detal"
      ? "detalle"
      : destinoTransferencia === "contenedor-40"
      ? "contenedor40"
      : destinoTransferencia === "contenedor-80"
      ? "contenedor80"
      : destinoTransferencia;

  const { data, error } = await supabase
  .from("productos")
  .update({
    ubicacion: destinoSupabase,
  })
  .eq("id", idSeleccionado)
  .select();

if (error) {
  console.error(
    "Error transfiriendo desde Contenedor 80:",
    error
  );

  alert(
    error.message ||
      "No se pudo transferir el motor."
  );

  return;
}

if (!data || data.length === 0) {
  alert("No se encontró el producto en Supabase.");
  return;
}

console.log("Motor actualizado en Supabase:", data);

 setProductos((productosActuales) =>
  productosActuales.filter(
    (producto) => obtenerId(producto) !== idSeleccionado
  )
);

  const destino = DESTINOS.find(
    (opcion) =>
      opcion.value === destinoTransferencia
  );

  cerrarModal();

  alert(
    `Motor transferido correctamente a ${
      destino?.label || "su nuevo destino"
    }.`
  );
}

  function eliminarMotor() {
    if (!motorSeleccionado) return;

    const idSeleccionado = obtenerId(motorSeleccionado);

    const productosActualizados = productos.filter(
      (producto) =>
        obtenerId(producto) !== idSeleccionado
    );

    guardarProductos(productosActualizados);
    cerrarModal();

    alert("Motor eliminado correctamente.");
  }

  return (
    <main className="contenedor80-page">
      <header className="contenedor80-header">
        <div>
          <span className="contenedor80-etiqueta">
            Inventario
          </span>

          <h1>Contenedor 80</h1>

          <p>
            Administra los motores asignados al Contenedor
            80.
          </p>
        </div>

        <div className="contenedor80-badge">
          {motoresContenedor80.length}{" "}
          {motoresContenedor80.length === 1
            ? "motor"
            : "motores"}
        </div>
      </header>

      <section className="contenedor80-resumen">
        <article className="resumen-lista">
          <span>Total de motores</span>
          <strong>{motoresContenedor80.length}</strong>
        </article>

        <article className="resumen-card">
          <span>Valor de compra</span>
          <strong>
            {formatearDolares(totalCompra)}
          </strong>
        </article>

        <article className="resumen-card">
          <span>Valor de venta</span>
          <strong>
            {formatearDolares(totalVenta)}
          </strong>
        </article>

        <article className="resumen-card">
          <span>Ganancia estimada</span>
          <strong>
            {formatearDolares(gananciaEstimada)}
          </strong>
        </article>
      </section>

      <section className="contenedor80-filtros">
        <div className="campo-busqueda">
          <span>🔎</span>

          <input
            type="search"
            placeholder="Buscar por código, marca, modelo o año..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(evento) =>
            setFiltroEstado(evento.target.value)
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

      {motoresFiltrados.length === 0 ? (
        <section className="contenedor80-vacio">
          <div className="icono-vacio">🚗</div>

          <h2>No hay motores en el Contenedor 80</h2>

          <p>
            Registra un motor o transfiérelo desde otro
            módulo.
          </p>
        </section>
      ) : (
        <section className="contenedor80-lista">
          {motoresFiltrados.map((motor, indice) => {
            const imagen = obtenerImagen(motor);
            const estado =
              motor.estado || "Disponible";

            const claseEstado = estado
              .toLowerCase()
              .replaceAll(" ", "-");

            return (
              <article
              
                className="motor-lista"
                key={obtenerId(motor) || indice}
              >
                <div className="motor-lista-imagen">
  <button
    type="button"
    className="boton-imagen-motor"
    onClick={() => abrirGaleria(motor)}
    aria-label={`Ver fotografías de ${motor.marca || "motor"} ${
      motor.modelo || ""
    }`}
  >
    {imagen ? (
      <img
        src={imagen}
        alt={`${motor.marca || "Motor"} ${motor.modelo || ""}`}
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
    {motor.codigo || "Sin código"}
  </span>

  <h2>
    {motor.marca || "Sin marca"}{" "}
    {motor.modelo || "Sin modelo"}
  </h2>

  <p>
    Año: {motor.anio || "No especificado"}
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
  <span>Compra</span>

  <strong>
    {formatearDolares(motor.precioCompra)}
  </strong>
</div>

<div className="motor-lista-precio">
  <span>Venta</span>

  <strong>
    {formatearDolares(
      motor.precioVenta || motor.precio
    )}
  </strong>
</div>

<div className="motor-lista-acciones">
  <button
    type="button"
    className="accion-moderna accion-transferir"
    onClick={() => abrirTransferir(motor)}
  >
    <span>⇄</span>
    Transferir
  </button>

  <button
    type="button"
    className="accion-moderna accion-editar"
    onClick={() => abrirEditar(motor)}
  >
    <span>✎</span>
    Editar
  </button>

  <button
    type="button"
    className="accion-moderna accion-eliminar"
    onClick={() => abrirEliminar(motor)}
  >
    <span>⌫</span>
    Eliminar
  </button>
</div>
              </article>
            );
          })}
        </section>
      )}

      {modal && motorSeleccionado && (
        <div
          className="modal-fondo"
          onMouseDown={cerrarModal}
        >
          <section
            className="modal-contenido"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-cerrar"
              onClick={cerrarModal}
            >
              ×
            </button>

            {modal === "ver" && (
              <>
                <h2>Detalles del motor</h2>

                <div className="detalle-lista">
                  <p>
                    <strong>Código:</strong>{" "}
                    {motorSeleccionado.codigo ||
                      "Sin código"}
                  </p>

                  <p>
                    <strong>Marca:</strong>{" "}
                    {motorSeleccionado.marca ||
                      "Sin marca"}
                  </p>

                  <p>
                    <strong>Modelo:</strong>{" "}
                    {motorSeleccionado.modelo ||
                      "Sin modelo"}
                  </p>

                  <p>
                    <strong>Año:</strong>{" "}
                    {motorSeleccionado.anio ||
                      "No especificado"}
                  </p>

                  <p>
                    <strong>Ubicación:</strong>{" "}
                    Contenedor 80
                  </p>

                  <p>
                    <strong>Estado:</strong>{" "}
                    {motorSeleccionado.estado ||
                      "Disponible"}
                  </p>

                  <p>
                    <strong>Precio de compra:</strong>{" "}
                    {formatearDolares(
                      motorSeleccionado.precioCompra
                    )}
                  </p>

                  <p>
                    <strong>Precio de venta:</strong>{" "}
                    {formatearDolares(
                      motorSeleccionado.precioVenta ||
                        motorSeleccionado.precio
                    )}
                  </p>

                  <p>
                    <strong>Descripción:</strong>{" "}
                    {motorSeleccionado.descripcion ||
                      "Sin descripción"}
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

            {modal === "editar" && (
              <>
                <h2>Editar motor</h2>

                <form
                  className="formulario-edicion"
                  onSubmit={guardarEdicion}
                >
                  <label>
                    Código
                    <input
                      type="text"
                      name="codigo"
                      value={formulario.codigo}
                      onChange={cambiarCampo}
                    />
                  </label>

                  <div className="formulario-dos-columnas">
                    <label>
                      Marca
                      <input
                        type="text"
                        name="marca"
                        value={formulario.marca}
                        onChange={cambiarCampo}
                        required
                      />
                    </label>

                    <label>
                      Modelo
                      <input
                        type="text"
                        name="modelo"
                        value={formulario.modelo}
                        onChange={cambiarCampo}
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
                        value={formulario.anio}
                        onChange={cambiarCampo}
                      />
                    </label>

                    <label>
                      Estado
                      <select
                        name="estado"
                        value={formulario.estado}
                        onChange={cambiarCampo}
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
                        value={formulario.precioCompra}
                        onChange={cambiarCampo}
                      />
                    </label>

                    <label>
                      Precio de venta USD
                      <input
                        type="number"
                        name="precioVenta"
                        min="0"
                        step="0.01"
                        value={formulario.precioVenta}
                        onChange={cambiarCampo}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Descripción
                    <textarea
                      name="descripcion"
                      rows="4"
                      value={formulario.descripcion}
                      onChange={cambiarCampo}
                    />
                  </label>

                  <div className="modal-botones">
                    <button
                      type="button"
                      className="boton-secundario"
                      onClick={cerrarModal}
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

            {modal === "transferir" && (
              <>
                <h2>Transferir motor</h2>

                <p>
                  Motor:{" "}
                  <strong>
                    {motorSeleccionado.codigo ||
                      `${motorSeleccionado.marca || ""} ${
                        motorSeleccionado.modelo || ""
                      }`}
                  </strong>
                </p>

                <label className="campo-transferencia">
                  Nuevo destino

                  <select
                    value={destinoTransferencia}
                    onChange={(evento) =>
                      setDestinoTransferencia(
                        evento.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecciona un destino
                    </option>

                    {DESTINOS.map((destino) => (
                      <option
                        key={destino.value}
                        value={destino.value}
                        disabled={
                          destino.value ===
                          "contenedor80"
                        }
                      >
                        {destino.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="modal-botones">
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="boton-principal"
                    onClick={transferirMotor}
                  >
                    Confirmar transferencia
                  </button>
                </div>
              </>
            )}

            {modal === "eliminar" && (
              <>
                <h2>Eliminar motor</h2>

                <p>
                  ¿Estás segura de eliminar este motor?
                </p>

                <p className="advertencia-eliminar">
                  El registro se eliminará completamente del
                  inventario.
                </p>

                <div className="modal-botones">
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="boton-confirmar-eliminar"
                    onClick={eliminarMotor}
                  >
                    Sí, eliminar
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}