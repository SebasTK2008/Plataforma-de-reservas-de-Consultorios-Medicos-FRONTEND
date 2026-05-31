// AvailabilityPage.jsx
//
// PROPÓSITO:
// Permite consultar los horarios disponibles de cualquier doctor,
// filtrando por especialidad, tipo de cita y fecha.
//
// FLUJO DE USO:
//   1. Filtrar por especialidad (opcional) → reduce la lista de doctores
//   2. Seleccionar un doctor (obligatorio)
//   3. Seleccionar tipo de cita (opcional pero recomendado)
//      → Si se elige, los slots se filtran por duración del tipo
//      → Si no se elige, se muestran todos los huecos libres
//   4. Elegir fecha (obligatorio)
//   5. Clic en "Buscar disponibilidad"
//   6. Se muestran los slots en chips de horario
//
// ARCHIVOS QUE CONSUME:
//   ../hooks/useAvailability
//   ../components/layout/MainLayout

import { useState } from 'react';
import {
  CalendarDays, Search, Clock, Stethoscope,
  UserRound, ClipboardList, AlertCircle,
  Loader, ChevronDown, CalendarCheck,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAvailability } from '../hooks/useAvailability';
import './AvailabilityPage.css';


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: FilterSelect
// Select estilizado con ícono y label integrados.
// Reutilizable para los cuatro selectores de la página.
// ════════════════════════════════════════════════════════════════
function FilterSelect({ id, label, icon: Icon, value, onChange, disabled, placeholder, children }) {
  return (
    <div className="avail-filter-group">
      <label htmlFor={id} className="avail-filter-label">
        {Icon && <Icon size={13} />}
        {label}
      </label>
      <div className="avail-select-wrap">
        <select
          id={id}
          className="avail-select"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={14} className="avail-select-arrow" />
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: DoctorCard
// Muestra la información del doctor seleccionado como resumen
// visual antes de ver los resultados.
// ════════════════════════════════════════════════════════════════
function DoctorCard({ doctor, typeInfo }) {
  if (!doctor) return null;

  return (
    <div className="doctor-card">
      <div className="doctor-card__avatar">
        {doctor.fullName?.charAt(0).toUpperCase() ?? '?'}
      </div>
      <div className="doctor-card__info">
        <span className="doctor-card__name">{doctor.fullName}</span>
        {doctor.specialty && (
          <span className="doctor-card__specialty">
            <Stethoscope size={11} />
            {doctor.specialty.name}
          </span>
        )}
      </div>
      {typeInfo && (
        <div className="doctor-card__type">
          <Clock size={12} />
          <span>{typeInfo.name} · {typeInfo.durationMinutes} min</span>
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: SlotGrid
// Cuadrícula de chips de horario disponible.
// Cada chip muestra el intervalo HH:mm – HH:mm.
// ════════════════════════════════════════════════════════════════
function SlotGrid({ slots, fmt }) {
  return (
    <div className="slot-grid">
      {slots.map((slot, i) => (
        <div key={i} className="slot-chip">
          <Clock size={12} className="slot-chip__icon" />
          <span>{fmt(slot.slotStart)} – {fmt(slot.slotEnd)}</span>
        </div>
      ))}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: SlotSkeleton
// Skeleton de carga mientras se consultan los slots
// ════════════════════════════════════════════════════════════════
function SlotSkeleton() {
  return (
    <div className="slot-skeleton">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="slot-skeleton__chip" />
      ))}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: AvailabilityPage
// ════════════════════════════════════════════════════════════════
function AvailabilityPage() {

  const {
    specialties, filteredDoctors, appointmentTypes,
    loadingStatics, staticsError,
    selectedSpecialty, selectedDoctor, selectedType, selectedDate,
    handleSpecialtyChange, handleDoctorChange, handleTypeChange, handleDateChange,
    slots, loading, error, searched,
    search,
    selectedDoctorInfo, selectedTypeInfo,
    fmt,
  } = useAvailability();

  // Fecha mínima: hoy
  function toLocalDateStr(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  const todayStr = toLocalDateStr(new Date());

  // Validación client-side: doctor y fecha son obligatorios para buscar
  const canSearch = selectedDoctor && selectedDate && !loading;

  // Texto legible de la fecha seleccionada
  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <MainLayout pageTitle="Disponibilidad">
      <div className="availability-page">

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Consulta de Disponibilidad</h2>
            <p className="page-header__subtitle">
              Busca horarios libres filtrando por especialidad, doctor y tipo de cita.
            </p>
          </div>
          <div className="avail-header-icon">
            <CalendarCheck size={30} />
          </div>
        </div>

        {/* ── Error de carga de datos estáticos ───────────── */}
        {staticsError && (
          <div className="alert alert--error">
            <AlertCircle size={16} />
            <span>{staticsError}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            PANEL DE FILTROS
            Cuatro controles: especialidad, doctor, tipo, fecha
            + botón de búsqueda.

            Orden de llenado guiado:
            1. Especialidad (reduce el listado de doctores)
            2. Doctor (obligatorio)
            3. Tipo de cita (opcional pero mejora la búsqueda)
            4. Fecha (obligatoria)
        ══════════════════════════════════════════════════ */}
        <div className="avail-filter-card">
          <p className="avail-filter-card__title">
            <Search size={15} /> Parámetros de búsqueda
          </p>

          {loadingStatics ? (
            /* Skeleton de los selects mientras cargan los datos */
            <div className="avail-filter-skeleton">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="avail-filter-skeleton__item">
                  <div className="sk sk--sm" style={{ marginBottom: 6 }} />
                  <div className="sk" style={{ height: 42, width: '100%', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="avail-filters-grid">

              {/* 1. Especialidad */}
              <FilterSelect
                id="av-specialty"
                label="Especialidad"
                icon={Stethoscope}
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                placeholder="Todas las especialidades"
              >
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </FilterSelect>

              {/* 2. Doctor */}
              <FilterSelect
                id="av-doctor"
                label="Doctor *"
                icon={UserRound}
                value={selectedDoctor}
                onChange={handleDoctorChange}
                placeholder="— Selecciona un doctor —"
              >
                {filteredDoctors.length === 0 ? (
                  <option disabled value="">No hay doctores para esta especialidad</option>
                ) : (
                  filteredDoctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}{d.specialty ? ` · ${d.specialty.name}` : ''}
                    </option>
                  ))
                )}
              </FilterSelect>

              {/* 3. Tipo de cita */}
              <FilterSelect
                id="av-type"
                label="Tipo de Cita"
                icon={ClipboardList}
                value={selectedType}
                onChange={handleTypeChange}
                placeholder="Cualquier tipo (sin filtrar)"
              >
                {appointmentTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.durationMinutes} min
                  </option>
                ))}
              </FilterSelect>

              {/* 4. Fecha */}
              <div className="avail-filter-group">
                <label htmlFor="av-date" className="avail-filter-label">
                  <CalendarDays size={13} /> Fecha *
                </label>
                <input
                  id="av-date"
                  type="date"
                  className="avail-date-input"
                  value={selectedDate}
                  min={todayStr}
                  onChange={e => handleDateChange(e.target.value)}
                />
              </div>

            </div>
          )}

          {/* Botón de búsqueda + hint de campos obligatorios */}
          <div className="avail-filter-footer">
            <p className="avail-filter-hint">
              * Doctor y fecha son obligatorios. El tipo de cita es opcional.
            </p>
            <button
              className="btn btn--primary avail-search-btn"
              onClick={search}
              disabled={!canSearch}
            >
              {loading
                ? <><Loader size={16} className="spin" /> Buscando...</>
                : <><Search size={16} /> Buscar disponibilidad</>
              }
            </button>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════
            ÁREA DE RESULTADOS
            Se muestra solo después de la primera búsqueda
            o mientras carga.
        ══════════════════════════════════════════════════ */}
        {(searched || loading) && (
          <div className="avail-results-card">

            {/* Encabezado del resultado: doctor + fecha */}
            <div className="avail-results-header">
              <DoctorCard doctor={selectedDoctorInfo} typeInfo={selectedTypeInfo} />
              {dateLabel && (
                <p className="avail-results-date">
                  <CalendarDays size={14} />
                  <span style={{ textTransform: 'capitalize' }}>{dateLabel}</span>
                </p>
              )}
            </div>

            <div className="avail-results-body">

              {/* Cargando */}
              {loading && <SlotSkeleton />}

              {/* Error */}
              {!loading && error && (
                <div className="avail-results-error">
                  <AlertCircle size={22} />
                  <p>{error}</p>
                </div>
              )}

              {/* Sin slots */}
              {!loading && !error && searched && slots.length === 0 && (
                <div className="avail-results-empty">
                  <Clock size={36} />
                  <h4>Sin horarios disponibles</h4>
                  <p>
                    El doctor no tiene huecos libres para este día.
                    {selectedTypeInfo && ' Prueba con otro tipo de cita o fecha.'}
                  </p>
                </div>
              )}

              {/* Slots disponibles */}
              {!loading && !error && slots.length > 0 && (
                <div className="avail-slots-section">
                  <p className="avail-slots-count">
                    <span className="avail-slots-count__number">{slots.length}</span>
                    {' '}horario{slots.length !== 1 ? 's' : ''} disponible{slots.length !== 1 ? 's' : ''}
                    {selectedTypeInfo && (
                      <span className="avail-slots-count__sub">
                        · bloques de {selectedTypeInfo.durationMinutes} min
                      </span>
                    )}
                  </p>
                  <SlotGrid slots={slots} fmt={fmt} />
                </div>
              )}

            </div>
          </div>
        )}

        {/* Estado inicial: no se ha buscado nada */}
        {!searched && !loading && (
          <div className="avail-initial-state">
            <CalendarCheck size={48} />
            <h3>Consulta horarios libres</h3>
            <p>
              Selecciona un doctor y una fecha para ver los horarios disponibles.<br />
              Agrega un tipo de cita para ver solo los slots que se ajusten a su duración.
            </p>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default AvailabilityPage;