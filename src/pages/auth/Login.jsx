import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const correoLimpio = email.trim().toLowerCase();

    if (!correoLimpio || !password) {
      setMensaje("Completa el correo y la contraseña.");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: correoLimpio,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data?.session) {
        setMensaje("No se pudo iniciar la sesión.");
        return;
      }

      navigate("/admin");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.message === "Invalid login credentials") {
        setMensaje("Correo o contraseña incorrectos.");
      } else if (error.message === "Email not confirmed") {
        setMensaje("Debes confirmar tu correo electrónico.");
      } else {
        setMensaje(error.message || "No se pudo iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-icon" aria-hidden="true">
          ⚙
        </div>

        <h1 className="login-brand">
          Mr. Rivero <span>Motors</span>
        </h1>

        <p className="login-subtitle">
          Sistema de gestión de motores, piezas y contenedores
        </p>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>

          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="administrador@mr-rivero.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            required
          />

          {mensaje && <p className="login-error">{mensaje}</p>}

          <button
            className="login-button"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "ENTRANDO..." : "ENTRAR AL SISTEMA"}
          </button>
        </form>

        <p className="login-help">
          Acceso exclusivo para personal autorizado
        </p>
      </section>
    </main>
  );
}

export default Login;