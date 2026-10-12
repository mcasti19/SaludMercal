# Auditoría Integral — SaludMercal

Fecha: 2026-10-12 · Alcance: `backend/` (Laravel 12) y `frontend/` (Next.js 16 / React 19)

---

## 0. Resumen ejecutivo

**Estado real del sistema:** el proyecto es hoy un **prototipo de interfaz de alta calidad visual** con **autenticación real** conectada al backend. **Todo el dominio de negocio (citas, pacientes, médicos, reposos, reportes) vive en el navegador**: stores de Zustand con datos *mock* persistidos en `localStorage`. El backend solo expone 3 endpoints (`/login`, `/me`, `/logout`).

| Área | Madurez | Comentario |
|---|---|---|
| UI/UX frontend | 🟢 Alta | Diseño coherente, tema claro/oscuro, shadcn/ui, validación con Zod |
| Arquitectura frontend | 🟡 Media | Organización modular por dominio buena; sin capa de datos real |
| Autenticación | 🟠 Media-baja | Funciona, pero con fallos de sesión y seguridad |
| Backend / API de negocio | 🔴 Inexistente | Sin modelos, migraciones ni endpoints del dominio |
| Autorización (roles) | 🔴 Solo cosmética | Se controla únicamente en el cliente |
| Pruebas | 🔴 Nulas | Solo tests de ejemplo de Laravel (y el de `/` fallaría) |
| Seguridad / datos sensibles | 🔴 Crítica | Datos médicos en `localStorage`, adjuntos en base64, sin auditoría |

**Prioridades inmediatas (top 6):**
1. Construir el dominio en el backend (migraciones, modelos, API) y reemplazar los stores mock.
2. Corregir la sesión rota tras recargar (`hydrate()` nunca se invoca).
3. Implementar autorización por rol en el servidor (Policies/Gates).
4. Evitar datos clínicos en `localStorage` y adjuntos en base64.
5. Rate limiting en login + eliminar credenciales por defecto del seeder.
6. Añadir pruebas (Pest/PHPUnit y Vitest/Playwright) y CI.

---

## 1. BACKEND (Laravel 12 · PHP 8.4 · PostgreSQL · Sanctum)

### 1.1 Inventario actual
- Controladores: solo `Api/AuthController` (login, me, logout).
- Modelos: solo `User`.
- Migraciones: `users`, `password_reset_tokens`, `sessions`, `cache`, `jobs`, `personal_access_tokens`.
- Rutas: `POST /api/login`, `GET /api/me`, `POST /api/logout`.
- Tests: `ExampleTest` (Feature y Unit), sin cobertura real.

### 1.2 Fortalezas
- Stack moderno y adecuado (Laravel 12, PostgreSQL, Sanctum).
- Login flexible por email o username, con mensaje genérico ante credenciales inválidas (evita enumeración de usuarios).
- Se revocan tokens previos al iniciar sesión (no se acumulan).
- Hash de contraseña mediante cast `hashed` y `.env.template` bien documentado.
- `APP_TIMEZONE=America/Caracas` y locale `es` configurados.
- CORS restringido a un origen configurable (`FRONTEND_URL`) en vez de `*`.

### 1.3 Bugs y errores detectados

| # | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| B1 | 🔴 Alta | **Los tokens nunca expiran**: `sanctum.expiration = null`, pero el comentario del `AuthController` afirma "1 día de expiración". El comentario es falso. | `config/sanctum.php:53`, `AuthController::login` |
| B2 | 🔴 Alta | **Sin rate limiting en `/login`**: permite fuerza bruta ilimitada de contraseñas. | `routes/api.php` |
| B3 | 🟠 Media | `Hash::check` solo se ejecuta si el usuario existe → diferencia de tiempos permite **enumerar usuarios** por timing. | `AuthController::login` |
| B4 | 🟠 Media | `ExampleTest` espera `GET /` = 200 con `RefreshDatabase` comentado; con `welcome.blade` y config de sesión en BD puede fallar. No se ha validado ninguna prueba real. | `tests/Feature/ExampleTest.php` |
| B5 | 🟡 Baja | El comentario del controlador dice "httpOnly cookie a través de Next.js", pero no existe tal implementación. Documentación engañosa. | `AuthController` |
| B6 | 🟡 Baja | `Auth` por usuario/contraseña sin verificar campo de **usuario activo/inhabilitado**: no hay forma de bloquear a un empleado sin borrarlo. | `users` migration |
| B7 | 🟡 Baja | `CORS max_age = 0`: cada petición genera *preflight* adicional (latencia). | `config/cors.php` |

### 1.4 Deuda técnica
- **Dominio ausente**: ni `pacientes`, `medicos`, `especialidades`, `citas`, `reposos`, `horarios`. Todo el valor del producto está sin persistir.
- **Configuración ambigua de autenticación**: coexisten sesiones en BD (`SESSION_DRIVER=database`, `SANCTUM_STATEFUL_DOMAINS`, CORS con `supports_credentials`) y tokens Bearer. Es una configuración **híbrida sin propósito**; se debe elegir un modelo.
- **Rol como `string` libre** (`ADMIN|RECEPCION|...`) sin enum ni restricción en BD: permite valores inválidos.
- **Usuario ≠ Persona**: el frontend maneja `cedula`, `departamento`, `nombre/apellido`, que `users` no almacena (el frontend las rellena con `""`).
- **Sin capa de errores unificada**: `withExceptions` vacío; formato de errores de validación/401/500 no estandarizado para la API.
- **Sin versionado de API** (`/api/v1`) ni documentación (OpenAPI/Scribe).
- **Sin colas/jobs reales** pese a existir tabla `jobs` y `QUEUE_CONNECTION=database`.
- **`.env` en el workspace** con `APP_DEBUG=true` y `APP_ENV=local` (verificar que no llegue a producción; `.env.example` y `.env.template` duplicados).
- **Paquetes/archivos sobrantes**: `package.json`, `vite.config.js`, `resources/js` y `welcome.blade.php` no se usan (API pura).
- `AuthController` duplica el mapeo de usuario en `login` y `me`.

### 1.5 Refactorizaciones sugeridas
1. **`FormRequest`** (`LoginRequest`) para validar y encapsular lógica de login.
2. **API Resource** (`UserResource`) para eliminar el array duplicado en `login` y `me`.
3. **Servicio/Action** `AuthenticateUser` (SRP) con `RateLimiter`/`throttle:5,1`.
4. **Enum PHP** `UserRole` con cast en el modelo y regla `Rule::enum`.
5. **Middleware/Policies** por rol (`role:ADMIN,RECEPCION`) y `Gate::define`.
6. **Respuesta de errores consistente** en `bootstrap/app.php` (JSON para `/api/*`).
7. Agrupar rutas bajo `Route::prefix('v1')`.
8. Definir **expiración** (`SANCTUM_EXPIRATION=480`) y *abilities* por rol en el token.
9. Eliminar `package.json`, `vite.config.js`, `resources/js`, y vistas si no se usan.
10. Unificar `.env.example` y `.env.template`; poner `APP_DEBUG=false` como default seguro.

### 1.6 Seguridad
| Riesgo | Detalle | Acción |
|---|---|---|
| Credenciales por defecto | Seeder crea ADMIN con `Password123*` y lo imprime en consola, además de aparecer en el repositorio. | Leer password de `.env`, forzar cambio en primer login |
| Fuerza bruta | Sin throttle | `throttle:login` + bloqueo temporal |
| Tokens eternos | Sin expiración | `SANCTUM_EXPIRATION` + refresh/renovación |
| Autorización | Cualquier usuario autenticado tendría acceso a todo lo que se agregue | Policies desde el inicio |
| Auditoría | Sin bitácora de accesos/cambios | `spatie/laravel-activitylog` |
| Datos sensibles de salud | Sin cifrado de campos clínicos | Cifrado a nivel de columna (`encrypted` cast) |
| HTTPS/headers | No configurado | HSTS, `SESSION_SECURE_COOKIE`, CSP |

---

## 2. FRONTEND (Next.js 16 · React 19 · TS · Tailwind 4 · shadcn/ui · Zustand)

### 2.1 Inventario actual
- Dos portales: **Administrativo** `(dashboard)` (citas, médicos, pacientes, reposos, reportes) y **Portal del Empleado** `/portal` (citas, expediente, reposos, perfil).
- Estado: stores Zustand por módulo con `persist` (localStorage) y datos *mock*.
- Formularios con `react-hook-form` + `zod`; slots de citas con `date-fns`.
- `tsc --noEmit`: **sin errores de tipos**. `pnpm lint`: **23 problemas (5 errores, 18 advertencias)**. Sin uso de `any` explícito.

### 2.2 Fortalezas
- Estructura **modular por dominio** (`modules/<dominio>/...`) clara y escalable.
- TypeScript estricto, sin `any`; tipos centralizados en `types/index.ts`.
- Diseño visual cuidado: modo oscuro/claro, badges de estado, StatCards, sidebar colapsable.
- Validación robusta con Zod (cédula, campos requeridos) y mensajes en español.
- Generación de **slots disponibles** que excluye horas ocupadas y fechas pasadas (`date-utils.ts`).
- Separación del cliente HTTP (`lib/api.ts`) y manejo de errores de Laravel (`errors`/`message`).
- Dos experiencias separadas por rol (administrativo vs. empleado).
- Token Bearer en memoria (intención correcta de no exponerlo en localStorage).

### 2.3 Bugs y errores detectados

| # | Severidad | Hallazgo | Ubicación |
|---|---|---|---|
| F1 | 🔴 Alta | **`hydrate()` nunca se llama.** Al recargar, el token en memoria se pierde, pero `isAuthenticated` persiste en localStorage → el usuario *parece* autenticado, pero toda llamada futura a la API devolverá 401 sin manejo. | `auth.store.ts` (sin uso en la app) |
| F2 | 🔴 Alta | **Sin manejo global de 401/403**: `apiFetch` no cierra sesión ni redirige cuando el token expira/revoca. | `lib/api.ts` |
| F3 | 🔴 Alta | **Guard de rutas solo en cliente** (`useEffect`), sin `middleware`/`proxy`. Hay parpadeo y el HTML/JS de páginas protegidas se sirve igual. El portal `/portal` además no valida rol ADMIN vs EMPLEADO igual que el dashboard (verificar `PortalShell`). | `DashboardShell.tsx`, ausencia de `proxy.ts` |
| F4 | 🟠 Media | **Fecha "hoy" calculada en UTC** con `new Date().toISOString().split("T")[0]`: en Venezuela (UTC-4) tras las 8:00 PM "hoy" pasa a ser mañana → citas del día incorrectas y fecha por defecto errónea. | `citas.store.ts:67`, `DashboardContent.tsx:25`, `NuevaCitaModal.tsx:28` |
| F5 | 🟠 Media | **Doble reserva posible**: la disponibilidad se valida solo en la UI; el store `addCita`/`updateCita` no revisa conflictos ni los de `EditarCitaModal`. | `citas.store.ts` |
| F6 | 🟠 Media | `generateId()` con `Math.random().substr` (deprecado, riesgo de colisión). | `lib/utils.ts:35` |
| F7 | 🟠 Media | **Error de lint (React Compiler)**: `setState` síncrono dentro de `useEffect` → renders en cascada. 5 errores en total. | `NuevoReposoModal.tsx:36` y otros |
| F8 | 🟡 Baja | `mapApiUser`: `name.split(" ")` produce apellido vacío / `?? ""` inútil (`join` siempre devuelve string). `cedula` y `departamento` quedan vacíos. | `auth.store.ts` |
| F9 | 🟡 Baja | `Reportes` usa `MOCK_ESPECIALIDADES` directamente en vez del store → no refleja especialidades nuevas. | `ReportesContent.tsx:9` |
| F10 | 🟡 Baja | Duplicación: `ADMIN_ROLES` definido en `auth.store.ts` **y** `constants.ts`. | ambos |
| F11 | 🟡 Baja | Imports sin uso (`Upload`, `watch`) y 18 warnings; uso de `<img>` en lugar de `next/image`. | varios |

### 2.4 Deuda técnica
- **Sin capa de datos**: ningún módulo consume `lib/api.ts`; todo es mock. Hay que sustituir stores por consultas (TanStack Query) o *server components*.
- **Datos clínicos en `localStorage`** (`saludmercal-citas`, pacientes, reposos): inaceptable en producción por privacidad (equipos compartidos).
- **Adjuntos médicos en base64** dentro del store/localStorage: límite de ~5 MB, bloqueo de UI y exposición.
- **Credenciales demo hardcodeadas** (`mercal2024`, cédulas) en `auth.mocks.ts` y `constants.ts`; verificar que no lleguen al bundle de producción.
- **Archivos de desarrollo sueltos** en el repo: `frontend/fix_theme.js` (script de reemplazo masivo con regex, ya ejecutado), `test_colors.html` en la raíz.
- **Dark/Light a base de clases duplicadas** (`bg-slate-50 dark:bg-slate-900` repetido en cada archivo, resultado del script) en vez de **tokens semánticos** (`bg-background`, `text-foreground`). Alta repetición y riesgo de inconsistencias.
- **Páginas todas `"use client"`**: se pierde SSR/streaming de Next 16.
- **Componentes grandes** (modales de 280–300 líneas: `EditarMedicoModal`, `NuevoMedicoModal` duplican casi el mismo formulario; `Nuevo/Editar` cita igual).
- **Constantes de dominio duplicadas** (`HORAS_DISPONIBLES` vs horarios por médico, `DEPARTAMENTOS` mezcla áreas con "Consulta General").
- **Metadata/SEO básica**: títulos por layout, no por página; sin `loading.tsx`/`error.tsx`/`not-found.tsx`.
- **Sin tests** (ni unitarios, ni E2E) y sin CI.
- `next.config.ts` con IP privada (`10.20.16.26`) hardcodeada en `allowedDevOrigins`.
- **Accesibilidad**: no auditada (contraste de `text-slate-400/500` sobre fondos oscuros, foco, `aria-*` en tablas de acciones).

### 2.5 Refactorizaciones sugeridas
1. **Capa API tipada por dominio** (`citas.api.ts`, etc.) + **TanStack Query** para caché, reintentos y estados de carga/error. Los stores Zustand quedan solo para estado de UI (filtros, búsqueda).
2. **Componente de formulario compartido** `MedicoForm` / `CitaForm` reutilizado en modales Nuevo/Editar (DRY, SRP).
3. **Hook `useRequireRole(roles)`** + `proxy.ts` de Next 16 (con cookie httpOnly) para protección real de rutas.
4. **Utilidad de fechas local** (`todayLocalISO()` con `date-fns/format`) y reemplazo de todos los `toISOString().split`.
5. **`crypto.randomUUID()`** o IDs del backend.
6. **Migrar a tokens de diseño** (`bg-background`, `text-muted-foreground`, variables CSS) y eliminar `fix_theme.js`.
7. Convertir páginas a **Server Components** donde sea posible y aislar `"use client"` en hojas interactivas.
8. **Cliente HTTP**: interceptor 401 → logout, timeout con `AbortController`, tipado de errores (`ApiError`).
9. Consolidar `ADMIN_ROLES`/`getRedirectPath` en un único módulo `auth/roles.ts`.
10. Corregir los 5 errores de lint y habilitar `lint` + `tsc` + `build` en CI.
11. Eliminar `auth.mocks.ts` y datos demo del bundle de producción (o proteger con `NEXT_PUBLIC_APP_ENV`).

### 2.6 Seguridad
- Evitar PHI/datos clínicos en almacenamiento del navegador.
- Mover el token a **cookie httpOnly** (BFF con Route Handlers de Next) o usar el modo SPA de Sanctum con CSRF; hoy un refresh obliga a re-login (token en memoria) — mala UX sin solución clara.
- Cabeceras de seguridad en `next.config.ts` (CSP, X-Frame-Options, Referrer-Policy).
- Validar tipo/tamaño de archivos adjuntos en servidor (antivirus/MIME), no solo en cliente.

---

## 3. HALLAZGOS TRANSVERSALES (contrato Front–Back)
- **Desalineación de modelos**: el frontend maneja `Paciente`, `Medico`, `Cita`, `Reposo`, `Especialidad`, el backend solo `User`. Se necesita definir un **contrato** (OpenAPI → tipos TS generados con `openapi-typescript`).
- **Identidad**: ¿empleado = usuario = paciente? Hoy son tres conceptos distintos. Definir un modelo `Empleado` (cédula, departamento, cargo, sede) enlazado a `User` y a `Paciente`.
- **IDs**: frontend usa strings (`CIT...`), backend usará enteros/UUID.
- **Documentación**: el README no menciona `pnpm`+seeder (`php artisan db:seed`), roles ni estado "mock" del dominio; la `git clone` tiene la URL vacía.
- **Sin pipeline CI/CD ni Docker** → entornos poco reproducibles.
- **Sin estrategia de ramas/versionado** más allá de `main`/`developer`.

---

## 4. MEJORAS Y OPORTUNIDADES DE VALOR (lo que aún no existe)

### 4.1 Núcleo funcional (imprescindible)
| Mejora | Valor |
|---|---|
| **API REST completa** con modelos: `Empleado`, `Paciente`, `Medico`, `Especialidad`, `HorarioMedico`, `Cita`, `Reposo`, `ConsultaClinica` | Convierte el prototipo en producto |
| **RBAC con Policies** (ADMIN, RECEPCION, MEDICO, ENFERMERIA, EMPLEADO) y *scopes* (el empleado solo ve lo suyo, el médico sus pacientes) | Seguridad y cumplimiento |
| **Anti-solapamiento transaccional** de citas (constraint único `medico_id+fecha+hora` / `lockForUpdate`) | Evita dobles reservas |
| **Horarios y bloqueos por médico** (vacaciones, feriados, excepciones) | Agenda realista |
| **Almacenamiento seguro de adjuntos** (disco privado, URLs firmadas) | Reposos con soporte |

### 4.2 Notificaciones y experiencia
- **Recordatorios** de cita por correo / WhatsApp / SMS (colas + `schedule`).
- **Notificaciones en la app** (campana) y confirmación/cancelación con un clic.
- **Lista de espera** automática: al cancelarse una cita se ofrece el cupo.
- **Vista de calendario** (día/semana/mes) por médico con *drag & drop* para reprogramar.
- **PWA** / modo móvil: los empleados de almacenes y distribución usan principalmente teléfono.
- **Check-in con QR** en recepción y cola de turnos en pantalla.

### 4.3 Gestión clínica
- **Historia clínica electrónica** (antecedentes, diagnósticos CIE-10, recetas, indicaciones), con cifrado y control de acceso.
- **Flujo de aprobación de reposos** (solicitud → validación médica → notificación a RRHH) con constancia **PDF firmada** y código QR verificable.
- **Control epidemiológico**: ausentismo por departamento/sede, enfermedades frecuentes, alertas de brotes.
- **Inventario de medicamentos/insumos** del servicio médico.
- **Carnet de vacunación y exámenes preocupacionales/periódicos** con recordatorios.

### 4.4 Analítica y reportes
- Dashboard real con **gráficas** (Recharts/Tremor): demanda por especialidad, tiempos de espera, tasa de no-show, productividad por médico.
- **Exportación** a PDF/Excel/CSV.
- **KPI de ausentismo laboral** cruzando reposos con la nómina/departamentos de Mercal.
- **Multisede**: filtrado por estado/almacén/agencia (Mercal es una red nacional).

### 4.5 Integraciones
- Integración con **RRHH/nómina** (importar empleados, notificar reposos).
- **SSO / LDAP / Active Directory** institucional.
- Validación de cédula contra fuente oficial (si es viable).
- **Webhooks / API pública** para otros sistemas internos.

### 4.6 Plataforma e ingeniería
- **Auditoría (activity log)**: quién vio/modificó qué dato clínico.
- **Recuperación de contraseña** y **2FA** para personal médico/administrativo.
- **Pruebas**: Pest (Feature de auth/citas/policies), Vitest (utils, stores), Playwright (flujo de login y solicitud de cita).
- **CI/CD** (GitHub Actions): `pnpm lint`, `tsc --noEmit`, `pnpm build`, `php artisan test`, `pint`, `larastan`.
- **Docker Compose** (app, postgres, redis) para onboarding en minutos.
- **Observabilidad**: Sentry, logs estructurados, health-check (`/up` ya existe), backups automáticos de PostgreSQL.
- **Redis** para caché, colas y *throttling*.
- **i18n/formatos** consistentes (fechas `dd/MM/yyyy`, zona Caracas).
- **Accesibilidad** (WCAG AA) y *skeletons* en carga.

---

## 5. PLAN DE ACCIÓN PRIORIZADO

### Fase 0 — Correcciones rápidas (1–2 días)
- [ ] Invocar `hydrate()` al montar la app / manejar 401 globalmente (F1, F2)
- [ ] `throttle` en login y `SANCTUM_EXPIRATION` (B1, B2)
- [ ] Fix de fecha local (F4) y `crypto.randomUUID` (F6)
- [ ] Corregir 5 errores de lint (F7)
- [ ] Quitar `fix_theme.js`, `test_colors.html`, credenciales demo del seeder/bundle
- [ ] Corregir comentarios engañosos y README

### Fase 1 — Fundamentos (2–3 semanas)
- [ ] Modelo de datos + migraciones + API `v1` de pacientes/médicos/citas
- [ ] Policies por rol, `FormRequest`, `Resource`, enum `UserRole`
- [ ] Capa API + TanStack Query en el frontend; retirar mocks y `persist`
- [ ] Tests de auth y citas; CI básico

### Fase 2 — Valor de negocio (3–5 semanas)
- [ ] Reposos con adjuntos seguros y flujo de aprobación + PDF
- [ ] Notificaciones y recordatorios
- [ ] Reportes reales y exportación
- [ ] Auditoría, recuperación de contraseña, 2FA

### Fase 3 — Escala (continuo)
- [ ] Multisede, historia clínica, integración RRHH/SSO, PWA, observabilidad

---

## 6. Conclusión
SaludMercal tiene una **base visual y de organización muy sólida** y una intención de arquitectura correcta (módulos, TypeScript estricto, Zod, Sanctum). Su mayor brecha es que **el backend de negocio aún no existe** y que, mientras tanto, el frontend almacena información sensible localmente. Cerrar esa brecha (Fase 1), corregir la sesión y la autorización (Fase 0) y luego añadir notificaciones, reposos con flujo de aprobación y reportes reales (Fase 2) llevará el sistema de demo a una herramienta operativa de valor real para Mercal.

> **Nota metodológica:** análisis estático del código, `tsc --noEmit` y `pnpm lint`. No se ejecutó `pnpm run build` ni la suite de Laravel, ni se probó en navegador; algunos puntos (p. ej. F3 sobre `PortalShell`, B4) conviene verificarlos al implementar la corrección.
