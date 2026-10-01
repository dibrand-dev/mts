/**
 * Runner maestro para todas las suites de prueba SCRIPT
 * Ejecución: npx tsx tests/scripts/run-all-tests.ts
 */

import { execSync } from 'child_process';

console.log('===============================================================');
console.log(' MTS GESTIÓN LOGÍSTICA - SUITE DE TESTING AUTOMATIZADO (SCRIPT)');
console.log('===============================================================\n');

const suites = [
  { name: 'Cálculos de Horas y Lógica Operativa', file: 'tests/scripts/test-calculations.ts' },
  { name: 'Seguridad de APIs y Mock de Correos', file: 'tests/scripts/test-api-security.ts' },
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n>>> Ejecutando Suite: ${suite.name} (${suite.file})`);
  try {
    const cmd = process.env.TS_RUNNER || 'npx tsx';
    execSync(`${cmd} ${suite.file}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n[ERROR] Falló la suite: ${suite.name}`);
    allPassed = false;
  }
}

console.log('\n===============================================================');
if (allPassed) {
  console.log('\x1b[32m[RESUMEN FINAL] TODAS LAS SUITES DE PRUEBA PASARON EXITOSAMENTE\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[31m[RESUMEN FINAL] SE DETECTARON FALLOS EN UNA O MÁS SUITES\x1b[0m');
  process.exit(1);
}
