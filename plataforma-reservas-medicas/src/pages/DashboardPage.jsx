// DashboardPage.jsx
// El tablero principal del sistema.
// Muestra un resumen de toda la actividad: pacientes, citas, doctores.

import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Users,           // Ícono de múltiples personas
  UserRound,       // Ícono de una persona
  Calendar,        // Ícono de calendario
  CalendarCheck,   // Ícono de calendario con check
  CalendarX,       // Ícono de calendario con X
  TrendingUp,      // Ícono de tendencia positiva
  Clock,           // Ícono de reloj
  AlertCircle,     // Ícono de alerta
  RefreshCw        // Ícono de refrescar
} from 'lucide-react';

import { getPatients } from '../api/patientsApi';
import { getTodayAppointments, getRecentAppointments } from '../api/appointmentsApi';
import { getDoctorProductivity } from '../api/reportsApi';

import './DashboardPage.css';


// ─────────────────────────────────────────────────────────
// COMPONENTE: StatsCard
// ─────────────────────────────────────────────────────────
// Un componente pequeño que vive DENTRO de este archivo.
// Esto es válido cuando el componente es pequeño y solo
// se usa en este archivo. Si lo usáramos en varios lugares,
// lo moveríamos a src/components/common/StatsCard.jsx
//
// Props explicadas:
// - title: el texto descriptivo ("Total Pacientes")
// - value: el número grande a mostrar ("128")
// - icon: el componente de ícono de Lucide
// - color: para variar el color del ícono ("blue", "green", etc.)
// - loading: muestra un skeleton mientras carga
// ─────────────────────────────────────────────────────────
function StatsCard({ title, value, icon: Icon, color, loading, subtitle }) {
  return (
    <div className={`stats-card stats-card--${color}`}>

      {/* Icono en un círculo de color */}
      <div className="stats-card__icon">
        <Icon size={24} />
      </div>

      <div className="stats-card__content">
        <p className="stats-card__title">{title}</p>

        {/* Skeleton: un bloque gris animado mientras carga */}
        {loading ? (
          <div className="stats-card__skeleton" />
        ) : (
          <p className="stats-card__value">{value ?? '—'}</p>
        )}

        {/* Texto secundario opcional debajo del número */}
        {subtitle && <p className="stats-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// COMPONENTE: AppointmentStatusBadge
// Muestra el estado de una cita con color apropiado
// ─────────────────────────────────────────────────────────
function AppointmentStatusBadge({ status }) {

  // Mapeamos cada estado del backend a texto en español + color CSS
  const statusConfig = {
    SCHEDULED: { label: 'Programada', className: 'badge badge--blue' },
    CONFIRMED:  { label: 'Confirmada', className: 'badge badge--green' },
    COMPLETED:  { label: 'Completada', className: 'badge badge--gray' },
    CANCELLED:  { label: 'Cancelada',  className: 'badge badge--red' },
    NO_SHOW:    { label: 'No asistió', className: 'badge badge--orange' },
  };

  const config = statusConfig[status] || { label: status, className: 'badge badge--gray' };

  return <span className={config.className}>{config.label}</span>;
}


// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DashboardPage
// ─────────────────────────────────────────────────────────
function DashboardPage() {

  // ── Estado del dashboard ──────────────────────────────
  // En lugar de un hook personalizado (que haríamos para algo más complejo),
  // usamos useState directamente porque el dashboard es un caso especial:
  // necesita datos de MÚLTIPLES fuentes al mismo tiempo.

  const [stats, setStats] = useState({
    totalPatients: null,
    todayAppointments: null,
    scheduledAppointments: null,
    completedToday: null,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);


  // ── Función para cargar todos los datos del dashboard ──
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Promise.all ejecuta TODAS las peticiones EN PARALELO.
      // Esto es mucho más eficiente que hacerlas una por una:
      //
      //  Una por una:  ──A──► ──B──► ──C──►  (3 segundos si cada una tarda 1s)
      //  En paralelo:  ──A──►
      //                ──B──►  (1 segundo: todas tardan lo mismo que la más lenta)
      //                ──C──►
      //
      const [patientsData, todayData, recentData, productivityData] = await Promise.all([
        getPatients(0, 1),           // Solo necesitamos totalElements, no el contenido
        getTodayAppointments(),       // Citas de hoy
        getRecentAppointments(),      // Las 5 más recientes
        getDoctorProductivity(),      // Ranking de doctores
      ]);

      // Calculamos estadísticas a partir de los datos recibidos
      const todayScheduled = todayData.content?.filter(
        a => a.status === 'SCHEDULED'
      ).length || 0;

      const todayCompleted = todayData.content?.filter(
        a => a.status === 'COMPLETED'
      ).length || 0;

      setStats({
        totalPatients: patientsData.totalElements,
        todayAppointments: todayData.totalElements || 0,
        scheduledAppointments: todayScheduled,
        completedToday: todayCompleted,
      });

      setRecentAppointments(recentData.content || []);

      // Tomamos solo los primeros 5 doctores del ranking
      setTopDoctors(productivityData.slice(0, 5));

      // Guardamos la hora de la última actualización
      setLastUpdated(new Date().toLocaleTimeString('es-CO'));

    } catch (err) {
      setError('No se pudieron cargar los datos del dashboard. Verifica tu conexión.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };


  // Cargar datos cuando el componente se monta por primera vez
  useEffect(() => {
    loadDashboardData();
  }, []); // [] significa "ejecutar solo una vez al montar"


  // ── Formatear fecha para la tabla ─────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // ── Render ────────────────────────────────────────────
  return (
    <MainLayout pageTitle="Dashboard">
      <div className="dashboard">

        {/* ─── ENCABEZADO ─────────────────────────────── */}
        <div className="dashboard__header">
          <div>
            <h2 className="dashboard__title">Resumen del Sistema</h2>
            {lastUpdated && (
              <p className="dashboard__subtitle">
                <Clock size={14} />
                Actualizado a las {lastUpdated}
              </p>
            )}
          </div>

          {/* Botón para recargar los datos manualmente */}
          <button
            className="btn btn--secondary"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>


        {/* ─── MENSAJE DE ERROR ───────────────────────── */}
        {error && (
          <div className="dashboard__error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}


        {/* ─── TARJETAS DE ESTADÍSTICAS ───────────────── */}
        {/*
          Estas 4 tarjetas dan una visión rápida del estado del sistema.
          Son lo primero que ve el usuario al abrir el sistema,
          así que deben ser claras y cargarse rápido.
        */}
        <div className="dashboard__stats">
          <StatsCard
            title="Total Pacientes"
            value={stats.totalPatients}
            icon={Users}
            color="blue"
            loading={loading}
            subtitle="Registrados en el sistema"
          />
          <StatsCard
            title="Citas Hoy"
            value={stats.todayAppointments}
            icon={Calendar}
            color="purple"
            loading={loading}
            subtitle="Programadas para hoy"
          />
          <StatsCard
            title="Pendientes"
            value={stats.scheduledAppointments}
            icon={Clock}
            color="orange"
            loading={loading}
            subtitle="Sin confirmar hoy"
          />
          <StatsCard
            title="Completadas Hoy"
            value={stats.completedToday}
            icon={CalendarCheck}
            color="green"
            loading={loading}
            subtitle="Consultas finalizadas"
          />
        </div>


        {/* ─── SECCIÓN INFERIOR: DOS COLUMNAS ─────────── */}
        <div className="dashboard__bottom">

          {/* Columna izquierda: Citas recientes */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>
                <Calendar size={18} />
                Citas Recientes
              </h3>
            </div>

            {loading ? (
              // Skeleton de la tabla mientras carga
              <div className="table-skeleton">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="table-skeleton__row" />
                ))}
              </div>
            ) : recentAppointments.length === 0 ? (
              // Estado vacío: no hay datos
              <div className="empty-state">
                <Calendar size={40} />
                <p>No hay citas registradas</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Doctor</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>
                          <span className="table__patient-name">
                            {appointment.patient?.fullName || '—'}
                          </span>
                        </td>
                        <td>{appointment.doctor?.fullName || '—'}</td>
                        <td className="table__date">
                          {formatDate(appointment.startAt)}
                        </td>
                        <td>
                          <AppointmentStatusBadge status={appointment.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Columna derecha: Top doctores */}
          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3>
                <TrendingUp size={18} />
                Top Doctores
              </h3>
              <span className="dashboard__card-subtitle">Por citas completadas</span>
            </div>

            {loading ? (
              <div className="table-skeleton">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="table-skeleton__row" />
                ))}
              </div>
            ) : topDoctors.length === 0 ? (
              <div className="empty-state">
                <UserRound size={40} />
                <p>No hay datos de productividad</p>
              </div>
            ) : (
              <div className="doctor-ranking">
                {topDoctors.map((doctor) => (
                  <div key={doctor.doctorId} className="doctor-ranking__item">

                    {/* Posición en el ranking */}
                    <span className={`doctor-ranking__position position--${doctor.rankingPosition}`}>
                      {doctor.rankingPosition}
                    </span>

                    {/* Avatar con inicial del nombre */}
                    <div className="doctor-ranking__avatar">
                      {doctor.doctorFullName?.charAt(0) || 'D'}
                    </div>

                    {/* Nombre del doctor */}
                    <div className="doctor-ranking__info">
                      <p className="doctor-ranking__name">{doctor.doctorFullName}</p>
                    </div>

                    {/* Número de citas completadas */}
                    <div className="doctor-ranking__stats">
                      <span className="doctor-ranking__count">
                        {doctor.completedAppointments}
                      </span>
                      <span className="doctor-ranking__label">citas</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;