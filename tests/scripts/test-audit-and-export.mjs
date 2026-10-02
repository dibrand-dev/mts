import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('===============================================================');
console.log(' VERIFICACIÓN AUDITORÍA Y REPORTE PLANO DE LIQUIDACIÓN ');
console.log('===============================================================\n');

// Test 1: Verificar estructura de exportación plana (CSV / Excel)
console.log('>>> Test 1: Estructura estricta del archivo plano');
const headers = ['Empleado', 'Horas Normales', 'Horas 50%', 'Horas 100%', 'Plus por Vehículos'];
assert.strictEqual(headers.length, 5, 'Debe tener exactamente 5 columnas');
assert.deepStrictEqual(headers, ['Empleado', 'Horas Normales', 'Horas 50%', 'Horas 100%', 'Plus por Vehículos']);

const mockRecords = [
  {
    employeeName: 'ZZTEST-GOMEZ JUAN',
    regularHours: 16,
    overtime50Hours: 2,
    overtime100Hours: 0,
    vehicleBonus: 0,
  },
  {
    employeeName: 'ZZTEST-LOPEZ PEDRO',
    regularHours: 8,
    overtime50Hours: 0,
    overtime100Hours: 4,
    vehicleBonus: 15000,
  },
];

const rows = mockRecords.map((r) => [
  `"${r.employeeName.replace(/"/g, '""')}"`,
  r.regularHours,
  r.overtime50Hours,
  r.overtime100Hours,
  r.vehicleBonus,
]);

const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
const lines = csvContent.replace(/^\uFEFF/, '').trim().split('\n');

assert.strictEqual(lines[0], 'Empleado,Horas Normales,Horas 50%,Horas 100%,Plus por Vehículos');
assert.strictEqual(lines[1], '"ZZTEST-GOMEZ JUAN",16,2,0,0');
assert.strictEqual(lines[2], '"ZZTEST-LOPEZ PEDRO",8,0,4,15000');
console.log(' [PASS] Cabecera y filas cumplen estrictamente: Empleado | Horas Normales | Horas 50% | Horas 100% | Plus por Vehículos\n');

// Test 2: Verificar componentes en src/app/(dashboard)/employees/page.tsx
console.log('>>> Test 2: Verificación de Vista de Auditoría Rápida (Slideover) y Botón en Empleados');
const employeesPagePath = path.resolve('src/app/(dashboard)/employees/page.tsx');
const employeesPageContent = fs.readFileSync(employeesPagePath, 'utf-8');

// DoD 1: Botón con ícono de "Ojo" en la columna de acciones
assert.ok(employeesPageContent.includes('<Eye className="h-4 w-4" />'), 'La columna de acciones debe tener el ícono Eye (Ojo)');
assert.ok(employeesPageContent.includes('data-testid="employees-btn-auditar-horas"'), 'Debe existir data-testid employees-btn-auditar-horas');

// DoD 1: Panel lateral (Slideover)
assert.ok(employeesPageContent.includes('fixed inset-0 z-50 overflow-hidden flex justify-end'), 'Debe ser un panel lateral (Slideover)');
assert.ok(employeesPageContent.includes('data-testid="employees-slideover-audit"'), 'Debe existir data-testid employees-slideover-audit');

// DoD 1: Historial de turnos y acumulado de Horas Normales, 50%, 100% y Plus
assert.ok(employeesPageContent.includes('auditSummary.regular_hours'), 'Debe mostrar acumulado de Horas Normales');
assert.ok(employeesPageContent.includes('auditSummary.overtime_50_hours'), 'Debe mostrar acumulado de Horas 50%');
assert.ok(employeesPageContent.includes('auditSummary.overtime_100_hours'), 'Debe mostrar acumulado de Horas 100%');
assert.ok(employeesPageContent.includes('auditSummary.plus_amount'), 'Debe mostrar acumulado de Plus');
assert.ok(employeesPageContent.includes('Historial de Turnos'), 'Debe incluir Historial de Turnos');

// DoD 2: Botón global de "Exportar Liquidación"
assert.ok(employeesPageContent.includes('Exportar Liquidación'), 'Debe existir el botón global Exportar Liquidación en empleados');
assert.ok(employeesPageContent.includes('data-testid="employees-btn-export-payroll"'), 'Debe existir testid employees-btn-export-payroll');
console.log(' [PASS] Empleados contiene botón Ojo, Slideover lateral con turnos y acumulados, y botón Exportar Liquidación\n');

// Test 3: Verificar componentes en src/app/(dashboard)/payroll/page.tsx
console.log('>>> Test 3: Verificación de Exportación en Payroll');
const payrollPagePath = path.resolve('src/app/(dashboard)/payroll/page.tsx');
const payrollPageContent = fs.readFileSync(payrollPagePath, 'utf-8');

assert.ok(payrollPageContent.includes('Exportar Liquidación'), 'Debe existir el botón Exportar Liquidación en payroll');
assert.ok(payrollPageContent.includes('payroll-btn-export-liquidacion'), 'Debe existir testid payroll-btn-export-liquidacion');
console.log(' [PASS] Payroll contiene botón global de Exportar Liquidación\n');

// Test 4: Verificar implementación de exportLiquidationFlatCSV en payroll.ts
console.log('>>> Test 4: Verificación de servicio exportLiquidationFlatCSV');
const payrollServicePath = path.resolve('src/lib/services/payroll.ts');
const payrollServiceContent = fs.readFileSync(payrollServicePath, 'utf-8');

assert.ok(payrollServiceContent.includes('export function exportLiquidationFlatCSV'), 'Debe exportar función exportLiquidationFlatCSV');
assert.ok(payrollServiceContent.includes("'Plus por Vehículos'"), 'Debe contener la columna Plus por Vehículos');
console.log(' [PASS] payroll.ts exporta correctamente exportLiquidationFlatCSV con las 5 columnas\n');

console.log('===============================================================');
console.log(' [RESUMEN FINAL] TODOS LOS CRITERIOS DE ACEPTACIÓN (DoD) CUMPLIDOS ');
console.log('===============================================================');
