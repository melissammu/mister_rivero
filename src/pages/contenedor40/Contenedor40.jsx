import { useEffect, useMemo, useState } from "react";
import "../../styles/Contenedor40.css";
import { supabase } from "../../lib/supabase";

const STORAGE_KEY = "motores";

const destinos = [
  { value: "contenedor40", label: "Contenedor 40" },
  { value: "contenedor80", label: "Contenedor 80" },
  { value: "detal", label: "Motor al detal" },
];

const estados = ["Disponible", "Reservado", "Vendido"];

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

function obtenerProductosGuardados() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (!guardados) return [];

    const productos = JSON.parse(guardados);

    return Array.isArray(productos) ? productos : [];
  } catch (error) {
    console.error("Error leyendo los productos:", error);
    return [];
  }
}

export default function Contenedor40() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
 const [indiceImagen, setIndiceImagen] = useState(0);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalActivo, setModalActivo] = useState(null);
  const [destinoTransferencia, setDestinoTransferencia] = useState("");
  
  const [formularioEdicion, setFormularioEdicion] = useState({
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
  let componenteActivo = true;

  async function cargarContenedor40() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("tipo", "motor");

  if (error) {
    console.error(
      "Error cargando Contenedor 40:",
      error
    );
    return;
  }

  const productosContenedor40 = (data || [])
    .filter((producto) => {
      const ubicacion = String(
  producto?.ubicacion ||
  producto?.destino ||
  ""
)
  .toLowerCase()
  .trim()
  .replaceAll("-", "")
  .replaceAll("_", "")
  .replaceAll(" ", "");

      return ubicacion === "contenedor40";
    })
    .map((producto) => ({
      ...producto,

      precioCompra:
        producto.precio_compra ??
        producto.precioCompra ??
        0,

      precioVenta:
        producto.precio_venta ??
        producto.precioVenta ??
        0,

      numeroSerie:
        producto.numero_serie ??
        producto.numeroSerie ??
        "",

      imagenPrincipal:
        Array.isArray(producto.imagenes)
          ? producto.imagenes[0] || ""
          : "",
    }));

  console.log(
    "Productos cargados en Contenedor 40:",
    productosContenedor40
  );

  setProductos(productosContenedor40);
 }

  cargarContenedor40();

  return () => {
    componenteActivo = false;
  };
}, []);

  function guardarProductos(nuevosProductos) {
    setProductos(nuevosProductos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosProductos));
  }

  const motoresContenedor40 = useMemo(() => {
    return productos.filter((producto) => {
      const ubicacion = normalizarUbicacion(
        producto.ubicacion ||
          producto.destino ||
          producto.contenedor ||
          producto.area
      );

      return ubicacion === "contenedor40";
    });
  }, [productos]);

  const motoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return motoresContenedor40.filter((producto) => {
      const coincideBusqueda =
        !texto ||
        String(producto.codigo || "").toLowerCase().includes(texto) ||
        String(producto.marca || "").toLowerCase().includes(texto) ||
        String(producto.modelo || "").toLowerCase().includes(texto) ||
        String(producto.anio || "").toLowerCase().includes(texto);

      const coincideEstado =
        filtroEstado === "Todos" ||
        String(producto.estado || "Disponible").toLowerCase() ===
          filtroEstado.toLowerCase();

      return coincideBusqueda && coincideEstado;
    });
  }, [motoresContenedor40, busqueda, filtroEstado]);

  const totalVenta = motoresContenedor40.reduce(
    (total, producto) =>
      total + Number(producto.precioVenta || producto.precio || 0),
    0
  );

  const totalCompra = motoresContenedor40.reduce(
    (total, producto) => total + Number(producto.precioCompra || 0),
    0
  );

  const gananciaEstimada = totalVenta - totalCompra;

  function cerrarModal() {
    setModalActivo(null);
    setProductoSeleccionado(null);
    setDestinoTransferencia("");
  }

  function abrirVer(producto) {
    setProductoSeleccionado(producto);
    setModalActivo("ver");
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
  function abrirEditar(producto) {
    setProductoSeleccionado(producto);

    setFormularioEdicion({
      codigo: producto.codigo || "",
      marca: producto.marca || "",
      modelo: producto.modelo || "",
      anio: producto.anio || "",
      descripcion: producto.descripcion || "",
      precioCompra: producto.precioCompra || "",
      precioVenta: producto.precioVenta || producto.precio || "",
      estado: producto.estado || "Disponible",
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
    const { name, value } = evento.target;

    setFormularioEdicion((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function guardarEdicion(evento) {
    evento.preventDefault();

    if (!productoSeleccionado) return;

    if (
      !formularioEdicion.marca.trim() ||
      !formularioEdicion.modelo.trim() ||
      formularioEdicion.precioVenta === ""
    ) {
      alert("Completa la marca, el modelo y el precio de venta.");
      return;
    }

    const actualizados = productos.map((producto) => {
      if (producto.id !== productoSeleccionado.id) return producto;

      return {
        ...producto,
        ...formularioEdicion,
        precioCompra: Number(formularioEdicion.precioCompra) || 0,
        precioVenta: Number(formularioEdicion.precioVenta) || 0,
        anio: formularioEdicion.anio
          ? Number(formularioEdicion.anio)
          : "",
        actualizadoEn: new Date().toISOString(),
      };
    });

    guardarProductos(actualizados);
    cerrarModal();
    alert("Motor actualizado correctamente.");
  }

 async function transferirMotor() {
  if (!productoSeleccionado) {
    alert("Selecciona un motor.");
    return;
  }

  if (!destinoTransferencia) {
    alert("Selecciona un destino.");
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

  console.log("ID que se transferirá:", productoSeleccionado.id);
  console.log("Nuevo destino:", destinoSupabase);
const codigoSeleccionado = productoSeleccionado?.codigo;

if (!codigoSeleccionado) {
  alert("No se encontró el código del motor.");
  return;
}
  const { data, error } = await supabase
    .from("productos")
    .update({
      ubicacion: destinoSupabase,
    })
    .eq("codigo", codigoSeleccionado)
    .select();

  if (error) {
    console.error("Error transfiriendo motor:", error);
    alert(error.message || "No se pudo transferir el motor.");
    return;
  }
if (!data || data.length === 0) {
  alert("No se encontró el producto en Supabase.");
  return;
}
  console.log("Producto actualizado en Supabase:", data);

  setProductos((productosActuales) =>
    productosActuales.filter(
      (producto) => producto.id !== productoSeleccionado.id
    )
  );

  cerrarModal();
  alert("Motor transferido correctamente.");
}
  function eliminarMotor() {
    if (!productoSeleccionado) return;

    const actualizados = productos.filter(
      (producto) => producto.codigo !== codigoSeleccionado
    );

    guardarProductos(actualizados);
    cerrarModal();
    alert("Motor eliminado correctamente.");
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
  function obtenerImagen(producto) {
    if (producto.imagen) return producto.imagen;
    if (producto.foto) return producto.foto;

    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      return producto.imagenes[0];
    }

    if (Array.isArray(producto.fotos) && producto.fotos.length > 0) {
      return producto.fotos[0];
    }

    return null;
  }

  return (
    <main className="contenedor40-page">
      <header className="contenedor40-header">
        <div>
          <span className="contenedor40-etiqueta">Inventario</span>
          <h1>Contenedor 40</h1>
          <p>
            Consulta, edita, transfiere y administra los motores de este
            contenedor.
          </p>
        </div>

        <div className="contenedor40-badge">
          {motoresContenedor40.length} motores
        </div>
      </header>

      <section className="contenedor40-resumen">
        <article className="resumen-card">
          <span>Total de motores</span>
          <strong>{motoresContenedor40.length}</strong>
        </article>

        <article className="resumen-card">
          <span>Valor de compra</span>
          <strong>{formatearDolares(totalCompra)}</strong>
        </article>

        <article className="resumen-card">
          <span>Valor de venta</span>
          <strong>{formatearDolares(totalVenta)}</strong>
        </article>

        <article className="resumen-card">
          <span>Ganancia estimada</span>
          <strong>{formatearDolares(gananciaEstimada)}</strong>
        </article>
      </section>

      <section className="contenedor40-filtros">
        <div className="campo-busqueda">
          <span>🔎</span>
          <input
            type="search"
            placeholder="Buscar por código, marca, modelo o año..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(evento) => setFiltroEstado(evento.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </section>

      {motoresFiltrados.length === 0 ? (
        <section className="contenedor40-vacio">
          <div>🚗</div>
          <h2>No hay motores para mostrar</h2>
          <p>
            Registra un motor en el Contenedor 40 o cambia los filtros de
            búsqueda.
          </p>
        </section>
      ) : (
        <section className="contenedor40-lista">
          {motoresFiltrados.map((producto, indice) => {
            const imagen = obtenerImagen(producto);
            const estado = producto.estado || "Disponible";

            return (
              <article className="motor-lista" key={producto.id}>
<div className="motor-lista-imagen">
  <button
    type="button"
    className="boton-imagen-motor"
    onClick={() => abrirGaleria(producto)}
    aria-label={`Ver fotografías de ${producto.marca} ${producto.modelo}`}
  >
    {imagen ? (
      <img
        src={imagen}
        alt={`${producto.marca} ${producto.modelo}`}
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
    {producto.codigo || "Sin código"}
  </span>

  <h2>
    {producto.marca || "Sin marca"}{" "}
    {producto.modelo || "Sin modelo"}
  </h2>

  <p>
    Año: {producto.anio || "No especificado"}
  </p>
</div>

<div className="motor-lista-estado">
  <span
    className={`estado estado-${estado
      .toLowerCase()
      .replaceAll(" ", "-")}`}
  >
    {estado}
  </span>
</div>

<div className="motor-lista-precio">
  <span>Compra</span>

  <strong>
    {formatearDolares(producto.precioCompra)}
  </strong>
</div>

<div className="motor-lista-precio">
  <span>Venta</span>

  <strong>
    {formatearDolares(
      producto.precioVenta || producto.precio
    )}
  </strong>
</div>

<div className="motor-lista-acciones">
  <button
    type="button"
    className="accion-moderna accion-transferir"
    onClick={() => abrirTransferir(producto)}
  >
    <span>⇄</span>
    Transferir
  </button>

  <button
    type="button"
    className="accion-moderna accion-editar"
    onClick={() => abrirEditar(producto)}
  >
    <span>✎</span>
    Editar
  </button>

  <button
    type="button"
    className="accion-moderna accion-eliminar"
    onClick={() => abrirEliminar(producto)}
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

      {modalActivo && productoSeleccionado && (
        <div className="modal-fondo" onMouseDown={cerrarModal}>
          <section
            className="modal-contenido"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <button
              type="button"
              className="modal-cerrar"
              onClick={cerrarModal}
              aria-label="Cerrar"
            >
              ×
            </button>

            {modalActivo === "ver" && (
              <>
                <h2>Detalles del motor</h2>

                <div className="detalle-lista">
                  <p>
                    <strong>Código:</strong>{" "}
                    {productoSeleccionado.codigo || "Sin código"}
                  </p>
                  <p>
                    <strong>Marca:</strong>{" "}
                    {productoSeleccionado.marca || "Sin marca"}
                  </p>
                  <p>
                    <strong>Modelo:</strong>{" "}
                    {productoSeleccionado.modelo || "Sin modelo"}
                  </p>
                  <p>
                    <strong>Año:</strong>{" "}
                    {productoSeleccionado.anio || "No especificado"}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    {productoSeleccionado.estado || "Disponible"}
                  </p>
                  <p>
                    <strong>Precio de compra:</strong>{" "}
                    {formatearDolares(productoSeleccionado.precioCompra)}
                  </p>
                  <p>
                    <strong>Precio de venta:</strong>{" "}
                    {formatearDolares(
                      productoSeleccionado.precioVenta ||
                        productoSeleccionado.precio
                    )}
                  </p>
                  <p>
                    <strong>Descripción:</strong>{" "}
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

            {modalActivo === "editar" && (
              <>
                <h2>Editar motor</h2>

                <form className="formulario-edicion" onSubmit={guardarEdicion}>
                  <label>
                    Código
                    <input
                      type="text"
                      name="codigo"
                      value={formularioEdicion.codigo}
                      onChange={actualizarCampo}
                    />
                  </label>

                  <div className="formulario-dos-columnas">
                    <label>
                      Marca
                      <input
                        type="text"
                        name="marca"
                        value={formularioEdicion.marca}
                        onChange={actualizarCampo}
                        required
                      />
                    </label>

                    <label>
                      Modelo
                      <input
                        type="text"
                        name="modelo"
                        value={formularioEdicion.modelo}
                        onChange={actualizarCampo}
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
                        value={formularioEdicion.anio}
                        onChange={actualizarCampo}
                      />
                    </label>

                    <label>
                      Estado
                      <select
                        name="estado"
                        value={formularioEdicion.estado}
                        onChange={actualizarCampo}
                      >
                        {estados.map((estado) => (
                          <option key={estado} value={estado}>
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
                        value={formularioEdicion.precioCompra}
                        onChange={actualizarCampo}
                      />
                    </label>

                    <label>
                      Precio de venta USD
                      <input
                        type="number"
                        name="precioVenta"
                        min="0"
                        step="0.01"
                        value={formularioEdicion.precioVenta}
                        onChange={actualizarCampo}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Descripción
                    <textarea
                      name="descripcion"
                      rows="4"
                      value={formularioEdicion.descripcion}
                      onChange={actualizarCampo}
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

                    <button type="submit" className="boton-principal">
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalActivo === "transferir" && (
              <>
                <h2>Transferir motor</h2>

                <p>
                  Vas a transferir el motor{" "}
                  <strong>
                    {productoSeleccionado.codigo ||
                      productoSeleccionado.modelo}
                  </strong>
                  .
                </p>

                <label className="campo-transferencia">
                  Nuevo destino
                  <select
                    value={destinoTransferencia}
                    onChange={(evento) =>
                      setDestinoTransferencia(evento.target.value)
                    }
                  >
                    <option value="">Seleccionar destino</option>

                    {destinos.map((destino) => (
                      <option key={destino.value} value={destino.value}>
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

            {modalActivo === "eliminar" && (
              <>
                <h2>Eliminar motor</h2>

                <p>
                  ¿Estás segura de eliminar el motor{" "}
                  <strong>
                    {productoSeleccionado.codigo ||
                      productoSeleccionado.modelo}
                  </strong>
                  ?
                </p>

                <p className="advertencia-eliminar">
                  Esta acción eliminará el registro del inventario.
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
