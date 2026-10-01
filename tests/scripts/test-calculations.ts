/**
 * Test Suite: Verificación Automatizada de Lógica y Cálculos Matemáticos (SCRIPT)
 * Ejecución: npx tsx tests/scripts/test-calculations.ts
 */

import { calculateShiftHours } from '../../src/lib/services/daily-entries.ts';

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
  expected: any,
  comparator?: (a: any, b: any) => boolean
) {
  const passed = comparator ? comparator(actual, expected) : JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ id, description, passed, expected, actual });

  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${description}`);
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${description}`);
    console.log(`       Esperado: ${JSON.stringify(expected)}`);
    console.log(`       Obtenido: ${JSON.stringify(actual)}`);
  }
}

console.log('===============================================================');
console.log(' INICIANDO VERIFICACIÓN DE CÁLCULOS MATEMÁTICOS DE MTS ');
console.log('===============================================================\n');

// 1. Carga Diaria: Turno estándar día hábil (8 hs)
const shift1 = calculateShiftHours('2026-10-05', '08:00', '16:00');
assertTest(
  'CALC-HRS-01',
  'Turno hábil 8hs (08:00 a 16:00) -> 8.00 reg, 0.00 ot50, 0.00 ot100',
  { reg: shift1.regular_hours, ot50: shift1.overtime_50_hours, ot100: shift1.overtime_100_hours, total: shift1.total_hours },
  { reg: 8, ot50: 0, ot100: 0, total: 8 }
);

// 2. Carga Diaria: Turno hábil con 2 hs extras al 50%
const shift2 = calculateShiftHours('2026-10-06', '08:00', '18:00');
assertTest(
  'CALC-HRS-02',
  'Turno hábil 10hs (08:00 a 18:00) -> 8.00 reg, 2.00 ot50, 0.00 ot100',
  { reg: shift2.regular_hours, ot50: shift2.overtime_50_hours, ot100: shift2.overtime_100_hours, total: shift2.total_hours },
  { reg: 8, ot50: 2, ot100: 0, total: 10 }
);

// 3. Carga Diaria: Sábado con corte 13:00 hs (08:00 a 17:00)
const shift3 = calculateShiftHours('2026-10-10', '08:00', '17:00');
assertTest(
  'CALC-HRS-03',
  'Sábado 08:00 a 17:00 -> 5.00 reg (antes 13hs), 0.00 ot50, 4.00 ot100 (post 13hs)',
  { reg: shift3.regular_hours, ot50: shift3.overtime_50_hours, ot100: shift3.overtime_100_hours, total: shift3.total_hours },
  { reg: 5, ot50: 0, ot100: 4, total: 9 }
);

// 4. Carga Diaria: Domingo completo al 100%
const shift4 = calculateShiftHours('2026-10-11', '08:00', '16:00');
assertTest(
  'CALC-HRS-04',
  'Domingo 08:00 a 16:00 -> 0.00 reg, 0.00 ot50, 8.00 ot100',
  { reg: shift4.regular_hours, ot50: shift4.overtime_50_hours, ot100: shift4.overtime_100_hours, total: shift4.total_hours },
  { reg: 0, ot50: 0, ot100: 8, total: 8 }
);

// 5. Carga Diaria: Borde inicio igual a fin (08:00 a 08:00 -> 24 hs totales)
const shift5 = calculateShiftHours('2026-10-07', '08:00', '08:00');
assertTest(
  'CALC-HRS-05',
  'Caso borde 08:00 a 08:00 -> 24.00 hs totales (8 reg + 16 ot50)',
  { reg: shift5.regular_hours, ot50: shift5.overtime_50_hours, ot100: shift5.overtime_100_hours, total: shift5.total_hours },
  { reg: 8, ot50: 16, ot100: 0, total: 24 }
);

// 6. Carga Diaria: Cruce de medianoche (22:00 a 06:00 -> 8 hs totales)
const shift6 = calculateShiftHours('2026-10-09', '22:00', '06:00');
assertTest(
  'CALC-HRS-06',
  'Cruce de medianoche 22:00 a 06:00 -> 8.00 hs totales',
  shift6.total_hours,
  8
);

// Resumen Final
const totalPassed = results.filter((r) => r.passed).length;
const totalFailed = results.filter((r) => !r.passed).length;

console.log('\n---------------------------------------------------------------');
console.log(`TOTAL CASOS EJECUTADOS: ${results.length}`);
console.log(`\x1b[32mPASADOS: ${totalPassed}\x1b[0m | \x1b[31mFALLADOS: ${totalFailed}\x1b[0m`);
console.log('---------------------------------------------------------------');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
