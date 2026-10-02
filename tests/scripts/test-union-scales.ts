/**
 * Test Suite: Verificación Automatizada de Escalas CCT y Cálculo Invisible (SCRIPT)
 * Ejecución: npx tsx tests/scripts/test-union-scales.ts
 */

import {
  calculateBonusForVehicles,
  DEFAULT_UNION_SCALES,
} from '../../src/lib/services/union-scales.ts';
import { unionBonusScaleSchema } from '../../src/lib/schemas/union-scales.ts';

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
  const passed = comparator
    ? comparator(actual, expected)
    : JSON.stringify(actual) === JSON.stringify(expected);

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
console.log(' INICIANDO VERIFICACIÓN DE ESCALAS DINÁMICAS CCT Y CÁLCULO INVISIBLE ');
console.log('===============================================================\n');

// 1. Caso base: 0 o negativo no asigna bonus
assertTest(
  'SCALE-01',
  '0 unidades operadas -> 0.00 bonificación',
  calculateBonusForVehicles(0, DEFAULT_UNION_SCALES, '2026-10-02'),
  0
);

assertTest(
  'SCALE-02',
  'Unidades negativas (-50) -> 0.00 bonificación',
  calculateBonusForVehicles(-50, DEFAULT_UNION_SCALES, '2026-10-02'),
  0
);

// 2. Tramo inicial: 0 a 1499 unidades = $88.200,48
assertTest(
  'SCALE-03',
  '1200 unidades (tramo 0 - 1499) -> $88.200,48',
  calculateBonusForVehicles(1200, DEFAULT_UNION_SCALES, '2026-10-02'),
  88200.48
);

assertTest(
  'SCALE-04',
  '1499 unidades (límite superior tramo 0 - 1499) -> $88.200,48',
  calculateBonusForVehicles(1499, DEFAULT_UNION_SCALES, '2026-10-02'),
  88200.48
);

// 3. Tramo del criterio DoD: 1800 unidades = $102.015,99 (tramo 1500 - 1999)
assertTest(
  'SCALE-05 (DoD)',
  'Al tipear 1800 unidades operadas -> Nivel CCT asignado exactamente $102.015,99',
  calculateBonusForVehicles(1800, DEFAULT_UNION_SCALES, '2026-10-02'),
  102015.99
);

assertTest(
  'SCALE-06',
  '1500 unidades (límite inferior tramo 1500 - 1999) -> $102.015,99',
  calculateBonusForVehicles(1500, DEFAULT_UNION_SCALES, '2026-10-02'),
  102015.99
);

assertTest(
  'SCALE-07',
  '1999 unidades (límite superior tramo 1500 - 1999) -> $102.015,99',
  calculateBonusForVehicles(1999, DEFAULT_UNION_SCALES, '2026-10-02'),
  102015.99
);

// 4. Tramos superiores
assertTest(
  'SCALE-08',
  '2200 unidades (tramo 2000 - 2499) -> $118.540,55',
  calculateBonusForVehicles(2200, DEFAULT_UNION_SCALES, '2026-10-02'),
  118540.55
);

assertTest(
  'SCALE-09',
  '2800 unidades (tramo 2500 - 2999) -> $135.065,11',
  calculateBonusForVehicles(2800, DEFAULT_UNION_SCALES, '2026-10-02'),
  135065.11
);

assertTest(
  'SCALE-10',
  '3500 unidades (tramo 3000+) -> $155.000,00',
  calculateBonusForVehicles(3500, DEFAULT_UNION_SCALES, '2026-10-02'),
  155000.00
);

// 5. Validación de Vigencia Temporal: escala futura no aplica a fecha pasada
const timeScales = [
  { min_vehicles: 0, max_vehicles: 1499, bonus_amount: 80000.00, effective_from: '2026-01-01' },
  { min_vehicles: 0, max_vehicles: 1499, bonus_amount: 88200.48, effective_from: '2026-06-01' },
  { min_vehicles: 0, max_vehicles: 1499, bonus_amount: 95000.00, effective_from: '2026-12-01' },
];

assertTest(
  'SCALE-TIME-01',
  'Vigencia: Turno en mayo 2026 toma escala vigente de enero ($80.000,00)',
  calculateBonusForVehicles(1000, timeScales, '2026-05-15'),
  80000.00
);

assertTest(
  'SCALE-TIME-02',
  'Vigencia: Turno en agosto 2026 toma escala vigente de junio ($88.200,48)',
  calculateBonusForVehicles(1000, timeScales, '2026-08-15'),
  88200.48
);

// 6. Validación de Esquema Zod
const validScaleData = {
  min_vehicles: 0,
  max_vehicles: 1499,
  bonus_amount: 88200.48,
  effective_from: '2026-10-01',
};
const parsedValid = unionBonusScaleSchema.safeParse(validScaleData);
assertTest(
  'ZOD-SCALE-01',
  'Validación Zod: Rango válido (0 a 1499, $88.200,48) pasa correctamente',
  parsedValid.success,
  true
);

const invalidRangeData = {
  min_vehicles: 2000,
  max_vehicles: 1500, // max < min
  bonus_amount: 100000,
  effective_from: '2026-10-01',
};
const parsedInvalid = unionBonusScaleSchema.safeParse(invalidRangeData);
assertTest(
  'ZOD-SCALE-02',
  'Validación Zod: Rango inválido (max < min) es rechazado',
  parsedInvalid.success,
  false
);

// 7. Simulación de Cruce de Puesto con `requires_vehicle_bonus`
const positionEncargado = { name: 'Encargado', requires_vehicle_bonus: true };
const positionApuntador = { name: 'Apuntador', requires_vehicle_bonus: false };
const testUnits = 1800;

const bonusForEncargado = positionEncargado.requires_vehicle_bonus
  ? calculateBonusForVehicles(testUnits, DEFAULT_UNION_SCALES, '2026-10-02')
  : 0;

const bonusForApuntador = positionApuntador.requires_vehicle_bonus
  ? calculateBonusForVehicles(testUnits, DEFAULT_UNION_SCALES, '2026-10-02')
  : 0;

assertTest(
  'CROSS-POS-01',
  'Puesto Encargado (requires_vehicle_bonus=true) con 1800u -> Recibe $102.015,99',
  bonusForEncargado,
  102015.99
);

assertTest(
  'CROSS-POS-02',
  'Puesto Apuntador (requires_vehicle_bonus=false) con 1800u -> Recibe $0.00',
  bonusForApuntador,
  0
);

console.log('\n---------------------------------------------------------------');
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;
console.log(`TOTAL CASOS EJECUTADOS: ${results.length}`);
console.log(`PASADOS: ${passedCount} | FALLADOS: ${failedCount}`);
console.log('---------------------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
}
