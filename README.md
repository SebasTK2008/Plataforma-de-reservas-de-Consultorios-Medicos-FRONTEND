# UMARS — Plataforma de Reservas Médicas
## README Técnico

> **Versión:** 1.0.0  
> **Stack:** Spring Boot 3 · Java 21 · React 18 · Vite · PostgreSQL  
> **Autor del proyecto:** githubzs

---

## Tabla de Contenidos

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Arquitectura General](#2-arquitectura-general)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Modelo de Dominio](#4-modelo-de-dominio)
5. [Reglas de Negocio](#5-reglas-de-negocio)
6. [Decisiones de Diseño](#6-decisiones-de-diseño)
7. [Seguridad y Autenticación](#7-seguridad-y-autenticación)
8. [API REST — Resumen de Endpoints](#8-api-rest--resumen-de-endpoints)
9. [Cómo Ejecutar el Proyecto](#9-cómo-ejecutar-el-proyecto)
10. [Variables de Entorno](#10-variables-de-entorno)
11. [Pruebas Manuales con Bruno / Postman](#11-pruebas-manuales-con-bruno--postman)
12. [Consideraciones y Deuda Técnica](#12-consideraciones-y-deuda-técnica)

---

## 1. Resumen del Sistema

UMARS es una plataforma de gestión de consultorios médicos universitarios. Permite administrar el ciclo completo de una atención médica: desde el registro de pacientes y doctores hasta el agendamiento, confirmación, completado o cancelación de citas.

### Actores del sistema

| Rol | Descripción |
|-----|-------------|
| `ROLE_ADMIN` | Control total. Puede crear usuarios, doctores, pacientes, consultorios, especialidades, tipos de cita y horarios. |
| `ROLE_STAFF` | Personal administrativo. Puede agendar y gestionar citas (confirmar / cancelar). No puede crear usuarios ni modificar entidades base. |
| `ROLE_DOCTOR` | Médico. Solo puede ver y completar sus propias citas (`/api/appointments/mine`). |
| `ROLE_COORDINATOR` | Coordinador. Solo tiene acceso de lectura al dashboard y a los reportes de gestión. |

---

## 2. Arquitectura General

```
┌───────────────────────────────────────────────┐
│               Frontend (React + Vite)          │
│  src/                                          │
│  ├── api/          ← Capa HTTP (axios)         │
│  ├── hooks/        ← Lógica y estado           │
│  ├── pages/        ← Presentación              │
│  └── context/      ← Estado global (Auth)      │
└─────────────────────┬─────────────────────────┘
                       │ HTTP/JSON
┌─────────────────────▼─────────────────────────┐
│             Backend (Spring Boot 3)            │
│  ┌──────────────────────────────────────────┐  │
│  │  Controllers  (API layer)                │  │
│  ├──────────────────────────────────────────┤  │
│  │  Services     (Business logic)           │  │
│  ├──────────────────────────────────────────┤  │
│  │  Validators   (Domain rules)             │  │
│  ├──────────────────────────────────────────┤  │
│  │  Mappers      (MapStruct)                │  │
│  ├──────────────────────────────────────────┤  │
│  │  Repositories (Spring Data JPA)          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────┬─────────────────────────┘
                       │ JPA/JDBC
┌─────────────────────▼─────────────────────────┐
│              PostgreSQL                        │
└────────────────────────────────────────────────┘
```

### Capas del Backend (por paquete)

| Paquete | Responsabilidad |
|---------|-----------------|
| `api/controllers` | Recibe la petición HTTP, delega al servicio, retorna `ResponseEntity`. No contiene lógica de negocio. |
| `api/dto` | Records inmutables de entrada/salida. Validados con Bean Validation (`@NotBlank`, `@Positive`, etc.). |
| `api/error` | `GlobalExceptionHandler` centraliza todos los errores en un formato `ApiError` homogéneo. |
| `services` | Interfaces que definen el contrato. |
| `services/impl` | Implementaciones con `@Transactional`. Aquí viven todas las reglas de negocio. |
| `services/mapper` | Interfaces de MapStruct. Generan código de mapeo en tiempo de compilación. |
| `services/validator` | `AppointmentValidator` agrupa todas las validaciones de dominio de citas (evita que el servicio quede con 300 líneas). |
| `domine/entities` | Entidades JPA. |
| `domine/repositories` | Interfaces `JpaRepository` con queries derivadas o `@Query` JPQL. |
| `security` | Configuración JWT, filtro de autenticación, manejo de errores 401/403. |

---

## 3. Estructura de Carpetas

```
plataforma_reservas_medicas/
│
├── src/main/java/com/githubzs/plataforma_reservas_medicas/
│   ├── api/
│   │   ├── controllers/        ← AppointmentController, DoctorController, etc.
│   │   ├── dto/                ← AppointmentDtos, DoctorDtos, PatientDtos, etc.
│   │   └── error/              ← GlobalExceptionHandler, ApiError
│   │
│   ├── domine/
│   │   ├── entities/           ← Appointment, Doctor, Patient, Office, etc.
│   │   ├── enums/              ← AppointmentStatus, DoctorStatus, etc.
│   │   ├── repositories/       ← JPA Repositories
│   │   └── dto/                ← DTOs de proyección para queries nativas
│   │
│   ├── services/
│   │   ├── impl/               ← Implementaciones de los servicios
│   │   ├── mapper/             ← MapStruct mappers
│   │   └── validator/          ← AppointmentValidator
│   │
│   ├── security/
│   │   ├── config/             ← SecurityConfig, CorsConfig
│   │   ├── jwt/                ← JwtService, JwtAuthenticationFilter
│   │   ├── web/                ← AuthController (login/register)
│   │   └── domine/             ← AppUser, Role, AppUserRepository
│   │
│   └── exception/              ← Excepciones de dominio personalizadas
│
├── plataforma-reservas-medicas/  ← Frontend React
│   └── src/
│       ├── api/                ← Capa HTTP con axios
│       ├── hooks/              ← Custom hooks (lógica + estado)
│       ├── pages/              ← Componentes de página
│       ├── components/         ← Componentes reutilizables
│       ├── context/            ← AuthContext (JWT + sesión)
│       └── styles/             ← Variables CSS, componentes globales
│
└── README.md
```

---

## 4. Modelo de Dominio

```
Specialty ──< Doctor >── DoctorSchedule
                │
                │ (1 doctor, N citas)
                ▼
            Appointment ──── AppointmentType (duración)
                │
                ├──── Patient
                └──── Office

AppUser (tabla separada de seguridad, sin FK al dominio médico)
```

### Entidades principales

#### `Doctor`
- Tiene `fullName`, `email`, `licenseNumber`, `documentNumber`, `status` (ACTIVE/INACTIVE).
- Se relaciona con exactamente una `Specialty`.
- Puede tener múltiples `DoctorSchedule` (horarios semanales).
- Un doctor inactivo **no puede** recibir citas nuevas.

#### `Patient`
- Tiene `fullName`, `email`, `phoneNumber`, `documentNumber`, `studentCode` (opcional), `status`.
- `status` puede ser: `ACTIVE`, `SUSPENDED`, `INACTIVE`.
- Un paciente no activo **no puede** tener nuevas citas agendadas.

#### `Appointment`
- Vincula `Patient` + `Doctor` + `Office` + `AppointmentType`.
- `startAt` se recibe del cliente; `endAt` se calcula automáticamente (`startAt + durationMinutes`).
- El estado sigue una **máquina de estados** estricta (ver sección 5).

#### `AppointmentType`
- Define el tipo de consulta (ej: "Consulta General", "Psicología").
- Almacena `durationMinutes` (1–480 min). Este valor es **inmutable** una vez creado.

#### `DoctorSchedule`
- Representa un bloque de disponibilidad semanal: `dayOfWeek` + `startTime` + `endTime`.
- No puede solaparse con otro horario del mismo doctor en el mismo día.

#### `Office`
- Consultorio físico con `name`, `location`, `roomNumber`, `status` (AVAILABLE/UNAVAILABLE/MAINTENANCE).
- Solo se puede asignar a una cita si `status == AVAILABLE`.

---

## 5. Reglas de Negocio

### 5.1 Ciclo de Vida de una Cita (Máquina de Estados)

```
SCHEDULED ──► CONFIRMED ──► COMPLETED
     │              │
     └──────────────┴──► CANCELLED
                    └──► NO_SHOW
```

| Transición | Quién puede hacerla | Condición adicional |
|------------|---------------------|---------------------|
| `SCHEDULED → CONFIRMED` | ADMIN, STAFF | — |
| `SCHEDULED → CANCELLED` | ADMIN, STAFF | Requiere `cancelReason` (obligatorio) |
| `CONFIRMED → CANCELLED` | ADMIN, STAFF | Requiere `cancelReason` (obligatorio) |
| `CONFIRMED → COMPLETED` | DOCTOR | `now >= startAt` (no puede completar antes de la hora) |
| `CONFIRMED → NO_SHOW` | ADMIN | `now >= startAt` (no puede marcar antes de la hora) |

**Las transiciones no permitidas lanzan `409 Conflict`.**

### 5.2 Creación de una Cita

Al crear una cita (`POST /api/appointments`) se validan **en orden**:

1. El paciente existe y está `ACTIVE`.
2. El doctor existe y está `ACTIVE`.
3. El consultorio existe y está `AVAILABLE`.
4. El tipo de cita existe.
5. `startAt` no está en el pasado.
6. `endAt = startAt + durationMinutes` es consistente.
7. El rango `[startAt, endAt)` cae **dentro** de un bloque de horario del doctor para ese día de la semana.
8. El doctor **no tiene** otra cita activa que se solape con el rango.
9. El consultorio **no tiene** otra cita activa que se solape con el rango.
10. El paciente **no tiene** otra cita activa que se solape con el rango.

Si cualquiera de estas validaciones falla, la cita **no se crea** y se retorna el error correspondiente.

### 5.3 Horarios de Doctor

- No se puede crear un horario que se solape (parcial o totalmente) con uno existente del mismo doctor en el mismo día.
- `startTime` debe ser estrictamente menor que `endTime`.
- Solo se pueden crear horarios para doctores con `status == ACTIVE`.

### 5.4 Disponibilidad

El algoritmo de disponibilidad (`AvailabilityServiceImpl`):
1. Obtiene los bloques de horario del doctor para el `dayOfWeek` de la fecha consultada.
2. Obtiene las citas activas (no canceladas) del doctor en esa fecha.
3. "Resta" los intervalos ocupados de los bloques libres usando un algoritmo de sweepline.
4. Si se pasa un `appointmentTypeId`, subdivide los huecos libres en bloques de exactamente `durationMinutes`.

> **Limitación conocida:** El algoritmo no considera citas que iniciaron el día anterior y terminan el día consultado (citas que cruzan la medianoche). Esto está documentado con un comentario en el código fuente.

### 5.5 Unicidad

| Campo | Entidad | Tipo de unicidad |
|-------|---------|-----------------|
| `documentNumber` | Doctor, Patient, AppUser | Case-sensitive |
| `email` | Doctor, Patient | Case-insensitive |
| `licenseNumber` | Doctor | Case-sensitive |
| `studentCode` | Patient | Case-insensitive |
| `name` | Specialty, AppointmentType, Office | Case-insensitive |

---

## 6. Decisiones de Diseño

### 6.1 Por qué `AppointmentValidator` como componente separado

`AppointmentServiceImpl.create()` necesita validar 10 condiciones antes de persistir. Si todas vivieran en el servicio, el método tendría más de 100 líneas de validación pura. Se extrajo un `@Component` `AppointmentValidator` que agrupa estas validaciones con nombres de método descriptivos (`validatePatientExistsAndActive`, `validateNoOverlapForDoctor`, etc.). El servicio queda como un orquestador limpio.

### 6.2 Por qué Records Java para los DTOs

Los `record` de Java son inmutables por defecto, tienen `equals`, `hashCode` y `toString` automáticos, y su sintaxis es más concisa que un POJO con Lombok. Son ideales para DTOs que solo transportan datos y no tienen comportamiento.

### 6.3 Por qué MapStruct en lugar de mapeo manual

MapStruct genera código de mapeo en tiempo de compilación (no reflexión en runtime). Es más rápido, más seguro (errores en compilación, no en producción) y más fácil de mantener que convertidores manuales. Los mappers tienen anotaciones `@Mapping(target = "...", ignore = true)` explícitas para documentar qué campos se asignan en el servicio.

### 6.4 Por qué `@BeanMapping(nullValuePropertyMappingStrategy = IGNORE)` en los mappers de actualización

En los endpoints `PATCH`, si el cliente no envía un campo, debe llegar como `null` en el DTO y **no sobrescribir** el valor existente en la entidad. La estrategia `IGNORE` de MapStruct hace exactamente eso: ignora los campos nulos del request y deja intacta la entidad.

### 6.5 Separación de `AppUser` del dominio médico

La tabla `users` (autenticación) está **completamente separada** de `Doctor` y `Patient`. Un doctor del dominio médico no es necesariamente un usuario del sistema, y viceversa. Esta separación evita acoplar la lógica de autenticación con la lógica de negocio.

### 6.6 Por qué `Summary` y `Response` DTOs separados

- `SummaryResponse`: versión ligera sin relaciones anidadas. Se usa en listados paginados para no cargar datos innecesarios (N+1 queries).
- `Response` (completo): incluye relaciones. Se usa solo cuando se consulta un recurso individual o se acaba de crear.

### 6.7 Frontend: Custom Hooks como capa de lógica

Cada página tiene un custom hook (`usePatients`, `useDoctors`, etc.) que encapsula: estado, paginación, llamadas a la API y funciones de mutación. El componente de página solo se ocupa de renderizar. Esto permite testear la lógica independientemente de la UI y reusar el hook en múltiples componentes.

### 6.8 Frontend: Patrón `useEffect([prop, isOpen])` en modales

El estado de los modales (campos del formulario, errores, `saving`) se resetea **cada vez que se abre el modal**, no solo al montar el componente. Esto previene el bug clásico donde `saving = true` queda "pegado" después de un error y el modal aparece bloqueado la próxima vez.

### 6.9 Manejo de errores del backend en el frontend

`AxiosConfig.js` tiene un interceptor de respuesta que redirige automáticamente al login cuando recibe un `401`. Los errores de negocio (4xx) se propagan al hook y se muestran en el modal/alerta correspondiente con el mensaje del backend.

### 6.10 Roles en el JWT como claim adicional

El JWT incluye un claim `roles` además del `sub` (número de documento). Esto permite al frontend decodificar el token y tomar decisiones de visibilidad (qué ítems del sidebar mostrar, qué botones habilitar) sin hacer una llamada adicional al backend.

---

## 7. Seguridad y Autenticación

### Flujo JWT

```
Cliente → POST /api/auth/login { documentNumber, password }
        ← { accessToken, tokenType: "Bearer", expiresInSeconds }

Cliente → GET /api/patients
          Header: Authorization: Bearer <token>
        ← 200 OK / 401 Unauthorized / 403 Forbidden
```

### Configuración de endpoints (SecurityConfig)

| Método | Ruta | Roles permitidos |
|--------|------|-----------------|
| `POST` | `/api/auth/login` | Público |
| `GET` | `/actuator/health` | Público |
| `POST` | `/api/auth/register` | `ADMIN` |
| `GET` | `/api/patients`, `/api/doctors`, `/api/offices`, etc. | `ADMIN`, `STAFF` |
| `POST` | `/api/appointments` | `ADMIN`, `STAFF` |
| `PATCH` | `/api/appointments/{id}/confirm` | `ADMIN`, `STAFF` |
| `PATCH` | `/api/appointments/{id}/cancel` | `ADMIN`, `STAFF` |
| `PATCH` | `/api/appointments/{id}/complete` | `DOCTOR` |
| `GET` | `/api/appointments/mine` | `DOCTOR` |
| `PATCH` | `/api/appointments/{id}/no-show` | `ADMIN` |
| `PATCH` | `/api/patients/{id}`, `/api/doctors/{id}`, `/api/offices/{id}` | `ADMIN` |
| `POST` | `/api/patients`, `/api/doctors`, `/api/specialties`, etc. | `ADMIN` |
| `GET` | `/api/reports/**` | `ADMIN`, `COORDINATOR` |
| `GET` | `/api/dashboard`, `/api/appointments` | `ADMIN`, `COORDINATOR`, `STAFF` |

### Errores de seguridad

| Código | Causa | Handler |
|--------|-------|---------|
| `401 Unauthorized` | Token ausente, expirado o inválido | `Http401EntryPoint` |
| `403 Forbidden` | Token válido pero rol insuficiente | `Http403AccessDenied` |

---

## 8. API REST — Resumen de Endpoints

> Base URL: `http://localhost:8080`  
> Todos los endpoints (excepto login y health) requieren `Authorization: Bearer <token>`

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Autenticación. Retorna JWT. |
| `POST` | `/api/auth/register` | Crear usuario del sistema (solo ADMIN). |

### Pacientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/patients` | Crear paciente. |
| `GET` | `/api/patients` | Listar paginado (`?page=0&size=10`). |
| `GET` | `/api/patients/{id}` | Obtener por ID. |
| `PATCH` | `/api/patients/{id}` | Actualizar campos editables. |

### Doctores
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/doctors` | Crear doctor. |
| `GET` | `/api/doctors` | Listar paginado. |
| `GET` | `/api/doctors/{id}` | Obtener por ID. |
| `PATCH` | `/api/doctors/{id}` | Actualizar campos editables. |

### Horarios de Doctor
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/doctors/{doctorId}/schedules` | Crear horario semanal. |
| `GET` | `/api/doctors/{doctorId}/schedules` | Listar horarios del doctor. |

### Especialidades
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/specialties` | Crear especialidad. |
| `GET` | `/api/specialties` | Listar todas. |

### Tipos de Cita
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/appointment-types` | Crear tipo de cita. |
| `GET` | `/api/appointment-types` | Listar todos. |

### Consultorios
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/offices` | Crear consultorio. |
| `GET` | `/api/offices` | Listar todos. |
| `PATCH` | `/api/offices/{id}` | Actualizar consultorio (incluye cambio de estado). |

### Disponibilidad
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/availability/doctors/{doctorId}?date=YYYY-MM-DD` | Huecos libres del doctor en la fecha. |
| `GET` | `/api/availability/doctors/{doctorId}/appointment-types/{typeId}?date=YYYY-MM-DD` | Huecos del tamaño exacto del tipo de cita. |

### Citas
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/appointments` | Crear cita (valida 10 condiciones). |
| `GET` | `/api/appointments` | Listar con filtros opcionales. |
| `GET` | `/api/appointments/{id}` | Obtener por ID. |
| `GET` | `/api/appointments/mine` | Citas del doctor autenticado. |
| `PATCH` | `/api/appointments/{id}/confirm` | Confirmar cita. |
| `PATCH` | `/api/appointments/{id}/cancel` | Cancelar cita (requiere motivo). |
| `PATCH` | `/api/appointments/{id}/complete` | Completar cita (solo doctor). |
| `PATCH` | `/api/appointments/{id}/no-show` | Marcar inasistencia. |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/dashboard?date=YYYY-MM-DD` | Estadísticas operativas del día. |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reports/office-occupancy?from=YYYY-MM-DD&to=YYYY-MM-DD` | Ocupación de consultorios. |
| `GET` | `/api/reports/doctor-productivity` | Ranking de doctores por citas completadas. |
| `GET` | `/api/reports/no-show-patients?from=YYYY-MM-DD&to=YYYY-MM-DD` | Pacientes con más inasistencias. |

---

## 9. Cómo Ejecutar el Proyecto

### Prerrequisitos

- Java 21+
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd plataforma_reservas_medicas

# 2. Crear la base de datos en PostgreSQL
psql -U postgres
CREATE DATABASE umars_db;
\q

# 3. Configurar variables de entorno (ver sección 10)
# Copiar y editar el archivo de propiedades
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# 4. Compilar y ejecutar
./mvnw spring-boot:run

# El backend quedará escuchando en http://localhost:8080
# Puedes verificar con: GET http://localhost:8080/actuator/health
```

### Frontend

```bash
# Desde la raíz del repo
cd plataforma-reservas-medicas

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El frontend estará en http://localhost:5173
```

### Primer usuario (bootstrap)

El sistema no crea usuarios automáticamente. Para el primer login necesitas insertar un usuario ADMIN directamente en la base de datos:

```sql
-- La contraseña "admin123" con BCrypt (strength 10)
INSERT INTO users (id, document_number, password)
VALUES (
  gen_random_uuid(),
  '0000000000',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
);

INSERT INTO user_roles (user_id, role)
SELECT id, 'ROLE_ADMIN'
FROM users WHERE document_number = '0000000000';
```

Con esas credenciales (`documentNumber: 0000000000`, `password: admin123`) puedes hacer login y desde ahí crear los demás usuarios con `POST /api/auth/register`.

---

## 10. Variables de Entorno

El archivo `application.properties` (o sus equivalentes por perfil) necesita:

```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/umars_db
spring.datasource.username=postgres
spring.datasource.password=TU_PASSWORD_AQUI

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false

# JWT
security.jwt.secret=CLAVE_SECRETA_DE_AL_MENOS_32_CARACTERES_AQUI
security.jwt.expiration-seconds=3600

# Puerto (opcional, default 8080)
server.port=8080
```

> ⚠️ **Importante:** El `jwt.secret` debe tener al menos 32 caracteres para que HMAC-SHA256 funcione correctamente. En producción, usa una variable de entorno del sistema operativo, no un valor hardcodeado en el `.properties`.

---

## 11. Pruebas Manuales con Bruno / Postman

Se incluye una colección de pruebas en el archivo `UMARS_API_Collection.json` (formato compatible con Bruno e importable en Postman).

### Orden recomendado para una prueba end-to-end completa

```
1.  POST /api/auth/login                         → Obtener token ADMIN
2.  POST /api/specialties                         → Crear especialidad
3.  POST /api/appointment-types                   → Crear tipo de cita
4.  POST /api/offices                             → Crear consultorio
5.  POST /api/doctors                             → Crear doctor
6.  POST /api/doctors/{id}/schedules              → Asignar horario al doctor
7.  POST /api/patients                            → Crear paciente
8.  GET  /api/availability/doctors/{id}?date=...  → Verificar disponibilidad
9.  POST /api/appointments                        → Crear cita
10. PATCH /api/appointments/{id}/confirm          → Confirmar cita
11. POST /api/auth/login (con doctor)             → Cambiar a token DOCTOR
12. PATCH /api/appointments/{id}/complete         → Completar cita
13. GET  /api/reports/doctor-productivity         → Verificar reporte
```

---

## 12. Consideraciones y Deuda Técnica

| Ítem | Descripción | Prioridad |
|------|-------------|-----------|
| Citas cross-midnight | El algoritmo de disponibilidad no maneja citas que empiezan antes de las 00:00 y terminan después. | Media |
| Endpoint de edición de horarios | No existe `PATCH /api/doctors/{id}/schedules/{scheduleId}`. Solo se pueden crear nuevos horarios, no modificar los existentes. | Media |
| Tests unitarios y de integración | El código está preparado para ser testeado (dependencias por constructor, `@Transactional`, etc.) pero no incluye tests escritos. | Alta |
| Refresh tokens | El JWT expira y el usuario debe volver a hacer login. No hay endpoint de refresh. | Media |
| Paginación en reportes | Los reportes retornan listas completas sin paginación. En producción con grandes volúmenes de datos esto puede ser un problema. | Baja |
| Gestión de usuarios desde la UI | Solo se pueden crear usuarios. No hay edición de roles ni desactivación desde el frontend. | Media |
| Variables de entorno en frontend | La `baseURL` de axios está hardcodeada como `http://localhost:8080`. Debería venir de `import.meta.env.VITE_API_URL`. | Baja |
| CORS en producción | `CorsConfig` permite `localhost:5173` y `localhost:3000`. Debe actualizarse con la URL real de producción. | Alta (antes de producción) |

---

*Este documento fue generado el 31 de mayo de 2026 y refleja el estado actual del código fuente.*
