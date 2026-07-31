import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCamera,
  FaImage,
  FaSave,
  FaTrash,
} from "react-icons/fa";

function RegistrarMotor() {
  const navigate = useNavigate();

  const inputCamaraRef = useRef(null);
  const inputGaleriaRef = useRef(null);

  const [imagenes, setImagenes] = useState([]);

  const [producto, setProducto] = useState({
  tipo: "motor",
  categoria: "",
  ubicacion: "por-detal",
  marca: "",
  modelo: "",
  anio: "",
  numeroSerie: "",
  estado: "Disponible",
  precioCompra: "",
  precioVenta: "",
  gastosAdicionales: "",
  descripcion: "",
});
  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    setProducto((datosAnteriores) => ({
      ...datosAnteriores,
      [name]: value,
    }));
  };

  const seleccionarTipo = (tipo) => {
    setProducto((datosAnteriores) => ({
      ...datosAnteriores,
      tipo,
      categoria:
        tipo === "motor"
          ? ""
          : datosAnteriores.categoria,
    }));
  };

  const convertirNumero = (valor) => {
    if (
      valor === null ||
      valor === undefined ||
      String(valor).trim() === ""
    ) {
      return 0;
    }

    let texto = String(valor)
      .trim()
      .replace(/\s/g, "")
      .replace(/R\$/gi, "");

    if (texto.includes(",") && texto.includes(".")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
      texto = texto.replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : 0;
  };

  const precioCompra = convertirNumero(
    producto.precioCompra
  );

  const precioVenta = convertirNumero(
    producto.precioVenta
  );

  const gastosAdicionales = convertirNumero(
    producto.gastosAdicionales
  );

  const costoTotal =
    precioCompra + gastosAdicionales;

  const gananciaEstimada =
    precioVenta - costoTotal;

  const formatearDinero = (valor) => {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const generarId = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  };

  const agregarArchivo = (archivo) => {
    if (!archivo) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      alert("La foto debe ser JPG, PNG o WEBP.");
      return;
    }

    const limiteEnBytes = 3 * 1024 * 1024;

    if (archivo.size > limiteEnBytes) {
      alert("Cada foto debe pesar menos de 3 MB.");
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      const nuevaImagen = {
        id: generarId(),
        url: lector.result,
        nombre: archivo.name,
      };

      setImagenes((imagenesAnteriores) => {
        if (imagenesAnteriores.length >= 3) {
          alert("Solo puedes agregar hasta 3 fotos.");
          return imagenesAnteriores;
        }

        return [
          ...imagenesAnteriores,
          nuevaImagen,
        ];
      });
    };

    lector.onerror = () => {
      alert("No se pudo leer la fotografía.");
    };

    lector.readAsDataURL(archivo);
  };

  const manejarFotoCamara = (evento) => {
    const archivo = evento.target.files?.[0];

    agregarArchivo(archivo);

    evento.target.value = "";
  };

  const manejarFotosGaleria = (evento) => {
    const archivos = Array.from(
      evento.target.files || []
    );

    const espaciosDisponibles =
      3 - imagenes.length;

    if (espaciosDisponibles <= 0) {
      alert("Ya agregaste las 3 fotos permitidas.");
      evento.target.value = "";
      return;
    }

    const archivosPermitidos = archivos.slice(
      0,
      espaciosDisponibles
    );

    archivosPermitidos.forEach((archivo) => {
      agregarArchivo(archivo);
    });

    if (archivos.length > espaciosDisponibles) {
      alert(
        `Solo se agregaron ${espaciosDisponibles} foto(s), porque el límite es 3.`
      );
    }

    evento.target.value = "";
  };

  const eliminarImagen = (idImagen) => {
    setImagenes((imagenesAnteriores) =>
      imagenesAnteriores.filter(
        (imagen) => imagen.id !== idImagen
      )
    );
  };

  const convertirEnPrincipal = (idImagen) => {
    setImagenes((imagenesAnteriores) => {
      const imagenSeleccionada =
        imagenesAnteriores.find(
          (imagen) => imagen.id === idImagen
        );

      if (!imagenSeleccionada) {
        return imagenesAnteriores;
      }

      const otrasImagenes =
        imagenesAnteriores.filter(
          (imagen) => imagen.id !== idImagen
        );

      return [
        imagenSeleccionada,
        ...otrasImagenes,
      ];
    });
  };

  const obtenerListaGuardada = (clave) => {
    try {
      const contenido = localStorage.getItem(clave);

      if (!contenido) {
        return [];
      }

      const lista = JSON.parse(contenido);

      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      console.error(
        `Error al leer ${clave}:`,
        error
      );

      return [];
    }
  };

  const generarCodigo = (
    listaGuardada,
    prefijo
  ) => {
    const numerosExistentes = listaGuardada.map(
      (elemento) => {
        const codigo = String(
          elemento.codigo || ""
        );

        const numero = Number(
          codigo.replace(`${prefijo}-`, "")
        );

        return Number.isNaN(numero)
          ? 0
          : numero;
      }
    );

    const ultimoNumero =
      numerosExistentes.length > 0
        ? Math.max(...numerosExistentes)
        : 0;

    return `${prefijo}-${String(
      ultimoNumero + 1
    ).padStart(6, "0")}`;
  };

  const validarFormulario = () => {
    if (imagenes.length === 0) {
      alert("Debes agregar al menos una foto.");
      return false;
    }

    if (
      producto.tipo === "autoparte" &&
      !producto.categoria
    ) {
      alert(
        "Selecciona la categoría de la autoparte."
      );
      return false;
    }

    if (!producto.marca.trim()) {
      alert("Debes colocar la marca.");
      return false;
    }

    if (!producto.modelo.trim()) {
      alert("Debes colocar el modelo.");
      return false;
    }

    if (
      producto.anio &&
      (
        Number(producto.anio) < 1900 ||
        Number(producto.anio) > 2100
      )
    ) {
      alert("Coloca un año válido.");
      return false;
    }

    if (precioCompra <= 0) {
      alert(
        "Coloca un precio de compra válido."
      );
      return false;
    }

    if (precioVenta <= 0) {
      alert(
        "Coloca un precio de venta válido."
      );
      return false;
    }

    if (!producto.descripcion.trim()) {
      alert(
        "Escribe una descripción del producto."
      );
      return false;
    }

    return true;
  };

  const guardarProducto = (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      const esMotor =
        producto.tipo === "motor";

      const claveAlmacenamiento = esMotor
        ? "motores"
        : "partes";

      const prefijo = esMotor
        ? "MTR"
        : "PAR";

      const listaGuardada =
        obtenerListaGuardada(
          claveAlmacenamiento
        );

      const codigo = generarCodigo(
        listaGuardada,
        prefijo
      );

      const fechaActual =
        new Date().toISOString();

      const nuevoProducto = {
        id: generarId(),
        codigo,

        tipo: producto.tipo,

        categoria: esMotor
          ? "Motor"
          : producto.categoria,

          ubicacion: producto.ubicacion,

        imagenes,

        imagenPrincipal:
          imagenes[0]?.url || "",

        marca: producto.marca.trim(),
        modelo: producto.modelo.trim(),

        anio: producto.anio
          ? Number(producto.anio)
          : null,

        numeroSerie:
          producto.numeroSerie.trim(),

        estado: producto.estado,

        precioCompra,
        precioVenta,
        gastosAdicionales,
        costoTotal,
        gananciaEstimada,

        descripcion:
          producto.descripcion.trim(),

        fechaRegistro: fechaActual,
        fechaActualizacion: fechaActual,
      };

      localStorage.setItem(
        claveAlmacenamiento,
        JSON.stringify([
          ...listaGuardada,
          nuevoProducto,
        ])
      );

      alert(
        `${
          esMotor ? "Motor" : "Autoparte"
        } ${codigo} registrado correctamente.`
      );

      navigate(
        esMotor
          ? "/admin/motores"
          : "/admin/partes"
      );
    } catch (error) {
      console.error(
        "Error al guardar:",
        error
      );

      if (
        error?.name === "QuotaExceededError"
      ) {
        alert(
          "Las fotografías ocupan demasiado espacio. Usa imágenes más pequeñas."
        );
        return;
      }

      alert(
        "No se pudo guardar el producto."
      );
    }
  };

  const cancelarRegistro = () => {
    navigate("/admin/motores");
  };

  return (
    <section style={estilos.pagina}>
      <div style={estilos.encabezado}>
        <div>
          <h1 style={estilos.titulo}>
            Registrar producto
          </h1>

          <p style={estilos.descripcion}>
            Registra un motor o una autoparte con
            un máximo de tres fotografías.
          </p>
        </div>

        <button
          type="button"
          onClick={cancelarRegistro}
          style={estilos.botonSecundario}
        >
          <FaArrowLeft />
          Volver
        </button>
      </div>

      <form
        onSubmit={guardarProducto}
        style={estilos.formulario}
      >
        <section style={estilos.seccion}>
          <h2 style={estilos.subtitulo}>
            1. Tipo de producto
          </h2>

          <div style={estilos.tipoGrid}>
            <button
              type="button"
              onClick={() =>
                seleccionarTipo("motor")
              }
              style={{
                ...estilos.botonTipo,
                ...(producto.tipo === "motor"
                  ? estilos.botonTipoActivo
                  : {}),
              }}
            >
              <strong style={estilos.tipoNombre}>
                Motor
              </strong>

              <span style={estilos.textoAyuda}>
                Motor completo para vehículo.
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                seleccionarTipo("autoparte")
              }
              style={{
                ...estilos.botonTipo,
                ...(producto.tipo === "autoparte"
                  ? estilos.botonTipoActivo
                  : {}),
              }}
            >
              <strong style={estilos.tipoNombre}>
                Autoparte
              </strong>

              <span style={estilos.textoAyuda}>
                Pieza o componente del vehículo.
              </span>
            </button>
          </div>
        </section>

        <section style={estilos.seccion}>
          <h2 style={estilos.subtitulo}>
            2. Fotografías
          </h2>

          <p style={estilos.textoAyuda}>
            Agrega entre una y tres fotografías.
            La primera será la foto principal.
          </p>

          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={manejarFotoCamara}
            style={estilos.inputOculto}
          />

          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={manejarFotosGaleria}
            style={estilos.inputOculto}
          />

          {imagenes.length === 0 ? (
            <div style={estilos.areaImagen}>
              <FaImage style={estilos.iconoImagen} />

              <strong>
                Todavía no hay fotografías
              </strong>

              <span style={estilos.textoAyuda}>
                Puedes tomar una foto o elegirla
                desde la galería.
              </span>
            </div>
          ) : (
            <div style={estilos.galeriaImagenes}>
              {imagenes.map(
                (imagen, indice) => (
                  <div
                    key={imagen.id}
                    style={estilos.tarjetaImagen}
                  >
                    <img
                      src={imagen.url}
                      alt={`Fotografía ${
                        indice + 1
                      }`}
                      style={estilos.miniatura}
                    />

                    {indice === 0 && (
                      <span
                        style={
                          estilos.etiquetaPrincipal
                        }
                      >
                        Foto principal
                      </span>
                    )}

                    <p style={estilos.nombreImagen}>
                      {imagen.nombre}
                    </p>

                    <div
                      style={
                        estilos.accionesFotografia
                      }
                    >
                      {indice !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            convertirEnPrincipal(
                              imagen.id
                            )
                          }
                          style={
                            estilos.botonPrincipal
                          }
                        >
                          Hacer principal
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          eliminarImagen(
                            imagen.id
                          )
                        }
                        style={
                          estilos.botonEliminar
                        }
                      >
                        <FaTrash />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {imagenes.length < 3 && (
            <div style={estilos.botonesImagen}>
              <button
                type="button"
                onClick={() =>
                  inputCamaraRef.current?.click()
                }
                style={estilos.botonCamara}
              >
                <FaCamera />
                Tomar foto
              </button>

              <button
                type="button"
                onClick={() =>
                  inputGaleriaRef.current?.click()
                }
                style={estilos.botonSecundario}
              >
                <FaImage />
                Agregar foto
              </button>
            </div>
          )}

          <p style={estilos.contadorFotos}>
            {imagenes.length} de 3 fotografías
          </p>
        </section>

        <section style={estilos.seccion}>
          <h2 style={estilos.subtitulo}>
            3. Información del producto
          </h2>

          <div style={estilos.grid}>
            <div style={estilos.campo}>
              <label style={estilos.label}>
                Código interno
              </label>

              <input
                type="text"
                value="Se asignará al guardar"
                disabled
                style={{
                  ...estilos.input,
                  ...estilos.inputDeshabilitado,
                }}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="estado"
                style={estilos.label}
              >
                Estado
              </label>

              <select
                id="estado"
                name="estado"
                value={producto.estado}
                onChange={manejarCambio}
                style={estilos.input}
              >
                <div style={estilos.campo}>
  <label
    htmlFor="ubicacion"
    style={estilos.label}
  >
    Ubicación inicial *
  </label>

  <select
    id="ubicacion"
    name="ubicacion"
    value={producto.ubicacion}
    onChange={manejarCambio}
    style={estilos.input}
  >
    <option value="contenedor-40">
      Contenedor 40
    </option>

    <option value="contenedor-80">
      Contenedor 80
    </option>

    <option value="por-detal">
      Por detal
    </option>
  </select>
</div>
                <option value="Disponible">
                  Disponible
                </option>

                <option value="Reservado">
                  Reservado
                </option>

                <option value="Vendido">
                  Vendido
                </option>
              </select>
            </div>

            {producto.tipo ===
              "autoparte" && (
              <div style={estilos.campo}>
                <label
                  htmlFor="categoria"
                  style={estilos.label}
                >
                  Categoría *
                </label>

                <select
                  id="categoria"
                  name="categoria"
                  value={producto.categoria}
                  onChange={manejarCambio}
                  style={estilos.input}
                >
                  <option value="">
                    Selecciona una categoría
                  </option>

                  <option value="Transmisión">
                    Transmisión
                  </option>

                  <option value="Frenos">
                    Frenos
                  </option>

                  <option value="Suspensión">
                    Suspensión
                  </option>

                  <option value="Dirección">
                    Dirección
                  </option>

                  <option value="Sistema eléctrico">
                    Sistema eléctrico
                  </option>

                  <option value="Refrigeración">
                    Refrigeración
                  </option>

                  <option value="Carrocería">
                    Carrocería
                  </option>

                  <option value="Accesorios">
                    Accesorios
                  </option>

                  <option value="Otra">
                    Otra
                  </option>
                </select>
              </div>
            )}
<h2 style={estilos.subtitulo}>
  3. Información del producto
</h2>
            <div style={estilos.campo}>
              <label
                htmlFor="marca"
                style={estilos.label}
              >
                Marca *
              </label>

              <input
                id="marca"
                name="marca"
                type="text"
                value={producto.marca}
                onChange={manejarCambio}
                placeholder="Ejemplo: Toyota"
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="modelo"
                style={estilos.label}
              >
                Modelo *
              </label>

              <input
                id="modelo"
                name="modelo"
                type="text"
                value={producto.modelo}
                onChange={manejarCambio}
                placeholder="Ejemplo: Hilux"
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="anio"
                style={estilos.label}
              >
                Año
              </label>

              <input
                id="anio"
                name="anio"
                type="text"
                inputMode="numeric"
                value={producto.anio}
                onChange={manejarCambio}
                placeholder="Ejemplo: 2022"
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="numeroSerie"
                style={estilos.label}
              >
                Número de serie
              </label>

              <input
                id="numeroSerie"
                name="numeroSerie"
                type="text"
                value={producto.numeroSerie}
                onChange={manejarCambio}
                placeholder="Opcional"
                style={estilos.input}
              />
            </div>
          </div>
        </section>

        <section style={estilos.seccion}>
          <h2 style={estilos.subtitulo}>
            4. Valores
          </h2>

          <div style={estilos.grid}>
            <div style={estilos.campo}>
              <label
                htmlFor="precioCompra"
                style={estilos.label}
              >
                Precio de compra *
              </label>

              <input
                id="precioCompra"
                name="precioCompra"
                type="text"
                inputMode="decimal"
                value={producto.precioCompra}
                onChange={manejarCambio}
                placeholder="Ejemplo: 1.500,00"
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="gastosAdicionales"
                style={estilos.label}
              >
                Gastos adicionales
              </label>

              <input
                id="gastosAdicionales"
                name="gastosAdicionales"
                type="text"
                inputMode="decimal"
                value={
                  producto.gastosAdicionales
                }
                onChange={manejarCambio}
                placeholder="Ejemplo: 300,00"
                style={estilos.input}
              />
            </div>

            <div style={estilos.campo}>
              <label
                htmlFor="precioVenta"
                style={estilos.label}
              >
                Precio de venta *
              </label>

              <input
                id="precioVenta"
                name="precioVenta"
                type="text"
                inputMode="decimal"
                value={producto.precioVenta}
                onChange={manejarCambio}
                placeholder="Ejemplo: 2.500,00"
                style={estilos.input}
              />
            </div>
          </div>

          <div style={estilos.resumen}>
            <div style={estilos.resumenItem}>
              <span style={estilos.textoAyuda}>
                Costo total
              </span>

              <strong style={estilos.valorResumen}>
                {formatearDinero(costoTotal)}
              </strong>
            </div>

            <div style={estilos.resumenItem}>
              <span style={estilos.textoAyuda}>
                Ganancia estimada
              </span>

              <strong
                style={{
                  ...estilos.valorResumen,
                  color:
                    gananciaEstimada < 0
                      ? "#ff6b6b"
                      : "#f4c430",
                }}
              >
                {formatearDinero(
                  gananciaEstimada
                )}
              </strong>
            </div>
          </div>
        </section>

        <section style={estilos.seccion}>
          <h2 style={estilos.subtitulo}>
            5. Descripción
          </h2>

          <div style={estilos.campo}>
            <label
              htmlFor="descripcion"
              style={estilos.label}
            >
              Descripción del producto *
            </label>

            <textarea
              id="descripcion"
              name="descripcion"
              rows="5"
              value={producto.descripcion}
              onChange={manejarCambio}
              placeholder="Describe su condición, características y cualquier información importante."
              style={estilos.textarea}
            />
          </div>
        </section>

        <div style={estilos.acciones}>
          <button
            type="button"
            onClick={cancelarRegistro}
            style={estilos.botonSecundario}
          >
            Cancelar
          </button>

          <button
            type="submit"
            style={estilos.botonGuardar}
          >
            <FaSave />
            Guardar producto
          </button>
        </div>
      </form>
    </section>
  );
}
const estilos = {
  pagina: {
    width: "100%",
    boxSizing: "border-box",
    padding: "28px",
    color: "#ffffff",
  },

  encabezado: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "24px",
  },

  titulo: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },

  descripcion: {
    margin: "8px 0 0",
    color: "#a7adb7",
    fontSize: "15px",
  },

  formulario: {
    width: "100%",
    maxWidth: "1000px",
    boxSizing: "border-box",
    padding: "24px",
    border: "1px solid #343943",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #20252d 0%, #15191f 100%)",
    boxShadow:
      "0 10px 25px rgba(0, 0, 0, 0.18)",
  },

  seccion: {
    paddingBottom: "25px",
    marginBottom: "25px",
    borderBottom: "1px solid #343943",
  },

  subtitulo: {
    margin: "0 0 15px",
    fontSize: "19px",
    fontWeight: "800",
  },

  textoAyuda: {
    color: "#a7adb7",
    fontSize: "14px",
  },

  tipoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "15px",
  },

  botonTipo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "7px",
    padding: "18px",
    border: "1px solid #48505c",
    borderRadius: "9px",
    background: "#101319",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
  },

  botonTipoActivo: {
    border: "2px solid #f4c430",
    background: "#292713",
  },

  tipoNombre: {
    fontSize: "18px",
  },

  inputOculto: {
    display: "none",
  },

  areaImagen: {
    display: "flex",
    minHeight: "190px",
    padding: "24px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    border: "2px dashed #4a515d",
    borderRadius: "10px",
    background: "#101319",
    textAlign: "center",
  },

  iconoImagen: {
    fontSize: "42px",
    color: "#f4c430",
  },

  botonesImagen: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px",
  },

  botonCamara: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 17px",
    border: "none",
    borderRadius: "7px",
    background: "#f4c430",
    color: "#151515",
    fontWeight: "800",
    cursor: "pointer",
  },

  botonSecundario: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 16px",
    border: "1px solid #4a515d",
    borderRadius: "7px",
    background: "#242932",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  galeriaImagenes: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "15px",
    marginTop: "15px",
  },

  tarjetaImagen: {
    position: "relative",
    padding: "10px",
    border: "1px solid #424a56",
    borderRadius: "10px",
    background: "#101319",
  },

  miniatura: {
    display: "block",
    width: "100%",
    height: "190px",
    objectFit: "cover",
    borderRadius: "7px",
    background: "#090b0e",
  },

  etiquetaPrincipal: {
    position: "absolute",
    top: "18px",
    left: "18px",
    padding: "6px 9px",
    borderRadius: "5px",
    background: "#f4c430",
    color: "#151515",
    fontSize: "12px",
    fontWeight: "800",
  },

  nombreImagen: {
    overflow: "hidden",
    margin: "10px 0",
    color: "#a7adb7",
    fontSize: "12px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  accionesFotografia: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  botonPrincipal: {
    flex: 1,
    minWidth: "120px",
    padding: "9px 10px",
    border: "1px solid #8b7720",
    borderRadius: "6px",
    background: "#353014",
    color: "#f4c430",
    fontWeight: "700",
    cursor: "pointer",
  },

  botonEliminar: {
    display: "flex",
    flex: 1,
    minWidth: "105px",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "9px 10px",
    border: "1px solid #743b3b",
    borderRadius: "6px",
    background: "#3b2020",
    color: "#ffb3b3",
    cursor: "pointer",
  },

  contadorFotos: {
    margin: "12px 0 0",
    color: "#a7adb7",
    textAlign: "center",
    fontSize: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },

  campo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #4a515d",
    borderRadius: "7px",
    background: "#101319",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
  },

  inputDeshabilitado: {
    background: "#29303a",
    color: "#b1b6bf",
    cursor: "not-allowed",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #4a515d",
    borderRadius: "7px",
    background: "#101319",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
  },

  resumen: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    marginTop: "22px",
  },

  resumenItem: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    padding: "17px",
    border: "1px solid #252a32",
    borderRadius: "8px",
    background: "#0e1116",
  },

  valorResumen: {
    color: "#f4c430",
    fontSize: "23px",
  },

  acciones: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "12px",
  },

  botonGuardar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 20px",
    border: "none",
    borderRadius: "7px",
    background: "#f4c430",
    color: "#151515",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default RegistrarMotor;