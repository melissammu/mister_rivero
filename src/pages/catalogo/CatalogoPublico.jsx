import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  FaBoxOpen,
  FaCar,
  FaCartPlus,
  FaCartShopping,
  FaCheck,
  FaChevronRight,
  FaMagnifyingGlass,
  FaShareNodes,
  FaWhatsapp,
  FaWrench,
} from "react-icons/fa6";

import { useCarrito } from "../../context/CarritoContext";
import { supabase } from "../../lib/supabase";

import motorPrincipal from "../../assets/motor-imagen.jpeg";
import "../../styles/CatalogoPublico.css";

/* =========================================================
   SECCIONES DEL CATÁLOGO
========================================================= */

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

];

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function normalizar(valor = "") {
  return String(valor)
    .trim()
    .toLowerCase();
}

function normalizarUbicacion(valor = "") {
  return normalizar(valor)
    .replaceAll("-", "")
    .replaceAll("_", "")
    .replaceAll(" ", "");
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

function obtenerNombre(producto = {}) {
  const marcaModelo = `${producto.marca || ""} ${
    producto.modelo || ""
  }`.trim();

  return (
    producto.nombre ||
    producto.titulo ||
    marcaModelo ||
    producto.modelo ||
    producto.categoria ||
    "Producto sin nombre"
  );
}

function obtenerPrecio(producto = {}) {
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
  }).format(Number(valor) || 0);
}

function obtenerImagen(producto = {}) {
  if (producto.imagenPrincipal) {
    return producto.imagenPrincipal;
  }

  if (producto.imagen_principal) {
    return producto.imagen_principal;
  }

  if (producto.imagen_url) {
    return producto.imagen_url;
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
      producto.imagenes[0]?.publicUrl ||
      producto.imagenes[0]?.src ||
      producto.imagenes[0]
    );
  }

  if (
    Array.isArray(producto.fotos) &&
    producto.fotos.length > 0
  ) {
    return (
      producto.fotos[0]?.url ||
      producto.fotos[0]?.publicUrl ||
      producto.fotos[0]?.src ||
      producto.fotos[0]
    );
  }

  return "";
}

function obtenerTipoCatalogoProducto(
  producto = {},
  tipoPredeterminado = "motores"
) {
  if (producto.tipoCatalogo) {
    return producto.tipoCatalogo;
  }

  const ubicacion = normalizarUbicacion(
    producto.ubicacion ||
      producto.destino
  );

  if (ubicacion === "contenedor40") {
    return "contenedor40";
  }

  if (ubicacion === "contenedor80") {
    return "contenedor80";
  }

  const tipo = normalizar(producto.tipo);

  if (
    ["parte", "partes", "autoparte"].includes(tipo)
  ) {
    return "partes";
  }

  return tipoPredeterminado;
}

function esProductoDeContenedor(producto = {}) {
  const tipoCatalogo =
    obtenerTipoCatalogoProducto(producto);

  return [
    "contenedor40",
    "contenedor80",
  ].includes(tipoCatalogo);
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function CatalogoPublico() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    agregarAlCarrito,
    procesando,
    cantidadProductos,
  } = useCarrito();

  const [productosSupabase, setProductosSupabase] =
    useState([]);

  const [
    cargandoProductos,
    setCargandoProductos,
  ] = useState(true);

  const [
    errorProductos,
    setErrorProductos,
  ] = useState("");

  const [
    fotoSeleccionada,
    setFotoSeleccionada,
  ] = useState({});

  const [
    productoAgregado,
    setProductoAgregado,
  ] = useState(null);

  const [
    mensajeCarrito,
    setMensajeCarrito,
  ] = useState("");

  const [seccionActiva, setSeccionActiva] =
    useState("motores");

  const [busqueda, setBusqueda] =
    useState("");

  const numeroWhatsApp = "12012792635";

  const productoCompartido =
    searchParams.get("producto");

  const seccionCompartida =
    searchParams.get("seccion");

  /* =======================================================
     GALERÍA DE IMÁGENES
  ======================================================= */

  function obtenerImagenesGaleria(producto) {
    if (!producto) {
      return [];
    }

    const resultado = [];

    function agregarImagen(imagen) {
      if (!imagen) {
        return;
      }

      if (typeof imagen === "string") {
        const url = imagen.trim();

        if (url) {
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
          url.trim()
        ) {
          resultado.push(url.trim());
        }
      }
    }

    if (Array.isArray(producto.imagenes)) {
      producto.imagenes.forEach(
        agregarImagen
      );
    } else if (
      typeof producto.imagenes === "string"
    ) {
      try {
        const lista = JSON.parse(
          producto.imagenes
        );

        if (Array.isArray(lista)) {
          lista.forEach(agregarImagen);
        } else {
          agregarImagen(
            producto.imagenes
          );
        }
      } catch {
        agregarImagen(
          producto.imagenes
        );
      }
    }

    if (Array.isArray(producto.fotos)) {
      producto.fotos.forEach(
        agregarImagen
      );
    }

    agregarImagen(
      producto.imagenPrincipal
    );

    agregarImagen(
      producto.imagen_principal
    );

    agregarImagen(
      producto.imagen_url
    );

    agregarImagen(producto.imagen);
    agregarImagen(producto.foto);

    return [...new Set(resultado)];
  }

  function obtenerClaveProducto(
    producto,
    indice
  ) {
    return String(
      producto?.id ||
        producto?.codigo ||
        `producto-${indice}`
    );
  }

  /* =======================================================
     CARGAR PRODUCTOS DE SUPABASE
  ======================================================= */

  useEffect(() => {
    let componenteActivo = true;

    async function cargarProductos() {
      setCargandoProductos(true);
      setErrorProductos("");

      try {
        const { data, error } =
          await supabase
            .from("productos")
            .select("*")
            .or(
              "estado.ilike.disponible,estado.ilike.reservado"
            )
            .order("created_at", {
              ascending: false,
            });

        if (error) {
          throw error;
        }

        if (componenteActivo) {
          setProductosSupabase(
            data || []
          );
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

  /* =======================================================
     INVENTARIO CLASIFICADO
  ======================================================= */

  const inventario = useMemo(() => {
    return {
      motores: productosSupabase.filter(
        (producto) =>
          normalizar(producto.tipo) ===
            "motor" &&
          normalizarUbicacion(
            producto.ubicacion
          ) === "detalle"
      ),

      contenedor40:
        productosSupabase.filter(
          (producto) =>
            normalizar(producto.tipo) ===
              "motor" &&
            normalizarUbicacion(
              producto.ubicacion
            ) === "contenedor40"
        ),

      contenedor80:
        productosSupabase.filter(
          (producto) =>
            normalizar(producto.tipo) ===
              "motor" &&
            normalizarUbicacion(
              producto.ubicacion
            ) === "contenedor80"
        ),

      partes: productosSupabase.filter(
        (producto) =>
          [
            "autoparte",
            "parte",
            "partes",
          ].includes(
            normalizar(producto.tipo)
          )
      ),

     
    };
  }, [productosSupabase]);

  const productosActuales =
    inventario[seccionActiva] || [];

  const busquedaActiva =
  normalizar(busqueda).length > 0;
  const esVistaContenedor =
    !busquedaActiva &&
    [
      "contenedor40",
      "contenedor80",
    ].includes(seccionActiva);

  const nombreContenedor =
    seccionActiva === "contenedor80"
      ? "Contenedor 80"
      : "Contenedor 40";

  const productosDelContenedor =
    esVistaContenedor
      ? inventario[seccionActiva] || []
      : [];

  const cantidadContenedor =
    productosDelContenedor.length;

  const valorTotalContenedor =
    productosDelContenedor.reduce(
      (total, producto) =>
        total + obtenerPrecio(producto),
      0
    );

  const productosPropios = useMemo(
    () => [
      ...inventario.motores.map(
        (producto) => ({
          ...producto,
          tipoCatalogo: "motores",
        })
      ),

      ...inventario.contenedor40.map(
        (producto) => ({
          ...producto,
          tipoCatalogo:
            "contenedor40",
        })
      ),

      ...inventario.contenedor80.map(
        (producto) => ({
          ...producto,
          tipoCatalogo:
            "contenedor80",
        })
      ),

      ...inventario.partes.map(
        (producto) => ({
          ...producto,
          tipoCatalogo: "partes",
        })
      ),
    ],
    [inventario]
  );

  const productosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    if (
      !texto ||
      seccionActiva === "amazon"
    ) {
      return productosActuales.map(
        (producto) => ({
          ...producto,
          tipoCatalogo:
            producto.tipoCatalogo ||
            seccionActiva,
        })
      );
    }

    return productosPropios.filter(
      (producto) => {
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
          producto.numero_serie,
          producto.estado,
          obtenerNombreSeccion(
            producto.tipoCatalogo
          ),
        ]
          .map((valor) =>
            normalizar(valor)
          )
          .join(" ");

        return contenidoBuscable.includes(
          texto
        );
      }
    );
  }, [
    busqueda,
    productosActuales,
    productosPropios,
    seccionActiva,
  ]);

  /* =======================================================
     COMPRA INDIVIDUAL
  ======================================================= */

  async function manejarAgregarAlCarrito(
    producto
  ) {
    setMensajeCarrito("");

    try {
      const tipoProducto =
        normalizar(producto.tipo) ===
        "motor"
          ? "motor"
          : "autoparte";

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
        error?.message ===
        "USUARIO_NO_AUTENTICADO"
      ) {
        localStorage.setItem(
          "productoPendiente",
          JSON.stringify({
            producto,
            tipoProducto:
              normalizar(
                producto.tipo
              ) === "motor"
                ? "motor"
                : "autoparte",
            cantidad: 1,
          })
        );

        localStorage.setItem(
          "rutaDespuesDelLogin",
          window.location.pathname +
            window.location.search
        );

        navigate(
          "/iniciar-sesion",
          {
            state: {
              desde:
                window.location.pathname +
                window.location.search,
            },
          }
        );

        return;
      }

      if (
        error?.message ===
        "MOTOR_YA_AGREGADO"
      ) {
        setMensajeCarrito(
          "Este motor ya está en tu carrito."
        );

        return;
      }

      if (
        error?.message ===
        "RESERVA_ACTIVA"
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

  /* =======================================================
     WHATSAPP INDIVIDUAL
  ======================================================= */

  function contactarPorWhatsApp(
    producto
  ) {
    const codigo =
      producto?.codigo ||
      "Sin código";

    const nombre =
      obtenerNombre(producto);

    const precioFormateado =
      formatearPrecio(
        obtenerPrecio(producto)
      );

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
  }

  /* =======================================================
     COMPARTIR PRODUCTO INDIVIDUAL
  ======================================================= */

  async function compartirProducto(
    producto
  ) {
    const seccion =
      obtenerTipoCatalogoProducto(
        producto,
        seccionActiva
      );

    const enlace =
      `${window.location.origin}/catalogo` +
      `?seccion=${seccion}` +
      `&producto=${producto.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            obtenerNombre(producto),
          text:
            `${obtenerNombre(
              producto
            )} disponible en ` +
            "MR. RIVERO MOTORS",
          url: enlace,
        });

        return;
      }

      await navigator.clipboard.writeText(
        enlace
      );

      window.alert(
        "Enlace copiado."
      );
    } catch (error) {
      console.error(
        "Error compartiendo:",
        error
      );

      window.prompt(
        "Copia este enlace:",
        enlace
      );
    }
  }

  /* =======================================================
     WHATSAPP DEL CONTENEDOR COMPLETO
  ======================================================= */

  function contactarContenedorPorWhatsApp() {
    const mensaje = [
      `Hola, estoy interesado en comprar el ${nombreContenedor} completo de MR. RIVERO MOTORS.`,
      "",
      `Cantidad de motores: ${cantidadContenedor}`,
      `Valor total: ${formatearPrecio(
        valorTotalContenedor
      )}`,
      "",
      "Quisiera recibir más información para completar la compra.",
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
  }

  /* =======================================================
     COMPARTIR CONTENEDOR COMPLETO
  ======================================================= */

  async function compartirContenedor() {
    const enlace =
      `${window.location.origin}/catalogo` +
      `?seccion=${seccionActiva}`;

    const texto =
      `${nombreContenedor} disponible en MR. RIVERO MOTORS. ` +
      `${cantidadContenedor} motores por ` +
      `${formatearPrecio(
        valorTotalContenedor
      )}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: nombreContenedor,
          text: texto,
          url: enlace,
        });

        return;
      }

      await navigator.clipboard.writeText(
        enlace
      );

      window.alert(
        "Enlace del contenedor copiado."
      );
    } catch (error) {
      console.error(
        "Error compartiendo contenedor:",
        error
      );

      window.prompt(
        "Copia este enlace:",
        enlace
      );
    }
  }

  /* =======================================================
     COMPRAR CONTENEDOR COMPLETO
  ======================================================= */

  async function comprarContenedorCompleto() {
    if (cantidadContenedor === 0) {
      window.alert(
        "Este contenedor no tiene motores disponibles."
      );

      return;
    }

    const primerProducto =
      productosDelContenedor[0] || {};

    const productoContenedor = {
      id:
        seccionActiva ===
        "contenedor80"
          ? "VENTA-CONTENEDOR-80"
          : "VENTA-CONTENEDOR-40",

      codigo:
        seccionActiva ===
        "contenedor80"
          ? "CONTENEDOR-80"
          : "CONTENEDOR-40",

      nombre:
        `${nombreContenedor} completo`,

      titulo:
        `${nombreContenedor} completo`,

      descripcion:
        `${cantidadContenedor} motores incluidos en la compra.`,

      tipo: "motor",

      tipo_producto: "motor",

      ubicacion: seccionActiva,

      precio_venta:
        valorTotalContenedor,

      precioVenta:
        valorTotalContenedor,

      precio:
        valorTotalContenedor,

      imagen:
        obtenerImagen(
          primerProducto
        ),

      es_contenedor: true,

      cantidad_motores:
        cantidadContenedor,

      productos_incluidos:
        productosDelContenedor.map(
          (producto) => producto.id
        ),
    };

    try {
      await agregarAlCarrito(
        productoContenedor,
        "motor",
        1
      );

      setMensajeCarrito(
        `${nombreContenedor} agregado correctamente al carrito.`
      );

      navigate("/carrito");
    } catch (error) {
      console.error(
        "Error agregando contenedor:",
        error
      );

      if (
        error?.message ===
        "USUARIO_NO_AUTENTICADO"
      ) {
        localStorage.setItem(
          "productoPendiente",
          JSON.stringify({
            producto:
              productoContenedor,
            tipoProducto: "motor",
            cantidad: 1,
          })
        );

        localStorage.setItem(
          "rutaDespuesDelLogin",
          `/catalogo?seccion=${seccionActiva}`
        );

        navigate(
          "/iniciar-sesion",
          {
            state: {
              desde:
                `/catalogo?seccion=${seccionActiva}`,
            },
          }
        );

        return;
      }

      if (
        error?.message ===
        "MOTOR_YA_AGREGADO"
      ) {
        setMensajeCarrito(
          `${nombreContenedor} ya está en el carrito.`
        );

        navigate("/carrito");
        return;
      }

      if (
        error?.message ===
        "RESERVA_ACTIVA"
      ) {
        setMensajeCarrito(
          "Ya tienes una reserva activa. Finaliza esa compra antes de agregar el contenedor."
        );

        return;
      }

      setMensajeCarrito(
        error?.message ||
          "No fue posible agregar el contenedor."
      );
    }
  }

  /* =======================================================
     ABRIR DETALLE DEL PRODUCTO
  ======================================================= */

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

  /* =======================================================
     ENLACES COMPARTIDOS
  ======================================================= */

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

    if (
      seccionesPermitidas.includes(
        seccionCompartida
      )
    ) {
      setSeccionActiva(
        seccionCompartida
      );
    }
  }, [seccionCompartida]);

  useEffect(() => {
    if (!productoCompartido) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        const tarjeta =
          document.getElementById(
            `producto-${productoCompartido}`
          );

        if (tarjeta) {
          tarjeta.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 800);

    return () =>
      window.clearTimeout(
        temporizador
      );
  }, [
    productoCompartido,
    seccionActiva,
    productosSupabase,
  ]);

  /* =======================================================
     RENDERIZADO
  ======================================================= */

  return (
    <main className="catalogo-publico">
      <header className="catalogo-header">
        <button
          type="button"
          className="catalogo-logo"
          onClick={() => {
            setSeccionActiva(
              "motores"
            );

            setBusqueda("");
          }}
        >
          <span className="catalogo-logo-icono">
            ⚙
          </span>

          <span>
            <strong>
              MR. RIVERO
            </strong>

            <small>MOTORS</small>
          </span>
        </button>

        <button
          type="button"
          className="catalogo-carrito-header"
          onClick={() =>
            navigate("/carrito")
          }
          aria-label="Abrir carrito"
        >
          <FaCartShopping />

          {cantidadProductos > 0 && (
            <span>
              {cantidadProductos}
            </span>
          )}
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
              seccionActiva ===
              seccion.id
                ? "activo"
                : ""
            }
            onClick={() => {
              setSeccionActiva(
                seccion.id
              );

              setBusqueda("");
              setMensajeCarrito("");
            }}
          >
            {seccion.nombre}
          </button>
        ))}

        <a
          href={`https://wa.me/${numeroWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="catalogo-contacto"
        >
          <FaWhatsapp />

          <span>
            Entra en contacto
          </span>
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
            Motores, contenedores y
            autopartes importadas de alta
            calidad directamente desde USA.
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
          <strong>
            Productos verificados
          </strong>

          <span>
            Calidad garantizada
          </span>
        </article>

        <article>
          <strong>
            Envíos seguros
          </strong>

          <span>
            Entregas coordinadas
          </span>
        </article>

        <article>
          <strong>
            Atención experta
          </strong>

          <span>
            Soporte especializado
          </span>
        </article>

        <article>
          <strong>
            Pagos seguros
          </strong>

          <span>
            Protegemos tu compra
          </span>
        </article>
      </section>

      {/* BUSCADOR GLOBAL */}

      <div className="catalogo-buscador-contenedor">
        <div className="catalogo-buscador-superior">
          <FaMagnifyingGlass />

<input
  type="search"
  value={busqueda}
  placeholder="Buscar por código, marca, modelo o pieza..."
  onChange={(evento) =>
    setBusqueda(evento.target.value)
  }
/>
{busqueda && (
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
      </div>

      {/* CATEGORÍAS */}

      <section className="catalogo-categorias">
        {SECCIONES.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={
              seccionActiva ===
              seccion.id
                ? "categoria-card activa"
                : "categoria-card"
            }
            onClick={() => {
              setSeccionActiva(
                seccion.id
              );

              setBusqueda("");
              setMensajeCarrito("");
            }}
          >
            <span className="categoria-icono">
              {seccion.icono}
            </span>

            <div>
              <strong>
                {seccion.nombre}
              </strong>

              <small>
                {seccion.descripcion}
              </small>
            </div>

            <FaChevronRight />
          </button>
        ))}
      </section>

      {/* PRODUCTOS */}

      <section
        id="productos"
        className="catalogo-productos"
      >
        {esVistaContenedor ? (
          <div className="contenedor-resumen-publico">
            <div className="contenedor-resumen-identidad">
              <span className="contenedor-etiqueta">
                Catálogo disponible
              </span>

              <h2>
                {nombreContenedor}
              </h2>

              <p>
                Compra completa del
                contenedor.
              </p>
            </div>

            <div className="contenedor-resumen-datos">
              <div className="contenedor-dato">
                <span>
                  Motores disponibles
                </span>

                <strong>
                  {cantidadContenedor}
                </strong>
              </div>

              <div className="contenedor-dato contenedor-dato-total">
                <span>
                  Valor total del
                  contenedor
                </span>

                <strong>
                  {formatearPrecio(
                    valorTotalContenedor
                  )}
                </strong>
              </div>
            </div>

            <div className="contenedor-resumen-acciones">
              <button
                type="button"
                className="contenedor-boton-whatsapp"
                onClick={
                  contactarContenedorPorWhatsApp
                }
              >
                <FaWhatsapp />

                <span>
                  <strong>
                    WhatsApp
                  </strong>

                  <small>
                    Contactar vendedor
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="contenedor-boton-compartir"
                onClick={
                  compartirContenedor
                }
              >
                <FaShareNodes />

                <span>
                  <strong>
                    Compartir
                  </strong>

                  <small>
                    Compartir contenedor
                  </small>
                </span>
              </button>

              <button
                type="button"
                className="contenedor-boton-comprar"
                onClick={
                  comprarContenedorCompleto
                }
                disabled={
                  procesando ||
                  cantidadContenedor === 0
                }
              >
                <FaCartShopping />

                <span>
                  <strong>
                    {procesando
                      ? "Procesando..."
                      : "Comprar contenedor"}
                  </strong>

                  <small>
                    Agregar compra completa
                  </small>
                </span>
              </button>
            </div>
          </div>
        ) : (
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
                        seccion.id ===
                        seccionActiva
                    )?.nombre}
              </h2>
            </div>

            <strong>
              {productosFiltrados.length}{" "}
              {productosFiltrados.length ===
              1
                ? "producto"
                : "productos"}
            </strong>
          </div>
        )}

        {mensajeCarrito && (
          <div className="mensaje-carrito">
            <span>
              {mensajeCarrito}
            </span>

            <button
              type="button"
              onClick={() =>
                setMensajeCarrito("")
              }
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        {cargandoProductos ? (
          <div className="catalogo-vacio">
            <FaBoxOpen />

            <h3>
              Cargando productos...
            </h3>

            <p>
              Estamos consultando el
              inventario disponible.
            </p>
          </div>
        ) : errorProductos ? (
          <div className="catalogo-vacio">
            <FaBoxOpen />

            <h3>
              No se pudo cargar el
              catálogo
            </h3>

            <p>{errorProductos}</p>
          </div>
        ) : seccionActiva ===
          "amazon" ? (
          <div className="catalogo-vacio">
            <FaAmazon />

            <p>
              Aquí se mostrará el catálogo
              de Amazon de manera
              independiente.
            </p>
          </div>
        ) : productosFiltrados.length ===
          0 ? (
          <div className="catalogo-vacio">
            <FaBoxOpen />

            <h3>
              No hay productos disponibles
            </h3>

            <p>
              Regresa más tarde para
              revisar nuevas publicaciones.
            </p>

            <button
              type="button"
              className="boton-ir-carrito"
              onClick={() =>
                navigate("/carrito")
              }
            >
              <FaCartShopping />

              Carrito (
              {cantidadProductos})
            </button>
          </div>
        ) : (
          <div className="catalogo-grid">
            {productosFiltrados.map(
              (producto, indice) => {
                const imagenesGaleria =
                  obtenerImagenesGaleria(
                    producto
                  );

                const claveProducto =
                  obtenerClaveProducto(
                    producto,
                    indice
                  );

                const indiceFotoActual =
                  fotoSeleccionada[
                    claveProducto
                  ] ?? 0;

                const imagenPrincipal =
                  imagenesGaleria[
                    indiceFotoActual
                  ] ||
                  imagenesGaleria[0] ||
                  obtenerImagen(
                    producto
                  ) ||
                  "";

                const tipoCatalogo =
                  obtenerTipoCatalogoProducto(
                    producto,
                    seccionActiva
                  );

                const productoPerteneceAContenedor =
                  esProductoDeContenedor({
                    ...producto,
                    tipoCatalogo,
                  });

                return (
                  <article
                    key={claveProducto}
                    id={`producto-${producto.id}`}
                    className={`catalogo-producto-card ${
                      String(
                        producto.id
                      ) ===
                      String(
                        productoCompartido
                      )
                        ? "producto-compartido-destacado"
                        : ""
                    } ${
                      productoPerteneceAContenedor
                        ? "producto-card-contenedor"
                        : ""
                    }`}
                  >
                    <div className="producto-galeria">
                      <div
                        className="producto-imagen-principal"
                        onClick={() =>
                          abrirProducto(
                            producto
                          )
                        }
                        role="button"
                        tabIndex={0}
                      >
                        {imagenPrincipal ? (
                          <img
                            src={
                              imagenPrincipal
                            }
                            alt={obtenerNombre(
                              producto
                            )}
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

                        {imagenesGaleria.length >
                          1 && (
                          <span className="producto-cantidad-fotos">
                            {indiceFotoActual +
                              1}
                            /
                            {
                              imagenesGaleria.length
                            }
                          </span>
                        )}
                      </div>

                      {imagenesGaleria.length >
                        1 && (
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
                                      (
                                        estadoAnterior
                                      ) => ({
                                        ...estadoAnterior,
                                        [claveProducto]:
                                          indiceMiniatura,
                                      })
                                    )
                                  }
                                  aria-label={`Mostrar fotografía ${
                                    indiceMiniatura +
                                    1
                                  }`}
                                >
                                  <img
                                    src={
                                      imagenMiniatura
                                    }
                                    alt={`Fotografía ${
                                      indiceMiniatura +
                                      1
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
                          {producto.codigo ||
                            "Sin código"}
                        </span>

                        {busquedaActiva && (
                          <span className="producto-origen">
                            {obtenerNombreSeccion(
                              tipoCatalogo
                            )}
                          </span>
                        )}
                      </div>

                      <h3>
                        {obtenerNombre(
                          producto
                        )}
                      </h3>

                      <p className="producto-marca-modelo">
                        {producto.marca ||
                          "Sin marca"}{" "}
                        {producto.modelo ||
                          ""}
                      </p>

                      <p className="producto-descripcion">
                        {producto.descripcion ||
                          "Sin descripción disponible"}
                      </p>

                      <strong className="producto-precio">
                        {formatearPrecio(
                          obtenerPrecio(
                            producto
                          )
                        )}
                      </strong>

                      {!productoPerteneceAContenedor && (
                        <div className="producto-card-acciones">
                          <button
                            type="button"
                            className="boton-comprar"
                            onClick={() =>
                              manejarAgregarAlCarrito(
                                producto
                              )
                            }
                            disabled={
                              procesando
                            }
                          >
                            {productoAgregado ===
                            (producto.id ||
                              producto.codigo) ? (
                              <>
                                <FaCheck />
                                Agregado
                              </>
                            ) : (
                              <>
                                <FaCartPlus />
                                Agregar al
                                carrito
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="boton-whatsapp"
                            onClick={() =>
                              contactarPorWhatsApp(
                                producto
                              )
                            }
                            aria-label="Consultar por WhatsApp"
                          >
                            <FaWhatsapp />
                          </button>

                          <button
                            type="button"
                            className="boton-compartir"
                            onClick={() =>
                              compartirProducto(
                                producto
                              )
                            }
                            aria-label="Compartir producto"
                          >
                            <FaShareNodes />
                          </button>
                        </div>
                      )}
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