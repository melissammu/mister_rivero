import { useEffect,useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import {
  FaAmazon,
  FaBoxOpen,
  FaCar,
  FaCartPlus,
  FaCartShopping,
  FaCheck,
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
import { supabase } from "../../lib/supabase";

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
      producto.precio_venta ??
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

const [productosSupabase, setProductosSupabase] = useState([]);
const [cargandoProductos, setCargandoProductos] = useState(true);
const [errorProductos, setErrorProductos] = useState("");
const [fotoSeleccionada, setFotoSeleccionada] =
  useState({});
    
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

const productoCompartido =
  searchParams.get("producto");

const seccionCompartida =
  searchParams.get("seccion");

const {
  agregarAlCarrito,
  procesando,
  cantidadProductos,
} = useCarrito();

const [productoAgregado, setProductoAgregado] = useState(null);
const [mensajeCarrito, setMensajeCarrito] = useState("");

  const [seccionActiva, setSeccionActiva] =
    useState("motores");

  const [busqueda, setBusqueda] =
    useState("");
  const numeroWhatsApp = "12012792635";
    const obtenerImagenesGaleria = (producto) => {
  if (!producto) {
    return [];
  }

  const resultado = [];

  const agregarImagen = (imagen) => {
    if (!imagen) return;

    if (typeof imagen === "string") {
      const url = imagen.trim();

      if (url) resultado.push(url);

      return;
    }

    if (typeof imagen === "object") {
      const url =
        imagen.url ||
        imagen.publicUrl ||
        imagen.src ||
        imagen.imagen;

      if (typeof url === "string" && url.trim()) {
        resultado.push(url.trim());
      }
    }
  };

  if (Array.isArray(producto.imagenes)) {
    producto.imagenes.forEach(agregarImagen);
  } else if (typeof producto.imagenes === "string") {
    try {
      const lista = JSON.parse(producto.imagenes);

      if (Array.isArray(lista)) {
        lista.forEach(agregarImagen);
      } else {
        agregarImagen(producto.imagenes);
      }
    } catch {
      agregarImagen(producto.imagenes);
    }
  }

  agregarImagen(producto.imagenPrincipal);
  agregarImagen(producto.imagen);
  agregarImagen(producto.foto);

  return [...new Set(resultado)];
};
const obtenerClaveProducto = (producto, indice) => {
  return String(
    producto?.id ||
    producto?.codigo ||
    `producto-${indice}`
  );
};
const contactarPorWhatsApp = (producto) => {
  const codigo =
    producto?.codigo || "Sin código";

  const nombre =
    producto?.nombre ||
    `${producto?.marca || ""} ${
      producto?.modelo || ""
    }`.trim() ||
    "Producto";

  const precio =
    producto?.precio_venta ??
    producto?.precioVenta ??
    producto?.precio ??
    0;

  const precioFormateado =
    formatearPrecio(Number(precio) || 0);

  const mensaje = [
    "Hola, estoy interesado en este producto de MR. RIVERO MOTORS:",
    "",
    `Producto: ${nombre}`,
    `Código: ${codigo}`,
    `Precio: ${precioFormateado}`,
    "",
    "¿Sigue disponible?",
  ].join("\n");

  const enlaceWhatsApp =
    `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      mensaje
    )}`;

  window.open(
    enlaceWhatsApp,
    "_blank",
    "noopener,noreferrer"
  );
};
useEffect(() => {
  let componenteActivo = true;

  async function cargarProductos() {
    setCargandoProductos(true);
    setErrorProductos("");

    try {
const { data, error } = await supabase
  .from("productos")
  .select("*")
  .or("estado.ilike.disponible,estado.ilike.reservado")
  .order("created_at", {
    ascending: false,
  });

      if (error) {
        throw error;
      }

      if (componenteActivo) {
        setProductosSupabase(data || []);
      }
    } catch (error) {
      console.error(
        "Error cargando productos:",
        error
      );

      if (componenteActivo) {
        setErrorProductos(
          "No fue posible cargar los productos."
        );
        setProductosSupabase([]);
      }
    } finally {
      if (componenteActivo) {
        setCargandoProductos(false);
      }
    }
  }

  cargarProductos();

  return () => {
    componenteActivo = false;
  };
  
}, []);
async function manejarAgregarAlCarrito(producto) {
  setMensajeCarrito("");

  try {
    const tipoProducto =
      producto.tipo === "motor" ? "motor" : "autoparte";

    await agregarAlCarrito(
      producto,
      tipoProducto,
      1
    );

    const referencia =
      producto.id ||
      producto.codigo ||
      producto.producto_id;

    setProductoAgregado(referencia);

    setMensajeCarrito(
      "Producto agregado correctamente al carrito."
    );

    window.setTimeout(() => {
      setProductoAgregado(null);
      setMensajeCarrito("");
    }, 2500);
  } catch (error) {
    console.error(
      "Error al agregar al carrito:",
      error
    );

    if (
      error?.message === "USUARIO_NO_AUTENTICADO"
    ) {
      localStorage.setItem(
        "rutaDespuesDelLogin",
        window.location.pathname
      );

      navigate("/iniciar-sesion", {
        state: {
          desde: window.location.pathname,
        },
      });

      return;
    }

    if (
      error?.message === "MOTOR_YA_AGREGADO"
    ) {
      setMensajeCarrito(
        "Este motor ya está en tu carrito."
      );

      return;
    }

    if (
      error?.message === "RESERVA_ACTIVA"
    ) {
      setMensajeCarrito(
        "Ya tienes una reserva activa. Finaliza el pago antes de modificar el carrito."
      );

      return;
    }

    setMensajeCarrito(
      error?.message ||
      "No fue posible agregar el producto."
    );
  }
}
const inventario = useMemo(() => {
  return {
    motores: productosSupabase.filter(
      (producto) =>
        producto.tipo === "motor" &&
        producto.ubicacion === "detalle"
    ),

    contenedor40: productosSupabase.filter(
      (producto) =>
        producto.tipo === "motor" &&
        producto.ubicacion === "contenedor40"
    ),

    contenedor80: productosSupabase.filter(
      (producto) =>
        producto.tipo === "motor" &&
        producto.ubicacion === "contenedor80"
    ),

    partes: productosSupabase.filter(
      (producto) => producto.tipo === "autoparte"
    ),

    amazon: [],
  };
}, [productosSupabase]);
 
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

  let seccion = "motores";

  if (ubicacion === "contenedor40") {
    seccion = "contenedor40";
  } else if (ubicacion === "contenedor80") {
    seccion = "contenedor80";
  } else if (
    ["parte", "partes", "autoparte"].includes(
      String(producto?.tipo || "").toLowerCase()
    )
  ) {
    seccion = "partes";
  }

  const enlace = `${
    window.location.origin
  }/catalogo?seccion=${seccion}&producto=${producto.id}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: obtenerNombre(producto),
        text: `${obtenerNombre(producto)} disponible en Mr. Rivero Motors`,
        url: enlace,
      });

      return;
    }

    await navigator.clipboard.writeText(enlace);
    window.alert("Enlace copiado.");
  } catch (error) {
    console.error("Error compartiendo:", error);

    window.prompt(
      "Copia este enlace:",
      enlace
    );
  }
}
useEffect(() => {
  if (!seccionCompartida) {
    return;
  }

  const seccionesPermitidas = [
    "motores",
    "contenedor40",
    "contenedor80",
    "partes",
  ];

  if (seccionesPermitidas.includes(seccionCompartida)) {
    setSeccionActiva(seccionCompartida);
  }
}, [seccionCompartida]);useEffect(() => {
  if (!productoCompartido) {
    return;
  }

  const temporizador = setTimeout(() => {
    const tarjeta = document.getElementById(
      `producto-${productoCompartido}`
    );

    if (tarjeta) {
      tarjeta.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 800);

  return () => clearTimeout(temporizador);
}, [
  productoCompartido,
  seccionActiva,
  productosSupabase,
]);
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

        <a
  href="https://wa.me/12012792635"
  target="_blank"
  rel="noopener noreferrer"
  className="catalogo-contacto"
>
  <FaWhatsapp />
  <span>Entra en contacto</span>
</a>
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
            {mensajeCarrito && (
  <div className="mensaje-carrito">
    {mensajeCarrito}
  </div>
)}

<button
  type="button"
  className="boton-ir-carrito"
  onClick={() => navigate("/carrito")}
>
  <FaCartShopping />
  Carrito ({cantidadProductos})
</button>
          </div>
        ) : (
          <div className="catalogo-grid">
           {productosFiltrados.map((producto, indice) => {
  const imagenesGaleria =
    obtenerImagenesGaleria(producto);

  const claveProducto =
    obtenerClaveProducto(producto, indice);

  const indiceFotoActual =
    fotoSeleccionada[claveProducto] ?? 0;

  const imagenPrincipal =
    imagenesGaleria[indiceFotoActual] ||
    imagenesGaleria[0] ||
    obtenerImagen(producto) ||
    "";

  return (
    <article
  key={claveProducto}
  id={`producto-${producto.id}`}
  className={`catalogo-producto-card ${
    String(producto.id) === String(productoCompartido)
      ? "producto-compartido-destacado"
      : ""
  }`}
><div className="producto-galeria">
  <div className="producto-imagen-principal">
    {imagenPrincipal ? (
      <img
        src={imagenPrincipal}
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

    {imagenesGaleria.length > 1 && (
      <span className="producto-cantidad-fotos">
        {indiceFotoActual + 1}/
        {imagenesGaleria.length}
      </span>
    )}
  </div>

  {imagenesGaleria.length > 1 && (
    <div className="producto-lista-miniaturas">
      {imagenesGaleria
        .slice(0, 4)
        .map(
          (
            imagenMiniatura,
            indiceMiniatura
          ) => (
            <button
              type="button"
              key={`${claveProducto}-${indiceMiniatura}`}
              className={
                indiceFotoActual ===
                indiceMiniatura
                  ? "producto-miniatura producto-miniatura-activa"
                  : "producto-miniatura"
              }
              onClick={() =>
                setFotoSeleccionada(
                  (estadoAnterior) => ({
                    ...estadoAnterior,
                    [claveProducto]:
                      indiceMiniatura,
                  })
                )
              }
              aria-label={`Mostrar fotografía ${
                indiceMiniatura + 1
              }`}
            >
              <img
                src={imagenMiniatura}
                alt={`Fotografía ${
                  indiceMiniatura + 1
                } de ${obtenerNombre(
                  producto
                )}`}
                loading="lazy"
              />
            </button>
          )
        )}
    </div>
  )}
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
  onClick={() => manejarAgregarAlCarrito(producto)}
>
  {productoAgregado === (producto.id || producto.codigo) ? (
    <>
      <FaCheck />
      Agregado
    </>
  ) : (
    <>
      <FaCartPlus />
      Agregar al carrito
    </>
  )}
</button>

<button
  type="button"
  className="boton-whatsapp"
  onClick={() => contactarPorWhatsApp(producto)}
  aria-label="Consultar por WhatsApp"
>
  <FaWhatsapp />
</button>

<button
  type="button"
  className="boton-compartir"
  onClick={() => compartirProducto(producto)}
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

    </main>
  );
}