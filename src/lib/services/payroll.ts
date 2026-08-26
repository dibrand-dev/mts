import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

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

  // 1. Fetch all active employees
  const { data: employeesData, error: empErr } = await supabase
    .from('employees')
    .select(`
      id,
      national_id,
      file_number,
      full_name,
      status,
      default_position:positions(id, name)
    `)
    .order('full_name', { ascending: true });

  if (empErr) {
    console.error('Error fetching employees for payroll:', empErr);
    throw new Error(`Error al obtener empleados: ${empErr.message}`);
  }

  // 2. Fetch all rates with positions and hour types
  const { data: ratesData, error: ratesErr } = await supabase
    .from('client_position_rates')
    .select(`
      *,
      position:positions(id, name),
      hour_type:hour_types(id, code)
    `);

  if (ratesErr) {
    console.error('Error fetching rates for payroll:', ratesErr);
  }

  // Create rate lookup: `${clientId}_${positionId}` -> { REGULAR: number, OVERTIME_50: number, OVERTIME_100: number }
  const ratesMap = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();
  // Also position fallback lookup: `${positionId}` -> { REGULAR: number, OVERTIME_50: number, OVERTIME_100: number }
  const posFallbackRates = new Map<string, { REGULAR: number; OVERTIME_50: number; OVERTIME_100: number }>();

  for (const r of ratesData || []) {
    const code = r.hour_type?.code as 'REGULAR' | 'OVERTIME_50' | 'OVERTIME_100';
    if (!code) continue;
    const rateVal = Number(r.hourly_rate || 0);

    const clientPosKey = `${r.client_id}_${r.position_id}`;
    if (!ratesMap.has(clientPosKey)) {
      ratesMap.set(clientPosKey, { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 });
    }
    ratesMap.get(clientPosKey)![code] = rateVal;

    if (!posFallbackRates.has(r.position_id)) {
      posFallbackRates.set(r.position_id, { REGULAR: 0, OVERTIME_50: 0, OVERTIME_100: 0 });
    }
    if (posFallbackRates.get(r.position_id)![code] === 0) {
      posFallbackRates.get(r.position_id)![code] = rateVal;
    }
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

      const clientPosKey = `${log.client_id}_${entry.position_id}`;
      const posRates = ratesMap.get(clientPosKey) ||
        posFallbackRates.get(entry.position_id) || {
          REGULAR: 10000,
          OVERTIME_50: 15000,
          OVERTIME_100: 20000,
        };

      const regHours = Number(entry.regular_hours || 0);
      const ot50Hours = Number(entry.overtime_50_hours || 0);
      const ot100Hours = Number(entry.overtime_100_hours || 0);
      const plusDelta = Number(entry.plus_delta_amount || 0);
      const bonusApplied = Number(entry.bonus_applied_amount || 0);
      const advance = Number(entry.advance_payment_amount || 0);

      const regRate = posRates.REGULAR || 10000;
      const ot50Rate = posRates.OVERTIME_50 || Math.round(regRate * 1.5);
      const ot100Rate = posRates.OVERTIME_100 || Math.round(regRate * 2.0);

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
