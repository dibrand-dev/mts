# Módulo 01: Autenticación y Control de Permisos

Este documento contiene los casos de prueba verificados para el flujo de autenticación, control de accesos por rol y protección de rutas en **MTS Gestión Logística**.

---

## Bloque de Ejecución CHROME 01: Flujo de Acceso y Sesión
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Usuario de prueba secundario:** `zztest-auditor@example.com` (Rol: `auditor`), Contraseña: `ZztestPass123!`
- **Precondición general:** Servidor local ejecutándose en `http://localhost:3000` con `.env.test`. Base de datos con usuarios creados mediante `scripts/create-test-users.ts`.

---

### TC-AUTH-01: Inicio de sesión exitoso con rol Administrador
- **Módulo / Funcionalidad:** Autenticación / Inicio de Sesión
- **Objetivo:** Verificar que un usuario con credenciales válidas y rol `admin` inicie sesión correctamente y sea redirigido al Dashboard.
- **Prioridad:** P0 (Seguridad y Flujo Crítico)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-admin@example.com`
  - Contraseña: `ZztestPass123!`
- **Precondiciones:**
  - El usuario administrador de test existe en Supabase Auth (`email_confirm: true`) y cuenta con perfil en tabla `profiles` con `role = 'admin'`.
  - El navegador se encuentra en la pantalla de inicio de sesión (`http://localhost:3000/login`).
- **Pasos de Ejecución:**
  1. En el campo "Correo electrónico" (`login-input-email`), escribir `zztest-admin@example.com`.
  2. En el campo "Contraseña" (`login-input-password`), escribir `ZztestPass123!`.
  3. Hacer clic en el botón "Iniciar Sesión" (`login-btn-submit`).
- **Resultado Esperado:**
  - El sistema procesa la autenticación sin mostrar mensajes de error.
  - La URL del navegador cambia inmediatamente a `http://localhost:3000/` o `http://localhost:3000/dashboard`.
  - Se visualiza la barra de navegación lateral (Sidebar) con el logotipo de MTS Gestión Logística.
  - Los accesos a todos los módulos operativos y de gestión son visibles: Dashboard (`sidebar-link-dashboard`), Carga Diaria (`sidebar-link-daily-entry`), Sueldos (`sidebar-link-payroll`), Facturación (`sidebar-link-invoicing`), Tarifario (`sidebar-link-rates`), Flujo de Caja (`sidebar-link-cash-flow`), Empleados (`sidebar-link-employees`), Puestos (`sidebar-link-positions`), Lugares (`sidebar-link-locations`), Clientes (`sidebar-link-clients`).
- **Datos que crea:** Ninguno (generación de cookies de sesión Supabase en el navegador).

---

### TC-AUTH-02: Rechazo de inicio de sesión con contraseña incorrecta
- **Módulo / Funcionalidad:** Autenticación / Validaciones de Acceso
- **Objetivo:** Verificar que el sistema impida el acceso cuando se ingresa una contraseña errónea y despliegue el mensaje de alerta correspondiente.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-admin@example.com`
  - Contraseña inválida: `PasswordIncorrecto123!`
- **Precondiciones:**
  - El usuario de prueba existe en Supabase Auth.
  - El navegador se encuentra en `http://localhost:3000/login`.
- **Pasos de Ejecución:**
  1. En el campo "Correo electrónico" (`login-input-email`), escribir `zztest-admin@example.com`.
  2. En el campo "Contraseña" (`login-input-password`), escribir `PasswordIncorrecto123!`.
  3. Hacer clic en el botón "Iniciar Sesión" (`login-btn-submit`).
- **Resultado Esperado:**
  - El sistema no redirige y permanece en la ruta `/login`.
  - Aparece un cuadro de alerta rojo en la parte superior del formulario (`login-alert-error`).
  - El texto exacto de la alerta es: `Credenciales inválidas. Por favor verifique correo y contraseña.`.
  - El campo de contraseña permanece disponible para reintentar.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-03: Alternar visibilidad de contraseña (Toggle Password)
- **Módulo / Funcionalidad:** Autenticación / UI de Formulario
- **Objetivo:** Verificar que el botón de visibilidad de contraseña cambie el tipo de input entre protegido y texto visible.
- **Prioridad:** P2 (UI y Conveniencia)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - El navegador se encuentra en `http://localhost:3000/login`.
- **Pasos de Ejecución:**
  1. En el campo "Contraseña" (`login-input-password`), escribir `MiClavePrueba123`.
  2. Verificar que el atributo `type` del elemento input es `"password"`.
  3. Hacer clic en el botón con ícono de ojo a la derecha del campo (`login-btn-toggle-password`).
  4. Verificar el atributo `type` del elemento input y que los caracteres sean legibles.
  5. Hacer clic nuevamente en el botón (`login-btn-toggle-password`).
- **Resultado Esperado:**
  - Tras el primer clic, el atributo `type` del campo cambia a `"text"` y el texto `"MiClavePrueba123"` queda visible.
  - Tras el segundo clic, el atributo `type` vuelve a `"password"` y el texto se enmascara con puntos o asteriscos.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-04: Cierre de sesión exitoso desde Sidebar
- **Módulo / Funcionalidad:** Autenticación / Cierre de Sesión
- **Objetivo:** Verificar que un usuario autenticado pueda finalizar su sesión y sea redirigido a `/login`, eliminando tokens locales.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Sesión activa iniciada con `zztest-admin@example.com`.
- **Precondiciones:**
  - El usuario tiene una sesión válida y se encuentra en cualquier pantalla interna (ej. `/daily-entry`).
- **Pasos de Ejecución:**
  1. En el extremo inferior de la barra de navegación lateral (Sidebar), localizar el botón "Cerrar Sesión" (`sidebar-btn-logout`).
  2. Hacer clic en "Cerrar Sesión".
- **Resultado Esperado:**
  - La sesión se invalida en el cliente Supabase.
  - El navegador redirige automáticamente a la pantalla de login (`http://localhost:3000/login`).
  - Al pulsar el botón "Atrás" del navegador, el sistema no permite ingresar a la pantalla anterior protegida y fuerza la redirección a `/login`.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-05: Redirección automática al intentar acceder a ruta protegida sin sesión
- **Módulo / Funcionalidad:** Seguridad / Middleware y Rutas Protegidas
- **Objetivo:** Verificar que un usuario no autenticado que intente ingresar directamente mediante URL a un módulo interno sea redirigido a `/login`.
- **Prioridad:** P0 (Seguridad)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - El navegador no cuenta con ninguna sesión activa ni cookies de Supabase (modo incógnito o tras logout).
- **Pasos de Ejecución:**
  1. Ingresar directamente en la barra de direcciones del navegador: `http://localhost:3000/daily-entry`.
  2. Presionar Enter.
- **Resultado Esperado:**
  - El Middleware intercepta la petición antes de renderizar la página protegida.
  - La URL cambia a `http://localhost:3000/login` (o incluye parámetro de retorno).
  - La pantalla mostrada es el formulario de inicio de sesión de MTS Gestión Logística.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-06: Navegación y elementos visibles para rol Auditor
- **Módulo / Funcionalidad:** Permisos y Roles / Vista de Auditor
- **Objetivo:** Verificar que un usuario con rol `auditor` pueda iniciar sesión e interactuar con la interfaz según los permisos asignados.
- **Prioridad:** P1 (Permisos por Rol)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-auditor@example.com`
  - Contraseña: `ZztestPass123!`
- **Precondiciones:**
  - Usuario `zztest-auditor@example.com` configurado en `profiles` con `role = 'auditor'`.
- **Pasos de Ejecución:**
  1. En `http://localhost:3000/login`, ingresar email `zztest-auditor@example.com` y contraseña `ZztestPass123!`.
  2. Hacer clic en "Iniciar Sesión" (`login-btn-submit`).
  3. Observar la pantalla principal y la barra lateral de navegación (`Sidebar`).
- **Resultado Esperado:**
  - El ingreso es exitoso y redirige al Dashboard.
  - En el Sidebar se observan los accesos de consulta.
  - *(Nota Discrepancia D-06: Verificar que las opciones restringidas a escritura se oculten o deshabiliten correctamente según las políticas RLS y los permisos de interfaz).*
- **Datos que crea:** Ninguno.
