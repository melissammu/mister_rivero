import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/ProductoDetalle.css";

function formatearDolares(valor) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(valor) || 0);
}

export default function ProductoDetalle() {
  const navigate = useNavigate();
  const { tipo, id } = useParams();

  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let componenteActivo = true;

    async function cargarProducto() {
      setCargando(true);
      setError("");

      const { data, error: errorSupabase } = await supabase
        .from("productos")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!componenteActivo) {
        return;
      }

      if (errorSupabase) {
        console.error(
          "Error cargando el detalle del producto:",
          errorSupabase
        );

        setError("No se pudo cargar el producto.");
        setCargando(false);
        return;
      }

      if (!data) {
        setError("El producto no existe o ya no está disponible.");
        setCargando(false);
        return;
      }

      setProducto({
        ...data,

        precioVenta:
          data.precio_venta ??
          data.precioVenta ??
          data.precio ??
          0,

        numeroSerie:
          data.numero_serie ??
          data.numeroSerie ??
          "",

        imagenes:
          Array.isArray(data.imagenes)
            ? data.imagenes
            : [],
      });

      setCargando(false);
    }

    cargarProducto();

    return () => {
      componenteActivo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <main className="producto-detalle-pagina">
        <div className="producto-detalle-mensaje">
          Cargando producto...
        </div>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main className="producto-detalle-pagina">
        <div className="producto-detalle-mensaje">
          <h1>Producto no encontrado</h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/catalogo")}
          >
            Volver al catálogo
          </button>
        </div>
      </main>
    );
  }

  const imagenPrincipal =
    producto.imagenes?.[0] || "";

  const nombre =
    producto.nombre ||
    `${producto.marca || ""} ${producto.modelo || ""}`.trim() ||
    "Producto";

  return (
    <main className="producto-detalle-pagina">
      <button
        type="button"
        className="producto-detalle-volver"
        onClick={() => navigate("/catalogo")}
      >
        ← Volver al catálogo
      </button>

      <section className="producto-detalle-contenedor">
        <div className="producto-detalle-imagenes">
          {imagenPrincipal ? (
            <img
              src={imagenPrincipal}
              alt={nombre}
              className="producto-detalle-principal"
            />
          ) : (
            <div className="producto-detalle-sin-imagen">
              Sin fotografía
            </div>
          )}

          {producto.imagenes.length > 1 && (
            <div className="producto-detalle-miniaturas">
              {producto.imagenes.map((imagen, indice) => (
                <img
                  key={`${imagen}-${indice}`}
                  src={imagen}
                  alt={`${nombre} ${indice + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="producto-detalle-informacion">
          <span className="producto-detalle-estado">
            {producto.estado || "Disponible"}
          </span>

          <p className="producto-detalle-codigo">
            {producto.codigo}
          </p>

          <h1>{nombre}</h1>

          {producto.anio && (
            <p>
              <strong>Año:</strong> {producto.anio}
            </p>
          )}

          {producto.numeroSerie && (
            <p>
              <strong>Número de serie:</strong>{" "}
              {producto.numeroSerie}
            </p>
          )}

          <p className="producto-detalle-descripcion">
            {producto.descripcion ||
              "Sin descripción disponible."}
          </p>

          <p className="producto-detalle-precio">
            {formatearDolares(producto.precioVenta)}
          </p>

          <button
            type="button"
            className="producto-detalle-carrito"
            onClick={() => {
              window.alert(
                `${nombre} agregado al carrito.`
              );
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </section>
    </main>
  );
}