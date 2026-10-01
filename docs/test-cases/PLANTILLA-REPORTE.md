# Plantilla Estructurada de Reporte de Ejecución (QA AI Agent)

Esta plantilla define el formato estandarizado que el agente de IA en browser (Claude in Chrome u otro ejecutor automatizado) debe generar tras ejecutar cada caso de prueba o suite completa.

---

## 1. Encabezado de la Sesión de Pruebas

```markdown
# Reporte de Ejecución de Pruebas QA - MTS Gestión Logística

- **Fecha y Hora de Inicio:** YYYY-MM-DD HH:MM:SS (UTC-3)
- **Fecha y Hora de Fin:** YYYY-MM-DD HH:MM:SS (UTC-3)
- **Ejecutor:** Agente Browser (Claude in Chrome) / Script de Servicio
- **Ambiente:** Localhost:3000 -> Supabase Pre-lanzamiento
- **Usuario de Sesión:** zztest-admin@example.com / zztest-auditor@example.com
- **Versión/Commit del Código:** <git-commit-hash>
- **Modo de Correo (Brevo):** MOCK SEGURO (BREVO_API_KEY="")
```

---

## 2. Resumen Métrico de Ejecución

```markdown
| Total Casos | Aprobados (PASS) | Fallidos (FAIL) | Bloqueados (BLOCKED) | Tasa de Éxito |
| :---: | :---: | :---: | :---: | :---: |
| 45 | 42 | 2 | 1 | 93.3% |
```

---

## 3. Formato Detallado por Caso de Prueba

Para cada caso ejecutado, el agente debe reportar un bloque con la siguiente estructura exacta:

### Ejemplo: Caso Exitoso (PASS)

```markdown
### [PASS] TC-AUTH-01 · Inicio de sesión exitoso con credenciales válidas
- **Módulo:** Autenticación y Control de Acceso
- **Prioridad:** P0
- **Ejecutor:** CHROME
- **Resultado:** PASS
- **URL Final:** http://localhost:3000/
- **Valores Observados:**
  - Botón o avatar con iniciales visible en la barra superior.
  - Título visible: "Tablero Principal".
- **Errores de Consola:** Ninguno.
- **Observaciones:** Redirección automática ejecutada en < 1.5s.
```

---

### Ejemplo: Caso Fallido (FAIL)

```markdown
### [FAIL] TC-DAILY-04 · Cálculo de turno nocturno que cruza a sábado post-13:00
- **Módulo:** Carga Diaria de Horas
- **Prioridad:** P0
- **Ejecutor:** CHROME
- **Resultado:** FAIL
- **Paso donde falló:** Paso 6: Verificación de horas en la tabla de turnos.
- **URL Final:** http://localhost:3000/daily-entry
- **Valor Esperado:** 
  - Hs Norm: 0.0
  - Hs 50%: 0.0
  - Hs 100%: 8.0 (Cálculo: Turno sábado 12:00 a 20:00 -> 1h pre-13:00 normal, 7h post-13:00 al 100%)
- **Valor Observado:** 
  - Hs Norm: 8.0
  - Hs 50%: 0.0
  - Hs 100%: 0.0
- **Texto / Pantalla Visto:**
  - Fila del operario "ZZTEST-Operario Juan Pérez" muestra "8.0" en columna verde "Hs. Norm" y "0.0" en columna "Hs. 100%".
- **Errores de Consola Observados:** Ninguno.
- **Causa Raíz Identificada:** Discrepancia D-01 documentada en DISCREPANCIAS.md (`calculateShiftHours` no segmenta correctamente el cruce de corte).
```

---

### Ejemplo: Caso Bloqueado (BLOCKED)

```markdown
### [BLOCKED] TC-INV-08 · Caducidad automática de proforma a los 5 días
- **Módulo:** Facturación y Proformas
- **Prioridad:** P1
- **Ejecutor:** SCRIPT
- **Resultado:** BLOCKED
- **Paso donde falló:** Paso 1: Disparo del cron de caducidad.
- **URL / Endpoint:** /api/cron/expire-proformas
- **Valor Esperado:** Endpoint retorna 200 y actualiza proforma de 'sent' a 'approved'.
- **Valor Observado:** HTTP 404 Not Found (Ruta no existe en Next.js).
- **Causa Raíz:** Discrepancia D-04 documentada en DISCREPANCIAS.md (el cron job no está implementado en la aplicación).
```

---

## 4. Estructura de Campos Obligatorios para Automatización

Todo reporte parseable por otras IAs debe respetar este esquema JSON opcional o campos clave en Markdown:

```json
{
  "test_id": "TC-AUTH-01",
  "module": "Autenticación",
  "status": "PASS | FAIL | BLOCKED",
  "failed_step": null,
  "expected": "Texto o valor exacto",
  "actual": "Texto o valor visto en pantalla",
  "final_url": "http://localhost:3000/...",
  "console_errors": [],
  "notes": "Comentarios de ejecución"
}
```
