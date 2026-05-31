// ReportsPage.jsx
//
// ESTRUCTURA DE LA PÁGINA:
//
// 1. FILTRO DE FECHAS (from / to)
//    Un selector de rango. Los reportes de ocupación y no-shows requieren
//    estas fechas. El de productividad no las necesita pero se ejecuta
//    junto a los demás por consistencia UX.
//    Al hacer clic en "Generar Reporte" se ejecutan los tres en paralelo.
//
// 2. SECCIÓN A: Productividad de Doctores
//    Tabla con ranking: posición, nombre, citas completadas.
//    No requiere filtro de fecha (muestra todo el histórico).
//
// 3. SECCIÓN B: Ocupación de Consultorios
//    Tabla con: consultorio, ubicación, sala, total citas, minutos ocupados,
//    no-shows en ese consultorio.
//    Requiere from/to.
//
// 4. SECCIÓN C: Pacientes con Inasistencias (No-Show)
//    Tabla con: paciente, total no-shows en el período.
//    Requiere from/to.
//
// ¿POR QUÉ UN SOLO BOTÓN "Generar Reporte" Y NO TRES SEPARADOS?
// Porque en la mayoría de los casos el usuario quiere ver los tres reportes
// para el mismo período. Un solo botón reduce fricción. Si un reporte
// falla, los otros igual se muestran (gracias a Promise.allSettled en el hook).
//
// ARCHIVO EN LA ESTRUCTURA DEL PROYECTO:
//   src/pages/ReportsPage.jsx
//   src/pages/ReportsPage.css
//
// DEPENDENCIAS:
//   ../hooks/useReports          ← el hook que acabamos de crear
//   ../components/layout/MainLayout
//   lucide-react                 ← íconos

import { useState } from 'react';
import {
  BarChart3, Users, Building2, AlertTriangle,
  Calendar, RefreshCw, Loader, AlertCircle,
  TrendingUp, Trophy, Clock, Activity,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useReports } from '../hooks/useReports';
import './ReportsPage.css';


// ════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════

// Formatea minutos a "Xh Ym" — más legible que solo "492 minutos"
function formatMinutes(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Obtiene hoy en formato YYYY-MM-DD para el input type="date"
function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Obtiene el primer día del mes actual en formato YYYY-MM-DD
// Se usa como valor por defecto del "desde"
function firstOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: ReportSectionHeader
// Encabezado consistente para cada sección del reporte
// ════════════════════════════════════════════════════════════════
function ReportSectionHeader({ icon: Icon, title, count, loading, color }) {
  return (
    <div className="report-section__header">
      <div className={`report-section__icon report-section__icon--${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <h3 className="report-section__title">{title}</h3>
        {!loading && count !== undefined && (
          <span className="report-section__count">
            {count} resultado{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: ReportError
// Muestra un error de un reporte individual
// ════════════════════════════════════════════════════════════════
function ReportError({ message }) {
  return (
    <div className="report-error">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: ReportEmpty
// Estado vacío cuando un reporte no tiene datos
// ════════════════════════════════════════════════════════════════
function ReportEmpty({ message = 'No hay datos para el período seleccionado.' }) {
  return (
    <div className="report-empty">
      <Activity size={28} />
      <p>{message}</p>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: TableSkeleton
// Skeleton de carga para las tablas de reportes
// ════════════════════════════════════════════════════════════════
function TableSkeleton({ cols = 4, rows = 5 }) {
  return (
    <div className="report-skeleton">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="report-skeleton__row">
          {Array.from({ length: cols }, (_, j) => (
            <div
              key={j}
              className={`sk sk--rpt ${j === 0 ? 'sk--rpt-sm' : j === 1 ? 'sk--rpt-lg' : 'sk--rpt-md'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SECCIÓN A: Productividad de Doctores
// GET /api/reports/doctor-productivity
// DoctorProductivityResponse: { rankingPosition, doctorId, doctorFullName, completedAppointments }
// ════════════════════════════════════════════════════════════════
function DoctorProductivitySection({ data, loading, error }) {

  // Medalla según posición en el ranking
  const rankBadge = (pos) => {
    if (pos === 1) return <span className="rank-medal rank-medal--gold">🥇 1°</span>;
    if (pos === 2) return <span className="rank-medal rank-medal--silver">🥈 2°</span>;
    if (pos === 3) return <span className="rank-medal rank-medal--bronze">🥉 3°</span>;
    return <span className="rank-number">{pos}°</span>;
  };

  // Barra de progreso relativa al máximo
  // Ayuda a visualizar la diferencia entre doctores de un vistazo
  const maxCompleted = data.length > 0
    ? Math.max(...data.map(d => d.completedAppointments))
    : 1;

  return (
    <div className="report-section">
      <ReportSectionHeader
        icon={Trophy}
        title="Productividad de Doctores"
        count={loading ? undefined : data.length}
        loading={loading}
        color="gold"
      />
      <p className="report-section__desc">
        Ranking de doctores ordenado por cantidad de citas completadas en todo el histórico.
      </p>

      {error && <ReportError message={error} />}

      {loading && <TableSkeleton cols={3} rows={5} />}

      {!loading && !error && data.length === 0 && (
        <ReportEmpty message="No hay datos de productividad registrados aún." />
      )}

      {!loading && !error && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Doctor</th>
                <th>Citas completadas</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.doctorId}>
                  <td style={{ width: 64 }}>
                    {rankBadge(row.rankingPosition)}
                  </td>
                  <td>
                    <div className="doctor-cell">
                      <div className="doctor-cell__avatar doctor-cell__avatar--report">
                        {row.doctorFullName?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <span className="doctor-cell__name">{row.doctorFullName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <span className="progress-cell__number">{row.completedAppointments}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill progress-bar__fill--green"
                          style={{ width: `${(row.completedAppointments / maxCompleted) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SECCIÓN B: Ocupación de Consultorios
// GET /api/reports/office-occupancy?from=&to=
// OfficeOccupancyResponse:
//   { officeId, officeName, officeLocation, roomNumber,
//     appointmentCount, minutesOccupied, noShowCount }
// ════════════════════════════════════════════════════════════════
function OfficeOccupancySection({ data, loading, error }) {

  const maxAppointments = data.length > 0
    ? Math.max(...data.map(d => d.appointmentCount))
    : 1;

  return (
    <div className="report-section">
      <ReportSectionHeader
        icon={Building2}
        title="Ocupación de Consultorios"
        count={loading ? undefined : data.length}
        loading={loading}
        color="blue"
      />
      <p className="report-section__desc">
        Total de citas agendadas, tiempo ocupado e inasistencias por consultorio en el período.
      </p>

      {error && <ReportError message={error} />}

      {loading && <TableSkeleton cols={5} rows={5} />}

      {!loading && !error && data.length === 0 && (
        <ReportEmpty />
      )}

      {!loading && !error && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Consultorio</th>
                <th>Sala</th>
                <th>Citas</th>
                <th>Tiempo ocupado</th>
                <th>No-shows</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.officeId}>
                  <td>
                    <div>
                      <span className="fw-medium">{row.officeName}</span>
                      <br />
                      <span className="td--muted">{row.officeLocation}</span>
                    </div>
                  </td>
                  <td className="td--muted">#{row.roomNumber}</td>
                  <td>
                    <div className="progress-cell">
                      <span className="progress-cell__number">{row.appointmentCount}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill progress-bar__fill--blue"
                          style={{ width: `${(row.appointmentCount / maxAppointments) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="time-cell">
                      <Clock size={13} />
                      <span>{formatMinutes(row.minutesOccupied)}</span>
                    </div>
                  </td>
                  <td>
                    {row.noShowCount > 0 ? (
                      <span className="noshow-badge">{row.noShowCount}</span>
                    ) : (
                      <span className="td--muted">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SECCIÓN C: Pacientes con Inasistencias
// GET /api/reports/no-show-patients?from=&to=
// NoShowPatientResponse: { patientId, patientFullName, totalNoShows }
// ════════════════════════════════════════════════════════════════
function NoShowPatientsSection({ data, loading, error }) {

  // Colores de severidad según cantidad de no-shows
  // Ayuda a identificar de un vistazo quiénes son los casos más críticos
  const severityClass = (count) => {
    if (count >= 5) return 'noshow-severity--high';
    if (count >= 3) return 'noshow-severity--mid';
    return 'noshow-severity--low';
  };

  return (
    <div className="report-section">
      <ReportSectionHeader
        icon={AlertTriangle}
        title="Pacientes con Inasistencias"
        count={loading ? undefined : data.length}
        loading={loading}
        color="orange"
      />
      <p className="report-section__desc">
        Pacientes que no se presentaron a sus citas (No-Show) en el período seleccionado, ordenados por frecuencia.
      </p>

      {error && <ReportError message={error} />}

      {loading && <TableSkeleton cols={2} rows={5} />}

      {!loading && !error && data.length === 0 && (
        <ReportEmpty message="No se registraron inasistencias en el período seleccionado. ¡Buenas noticias!" />
      )}

      {!loading && !error && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Total no-shows</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.patientId}>
                  <td className="td--muted" style={{ width: 48 }}>{idx + 1}</td>
                  <td>
                    <div className="doctor-cell">
                      <div className="doctor-cell__avatar doctor-cell__avatar--patient">
                        {row.patientFullName?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <span className="doctor-cell__name">{row.patientFullName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`noshow-severity ${severityClass(row.totalNoShows)}`}>
                      {row.totalNoShows} inasistencia{row.totalNoShows !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: ReportsPage
// ════════════════════════════════════════════════════════════════
function ReportsPage() {

  // Rango de fechas — por defecto: desde el 1ro del mes hasta hoy
  const [fromDate, setFromDate] = useState(firstOfMonthStr());
  const [toDate,   setToDate]   = useState(todayStr());

  // Error de validación de fechas (client-side)
  const [dateError, setDateError] = useState(null);

  // ¿Se ha hecho al menos una consulta? Para mostrar estado inicial
  const [hasSearched, setHasSearched] = useState(false);

  const {
    occupancy, occupancyLoading, occupancyError,
    productivity, productivityLoading, productivityError,
    noShows, noShowsLoading, noShowsError,
    fetchAll,
  } = useReports();

  // ¿Alguno está cargando?
  const anyLoading = occupancyLoading || productivityLoading || noShowsLoading;

  const handleGenerate = async () => {
    // Validación client-side
    if (!fromDate || !toDate) {
      setDateError('Las fechas de inicio y fin son requeridas.');
      return;
    }
    if (fromDate > toDate) {
      setDateError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    setDateError(null);
    setHasSearched(true);
    await fetchAll(fromDate, toDate);
  };

  return (
    <MainLayout pageTitle="Reportes">
      <div className="reports-page">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Reportes y Estadísticas</h2>
            <p className="page-header__subtitle">
              Analiza la productividad, ocupación e inasistencias del sistema.
            </p>
          </div>
          <div className="page-header__icon-wrap">
            <BarChart3 size={32} />
          </div>
        </div>

        {/* ── Filtro de fechas ─────────────────────────────── */}
        <div className="filter-card">
          <p className="filter-card__label">
            <Calendar size={15} /> Período del reporte
          </p>

          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="r-from">Desde</label>
              <input
                id="r-from"
                type="date"
                className="report-date-input"
                value={fromDate}
                max={toDate || todayStr()}
                onChange={e => {
                  setFromDate(e.target.value);
                  setDateError(null);
                }}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="r-to">Hasta</label>
              <input
                id="r-to"
                type="date"
                className="report-date-input"
                value={toDate}
                min={fromDate}
                max={todayStr()}
                onChange={e => {
                  setToDate(e.target.value);
                  setDateError(null);
                }}
              />
            </div>

            <button
              className="btn btn--primary"
              onClick={handleGenerate}
              disabled={anyLoading}
            >
              {anyLoading
                ? <><Loader size={16} className="spin" /> Generando...</>
                : <><RefreshCw size={16} /> Generar Reporte</>
              }
            </button>
          </div>

          {dateError && (
            <div className="alert alert--error" style={{ marginTop: 10 }}>
              <AlertCircle size={15} /><span>{dateError}</span>
            </div>
          )}

          <p className="filter-card__hint">
            * La productividad de doctores no depende del período: muestra el histórico completo.
          </p>
        </div>

        {/* ── Estado inicial: no se ha generado nada aún ─── */}
        {!hasSearched && (
          <div className="reports-empty-state">
            <BarChart3 size={48} />
            <h3>Selecciona un período y genera el reporte</h3>
            <p>Los datos de ocupación e inasistencias dependen del rango de fechas elegido.</p>
          </div>
        )}

        {/* ── Secciones de reporte (visibles tras primer fetch) ── */}
        {hasSearched && (
          <div className="reports-sections">

            <DoctorProductivitySection
              data={productivity}
              loading={productivityLoading}
              error={productivityError}
            />

            <OfficeOccupancySection
              data={occupancy}
              loading={occupancyLoading}
              error={occupancyError}
            />

            <NoShowPatientsSection
              data={noShows}
              loading={noShowsLoading}
              error={noShowsError}
            />

          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default ReportsPage;