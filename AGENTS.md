<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MTS Gestión Logística — AI Agent Directives

## 🏢 Project Overview
**MTS Gestión Logística** (desarrollado por Dibrand) es una plataforma web para automatizar la gestión operativa portuaria diaria, la facturación divisible quincenal (*Plazoleta Fiscal*), la liquidación de jornales/sueldos y el flujo de caja.

---

## 📚 Sources of Truth (Consultar antes de implementar código)

1. **Base de Conocimiento (Open Knowledge Format - OKF):**
   - **Índice raíz:** [`knowledge/index.md`](file:///home/carluis/Work/dibrand/mts/knowledge/index.md)
   - Todo agente **debe consultar** el directorio [`knowledge/`](file:///home/carluis/Work/dibrand/mts/knowledge) antes de modificar o crear lógica de negocio:
     - [`knowledge/domains/`](file:///home/carluis/Work/dibrand/mts/knowledge/domains) — Dominios funcionales (Operaciones portuarias, Plazoleta Fiscal, Sueldos, Flujo de Caja).
     - [`knowledge/datasets/`](file:///home/carluis/Work/dibrand/mts/knowledge/datasets) — Especificación de tablas y entidades (`daily_work_logs`, `proformas`, `union_bonus_scales`, etc.).
     - [`knowledge/rules/`](file:///home/carluis/Work/dibrand/mts/knowledge/rules) — Políticas críticas (bonificación gremial, corte quincenal de proformas, recordatorios Brevo).
     - [`knowledge/metrics/`](file:///home/carluis/Work/dibrand/mts/knowledge/metrics) — Fórmulas de cálculo (horas equivalentes, totales, plus delta).
     - [`knowledge/processes/`](file:///home/carluis/Work/dibrand/mts/knowledge/processes) — Runbooks y flujos operativos paso a paso.

2. **Arquitectura Técnica y Esquema de Base de Datos:**
   - [`CONTEXT.md`](file:///home/carluis/Work/dibrand/mts/CONTEXT.md) — Fuente técnica de verdad: esquema completo de PostgreSQL 17, enums, relaciones y mapa de rutas.

3. **Sistema de Diseño UI/UX:**
   - [`stitch_mts/DESIGN.md`](file:///home/carluis/Work/dibrand/mts/stitch_mts/DESIGN.md) — Especificación visual (App Shell inmutable, Sidebar `#0F2547`, MainContent `#F8FAFC`, paneles slideovers, contrastes B2B).

---

## 🛠️ Stack Tecnológico y Reglas de Desarrollo

- **Frontend:** Next.js 15+ (App Router, Server Actions, React Server Components).
- **Backend & DB:** Supabase PostgreSQL 17 utilizando `@supabase/ssr` (manejo de sesiones en Server, Client y Middleware).
- **Estilos:** Tailwind CSS v4 + Lucide Icons.
- **Idiomas y Convenciones:**
  - **Base de datos y Código:** Estrictamente en **inglés** (nombres de tablas, columnas, funciones, variables, types y commits).
  - **Interfaz de Usuario (UI):** Estrictamente en **español** (etiquetas, botones, tablas, notificaciones y reportes para el usuario final).
- **Reglas Operativas Clave:**
  - **Ordenamiento:** Toda grilla de partes de trabajo se ordena por `work_date ASC` (fecha operativa), nunca por `created_at`.
  - **Proformas Quincenales:** Se dividen en 3 conceptos independientes (`general_hours`, `shuttles`, `export_tallymen`).
  - **Carga Diaria:** Mantener retención de memoria (fecha, cliente, ubicación, horario) hasta que el usuario presione "Finalizar Turno".
