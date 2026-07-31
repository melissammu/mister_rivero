import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaAmazon,
  FaBoxOpen,
  FaCar,
  FaCartShopping,
  FaChevronRight,
  FaHeart,
  FaMagnifyingGlass,
  FaShareNodes,
  FaUser,
  FaWhatsapp,
  FaWrench,
} from "react-icons/fa6";

import motorPrincipal from "../../assets/motor-imagen.jpeg";
import "../../styles/CatalogoPublico.css";

const SECCIONES = [
  {
    id: "motores",
    nombre: "Motores",
    descripcion: "Venta individual",
    icono: <FaCar />,
  },
  {
    id: "contenedor40",
    nombre: "Contenedor 40",
    descripcion: "Inventario disponible",
    icono: <FaBoxOpen />,
  },
  {
    id: "contenedor80",
    nombre: "Contenedor 80",
    descripcion: "Inventario disponible",
    icono: <FaBoxOpen />,
  },
  {
    id: "partes",
    nombre: "Partes",
    descripcion: "Autopartes y accesorios",
    icono: <FaWrench />,
  },
  {
    id: "amazon",
    nombre: "Amazon",
    descripcion: "Productos en Amazon",
    icono: <FaAmazon />,
  },
];

function leerProductos(clave) {
  try {
    const datos = JSON.parse(
      localStorage.getItem(clave) || "[]"
    );

    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error(`Error leyendo ${clave}:`, error);
    return [];
  }
}

function normalizar(valor = "") {
  return String(valor).trim().toLowerCase();
}
function obtenerNombreSeccion(tipo) {
  const nombres = {
    motores: "Motores",
    contenedor40: "Contenedor 40",
    contenedor80: "Contenedor 80",
    partes: "Partes",
  };

  return nombres[tipo] || "Producto";
}
function obtenerImagen(producto) {
  if (producto.imagenPrincipal) {
    return producto.imagenPrincipal;
  }

  if (producto.imagen) {
    return producto.imagen;
  }

  if (
    Array.isArray(producto.imagenes) &&
    producto.imagenes.length > 0
  ) {
    return (
      producto.imagenes[0]?.url ||
      producto.imagenes[0]
    );
  }

  if (
    Array.isArray(producto.fotos) &&
    producto.fotos.length > 0
  ) {
    return (
      producto.fotos[0]?.url ||
      producto.fotos[0]
    );
  }

  return "";
}

function obtenerNombre(producto) {
  return (
    producto.nombre ||
    producto.titulo ||
    producto.modelo ||
    producto.categoria ||
    "Producto sin nombre"
  );
}

function obtenerPrecio(producto) {
  return (
    Number(
      producto.precioVenta ??
        producto.precio ??
        0
    ) || 0
  );
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(valor);
}

export default function CatalogoPublico() {
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] =
    useState("motores");

  const [busqueda, setBusqueda] =
    useState("");

  const inventario = useMemo(() => {
    const motores = leerProductos("motores");
    const partes = leerProductos("partes");

    return {
      motores: motores.filter(
        (producto) =>
          normalizar(producto.estado || "Disponible") ===
            "disponible" &&
          normalizar(producto.ubicacion || "detal") ===
            "detal"
      ),

      contenedor40: motores.filter(
        (producto) =>
          normalizar(producto.estado || "Disponible") ===
            "disponible" &&
          normalizar(producto.ubicacion) ===
            "contenedor40"
      ),

      contenedor80: motores.filter(
        (producto) =>
          normalizar(producto.estado || "Disponible") ===
            "disponible" &&
          normalizar(producto.ubicacion) ===
            "contenedor80"
      ),

      partes: partes.filter(
        (producto) =>
          normalizar(producto.estado || "Disponible") ===
          "disponible"
      ),

      amazon: [],
    };
  }, []);

 const productosActuales =
  inventario[seccionActiva] || [];

const productosPropios = useMemo(() => {
  return [
    ...inventario.motores.map((producto) => ({
      ...producto,
      tipoCatalogo: "motores",
    })),

    ...inventario.contenedor40.map((producto) => ({
      ...producto,
      tipoCatalogo: "contenedor40",
    })),

    ...inventario.contenedor80.map((producto) => ({
      ...producto,
      tipoCatalogo: "contenedor80",
    })),

    ...inventario.partes.map((producto) => ({
      ...producto,
      tipoCatalogo: "partes",
    })),
  ];
}, [inventario]);

const busquedaActiva =
  seccionActiva !== "amazon" &&
  normalizar(busqueda).length > 0;

const productosFiltrados = useMemo(() => {
  const texto = normalizar(busqueda);

  /*
   * Cuando no se está buscando, muestra únicamente
   * la categoría seleccionada.
   */
  if (!texto || seccionActiva === "amazon") {
    return productosActuales.map((producto) => ({
      ...producto,
      tipoCatalogo:
        producto.tipoCatalogo || seccionActiva,
    }));
  }

  /*
   * Cuando existe una búsqueda, revisa todo el
   * inventario propio, excepto Amazon.
   */
  return productosPropios.filter((producto) => {
    const contenidoBuscable = [
      producto.codigo,
      producto.nombre,
      producto.titulo,
      producto.marca,
      producto.modelo,
      producto.categoria,
      producto.descripcion,
      producto.anio,
      producto.numeroSerie,
      producto.estado,
      obtenerNombreSeccion(producto.tipoCatalogo),
    ]
      .map((valor) => normalizar(valor))
      .join(" ");

    return contenidoBuscable.includes(texto);
  });
}, [
  busqueda,
  productosActuales,
  productosPropios,
  seccionActiva,
]);
  function abrirProducto(producto) {
  const tipo =
    producto.tipoCatalogo ||
    seccionActiva;

  const id =
    producto.id ||
    producto.codigo;

  if (!id) {
    window.alert(
      "Este producto no tiene un identificador válido."
    );
    return;
  }

  navigate(
    `/catalogo/producto/${tipo}/${encodeURIComponent(
      id
    )}`
  );
}

  async function compartirProducto(producto) {
    const tipo =
  producto.tipoCatalogo ||
  seccionActiva;

const id =
  producto.id ||
  producto.codigo;

const enlace = `${
  window.location.origin
}/catalogo/producto/${tipo}/${encodeURIComponent(
  id
)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: obtenerNombre(producto),
          text: `${obtenerNombre(
            producto
          )} disponible en Mr. Rivero Motors`,
          url: enlace,
        });

        return;
      }

      await navigator.clipboard.writeText(enlace);

      window.alert("Enlace copiado.");
    } catch (error) {
      console.error("Error compartiendo:", error);
    }
  }

  return (
    <main className="catalogo-publico">
      <header className="catalogo-header">
        <button
          type="button"
          className="catalogo-logo"
          onClick={() =>
            setSeccionActiva("motores")
          }
        >
          <span className="catalogo-logo-icono">
            ⚙
          </span>

          <span>
            <strong>MR. RIVERO</strong>
            <small>MOTORS</small>
          </span>
        </button>

 
      </header>

      <nav className="catalogo-navegacion">
        <button
          type="button"
          className="activo"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          Inicio
        </button>

        {SECCIONES.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={
              seccionActiva === seccion.id
                ? "activo"
                : ""
            }
            onClick={() => {
              setSeccionActiva(seccion.id);
              setBusqueda("");
            }}
          >
            {seccion.nombre}
          </button>
        ))}
      </nav>

      <section className="catalogo-hero">
        <div className="catalogo-hero-texto">
          <span>
            Calidad que te lleva más lejos
          </span>

          <h1>
            Motores que
            <strong> impulsan </strong>
            tu camino
          </h1>

          <p>
            Motores, contenedores y autopartes
            importadas de alta calidad directamente
            desde USA.
          </p>
        </div>

  <div className="catalogo-hero-motor">
    <img
        src={motorPrincipal}
        alt="Motor Toyota"
        loading="eager"
    />
</div>
      </section>

      <section className="catalogo-beneficios">
        <article>
          <strong>Productos verificados</strong>
          <span>Calidad garantizada</span>
        </article>

        <article>
          <strong>Envíos seguros</strong>
          <span></span>
        </article>

        <article>
          <strong>Atención experta</strong>
          <span>Soporte especializado</span>
        </article>

        <article>
          <strong>Pagos seguros</strong>
          <span>Protegemos tu compra</span>
        </article>
      </section>
    {/* =======================================================
    BUSCADOR GLOBAL
======================================================= */}

<div className="catalogo-buscador-contenedor">
  <div
    className={
      seccionActiva === "amazon"
        ? "catalogo-buscador-superior deshabilitado"
        : "catalogo-buscador-superior"
    }
  >
    <FaMagnifyingGlass />

    <input
      type="search"
      value={seccionActiva === "amazon" ? "" : busqueda}
      placeholder={
        seccionActiva === "amazon"
          ? "Amazon tendrá su propio buscador"
          : "Buscar por código, marca, modelo o pieza..."
      }
      disabled={seccionActiva === "amazon"}
      onChange={(evento) => setBusqueda(evento.target.value)}
    />

    {busqueda && seccionActiva !== "amazon" && (
      <button
        type="button"
        className="boton-limpiar-busqueda"
        onClick={() => setBusqueda("")}
        aria-label="Limpiar búsqueda"
      >
        ×
      </button>
    )}
  </div>
</div>     <section className="catalogo-categorias">
        {SECCIONES.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={
              seccionActiva === seccion.id
                ? "categoria-card activa"
                : "categoria-card"
            }
            onClick={() => {
              setSeccionActiva(seccion.id);
              setBusqueda("");
            }}
          >
            <span className="categoria-icono">
              {seccion.icono}
            </span>

            <div>
              <strong>{seccion.nombre}</strong>
              <small>{seccion.descripcion}</small>
            </div>

            <FaChevronRight />
          </button>
        ))}
      </section>

      <section
        id="productos"
        className="catalogo-productos"
      >
<div className="catalogo-productos-titulo">
  <div>
    <span>
      {busquedaActiva
        ? "Resultados de búsqueda"
        : "Catálogo disponible"}
    </span>

    <h2>
      {busquedaActiva
        ? `Resultados para “${busqueda}”`
        : SECCIONES.find(
            (seccion) =>
              seccion.id === seccionActiva
          )?.nombre}
    </h2>
  </div>

  <strong>
    {productosFiltrados.length}{" "}
    {productosFiltrados.length === 1
      ? "producto"
      : "productos"}
  </strong>
</div>
        {seccionActiva === "amazon" ? (
          <div className="catalogo-vacio">
            <FaAmazon />
            <h3>Amazon</h3>
            <p>
              Aquí se mostrará el catálogo de Amazon
              de manera independiente.
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="catalogo-vacio">
            <FaBoxOpen />
            <h3>No hay productos disponibles</h3>
            <p>
              Regresa más tarde para revisar nuevas
              publicaciones.
            </p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {productosFiltrados.map(
              (producto, indice) => {
                const imagen =
                  obtenerImagen(producto);

                return (
                  <article
                    key={
                      producto.id ||
                      producto.codigo ||
                      indice
                    }
                    className="catalogo-producto-card"
                  >
                    <div className="producto-card-imagen">
                      {imagen ? (
                        <img
                          src={imagen}
                          alt={obtenerNombre(producto)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="producto-sin-imagen">
                          <FaCar />
                        </div>
                      )}

                      <span className="producto-disponible">
                        Disponible
                      </span>

                      <button
                        type="button"
                        className="producto-favorito"
                        aria-label="Agregar a favoritos"
                      >
                        <FaHeart />
                      </button>
                    </div>

                    <div className="producto-card-contenido">
                      <div className="producto-identificacion">
  <span className="producto-codigo">
    {producto.codigo || "Sin código"}
  </span>

  {busquedaActiva && (
    <span className="producto-origen">
      {obtenerNombreSeccion(
        producto.tipoCatalogo
      )}
    </span>
  )}
</div>
                      <h3>{obtenerNombre(producto)}</h3>

                      <p>
                        {producto.marca || "Sin marca"}{" "}
                        {producto.modelo || ""}
                      </p>

                      <strong className="producto-precio">
                        {formatearPrecio(
                          obtenerPrecio(producto)
                        )}
                      </strong>

                      <div className="producto-card-acciones">
                        <button
                          type="button"
                          className="boton-comprar"
                          onClick={() =>
                            abrirProducto(producto)
                          }
                        >
                          <FaCartShopping />
                          Comprar
                        </button>

                        <button
                          type="button"
                          className="boton-compartir"
                          onClick={() =>
                            compartirProducto(producto)
                          }
                          aria-label="Compartir producto"
                        >
                          <FaShareNodes />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <a
        className="catalogo-whatsapp-flotante"
        href="https://wa.me/"
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp />
      </a>
    </main>
  );
}