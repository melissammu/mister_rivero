import "../../styles/Login.css";

function Login() {
  function handleSubmit(event) {
    event.preventDefault();
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
            placeholder="administrador@mr-rivero.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Contraseña</label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            required
          />

          <button className="login-button" type="submit">
            Entrar al sistema
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