import { createClient } from '@/lib/supabase/client';

export interface PayrollShiftDetail {
  id: string;
  workDate: string;
  clientName: string;
  positionName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  regularRate: number;
  overtime50Rate: number;
  overtime100Rate: number;
  plusDeltaAmount: number;
  bonusAppliedAmount: number;
  advanceAmount: number;
  shiftGrossAmount: number;
  shiftNetAmount: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  fileNumber: string; // Legajo
  fullName: string;
  position: string;
  contractType: 'Jornal' | 'Quincenal' | 'Mensual';
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  grossAmount: number;
  advancesAmount: number;
  bonusAmount: number;
  netAmount: number;
  shiftsCount: number;
  shifts: PayrollShiftDetail[];
}

export interface PayrollSummaryResult {
  records: PayrollRecord[];
  totals: {
    count: number;
    gross: number;
    advances: number;
    net: number;
    totalRegularHours: number;
    totalOvertime50Hours: number;
    totalOvertime100Hours: number;
  };
}

export async function getPayrollData(
  startDate: string,
  endDate: string
): Promise<PayrollRecord[]> {
  const supabase = createClient() as any;

  // 1. Fetch all active employees with their individual salary hourly rates
  const { data: employeesData, error: empErr } = await supabase
    .from('employees')
    .select(`
      id,
      national_id,
      file_number,
      full_name,
      status,
      hourly_rate_regular,
      hourly_rate_overtime_50,
      hourly_rate_overtime_100,
      salary_effective_from,
      default_position:positions(id, name, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100)
    `)
    .order('full_name', { ascending: true });

  if (empErr) {
    console.error('Error fetching employees for payroll:', empErr);
    throw new Error(`Error al obtener empleados: ${empErr.message}`);
  }

  // 2. Fetch positions with their official salary hourly rates (Valores Hora Hombre / Sueldos)
  const { data: positionsData, error: posErr } = await supabase
    .from('positions')
    .select('id, name, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100');

  if (posErr) {
    console.error('Error fetching positions for payroll:', posErr);
  }

  // Position fallback map: position_id -> { REGULAR, OVERTIME_50, OVERTIME_100 }
  const positionSalaryMap = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();
  for (const p of positionsData || []) {
    const isEncargado = (p.name || '').toLowerCase().includes('encargado');
    const defaultReg = isEncargado ? 10777.06 : 8983.68;
    const defaultOt50 = isEncargado ? 16165.60 : 13475.53;
    const defaultOt100 = isEncargado ? 21554.13 : 17967.37;

    const regular = Number(p.hourly_rate_regular) || defaultReg;
    const ot50 = Number(p.hourly_rate_overtime_50) || defaultOt50;
    const ot100 = Number(p.hourly_rate_overtime_100) || defaultOt100;

    positionSalaryMap.set(p.id, {
      REGULAR: regular,
      OVERTIME_50: ot50,
      OVERTIME_100: ot100,
    });
  }

  // Employee Direct Salary Lookup: employee_id -> { REGULAR, OVERTIME_50, OVERTIME_100 }
  // Asignación directa al personal (con fallback a la escala del puesto)
  const employeeSalaryMap = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();
  for (const emp of employeesData || []) {
    const isEncargado = (emp.default_position?.name || '').toLowerCase().includes('encargado');
    const defaultReg = isEncargado ? 10777.06 : 8983.68;
    const defaultOt50 = isEncargado ? 16165.60 : 13475.53;
    const defaultOt100 = isEncargado ? 21554.13 : 17967.37;

    const regular = Number(emp.hourly_rate_regular) || Number(emp.default_position?.hourly_rate_regular) || defaultReg;
    const ot50 = Number(emp.hourly_rate_overtime_50) || Number(emp.default_position?.hourly_rate_overtime_50) || defaultOt50;
    const ot100 = Number(emp.hourly_rate_overtime_100) || Number(emp.default_position?.hourly_rate_overtime_100) || defaultOt100;

    employeeSalaryMap.set(emp.id, {
      REGULAR: regular,
      OVERTIME_50: ot50,
      OVERTIME_100: ot100,
    });
  }

  // 3. Fetch staff entries within the date range
  const { data: workLogsData, error: logsErr } = await supabase
    .from('daily_work_logs')
    .select(`
      id,
      work_date,
      client_id,
      client:clients(id, company_name),
      entries:daily_staff_entries(
        id,
        employee_id,
        position_id,
        shift_start_date,
        shift_start_time,
        shift_end_date,
        shift_end_time,
        regular_hours,
        overtime_50_hours,
        overtime_100_hours,
        shuttles_count,
        plus_delta_amount,
        meal_allowance_count,
        advance_payment_amount,
        is_day_off,
        bonus_applied_amount,
        position:positions(id, name)
      )
    `)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: true });

  if (logsErr) {
    console.error('Error fetching work logs for payroll:', logsErr);
    throw new Error(`Error al obtener partes diarios: ${logsErr.message}`);
  }

  // 4. Map staff entries by employee_id
  const employeeShiftsMap = new Map<string, PayrollShiftDetail[]>();

  for (const log of workLogsData || []) {
    const entries = log.entries || [];
    for (const entry of entries) {
      const empId = entry.employee_id;
      if (!employeeShiftsMap.has(empId)) {
        employeeShiftsMap.set(empId, []);
      }

      const isEncargado = (entry.position?.name || '').toLowerCase().includes('encargado');
      const defaultReg = isEncargado ? 10777.06 : 8983.68;
      const defaultOt50 = isEncargado ? 16165.60 : 13475.53;
      const defaultOt100 = isEncargado ? 21554.13 : 17967.37;

      // Priorizar el sueldo asignado directamente al empleado
      const empRates = employeeSalaryMap.get(empId) || positionSalaryMap.get(entry.position_id) || {
        REGULAR: defaultReg,
        OVERTIME_50: defaultOt50,
        OVERTIME_100: defaultOt100,
      };

      const regHours = Number(entry.regular_hours || 0);
      const ot50Hours = Number(entry.overtime_50_hours || 0);
      const ot100Hours = Number(entry.overtime_100_hours || 0);
      const plusDelta = Number(entry.plus_delta_amount || 0);
      const bonusApplied = Number(entry.bonus_applied_amount || 0);
      const advance = Number(entry.advance_payment_amount || 0);

      const regRate = empRates.REGULAR;
      const ot50Rate = empRates.OVERTIME_50;
      const ot100Rate = empRates.OVERTIME_100;

      const shiftGross =
        regHours * regRate +
        ot50Hours * ot50Rate +
        ot100Hours * ot100Rate +
        plusDelta +
        bonusApplied;

      const shiftNet = shiftGross - advance;

      employeeShiftsMap.get(empId)!.push({
        id: entry.id,
        workDate: log.work_date,
        clientName: log.client?.company_name || 'Sin Cliente',
        positionName: entry.position?.name || 'Operario',
        shiftStartTime: entry.shift_start_time || '',
        shiftEndTime: entry.shift_end_time || '',
        regularHours: regHours,
        overtime50Hours: ot50Hours,
        overtime100Hours: ot100Hours,
        regularRate: regRate,
        overtime50Rate: ot50Rate,
        overtime100Rate: ot100Rate,
        plusDeltaAmount: plusDelta,
        bonusAppliedAmount: bonusApplied,
        advanceAmount: advance,
        shiftGrossAmount: Math.round(shiftGross * 100) / 100,
        shiftNetAmount: Math.round(shiftNet * 100) / 100,
      });
    }
  }

  // 5. Build consolidated records for employees
  const records: PayrollRecord[] = [];

  for (const emp of employeesData || []) {
    const shifts = employeeShiftsMap.get(emp.id) || [];
    
    let regularHours = 0;
    let overtime50Hours = 0;
    let overtime100Hours = 0;
    let grossAmount = 0;
    let advancesAmount = 0;
    let bonusAmount = 0;

    for (const s of shifts) {
      regularHours += s.regularHours;
      overtime50Hours += s.overtime50Hours;
      overtime100Hours += s.overtime100Hours;
      grossAmount += s.shiftGrossAmount;
      advancesAmount += s.advanceAmount;
      bonusAmount += (s.plusDeltaAmount + s.bonusAppliedAmount);
    }

    const netAmount = Math.max(0, grossAmount - advancesAmount);
    const positionName = shifts[0]?.positionName || emp.default_position?.name || 'Operario';

    // Contract type heuristic: if position has specific indicator or default to Jornal / Quincenal
    const contractType: 'Jornal' | 'Quincenal' | 'Mensual' =
      positionName.toLowerCase().includes('chofer') || positionName.toLowerCase().includes('guinchero')
        ? 'Quincenal'
        : positionName.toLowerCase().includes('administrativo') || positionName.toLowerCase().includes('jefe')
        ? 'Mensual'
        : 'Jornal';

    records.push({
      id: emp.id,
      employeeId: emp.id,
      fileNumber: emp.file_number || `LEG-${emp.national_id?.slice(-4) || '0000'}`,
      fullName: emp.full_name,
      position: positionName,
      contractType,
      regularHours: Math.round(regularHours * 100) / 100,
      overtime50Hours: Math.round(overtime50Hours * 100) / 100,
      overtime100Hours: Math.round(overtime100Hours * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
      advancesAmount: Math.round(advancesAmount * 100) / 100,
      bonusAmount: Math.round(bonusAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      shiftsCount: shifts.length,
      shifts,
    });
  }

  // Sort employees: those with shifts first (descending netAmount), then alphabetically
  records.sort((a, b) => {
    if (a.shiftsCount > 0 && b.shiftsCount === 0) return -1;
    if (a.shiftsCount === 0 && b.shiftsCount > 0) return 1;
    if (a.shiftsCount > 0 && b.shiftsCount > 0) return b.netAmount - a.netAmount;
    return a.fullName.localeCompare(b.fullName);
  });

  return records;
}

export function exportPayrollToCSV(records: PayrollRecord[], startDate: string, endDate: string) {
  const headers = [
    'Legajo',
    'Empleado',
    'Puesto',
    'Régimen',
    'Turnos',
    'Hs Normales',
    'Hs Extras 50%',
    'Hs Extras 100%',
    'Total Bruto',
    'Anticipos',
    'Pluses/Adicionales',
    'Total Neto',
  ];

  const rows = records.map((r) => [
    `"${r.fileNumber}"`,
    `"${r.fullName}"`,
    `"${r.position}"`,
    `"${r.contractType}"`,
    r.shiftsCount,
    r.regularHours,
    r.overtime50Hours,
    r.overtime100Hours,
    r.grossAmount,
    r.advancesAmount,
    r.bonusAmount,
    r.netAmount,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Pre-liquidacion_${startDate}_al_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface LiquidationFlatRecord {
  employeeName: string;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  vehicleBonus: number;
}

/**
 * Genera el reporte plano oficial para la contadora / liquidación mensual de sueldos.
 * Cumple estrictamente con las columnas requeridas (DoD):
 * Empleado | Horas Normales | Horas 50% | Horas 100% | Plus por Vehículos
 */
export function exportLiquidationFlatCSV(
  records: LiquidationFlatRecord[],
  periodLabel?: string
) {
  const headers = [
    'Empleado',
    'Horas Normales',
    'Horas 50%',
    'Horas 100%',
    'Plus por Vehículos',
  ];

  const rows = records.map((r) => [
    `"${r.employeeName.replace(/"/g, '""')}"`,
    r.regularHours,
    r.overtime50Hours,
    r.overtime100Hours,
    r.vehicleBonus,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = periodLabel
    ? `Liquidacion_${periodLabel}.csv`
    : 'Liquidacion_Sueldos.csv';
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

