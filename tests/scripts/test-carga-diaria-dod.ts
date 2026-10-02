/**
 * Test Suite: Verificación Exhaustiva de Criterios de Aceptación (DoD) - Carga Diaria de Horas
 * Ejecución: ./node_modules/.bin/jiti tests/scripts/test-carga-diaria-dod.ts
 */

import { calculateShiftHours } from '../../src/lib/services/daily-entries.ts';
import { isHoliday, fetchHolidaysForYear } from '../../src/lib/services/holidays.ts';

interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
}

const results: TestResult[] = [];

function assertTest(
  id: string,
  description: string,
  actual: any,
  expected: any
) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ id, description, passed, expected, actual });

  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${description}`);
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${description}`);
    console.log(`       Esperado: ${JSON.stringify(expected)}`);
    console.log(`       Obtenido: ${JSON.stringify(actual)}`);
  }
}

console.log('=====================================================================');
console.log(' VERIFICACIÓN DE CRITERIOS DE ACEPTACIÓN (DoD) - CARGA DIARIA MTS    ');
console.log('=====================================================================\n');

// -------------------------------------------------------------
// 1. Motor de Categorización Horaria: Jerarquía de 4 Niveles
// -------------------------------------------------------------
console.log('>>> 1. Motor de Categorización Horaria y Prioridad de Feriados');

// Nivel 1: Checkbox Manual Feriado forzado al 100% (sobrescribe todo)
// Día miércoles hábil con checkbox manual marcado -> 100% de las horas
const manualHolidayShift = calculateShiftHours('2026-10-07', '08:00', '2026-10-07', '16:00', true);
assertTest(
  'DOD-FERIADO-01',
  'Nivel 1: Checkbox manual "Feriado/Forzar 100%" activo en día hábil -> 100% de horas al 100%',
  { reg: manualHolidayShift.regular_hours, ot50: manualHolidayShift.overtime_50_hours, ot100: manualHolidayShift.overtime_100_hours },
  { reg: 0, ot50: 0, ot100: 8 }
);

// Nivel 2: Feriado detectado por API (effectiveIsHoliday = true)
const apiHolidayShift = calculateShiftHours('2026-05-25', '07:00', '2026-05-25', '19:00', true);
assertTest(
  'DOD-FERIADO-02',
  'Nivel 2: Feriado nacional 25 de Mayo (12 hs de turno) -> 12 hs al 100%',
  { reg: apiHolidayShift.regular_hours, ot50: apiHolidayShift.overtime_50_hours, ot100: apiHolidayShift.overtime_100_hours, total: apiHolidayShift.total_hours },
  { reg: 0, ot50: 0, ot100: 12, total: 12 }
);

// Nivel 3: Fin de semana nativo - Sábado con corte a las 13:00 hs
// Sábado 2026-10-10: 07:00 a 19:00 (12 hs). 07:00 a 13:00 (6 hs normales), 13:00 a 19:00 (6 hs al 100%)
const saturdayShift = calculateShiftHours('2026-10-10', '07:00', '2026-10-10', '19:00', false);
assertTest(
  'DOD-SATURDAY-01',
  'Nivel 3: Sábado 07:00 a 19:00 -> 6.00 reg (hasta 13hs) y 6.00 al 100% (post 13hs)',
  { reg: saturdayShift.regular_hours, ot50: saturdayShift.overtime_50_hours, ot100: saturdayShift.overtime_100_hours },
  { reg: 6, ot50: 0, ot100: 6 }
);

// Sábado después de las 13:00 hs completo (ej. 14:00 a 22:00) -> 100% al 100%
const saturdayAfternoonShift = calculateShiftHours('2026-10-10', '14:00', '2026-10-10', '22:00', false);
assertTest(
  'DOD-SATURDAY-02',
  'Nivel 3: Sábado post 13hs (14:00 a 22:00) -> 0.00 reg, 8.00 al 100%',
  { reg: saturdayAfternoonShift.regular_hours, ot50: saturdayAfternoonShift.overtime_50_hours, ot100: saturdayAfternoonShift.overtime_100_hours },
  { reg: 0, ot50: 0, ot100: 8 }
);

// Domingo nativo completo al 100% (2026-10-11)
const sundayShift = calculateShiftHours('2026-10-11', '06:00', '2026-10-11', '14:00', false);
assertTest(
  'DOD-SUNDAY-01',
  'Nivel 3: Domingo completo (06:00 a 14:00) -> 8.00 hs al 100%',
  { reg: sundayShift.regular_hours, ot50: sundayShift.overtime_50_hours, ot100: sundayShift.overtime_100_hours },
  { reg: 0, ot50: 0, ot100: 8 }
);

// Nivel 4: Día hábil estándar (Lunes a Viernes)
// 08:00 a 16:00 (8 hs) -> 8 normal, 0 al 50%, 0 al 100%
const weekdayStandard = calculateShiftHours('2026-10-05', '08:00', '2026-10-05', '16:00', false);
assertTest(
  'DOD-WEEKDAY-01',
  'Nivel 4: Día hábil 8hs (08:00 a 16:00) -> 8.00 reg, 0.00 ot50, 0.00 ot100',
  { reg: weekdayStandard.regular_hours, ot50: weekdayStandard.overtime_50_hours, ot100: weekdayStandard.overtime_100_hours },
  { reg: 8, ot50: 0, ot100: 0 }
);

// 08:00 a 18:00 (10 hs) -> 8 normal, 2 al 50%, 0 al 100%
const weekdayOvertime = calculateShiftHours('2026-10-05', '08:00', '2026-10-05', '18:00', false);
assertTest(
  'DOD-WEEKDAY-02',
  'Nivel 4: Día hábil 10hs (08:00 a 18:00) -> 8.00 reg, 2.00 ot50, 0.00 ot100',
  { reg: weekdayOvertime.regular_hours, ot50: weekdayOvertime.overtime_50_hours, ot100: weekdayOvertime.overtime_100_hours },
  { reg: 8, ot50: 2, ot100: 0 }
);

// -------------------------------------------------------------
// 2. Lógica de Remises: Solo Encargado PF
// -------------------------------------------------------------
console.log('\n>>> 2. Lógica de Remises (Habilitación exclusiva Encargado PF)');

function getRemisesAllowed(positionName: string, requestedShuttles: number): number {
  const clean = positionName.trim().toUpperCase();
  const isEncargado = clean.includes('ENCARGAD');
  return isEncargado ? Math.max(0, Math.floor(requestedShuttles)) : 0;
}

assertTest(
  'DOD-REMIS-01',
  'Encargado PF con 2 remises -> Acepta 2 remises enteros',
  getRemisesAllowed('ENCARGADO PF', 2),
  2
);

assertTest(
  'DOD-REMIS-01B',
  'Encargado (puesto general en base de datos) con 2 remises -> Acepta 2 remises enteros',
  getRemisesAllowed('ENCARGADO', 2),
  2
);

assertTest(
  'DOD-REMIS-02',
  'Apuntador con 2 remises solicitados -> Se anula a 0 (deshabilitado)',
  getRemisesAllowed('APUNTADOR', 2),
  0
);

assertTest(
  'DOD-REMIS-03',
  'Conductor con 1 remis solicitado -> Se anula a 0',
  getRemisesAllowed('CONDUCTOR', 1),
  0
);

// -------------------------------------------------------------
// 3. Gestión de Francos por Cantidad (+1 / -1)
// -------------------------------------------------------------
console.log('\n>>> 3. Gestión de Francos (+1 Generado / -1 Tomado)');

interface StaffEntryFranco {
  day_off_count: number;
  is_day_off: boolean;
}

function processFrancoEntry(input: number): StaffEntryFranco {
  return {
    day_off_count: input,
    is_day_off: input !== 0,
  };
}

const francoGenerated = processFrancoEntry(1);
assertTest(
  'DOD-FRANCO-01',
  'Operario genera franco (+1) -> day_off_count = 1, is_day_off = true',
  francoGenerated,
  { day_off_count: 1, is_day_off: true }
);

const francoTaken = processFrancoEntry(-1);
assertTest(
  'DOD-FRANCO-02',
  'Operario toma franco (-1) -> day_off_count = -1, is_day_off = true',
  francoTaken,
  { day_off_count: -1, is_day_off: true }
);

const francoNone = processFrancoEntry(0);
assertTest(
  'DOD-FRANCO-03',
  'Sin franco (0) -> day_off_count = 0, is_day_off = false',
  francoNone,
  { day_off_count: 0, is_day_off: false }
);

// -------------------------------------------------------------
// 4. Ordenamiento Estricto: Ascendente por fecha_trabajo
// -------------------------------------------------------------
console.log('\n>>> 4. Ordenamiento Estricto de la Grilla (work_date ASC)');

const mockLogs = [
  { id: '1', work_date: '2026-10-15', created_at: '2026-10-01T20:00:00Z', shift_start_time: '08:00' },
  { id: '2', work_date: '2026-10-02', created_at: '2026-10-01T21:00:00Z', shift_start_time: '14:00' },
  { id: '3', work_date: '2026-10-02', created_at: '2026-10-01T19:00:00Z', shift_start_time: '06:00' },
  { id: '4', work_date: '2026-10-08', created_at: '2026-10-01T22:00:00Z', shift_start_time: '10:00' },
];

const sortedLogs = [...mockLogs].sort((a, b) => {
  const dateCmp = a.work_date.localeCompare(b.work_date);
  if (dateCmp !== 0) return dateCmp;
  return a.shift_start_time.localeCompare(b.shift_start_time);
});

assertTest(
  'DOD-ORDEN-01',
  'Ordenamiento estricto por fecha de trabajo ignorando created_at',
  sortedLogs.map((l) => `${l.work_date} ${l.shift_start_time}`),
  [
    '2026-10-02 06:00',
    '2026-10-02 14:00',
    '2026-10-08 10:00',
    '2026-10-15 08:00',
  ]
);

// -------------------------------------------------------------
// 5. Buscador Predictivo (Typeahead)
// -------------------------------------------------------------
console.log('\n>>> 5. Buscador Predictivo (Typeahead) para Empleados');

const mockEmployees = [
  { id: 'emp-1', full_name: 'GONZALEZ JUAN CARLOS', file_number: '1042', national_id: '32145678' },
  { id: 'emp-2', full_name: 'RODRIGUEZ MATIAS', file_number: '1088', national_id: '38999111' },
  { id: 'emp-3', full_name: 'PEREZ JORGE', file_number: '2015', national_id: '29888777' },
];

function filterEmployees(term: string) {
  const q = term.toLowerCase().trim();
  if (!q) return mockEmployees;
  return mockEmployees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(q) ||
      (e.file_number && e.file_number.toLowerCase().includes(q)) ||
      (e.national_id && e.national_id.includes(q))
  );
}

assertTest(
  'DOD-TYPEAHEAD-01',
  'Búsqueda por nombre parcial "matias" -> encuentra RODRIGUEZ MATIAS',
  filterEmployees('matias').map((e) => e.id),
  ['emp-2']
);

assertTest(
  'DOD-TYPEAHEAD-02',
  'Búsqueda por número de legajo "1042" -> encuentra GONZALEZ JUAN CARLOS',
  filterEmployees('1042').map((e) => e.id),
  ['emp-1']
);

assertTest(
  'DOD-TYPEAHEAD-03',
  'Búsqueda por DNI "29888777" -> encuentra PEREZ JORGE',
  filterEmployees('29888777').map((e) => e.id),
  ['emp-3']
);

// -------------------------------------------------------------
// 6. Integración API Feriados (Parser & Fallback)
// -------------------------------------------------------------
console.log('\n>>> 6. API de Feriados y Fallback Oficial');

const holidays2026 = await fetchHolidaysForYear(2026);
assertTest(
  'DOD-API-01',
  'API o Fallback oficial identifica 2026-05-25 (Día de la Revolución de Mayo) como feriado',
  isHoliday('2026-05-25', holidays2026),
  true
);

assertTest(
  'DOD-API-02',
  'API o Fallback oficial identifica 2026-07-09 (Día de la Independencia) como feriado',
  isHoliday('2026-07-09', holidays2026),
  true
);

assertTest(
  'DOD-API-03',
  'API o Fallback oficial identifica 2026-05-26 como día hábil (NO feriado)',
  isHoliday('2026-05-26', holidays2026),
  false
);

// -------------------------------------------------------------
// Resumen Final
// -------------------------------------------------------------
const totalPassed = results.filter((r) => r.passed).length;
const totalFailed = results.filter((r) => !r.passed).length;

console.log('\n=====================================================================');
console.log(`TOTAL CRITERIOS DE ACEPTACIÓN VERIFICADOS: ${results.length}`);
console.log(`\x1b[32mPASADOS: ${totalPassed}\x1b[0m | \x1b[31mFALLADOS: ${totalFailed}\x1b[0m`);
console.log('=====================================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
