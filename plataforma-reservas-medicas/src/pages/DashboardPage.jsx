// DashboardPage.jsx
// Dashboard adaptado por rol:
//
//   ADMIN       → ve todo: pacientes, citas del día y ranking de doctores
//   COORDINATOR → solo ve el ranking de productividad (su función central)
//
// Usa Promise.allSettled para que un 403 parcial no rompa todo el dashboard.
// Cada sección solo se renderiza si el rol tiene permiso para verla.

import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Users, UserRound, Calendar, CalendarCheck,
  TrendingUp, Clock, AlertCircle, RefreshCw,
} from 'lucide-react';

import { getPatients } from '../api/patientsApi';
import { getTodayAppointments, getRecentAppointments } from '../api/appointmentsApi';
import { getDoctorProductivity } from '../api/reportsApi';

import './DashboardPage.css';


// ─────────────────────────────────────────────────────────
// HELPERS DE ROL
// Lee los roles del JWT almacenado en localStorage.
// Ajusta la clave ('roles') según cómo los guardés en tu AuthContext.
// ─────────────────────────────────────────────────────────
function getRoles() {
  try {
    const raw = localStorage.getItem('roles');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const isAdmin       = (roles) => roles.includes('ROLE_ADMIN');
const isCoordinator = (roles) => roles.includes('ROLE_COORDINATOR');

// ADMIN ve pacientes y citas; COORDINATOR no tiene esos endpoints
const canSeeOperations = (roles) => isAdmin(roles);
// Ambos roles pueden ver el ranking de reportes
const canSeeReports    = (roles) => isAdmin(roles) || isCoordinator(roles);


// ─────────────────────────────────────────────────────────
// COMPONENTE: StatsCard
// ─────────────────────────────────────────────────────────
function StatsCard({ title, value, icon: Icon, color, loading, subtitle }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card__icon">
        <Icon size={24} />
      </div>
      <div className="stats-card__content">
        <p className="stats-card__title">{title}</p>
        {loading
          ? <div className="stats-card__skeleton" />
          : <p className="stats-card__value">{value ?? '—'}</p>
        }
        {subtitle && <p className="stats-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// COMPONENTE: AppointmentStatusBadge
// ─────────────────────────────────────────────────────────
function AppointmentStatusBadge({ status }) {
  const MAP = {
    SCHEDULED: { label: 'Programada', className: 'badge badge--blue'   },
    CONFIRMED: { label: 'Confirmada', className: 'badge badge--green'  },
    COMPLETED: { label: 'Completada', className: 'badge badge--gray'   },
    CANCELLED: { label: 'Cancelada',  className: 'badge badge--red'    },
    NO_SHOW:   { label: 'No asistió', className: 'badge badge--orange' },
  };
  const config = MAP[status] || { label: status, className: 'badge badge--gray' };
  return <span className={config.className}>{config.label}</span>;
}


// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DashboardPage
// ─────────────────────────────────────────────────────────
function DashboardPage() {

  const roles = getRoles();

  const [stats, setStats] = useState({
    totalPatients: null,
    todayAppointments: null,
    scheduledAppointments: null,
    completedToday: null,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topDoctors,         setTopDoctors]         = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [lastUpdated,        setLastUpdated]        = useState(null);


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construimos solo las promesas que el rol puede resolver.
      // allSettled garantiza que un 403 parcial no aborta el resto.
      const promises = [];
      const keys     = [];

      if (canSeeOperations(roles)) {
        promises.push(getPatients(0, 1));
        promises.push(getTodayAppointments());
        promises.push(getRecentAppointments());
        keys.push('patients', 'today', 'recent');
      }

      if (canSeeReports(roles)) {
        promises.push(getDoctorProductivity());
        keys.push('productivity');
      }

      const results = await Promise.allSettled(promises);

      // Mapeamos cada resultado a su clave
      const data = {};
      keys.forEach((key, i) => {
        if (results[i].status === 'fulfilled') {
          data[key] = results[i].value;
        } else {
          console.warn(`Dashboard: fallo al cargar '${key}'`, results[i].reason);
          data[key] = null;
        }
      });

      // Estadísticas operacionales (solo ADMIN)
      if (canSeeOperations(roles)) {
        const todayContent = data.today?.content ?? [];
        setStats({
          totalPatients:         data.patients?.totalElements ?? null,
          todayAppointments:     data.today?.totalElements    ?? null,
          scheduledAppointments: todayContent.filter(a => a.status === 'SCHEDULED').length || null,
          completedToday:        todayContent.filter(a => a.status === 'COMPLETED').length || null,
        });
        setRecentAppointments(data.recent?.content ?? []);
      }

      // Ranking de productividad (ADMIN y COORDINATOR)
      if (canSeeReports(roles)) {
        setTopDoctors((data.productivity ?? []).slice(0, 5));
      }

      setLastUpdated(new Date().toLocaleTimeString('es-CO'));

    } catch (err) {
      setError('No se pudieron cargar los datos del dashboard.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };


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
          <button
            className="btn btn--secondary"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {/* ─── ERROR GLOBAL ────────────────────────────── */}
        {error && (
          <div className="dashboard__error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* ─── TARJETAS DE ESTADÍSTICAS (solo ADMIN) ──── */}
        {canSeeOperations(roles) && (
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
        )}

        {/* ─── SECCIÓN INFERIOR ────────────────────────── */}
        <div className="dashboard__bottom">

          {/* Citas recientes — solo ADMIN */}
          {canSeeOperations(roles) && (
            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3><Calendar size={18} />Citas Recientes</h3>
              </div>

              {loading ? (
                <div className="table-skeleton">
                  {[1,2,3,4,5].map(i => <div key={i} className="table-skeleton__row" />)}
                </div>
              ) : recentAppointments.length === 0 ? (
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
                      {recentAppointments.map(a => (
                        <tr key={a.id}>
                          <td>
                            <span className="table__patient-name">
                              {a.patient?.fullName || '—'}
                            </span>
                          </td>
                          <td>{a.doctor?.fullName || '—'}</td>
                          <td className="table__date">{formatDate(a.startAt)}</td>
                          <td><AppointmentStatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Ranking de doctores — ADMIN y COORDINATOR */}
          {canSeeReports(roles) && (
            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3><TrendingUp size={18} />Top Doctores</h3>
                <span className="dashboard__card-subtitle">Por citas completadas</span>
              </div>

              {loading ? (
                <div className="table-skeleton">
                  {[1,2,3,4,5].map(i => <div key={i} className="table-skeleton__row" />)}
                </div>
              ) : topDoctors.length === 0 ? (
                <div className="empty-state">
                  <UserRound size={40} />
                  <p>No hay datos de productividad</p>
                </div>
              ) : (
                <div className="doctor-ranking">
                  {topDoctors.map(doctor => (
                    <div key={doctor.doctorId} className="doctor-ranking__item">
                      <span className={`doctor-ranking__position position--${doctor.rankingPosition}`}>
                        {doctor.rankingPosition}
                      </span>
                      <div className="doctor-ranking__avatar">
                        {doctor.doctorFullName?.charAt(0) || 'D'}
                      </div>
                      <div className="doctor-ranking__info">
                        <p className="doctor-ranking__name">{doctor.doctorFullName}</p>
                      </div>
                      <div className="doctor-ranking__stats">
                        <span className="doctor-ranking__count">{doctor.completedAppointments}</span>
                        <span className="doctor-ranking__label">citas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;