# MTS Gestión Logística - Suite de Casos de Prueba Verificada contra Código

Esta carpeta (`docs/test-cases/`) contiene la suite completa de casos de prueba manuales y funcionales para **MTS Gestión Logística**, reescrita y validada rigurosamente contra el código fuente del repositorio para garantizar su ejecución por agentes de Inteligencia Artificial en el navegador (Claude in Chrome) y scripts automatizados (SCRIPT).

---

## 📋 Índice de Documentación y Entregables

| Documento | Descripción / Propósito |
|---|---|
| [`SETUP.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/SETUP.md) | Configuración de `.env.test`, usuarios de test, seed, scripts y crons. |
| [`SUPUESTOS.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/SUPUESTOS.md) | 40 reglas de negocio verificadas con enlaces a archivos y líneas de código. |
| [`DISCREPANCIAS.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/DISCREPANCIAS.md) | 12 discrepancias detectadas (bugs, crons faltantes, brechas RLS, D-01/D-08). |
| [`TEST-IDS.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/TEST-IDS.md) | Catálogo completo de atributos `data-testid` incorporados al código fuente. |
| [`PLANTILLA-REPORTE.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/PLANTILLA-REPORTE.md) | Formato estandarizado de reporte de ejecución para agentes de testing. |

---

## 📂 Módulos de Casos de Prueba

| Módulo | Enfoque Principal | Casos | Ejecutor |
|---|---|---|---|
| [`01-autenticacion-y-permisos.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/01-autenticacion-y-permisos.md) | Login admin/auditor, sesiones, rutas protegidas, logout. | TC-AUTH-01 a TC-AUTH-06 | CHROME |
| [`02-seguridad-rls-y-apis.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/02-seguridad-rls-y-apis.md) | RLS Supabase, llamadas a `/api/*` sin sesión, mock Brevo. | TC-SEC-01 a TC-SEC-05 | SCRIPT |
| [`03-carga-diaria-de-horas.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/03-carga-diaria-de-horas.md) | Registro turnos, auto-cálculo CCT, sábados post-13hs, pernoctes. | TC-DAILY-01 a TC-DAILY-10 | CHROME & SCRIPT |
| [`04-facturacion-y-proformas.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/04-facturacion-y-proformas.md) | 4 estrategias de facturación, emisión, factura ARCA, paid. | TC-INV-01 a TC-INV-10 | CHROME & SCRIPT |
| [`05-calculo-de-sueldos.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/05-calculo-de-sueldos.md) | Bruto, retención anticipos, neto a cobrar, exportación CSV. | TC-PAY-01 a TC-PAY-05 | CHROME & SCRIPT |
| [`06-tarifarios-y-puestos.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/06-tarifarios-y-puestos.md) | Tarifas 1.5x / 2.0x, puestos con plus CCT, FKs en borrado. | TC-RATE-01 a TC-POS-02 | CHROME & SCRIPT |
| [`07-abm-personal-clientes-lugares.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/07-abm-personal-clientes-lugares.md) | Altas, modificaciones y validación de unicidad (DNI, CUIT, código). | TC-ABM-EMP-01 a TC-ABM-LOC-02 | CHROME |
| [`08-flujo-de-caja.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/08-flujo-de-caja.md) | Ingresos, egresos, saldo progresivo diario en fecha aislada. | TC-CASH-01 a TC-CASH-03 | CHROME |
| [`09-reportes-y-notificaciones.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/09-reportes-y-notificaciones.md) | Reportes, Brevo Mock, verificación cambio de contraseña. | TC-REP-01 a TC-USER-02 | CHROME & SCRIPT |

---

## 🤖 Guía Rápida para Agentes de Testing (Claude in Chrome)

1. **Credenciales de inicio:**
   - Administrador: `zztest-admin@example.com` / `ZztestPass123!`
   - Auditor: `zztest-auditor@example.com` / `ZztestPass123!`
2. **Convención de Selectores:**
   - Todos los elementos clave cuentan con su atributo `data-testid` (ver catálogo en [`TEST-IDS.md`](file:///home/carluis/Work/dibrand/mts/docs/test-cases/TEST-IDS.md)).
   - No usar clases CSS ni selectores posicionales frágiles.
3. **Aislamiento:**
   - Operar únicamente con entidades y prefijo `ZZTEST-`.
   - Jamás modificar ni eliminar registros de clientes o datos reales de la base.
