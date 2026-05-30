// DashboardPage.jsx
// Dashboard adaptado por rol:
//
//   ADMIN       → ve todo: pacientes, citas del día y ranking de doctores
//   COORDINATOR → solo ve el ranking de productividad (su función central)

import { useEffect, useMemo } from 'react';
import MainLayout from '../components/layout/MainLayout';
import {
  Users, UserRound, Calendar, CalendarCheck,
  TrendingUp, Clock, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardData, canSeeOperations, canSeeReports } from '../hooks/useDashboardData';
import StatusBadge from '../common/StatusBadge';
import StatCard from '../common/StatCard';
import EmptyState from '../common/EmptyState';
import './DashboardPage.css';

function formatDate(dateString) {
  if (!dateString) return '—';

  return new Date(dateString).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DashboardPage() {
  const { user } = useAuth();
  const roles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const {
    stats,
    recentAppointments,
    topDoctors,
    loading,
    error,
    lastUpdated,
    loadDashboardData,
  } = useDashboardData(roles);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <MainLayout pageTitle="Dashboard">
      <div className="dashboard">
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

        {error && (
          <div className="dashboard__error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {canSeeOperations(roles) && (
          <div className="dashboard__stats">
            <StatCard
              title="Total Pacientes"
              value={stats.totalPatients}
              icon={Users}
              variant="blue"
              loading={loading}
              subtitle="Registrados en el sistema"
            />
            <StatCard
              title="Citas Hoy"
              value={stats.todayAppointments}
              icon={Calendar}
              variant="purple"
              loading={loading}
              subtitle="Programadas para hoy"
            />
            <StatCard
              title="Pendientes"
              value={stats.scheduledAppointments}
              icon={Clock}
              variant="orange"
              loading={loading}
              subtitle="Sin confirmar hoy"
            />
            <StatCard
              title="Completadas Hoy"
              value={stats.completedToday}
              icon={CalendarCheck}
              variant="green"
              loading={loading}
              subtitle="Consultas finalizadas"
            />
          </div>
        )}

        <div className="dashboard__bottom">
          {canSeeOperations(roles) && (
            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3><Calendar size={18} />Citas Recientes</h3>
              </div>

              {loading ? (
                <div className="table-skeleton">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="table-skeleton__row" />
                  ))}
                </div>
              ) : recentAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Sin citas recientes"
                  description="No hay citas registradas"
                />
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
                      {recentAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <span className="table__patient-name">
                              {appointment.patient?.fullName ?? '—'}
                            </span>
                          </td>
                          <td>{appointment.doctor?.fullName ?? '—'}</td>
                          <td className="table__date">{formatDate(appointment.startAt)}</td>
                          <td><StatusBadge status={appointment.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {canSeeReports(roles) && (
            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3><TrendingUp size={18} />Top Doctores</h3>
                <span className="dashboard__card-subtitle">Por citas completadas</span>
              </div>

              {loading ? (
                <div className="table-skeleton">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="table-skeleton__row" />
                  ))}
                </div>
              ) : topDoctors.length === 0 ? (
                <EmptyState
                  icon={UserRound}
                  title="Sin datos de productividad"
                  description="No hay datos de productividad disponibles"
                />
              ) : (
                <div className="doctor-ranking">
                  {topDoctors.map((doctor) => (
                    <div key={doctor.doctorId} className="doctor-ranking__item">
                      <span className={`doctor-ranking__position position--${doctor.rankingPosition}`}>
                        {doctor.rankingPosition}
                      </span>
                      <div className="doctor-ranking__avatar">
                        {doctor.doctorFullName?.charAt(0) ?? 'D'}
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
