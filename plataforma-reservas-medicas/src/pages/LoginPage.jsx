// LoginPage.jsx — Pantalla de inicio de sesión
// Por ahora solo es visual, sin lógica de conexión al backend
import { useState } from 'react';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {

    const navigate = useNavigate();  // Para redirigir después del login
    const { login } = useAuth();  

  // useState nos permite guardar valores que cambian en pantalla
  // passwordVisible controla si la contraseña se ve o se oculta
  const [passwordVisible, setPasswordVisible] = useState(false);

  // formData guarda lo que el usuario escribe en los inputs
  const [formData, setFormData] = useState({
    documentNumber: '',
    password: ''
  });

  // Esta función se llama cada vez que el usuario escribe en un input
  // "e" es el evento del navegador — contiene info sobre qué cambió
  function handleChange(e) {
    // e.target.name  → el atributo name del input que cambió
    // e.target.value → el texto que escribió el usuario
    setFormData({
      ...formData,           // Copia todo lo que ya había en formData
      [e.target.name]: e.target.value  // Reemplaza solo el campo que cambió
    });
  }

  // Esta función se llama cuando el usuario envía el formulario
function handleSubmit(e) {
  e.preventDefault();

  // Por ahora simulamos un login exitoso con un token falso
  // En el SIGUIENTE paso aquí irá la llamada real al backend
  const tokenSimulado = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZXMiOlsiUk9MRV9BRE1JTiJdfQ.firma';

  // Guardamos el token en el AuthContext
  login(tokenSimulado);

  // Redirigimos al dashboard
  navigate('/dashboard');
}

  return (
    <div className="login">

      {/* ===== PANEL IZQUIERDO — Identidad institucional ===== */}
      <div className="login__panel">

        {/* Logo */}
        <div className="login__logo">
          <div className="login__logo-icon">
            <Stethoscope size={32} color="white" />
          </div>
          <span className="login__logo-name">UMARS</span>
        </div>

        {/* Texto institucional */}
        <div className="login__panel-content">
          <h2 className="login__panel-title">
            Sistema de Gestión de<br />Consultorios Médicos
          </h2>
          <p className="login__panel-subtitle">
            Plataforma integral para la administración de citas,
            pacientes y profesionales de la salud universitaria.
          </p>

          {/* Tarjetas de características */}
          <div className="login__features">
            <div className="login__feature">
              <span className="login__feature-dot" />
              <span>Gestión de citas en tiempo real</span>
            </div>
            <div className="login__feature">
              <span className="login__feature-dot" />
              <span>Control de horarios médicos</span>
            </div>
            <div className="login__feature">
              <span className="login__feature-dot" />
              <span>Reportes y estadísticas operativas</span>
            </div>
          </div>
        </div>

        {/* Decoración del fondo del panel */}
        <div className="login__panel-decoration" aria-hidden="true">
          <div className="decoration-circle decoration-circle--1" />
          <div className="decoration-circle decoration-circle--2" />
          <div className="decoration-circle decoration-circle--3" />
        </div>

      </div>

      {/* ===== PANEL DERECHO — Formulario ===== */}
      <div className="login__form-panel">
        <div className="login__form-container">

          {/* Encabezado del formulario */}
          <div className="login__form-header">
            <h1 className="login__form-title">Iniciar Sesión</h1>
            <p className="login__form-subtitle">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          {/* onSubmit llama a handleSubmit cuando el usuario presiona Enter
              o hace clic en el botón de tipo "submit" */}
          <form className="login__form" onSubmit={handleSubmit}>

            {/* Campo: Número de documento */}
            <div className="form-group">
              <label className="form-label" htmlFor="documentNumber">
                Número de Documento
              </label>
              <input
                className="form-input"
                id="documentNumber"
                name="documentNumber"
                type="text"
                placeholder="Ej: 1234567890"
                value={formData.documentNumber}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>

              {/* Contenedor relativo para posicionar el botón del ojo */}
              <div className="form-input-wrapper">
                <input
                  className="form-input form-input--password"
                  id="password"
                  name="password"
                  // El tipo cambia dinámicamente según passwordVisible
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                {/* Botón para mostrar/ocultar contraseña */}
                <button
                  type="button"
                  className="form-password-toggle"
                  // Cada clic invierte el valor de passwordVisible
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  // Título para accesibilidad (tooltip al hover)
                  title={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {/* Muestra un ícono distinto según el estado */}
                  {passwordVisible
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button type="submit" className="login__submit-btn">
              Ingresar al Sistema
            </button>

          </form>

          {/* Pie del formulario */}
          <p className="login__footer-text">
            ¿Problemas para acceder? Contacta al
            <a href="mailto:soporte@umars.edu.co"> administrador del sistema</a>
          </p>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;