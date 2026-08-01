import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
} from "react-icons/fa";

import { supabase } from "../../lib/supabase";
import "../../styles/AuthUsuario.css";

export default function RegistroUsuario() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
    aceptarTerminos: false,
  });

  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  function actualizarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMensaje("");
  }

  async function registrarUsuario(evento) {
    evento.preventDefault();
    setMensaje("");
    setTipoMensaje("");

    const nombre = formulario.nombre.trim();
    const correo = formulario.correo.trim().toLowerCase();
    const telefono = formulario.telefono.trim();

    if (!nombre || !correo || !telefono || !formulario.contrasena) {
      setTipoMensaje("error");
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }

    if (formulario.contrasena.length < 8) {
      setTipoMensaje("error");
      setMensaje(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (
      formulario.contrasena !==
      formulario.confirmarContrasena
    ) {
      setTipoMensaje("error");
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (!formulario.aceptarTerminos) {
      setTipoMensaje("error");
      setMensaje(
        "Debes aceptar los términos y condiciones."
      );
      return;
    }

    try {
      setCargando(true);

      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: formulario.contrasena,
options: {
  data: {
    nombre_completo: nombre,
    telefono,
    rol: "cliente",
  },
  emailRedirectTo: `${window.location.origin}/iniciar-sesion`,
},
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate("/catalogo");
        return;
      }

      setTipoMensaje("exito");
      setMensaje(
        "Cuenta creada. Revisa tu correo y confirma tu dirección antes de iniciar sesión."
      );

      setFormulario({
        nombre: "",
        correo: "",
        telefono: "",
        contrasena: "",
        confirmarContrasena: "",
        aceptarTerminos: false,
      });
    } catch (error) {
      console.error("Error al registrar:", error);

      let mensajeError =
        "No fue posible crear la cuenta. Inténtalo nuevamente.";

      if (
        error.message
          ?.toLowerCase()
          .includes("already registered")
      ) {
        mensajeError =
          "Este correo ya está registrado. Inicia sesión.";
      }

      setTipoMensaje("error");
      setMensaje(mensajeError);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="auth-usuario-page">
      <section className="auth-usuario-card">
        <button
          type="button"
          className="auth-volver"
          onClick={() => navigate("/catalogo")}
        >
          <FaArrowLeft />
          Volver al catálogo
        </button>

        <header className="auth-usuario-header">
          <div className="auth-logo">
            <span>MR.</span>
            <strong>RIVERO MOTORS</strong>
          </div>

          <span className="auth-etiqueta">
            Cuenta de cliente
          </span>

          <h1>Crear cuenta</h1>

          <p>
            Regístrate para comprar motores, contenedores y
            autopartes de forma segura.
          </p>
        </header>

        <form
          className="auth-usuario-form"
          onSubmit={registrarUsuario}
        >
          <label>
            <span>Nombre completo</span>

            <div className="auth-input">
              <FaUser />

              <input
                type="text"
                name="nombre"
                value={formulario.nombre}
                placeholder="Escribe tu nombre"
                autoComplete="name"
                onChange={actualizarCampo}
                required
              />
            </div>
          </label>
<label>
  <span>Número de teléfono</span>

  <div className="auth-input">
    <FaPhone />

    <input
      type="tel"
      name="telefono"
      value={formulario.telefono}
      placeholder="+1 305 555 1234"
      autoComplete="tel"
      onChange={actualizarCampo}
      required
    />
  </div>
</label>
          <label>
            <span>Correo electrónico</span>

            <div className="auth-input">
              <FaEnvelope />

              <input
                type="email"
                name="correo"
                value={formulario.correo}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                onChange={actualizarCampo}
                required
              />
            </div>
          </label>

          <label>
            <span>Contraseña</span>

            <div className="auth-input">
              <FaLock />

              <input
                type={
                  mostrarContrasena ? "text" : "password"
                }
                name="contrasena"
                value={formulario.contrasena}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                onChange={actualizarCampo}
                required
              />

              <button
                type="button"
                className="auth-ver-contrasena"
                onClick={() =>
                  setMostrarContrasena(
                    (estadoActual) => !estadoActual
                  )
                }
                aria-label="Mostrar u ocultar contraseña"
              >
                {mostrarContrasena ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </label>

          <label>
            <span>Confirmar contraseña</span>

            <div className="auth-input">
              <FaLock />

              <input
                type={
                  mostrarConfirmacion
                    ? "text"
                    : "password"
                }
                name="confirmarContrasena"
                value={formulario.confirmarContrasena}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                onChange={actualizarCampo}
                required
              />

              <button
                type="button"
                className="auth-ver-contrasena"
                onClick={() =>
                  setMostrarConfirmacion(
                    (estadoActual) => !estadoActual
                  )
                }
                aria-label="Mostrar u ocultar confirmación"
              >
                {mostrarConfirmacion ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </label>

          <label className="auth-terminos">
            <input
              type="checkbox"
              name="aceptarTerminos"
              checked={formulario.aceptarTerminos}
              onChange={actualizarCampo}
            />

            <span>
              Acepto los términos, las condiciones y la
              política de privacidad.
            </span>
          </label>

          {mensaje && (
            <div
              className={`auth-mensaje auth-mensaje-${tipoMensaje}`}
              role="alert"
            >
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            className="auth-boton-principal"
            disabled={cargando}
          >
            {cargando
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>
        </form>

        <footer className="auth-usuario-footer">
          <span>¿Ya tienes una cuenta?</span>

          <Link to="/iniciar-sesion">
            Iniciar sesión
          </Link>
        </footer>
      </section>
    </main>
  );
}