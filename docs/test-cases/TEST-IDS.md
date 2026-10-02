# Catálogo de Selectores data-testid

Este documento lista todos los atributos `data-testid` incorporados en el código de **MTS Gestión Logística** para permitir la ejecución automatizada y determinística de casos de prueba mediante agentes de IA (Claude in Chrome) y suites de testing E2E.

**Convención de nomenclatura:** `modulo-elemento-accion` (o `modulo-elemento-tipo`) en kebab-case.

---

## 1. Módulo: Autenticación (`/login`)
**Archivo:** [`src/app/login/page.tsx`](src/app/login/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `login-input-email` | `<input type="email">` | Campo para ingresar correo del usuario |
| `login-input-password` | `<input type="password\|text">` | Campo para ingresar contraseña |
| `login-btn-toggle-password` | `<button type="button">` | Botón para mostrar / ocultar contraseña |
| `login-btn-submit` | `<button type="submit">` | Botón para enviar formulario ("Iniciar Sesión") |
| `login-alert-error` | `<div>` | Contenedor de mensaje de error de credenciales |

---

## 2. Layout Global: Navegación y Encabezado
**Archivos:**
- [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx)
- [`src/components/layout/TopNav.tsx`](src/components/layout/TopNav.tsx)

| data-testid | Elemento HTML | Ubicación | Propósito / Descripción |
|---|---|---|---|
| `sidebar-btn-nuevo-registro` | `<Link>` | Sidebar | Acceso rápido a Carga Diaria |
| `sidebar-link-dashboard` | `<Link>` | Sidebar | Navegación a Dashboard General |
| `sidebar-link-daily-entry` | `<Link>` | Sidebar | Navegación a Carga Diaria de Horas |
| `sidebar-link-payroll` | `<Link>` | Sidebar | Navegación a Liquidación y Sueldos |
| `sidebar-link-invoicing` | `<Link>` | Sidebar | Navegación a Facturación y Proformas |
| `sidebar-link-rates` | `<Link>` | Sidebar | Navegación a Tarifario Comercial |
| `sidebar-link-cash-flow` | `<Link>` | Sidebar | Navegación a Flujo de Caja |
| `sidebar-link-employees` | `<Link>` | Sidebar | Navegación a Gestión de Empleados |
| `sidebar-link-positions` | `<Link>` | Sidebar | Navegación a Puestos y Funciones |
| `sidebar-link-locations` | `<Link>` | Sidebar | Navegación a Lugares de Operación |
| `sidebar-link-clients` | `<Link>` | Sidebar | Navegación a Gestión de Clientes |
| `sidebar-link-reports` | `<Link>` | Sidebar | Navegación a Reportes Avanzados |
| `sidebar-link-settings` | `<Link>` | Sidebar | Navegación a Configuración |
| `sidebar-btn-logout` | `<button>` | Sidebar | Botón para cerrar sesión |
| `topnav-user-menu-trigger` | `<button>` | TopNav | Menú desplegable de usuario (avatar/nombre) |
| `topnav-link-change-password` | `<button>` | TopNav (Dropdown) | Opción para cambiar contraseña |
| `topnav-link-settings` | `<Link>` | TopNav (Dropdown) | Enlace a Configuración del sistema |
| `topnav-btn-logout` | `<button>` | TopNav (Dropdown) | Botón para cerrar sesión desde TopNav |

---

## 3. Módulo: Carga Diaria de Horas (`/daily-entry`)
**Archivo:** [`src/app/(dashboard)/daily-entry/page.tsx`](src/app/%28dashboard%29/daily-entry/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `daily-entry-btn-cargar-horas` | `<button>` | Botón principal de cabecera "Cargar Horas" para abrir slideover |
| `daily-entry-btn-toggle-approval` | `<button>` | Botón en fila de tabla para alternar aprobación (check verde) |
| `daily-entry-btn-edit-entry` | `<button>` | Botón en fila de tabla para editar turno (ícono lápiz) |
| `daily-entry-btn-delete-entry` | `<button>` | Botón en fila de tabla para eliminar turno (ícono papelera) |
| `daily-entry-input-date` | `<input type="date">` | Selector de fecha del turno |
| `daily-entry-select-client` | `<select>` | Selector de Cliente |
| `daily-entry-select-location` | `<select>` | Selector de Lugar de Trabajo |
| `daily-entry-select-vessel` | `<input type="text">` | Campo de texto para Buque (cuando el lugar lo requiere) |
| `daily-entry-select-employee` | `<select>` | Selector de Operario / Empleado |
| `daily-entry-select-position` | `<select>` | Selector de Puesto / Función |
| `daily-entry-input-start-time` | `<input type="time">` | Hora de inicio del turno |
| `daily-entry-input-end-time` | `<input type="time">` | Hora de fin del turno |
| `daily-entry-input-regular-hours` | `<input type="number">` | Cantidad de horas normales |
| `daily-entry-input-overtime-50` | `<input type="number">` | Cantidad de horas al 50% |
| `daily-entry-input-overtime-100` | `<input type="number">` | Cantidad de horas al 100% |
| `daily-entry-input-shuttles` | `<input type="number">` | Cantidad de traslados |
| `daily-entry-input-meal` | `<input type="number">` | Importe de vianda ($) |
| `daily-entry-input-advance` | `<input type="number">` | Importe de anticipo ($) |
| `daily-entry-input-plus-delta` | `<input type="number">` | Importe de Plus Delta ($) |
| `daily-entry-checkbox-day-off` | `<input type="checkbox">` | Checkbox para marcar día de franco |
| `daily-entry-checkbox-approved` | `<input type="checkbox">` | Checkbox para marcar turno como aprobado en el alta |
| `daily-entry-btn-finalizar-turno-slideover` | `<button type="submit">` | Guardar registro y cerrar slideover |
| `daily-entry-btn-guardar-seguir` | `<button type="button">` | Guardar registro y mantener slideover abierto |

---

## 4. Módulo: Facturación y Proformas (`/invoicing`)
**Archivos:**
- [`src/app/(dashboard)/invoicing/page.tsx`](src/app/%28dashboard%29/invoicing/page.tsx)
- [`src/components/invoicing/CreateProformaSlideover.tsx`](src/components/invoicing/CreateProformaSlideover.tsx)

| data-testid | Elemento HTML | Ubicación | Propósito / Descripción |
|---|---|---|---|
| `invoicing-btn-nueva-proforma` | `<button>` | `/invoicing` Header | Abrir panel para emitir nueva proforma |
| `invoicing-btn-view-details` | `<button>` | `/invoicing` Tabla | Ver detalle / desglose de proforma |
| `invoicing-btn-facturar` | `<button>` | `/invoicing` Tabla | Abrir modal para asignar número de factura |
| `invoicing-btn-marcar-cobrada` | `<button>` | `/invoicing` Tabla | Marcar proforma facturada como cobrada (paid) |
| `invoicing-btn-delete-proforma` | `<button>` | `/invoicing` Tabla | Eliminar proforma en estado borrador |
| `invoicing-input-factura-numero` | `<input type="text">` | Modal Facturar | Campo para ingresar número oficial de factura |
| `invoicing-btn-confirmar-factura` | `<button>` | Modal Facturar | Confirmar transición a estado `invoiced` |
| `invoicing-select-client` | `<select>` | Slideover Alta | Selector de cliente a liquidar |
| `invoicing-select-model` | `<select>` | Slideover Alta | Estrategia de facturación (`vessel`, `fiscal_yard`, etc.) |
| `invoicing-input-from-date` | `<input type="date">` | Slideover Alta | Fecha inicial del período |
| `invoicing-input-to-date` | `<input type="date">` | Slideover Alta | Fecha final del período |
| `invoicing-input-fortnight-period` | `<select>` | Slideover Alta | Selector de quincena (1Q / 2Q) |
| `invoicing-input-discount` | `<input type="number">` | Slideover Alta | Porcentaje de descuento comercial aplicable |
| `invoicing-preview-subtotal` | `<span>` | Slideover Alta | Vista previa del subtotal calculado |
| `invoicing-preview-total` | `<span>` | Slideover Alta | Vista previa del total neto calculado |
| `invoicing-btn-emitir-proforma` | `<button>` | Slideover Alta | Botón para emitir la proforma definitiva |
| `invoicing-btn-copy-public-link` | `<button>` | `/invoicing` Tabla | Copiar enlace público directo al portapapeles |
| `invoicing-btn-open-public-link` | `<a>` | `/invoicing` Tabla | Abrir enlace público en nueva pestaña |
| `modal-btn-copy-public-link` | `<button>` | Modal Detalle | Copiar enlace público desde modal |
| `modal-btn-open-public-view` | `<a>` | Modal Detalle | Abrir enlace público desde modal |
| `modal-btn-download-csv` | `<button>` | Modal Detalle | Descargar detalle en archivo CSV (Excel) |
| `public-btn-copy-link` | `<button>` | Portal Público | Copiar enlace público en portal |
| `public-btn-download-csv` | `<button>` | Portal Público | Descargar proforma en CSV desde portal |
| `public-btn-download-pdf` | `<button>` | Portal Público | Descargar / Imprimir proforma en PDF desde portal |

---

## 5. Módulo: Liquidación de Sueldos (`/payroll`)
**Archivo:** [`src/app/(dashboard)/payroll/page.tsx`](src/app/%28dashboard%29/payroll/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `payroll-btn-preset-week` | `<button>` | Botón preset "Esta Semana" |
| `payroll-btn-preset-fortnight` | `<button>` | Botón preset "Esta Quincena" |
| `payroll-btn-preset-month` | `<button>` | Botón preset "Este Mes" |
| `payroll-btn-export-liquidacion` | `<button>` | Botón de exportación plana para contadora (CSV plano 5 columnas) |
| `payroll-btn-export-csv` | `<button>` | Botón de exportación a CSV (Pre-liquidación) |
| `payroll-kpi-personal-liquidado` | `<span>` | Tarjeta KPI: Cantidad de empleados liquidados |
| `payroll-kpi-total-bruto` | `<span>` | Tarjeta KPI: Total Sueldos Bruto ($) |
| `payroll-kpi-total-anticipos` | `<span>` | Tarjeta KPI: Total de Anticipos a descontar ($) |
| `payroll-kpi-total-neto` | `<span>` | Tarjeta KPI: Total Sueldos Neto ($) |

---

## 6. Módulo: Tarifario Comercial (`/rates`)
**Archivo:** [`src/app/(dashboard)/rates/page.tsx`](src/app/%28dashboard%29/rates/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `rates-btn-nueva-tarifa` | `<button>` | Botón de cabecera "Nueva Tarifa" para abrir slideover |
| `rates-btn-edit` | `<button>` | Botón en fila de tabla para editar tarifa existente |
| `rates-btn-delete` | `<button>` | Botón en fila de tabla para eliminar tarifa |
| `rates-select-client` | `<select>` | Slideover: Selector de cliente |
| `rates-select-position` | `<select>` | Slideover: Selector de puesto operativo |
| `rates-input-effective-from` | `<input type="date">` | Slideover: Fecha de entrada en vigencia |
| `rates-checkbox-auto-calculate` | `<input type="checkbox">` | Slideover: Checkbox cálculo automático 50% y 100% |
| `rates-input-regular` | `<input type="number">` | Slideover: Valor Hora Normal ($) |
| `rates-input-overtime-50` | `<input type="number">` | Slideover: Valor Hora 50% ($) |
| `rates-input-overtime-100` | `<input type="number">` | Slideover: Valor Hora 100% ($) |
| `rates-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar tarifa |

---

## 7. Módulo: Puestos y Funciones (`/positions`)
**Archivo:** [`src/app/(dashboard)/positions/page.tsx`](src/app/%28dashboard%29/positions/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `positions-btn-nuevo-puesto` | `<button>` | Botón de cabecera "Nuevo Puesto" |
| `positions-btn-assign-staff` | `<button>` | Botón en tarjeta para asignar personal |
| `positions-btn-view-rates` | `<Link>` | Botón en tarjeta para ver tarifas asociadas |
| `positions-btn-edit` | `<button>` | Botón en tarjeta para editar puesto |
| `positions-btn-delete` | `<button>` | Botón en tarjeta para eliminar puesto |
| `positions-input-name` | `<input type="text">` | Slideover: Nombre del puesto |
| `positions-checkbox-vehicle-bonus` | `<input type="checkbox">` | Slideover: Checkbox para habilitar Plus Vehicular CCT |
| `positions-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar puesto |

---

## 8. Módulo: Gestión de Empleados (`/employees`)
**Archivo:** [`src/app/(dashboard)/employees/page.tsx`](src/app/%28dashboard%29/employees/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `employees-btn-nuevo-empleado` | `<button>` | Botón de cabecera "Nuevo Operario" |
| `employees-btn-export-payroll` | `<button>` | Botón global "Exportar Liquidación" (reporte plano para contadora) |
| `employees-btn-auditar-horas` | `<button>` | Botón en fila con ícono de Ojo para abrir slideover de auditoría |
| `employees-slideover-audit` | `<div>` | Panel lateral (Slideover) de auditoría rápida de turnos y acumulados |
| `employees-btn-edit` | `<button>` | Botón en fila para editar datos del empleado |
| `employees-btn-delete` | `<button>` | Botón en fila para eliminar empleado |
| `employees-input-fullname` | `<input type="text">` | Slideover: Nombre completo |
| `employees-input-dni` | `<input type="text">` | Slideover: Número de DNI (único) |
| `employees-input-file-number` | `<input type="text">` | Slideover: Número de Legajo (único) |
| `employees-input-tax-id` | `<input type="text">` | Slideover: CUIL del empleado |
| `employees-select-position` | `<select>` | Slideover: Selector de Puesto predeterminado |
| `employees-input-phone` | `<input type="text">` | Slideover: Teléfono de contacto |
| `employees-select-status` | `<select>` | Slideover: Estado (Activo / Licencia / Inactivo) |
| `employees-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar empleado |


---

## 9. Módulo: Gestión de Clientes (`/clients`)
**Archivo:** [`src/app/(dashboard)/clients/page.tsx`](src/app/%28dashboard%29/clients/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `clients-btn-nuevo-cliente` | `<button>` | Botón de cabecera "Nuevo Cliente" |
| `clients-btn-edit` | `<button>` | Botón en fila para editar cliente |
| `clients-btn-delete` | `<button>` | Botón en fila para eliminar cliente |
| `clients-input-company-name` | `<input type="text">` | Slideover: Razón Social / Nombre Comercial |
| `clients-input-tax-id` | `<input type="text">` | Slideover: CUIT (11 dígitos numéricos sin guiones) |
| `clients-input-billing-email` | `<input type="email">` | Slideover: Correo electrónico de facturación |
| `clients-input-phone` | `<input type="text">` | Slideover: Teléfono de contacto |
| `clients-select-payment-due-days` | `<select>` | Slideover: Plazo de pago (7, 15, 30, 60, 90 días) |
| `clients-select-status` | `<select>` | Slideover: Estado (Activo / Inactivo) |
| `clients-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar cliente |

---

## 10. Módulo: Lugares de Trabajo (`/locations`)
**Archivo:** [`src/app/(dashboard)/locations/page.tsx`](src/app/%28dashboard%29/locations/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `locations-btn-nuevo-lugar` | `<button>` | Botón de cabecera "Nuevo Lugar de Trabajo" |
| `locations-btn-edit` | `<button>` | Botón en fila para editar lugar |
| `locations-btn-delete` | `<button>` | Botón en fila para eliminar lugar |
| `locations-input-code` | `<input type="text">` | Slideover: Código del lugar (ej. LDT-001) |
| `locations-input-name` | `<input type="text">` | Slideover: Nombre del lugar (ej. Muelle Norte 1) |
| `locations-input-port-city` | `<input type="text">` | Slideover: Puerto o Ciudad |
| `locations-select-status` | `<select>` | Slideover: Estado (Activo / En Mantenimiento / Inactivo) |
| `locations-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar lugar de trabajo |

---

## 11. Módulo: Flujo de Caja (`/cash-flow`)
**Archivo:** [`src/app/(dashboard)/cash-flow/page.tsx`](src/app/%28dashboard%29/cash-flow/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `cash-flow-btn-ver-proyecciones` | `<Link>` | Cabecera: Acceso exclusivo a la pantalla de Proyecciones (`/cash-flow/projections`) |
| `cash-flow-btn-nuevo-ingreso` | `<button>` | Botón rápido "Nuevo Ingreso" |
| `cash-flow-btn-nuevo-movimiento` | `<button>` | Botón principal de cabecera "Nuevo Movimiento" |
| `cash-flow-kpi-total-ingresos` | `<span>` | Tarjeta KPI: Total Ingresos acumulados del período |
| `cash-flow-kpi-total-egresos` | `<span>` | Tarjeta KPI: Total Egresos acumulados del período |
| `cash-flow-kpi-saldo-operativo` | `<span>` | Tarjeta KPI: Saldo Neto Operativo del período |
| `cash-flow-input-date` | `<input type="date">` | Slideover: Fecha del movimiento de caja |
| `cash-flow-select-type` | `<select>` | Slideover: Tipo de movimiento (income / expense) |
| `cash-flow-select-area` | `<select>` | Slideover: Área de imputación |
| `cash-flow-input-detail` | `<input type="text">` | Slideover: Concepto / detalle del movimiento |
| `cash-flow-input-amount` | `<input type="number">` | Slideover: Monto del movimiento ($) |
| `cash-flow-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar movimiento |

---

## 12. Módulo: Proyecciones de Flujo de Caja (`/cash-flow/projections`)
**Archivo:** [`src/app/(dashboard)/cash-flow/projections/page.tsx`](src/app/%28dashboard%29/cash-flow/projections/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `projections-btn-volver` | `<Link>` | Botón de retorno "← Volver a Flujo de Caja" |
| `projections-btn-nuevo-ingreso` | `<button>` | Cabecera: Abrir slideover para nuevo ingreso |
| `projections-btn-nuevo-movimiento` | `<button>` | Cabecera: Abrir slideover para nuevo egreso |
| `projections-kpi-ingresos` | `<p>` | Tarjeta KPI: Total ingresos proyectados de facturación |
| `projections-kpi-egresos` | `<p>` | Tarjeta KPI: Total egresos proyectados (sueldos, ARCA, ARBA, IVA, comisiones) |
| `projections-kpi-saldo-proyectado` | `<p>` | Tarjeta KPI: Saldo acumulado proyectado a la fecha X |
| `projections-input-target-date` | `<input type="date">` | Filtro: Selector de fecha de corte "Saldo para fecha X" |
| `projections-preset-fin-mes` | `<button>` | Preset rápido: Último día del mes actual |
| `projections-preset-quincena` | `<button>` | Preset rápido: Próxima quincena (15 o fin de mes) |
| `projections-preset-fin-prox-mes` | `<button>` | Preset rápido: Último día del próximo mes |
| `projections-preset-plus-30` | `<button>` | Preset rápido: +30 días hacia adelante |
| `projections-form-input-date` | `<input type="date">` | Slideover: Fecha del movimiento proyectado |
| `projections-form-select-category` | `<select>` | Slideover: Área / Concepto (ARCA, ARBA, IVA, Sueldos, Comisiones, etc.) |
| `projections-form-input-title` | `<input type="text">` | Slideover: Detalle o concepto del movimiento |
| `projections-form-input-amount` | `<input type="number">` | Slideover: Importe del movimiento ($) |
| `projections-btn-guardar-movimiento` | `<button type="submit">` | Slideover: Guardar movimiento en la proyección |
| `projections-btn-confirm-delete` | `<button>` | Modal: Confirmar eliminación de movimiento |

