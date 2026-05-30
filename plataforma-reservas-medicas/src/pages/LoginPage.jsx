// LoginPage.jsx — Con conexión real al backend
import { useState } from 'react';
import { Eye, EyeOff, Stethoscope, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginRequest } from '../api/authApi';
import './LoginPage.css';

function LoginPage() {

  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Estados del formulario ──────────────────
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [formData, setFormData] = useState({
    documentNumber: '',
    password: ''
  });

  // Estado de carga: true mientras esperamos respuesta del backend
  const [isLoading, setIsLoading] = useState(false);

  // Mensaje de error para mostrar al usuario
  // null = sin error, string = hay un error
  const [errorMessage, setErrorMessage] = useState(null);

  // ── Manejadores ─────────────────────────────

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Borramos el error cuando el usuario empieza a escribir
    // Para no tener el mensaje de error mientras corrige
    if (errorMessage) setErrorMessage(null);
  }

  // async/await: le decimos que esta función hará operaciones
  // que toman tiempo (llamar al backend)
  async function handleSubmit(e) {
    e.preventDefault();

    // Activamos el estado de carga
    // El botón mostrará un spinner y se deshabilitará
    setIsLoading(true);
    setErrorMessage(null);

    // try/catch: intentamos hacer el login
    // Si algo falla, el catch captura el error
    try {

      // Llamamos al backend con los datos del formulario
      // "await" pausa aquí hasta que el backend responda
      const response = await loginRequest({
        documentNumber: formData.documentNumber,
        password: formData.password
      });

      // Si llegamos aquí, el login fue exitoso
      // response.accessToken tiene el JWT que devolvió el backend
      login(response.accessToken);

      // Redirigimos al dashboard
      navigate('/dashboard');

    } catch (error) {
      // El backend respondió con error, o no hubo conexión

      // error.response existe cuando el backend respondió
      // (ej: 401 credenciales incorrectas, 400 datos inválidos)
      if (error.response) {

        const status = error.response.status;

        if (status === 401 || status === 403) {
          setErrorMessage('Número de documento o contraseña incorrectos.');
        } else if (status === 400) {
          setErrorMessage('Datos inválidos. Verifica la información ingresada.');
        } else {
          setErrorMessage('Error en el servidor. Intenta más tarde.');
        }

      } else if (error.request) {
        // error.request existe cuando la petición salió pero
        // no hubo respuesta — el backend no está corriendo
        setErrorMessage(
          'No se pudo conectar con el servidor. ' +
          'Verifica que el backend esté en ejecución.'
        );
      } else {
        setErrorMessage('Ocurrió un error inesperado.');
      }

    } finally {
      // finally se ejecuta SIEMPRE, haya error o no
      // Desactivamos el estado de carga
      setIsLoading(false);
    }
  }

  // ── Render ──────────────────────────────────

  return (
    <div className="login">

      {/* Panel izquierdo */}
      <div className="login__panel">
        <div className="login__logo">
          <div className="login__logo-icon">
            <Stethoscope size={32} color="white" />
          </div>
          <span className="login__logo-name">UMARS</span>
        </div>

        <div className="login__panel-content">
          <h2 className="login__panel-title">
            Sistema de Gestión de<br />Consultorios Médicos
          </h2>
          <p className="login__panel-subtitle">
            Plataforma integral para la administración de citas,
            pacientes y profesionales de la salud universitaria.
          </p>

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

        <div className="login__panel-decoration" aria-hidden="true">
          <div className="decoration-circle decoration-circle--1" />
          <div className="decoration-circle decoration-circle--2" />
          <div className="decoration-circle decoration-circle--3" />
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="login__form-panel">
        <div className="login__form-container">

          <div className="login__form-header">
            <h1 className="login__form-title">Iniciar Sesión</h1>
            <p className="login__form-subtitle">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* ── Alerta de error ── */}
          {/* Solo se renderiza si errorMessage tiene valor */}
          {errorMessage && (
            <div className="login__error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="login__form" onSubmit={handleSubmit}>

            {/* Campo documento */}
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
                // Deshabilitamos mientras carga para evitar cambios
                disabled={isLoading}
                required
              />
            </div>

            {/* Campo contraseña */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <div className="form-input-wrapper">
                <input
                  className="form-input form-input--password"
                  id="password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  disabled={isLoading}
                  title={passwordVisible ? 'Ocultar' : 'Mostrar'}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            {/* Se deshabilita mientras carga para evitar doble envío */}
            <button
              type="submit"
              className="btn btn--primary login__submit-btn"
              disabled={isLoading}
            >
              {/* Mostramos spinner o texto según el estado */}
              {isLoading
                ? <><Loader size={18} className="spin" /> Verificando...</>
                : 'Ingresar al Sistema'
              }
            </button>

          </form>

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