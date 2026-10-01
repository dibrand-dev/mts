# Módulo 09: Reportes, Notificaciones y Configuración de Cuenta

Este documento contiene los casos de prueba para el módulo de Reportes Avanzados (`/reports`), Notificaciones por Correo Electrónico (Brevo Mock) y las opciones del menú de usuario en la barra superior (`TopNav`).

---

## Bloque de Ejecución CHROME 08: Interfaz de Reportes y Cuenta
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`

---

### TC-REP-01: Visualización y navegación en Reportes Avanzados
- **Módulo / Funcionalidad:** Reportes / Carga de Métricas
- **Objetivo:** Verificar que la pantalla de reportes renderice correctamente los gráficos y filtros temporales sin excepciones de JavaScript.
- **Prioridad:** P2 (Visualización)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - Sesión activa con `zztest-admin@example.com`.
- **Pasos de Ejecución:**
  1. En la barra de navegación lateral, hacer clic en "Reportes" (`sidebar-link-reports`).
  2. Verificar que la URL cambie a `http://localhost:3000/reports`.
  3. Observar la presencia de los filtros de período y secciones de métricas operativas y comerciales.
- **Resultado Esperado:**
  - La página carga con éxito sin errores en la consola del navegador.
- **Datos que crea:** Ninguno.

---

### TC-USER-01: Despliegue de opciones en el menú de usuario de TopNav
- **Módulo / Funcionalidad:** Configuración / Menú de Usuario
- **Objetivo:** Verificar la apertura del desplegable de usuario en la cabecera superior con sus accesos correspondientes.
- **Prioridad:** P2 (UI y Navegación)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Pasos de Ejecución:**
  1. En el extremo superior derecho, hacer clic en el botón de usuario (`topnav-user-menu-trigger`).
  2. Comprobar que se despliegue el menú con las opciones:
     - Cambiar Contraseña (`topnav-link-change-password`).
     - Configuración (`topnav-link-settings`).
     - Cerrar Sesión (`topnav-btn-logout`).
- **Resultado Esperado:**
  - El menú emergente se muestra claramente sobre los demás elementos.
- **Datos que crea:** Ninguno.

---

### TC-USER-02: Verificación de cambio de contraseña simulado (Discrepancia D-08)
- **Módulo / Funcionalidad:** Configuración / Cambio de Contraseña
- **Objetivo:** Evaluar el formulario de cambio de contraseña y documentar si la mutación conecta con Supabase Auth o es una simulación visual.
- **Prioridad:** P1 (Discrepancia de Seguridad D-08)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Contraseña nueva: `NuevaContrasenaSegura99!`
- **Pasos de Ejecución:**
  1. Hacer clic en "Cambiar Contraseña" (`topnav-link-change-password`).
  2. Completar los campos de contraseña actual y nueva contraseña.
  3. Enviar el formulario.
  4. Intentar iniciar sesión con la contraseña nueva.
- **Resultado Esperado:**
  - Si el login con la nueva contraseña falla y sigue requiriendo la anterior, confirmar la Discrepancia **D-08** (el componente muestra mensaje de éxito pero no ejecuta `supabase.auth.updateUser({ password: ... })`).
- **Datos que crea:** Ninguno.
