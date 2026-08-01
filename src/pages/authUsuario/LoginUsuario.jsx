import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
} from "react-icons/fa";

import { supabase } from "../../lib/supabase";
import "../../styles/AuthUsuario.css";

export default function LoginUsuario() {
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  async function iniciarSesion(evento) {
    evento.preventDefault();

    const correoLimpio = correo.trim().toLowerCase();

    setMensaje("");
    setTipoMensaje("");

    if (!correoLimpio || !contrasena) {
      setTipoMensaje("error");
      setMensaje("Escribe tu correo y contraseña.");
      return;
    }

    try {
      setCargando(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: correoLimpio,
          password: contrasena,
        });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setTipoMensaje("error");
        setMensaje("No se pudo iniciar la sesión.");
        return;
      }

      const destino =
        location.state?.desde ||
        localStorage.getItem("rutaDespuesDelLogin") ||
        "/catalogo";

      localStorage.removeItem("rutaDespuesDelLogin");

      navigate(destino, { replace: true });
    } catch (error) {
      const mensajeError = error.message?.toLowerCase() || "";

      if (mensajeError.includes("invalid login credentials")) {
        setMensaje("El correo o la contraseña son incorrectos.");
      } else if (mensajeError.includes("email not confirmed")) {
        setMensaje(
          "Debes confirmar tu correo antes de iniciar sesión."
        );
      } else {
        setMensaje(
          "No fue posible iniciar sesión. Inténtalo nuevamente."
        );
      }

      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  }

  async function reenviarConfirmacion() {
    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio) {
      setTipoMensaje("error");
      setMensaje("Escribe primero tu correo.");
      return;
    }

    try {
      setCargando(true);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: correoLimpio,
        options: {
          emailRedirectTo: `${window.location.origin}/iniciar-sesion`,
        },
      });

      if (error) {
        throw error;
      }

      setTipoMensaje("exito");
      setMensaje(
        "Correo reenviado. Revisa también la carpeta de spam."
      );
    } catch {
      setTipoMensaje("error");
      setMensaje(
        "No fue posible reenviar el correo de confirmación."
      );
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
            Acceso de clientes
          </span>

          <h1>Iniciar sesión</h1>

          <p>
            Accede a tu cuenta para comprar productos y
            consultar tus pedidos.
          </p>
        </header>

        <form
          className="auth-usuario-form"
          onSubmit={iniciarSesion}
        >
          <label>
            <span>Correo electrónico</span>

            <div className="auth-input">
              <FaEnvelope />

              <input
                type="email"
                value={correo}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                onChange={(evento) => {
                  setCorreo(evento.target.value);
                  setMensaje("");
                }}
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
                value={contrasena}
                placeholder="Escribe tu contraseña"
                autoComplete="current-password"
                onChange={(evento) => {
                  setContrasena(evento.target.value);
                  setMensaje("");
                }}
                required
              />

              <button
                type="button"
                className="auth-ver-contrasena"
                onClick={() =>
                  setMostrarContrasena((estado) => !estado)
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
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="auth-boton-secundario"
            onClick={reenviarConfirmacion}
            disabled={cargando}
          >
            Reenviar correo de confirmación
          </button>
        </form>

        <footer className="auth-usuario-footer">
          <span>¿Todavía no tienes cuenta?</span>

          <Link to="/crear-cuenta">
            Crear una cuenta
          </Link>
        </footer>
      </section>
    </main>
  );
}