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
  contractType: 'Jornal' | 'Quincenal' | 'Mensual' | 'Jornalizado' | 'Mensualizado' | 'Temporario';
  hireDate: string;
  seniorityYears: number;
  seniorityPercentage: number;
  baseGrossSalary: number; // Jornal Bruto o Básico Bruto Mensual
  seniorityAmount: number;
  presenteeismAmount: number;
  totalBaseSalary: number;
  regularHourlyRate: number;
  overtime50HourlyRate: number;
  overtime100HourlyRate: number;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  plusCatAmount: number; // PLUS CAT (Bonificación por vehículo / buque / categoría)
  plusDDAmount: number; // PLUS DD (Plus Delta / Día descanso)
  plusIncidenceAmount: number; // INCIDENCIA PLUS
  advancesAmount: number; // ANTICIPOS
  bonusAmount: number;
  grossAmount: number; // TOTAL BRUTO
  netAmount: number; // TOTAL NETO (79% del Bruto menos anticipos)
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

  // 1. Fetch all active employees with their individual salary hourly rates, hire_date and base wages
  const { data: employeesData, error: empErr } = await supabase
    .from('employees')
    .select(`
      id,
      national_id,
      file_number,
      full_name,
      status,
      hire_date,
      employment_type,
      base_gross_salary,
      hourly_rate_regular,
      hourly_rate_overtime_50,
      hourly_rate_overtime_100,
      salary_effective_from,
      created_at,
      default_position:positions(id, name, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100)
    `)
    .order('full_name', { ascending: true });

  if (empErr) {
    console.error('Error fetching employees for payroll:', empErr);
    throw new Error(`Error al obtener empleados: ${empErr.message}`);
  }

  // 2. Fetch positions with their official salary hourly rates
  const { data: positionsData, error: posErr } = await supabase
    .from('positions')
    .select('id, name, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100');

  if (posErr) {
    console.error('Error fetching positions for payroll:', posErr);
  }

  const positionMap = new Map<string, any>();
  for (const p of positionsData || []) {
    positionMap.set(p.id, p);
  }

  // 3. Employee Rate Calculation Map: employee_id -> calculated rates & base info
  // Implements the exact logic from CALCULO DE SUELDOS.xls
  const employeeSalaryMap = new Map<
    string,
    {
      contractType: 'Jornalizado' | 'Mensualizado' | 'Temporario';
      hireDate: string;
      seniorityYears: number;
      seniorityPercentage: number;
      baseGrossSalary: number;
      seniorityAmount: number;
      presenteeismAmount: number;
      totalBaseSalary: number;
      regularHourlyRate: number;
      overtime50HourlyRate: number;
      overtime100HourlyRate: number;
    }
  >();

  const referenceDate = new Date(endDate || new Date().toISOString().split('T')[0]);

  for (const emp of employeesData || []) {
    const posName = emp.default_position?.name || '';
    const isEncargado = posName.toLowerCase().includes('encargado');

    // Contract type: Mensualizado vs Jornalizado vs Temporario
    let contractType: 'Jornalizado' | 'Mensualizado' | 'Temporario' = 'Jornalizado';
    if (emp.employment_type) {
      contractType = emp.employment_type;
    } else if (isEncargado || posName.toLowerCase().includes('jefe') || posName.toLowerCase().includes('admin')) {
      contractType = 'Mensualizado';
    }

    // Base Gross Salary:
    // Mensualizado Encargado: $2.069.196,18 / Mensualizado Apuntador: $1.897.133,14 / Jornalizado: $79.047,21
    let baseGross = Number(emp.base_gross_salary);
    if (!baseGross || baseGross <= 0) {
      if (contractType === 'Mensualizado') {
        baseGross = isEncargado ? 2069196.18 : 1897133.14;
      } else {
        baseGross = 79047.21;
      }
    }

    // Hire Date & Seniority calculation
    const hireDate = emp.hire_date || (emp.created_at ? emp.created_at.split('T')[0] : '2026-01-01');
    const hireD = new Date(hireDate);
    let seniorityYears = 0;
    if (!isNaN(hireD.getTime())) {
      const diffMs = referenceDate.getTime() - hireD.getTime();
      seniorityYears = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
    }
    const seniorityPercentage = seniorityYears; // 1% per year
    const seniorityAmount = Math.round(baseGross * (seniorityPercentage / 100) * 100) / 100;

    // Presenteeism (3% of Gross Base)
    const presenteeismAmount = Math.round(baseGross * 0.03 * 100) / 100;

    // Total Base
    const totalBaseSalary = Math.round((baseGross + seniorityAmount + presenteeismAmount) * 100) / 100;

    // Hourly rates:
    // Mensualizados: divisor 192 horas (24 días x 8 hs)
    // Jornalizados: divisor 8 horas
    let regularHourlyRate: number;
    let overtime50HourlyRate: number;
    let overtime100HourlyRate: number;

    if (contractType === 'Mensualizado') {
      regularHourlyRate = Math.round((totalBaseSalary / 192) * 10000) / 10000;
      overtime50HourlyRate = Math.round((regularHourlyRate * 1.5) * 10000) / 10000;
      overtime100HourlyRate = Math.round((regularHourlyRate * 2.0) * 10000) / 10000;
    } else {
      regularHourlyRate = Math.round((totalBaseSalary / 8) * 10000) / 10000;
      overtime50HourlyRate = Math.round(((baseGross / 8) * 1.5) * 10000) / 10000;
      overtime100HourlyRate = Math.round(((baseGross / 8) * 2.0) * 10000) / 10000;
    }

    // Preserve custom override if manually defined on employee and higher
    if (emp.hourly_rate_regular && !emp.base_gross_salary) {
      regularHourlyRate = Number(emp.hourly_rate_regular);
      overtime50HourlyRate = Number(emp.hourly_rate_overtime_50) || regularHourlyRate * 1.5;
      overtime100HourlyRate = Number(emp.hourly_rate_overtime_100) || regularHourlyRate * 2.0;
    }

    employeeSalaryMap.set(emp.id, {
      contractType,
      hireDate,
      seniorityYears,
      seniorityPercentage,
      baseGrossSalary: baseGross,
      seniorityAmount,
      presenteeismAmount,
      totalBaseSalary,
      regularHourlyRate,
      overtime50HourlyRate,
      overtime100HourlyRate,
    });
  }

  // 4. Fetch staff entries within the date range
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

  // 5. Map staff entries by employee_id
  const employeeShiftsMap = new Map<string, PayrollShiftDetail[]>();

  for (const log of workLogsData || []) {
    const entries = log.entries || [];
    for (const entry of entries) {
      const empId = entry.employee_id;
      if (!employeeShiftsMap.has(empId)) {
        employeeShiftsMap.set(empId, []);
      }

      const empSal = employeeSalaryMap.get(empId) || {
        contractType: 'Jornalizado',
        hireDate: startDate,
        seniorityYears: 0,
        seniorityPercentage: 0,
        baseGrossSalary: 79047.21,
        seniorityAmount: 0,
        presenteeismAmount: 0,
        totalBaseSalary: 79047.21,
        regularHourlyRate: 9880.90,
        overtime50HourlyRate: 14821.35,
        overtime100HourlyRate: 19761.80,
      };

      const regHours = Number(entry.regular_hours || 0);
      const ot50Hours = Number(entry.overtime_50_hours || 0);
      const ot100Hours = Number(entry.overtime_100_hours || 0);
      const plusDelta = Number(entry.plus_delta_amount || 0);
      const bonusApplied = Number(entry.bonus_applied_amount || 0);
      const advance = Number(entry.advance_payment_amount || 0);

      const regRate = empSal.regularHourlyRate;
      const ot50Rate = empSal.overtime50HourlyRate;
      const ot100Rate = empSal.overtime100HourlyRate;

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

  // 6. Build consolidated records for employees
  const records: PayrollRecord[] = [];

  for (const emp of employeesData || []) {
    const shifts = employeeShiftsMap.get(emp.id) || [];
    const empSal = employeeSalaryMap.get(emp.id)!;

    let regularHours = 0;
    let overtime50Hours = 0;
    let overtime100Hours = 0;
    let plusCatAmount = 0;
    let plusDDAmount = 0;
    let plusIncidenceAmount = 0;
    let advancesAmount = 0;

    for (const s of shifts) {
      regularHours += s.regularHours;
      overtime50Hours += s.overtime50Hours;
      overtime100Hours += s.overtime100Hours;
      plusCatAmount += s.bonusAppliedAmount;
      plusDDAmount += s.plusDeltaAmount;
      advancesAmount += s.advanceAmount;
    }

    // Gross Amount according to formula:
    // (regularHours * regularHourlyRate) + (ot50Hours * overtime50HourlyRate) + (ot100Hours * overtime100HourlyRate) + PLUSES
    const hoursGross =
      regularHours * empSal.regularHourlyRate +
      overtime50Hours * empSal.overtime50HourlyRate +
      overtime100Hours * empSal.overtime100HourlyRate;

    const grossAmount = Math.round((hoursGross + plusCatAmount + plusDDAmount + plusIncidenceAmount) * 100) / 100;

    // Argentine official payroll formula used in CALCULO DE SUELDOS.xls:
    // TOTAL NETO = (TOTAL BRUTO * 0.79) - ANTICIPOS
    const netAmount = Math.max(0, Math.round((grossAmount * 0.79 - advancesAmount) * 100) / 100);

    const positionName = shifts[0]?.positionName || emp.default_position?.name || 'Operario';

    records.push({
      id: emp.id,
      employeeId: emp.id,
      fileNumber: emp.file_number || `LEG-${emp.national_id?.slice(-4) || '0000'}`,
      fullName: emp.full_name,
      position: positionName,
      contractType: empSal.contractType,
      hireDate: empSal.hireDate,
      seniorityYears: empSal.seniorityYears,
      seniorityPercentage: empSal.seniorityPercentage,
      baseGrossSalary: empSal.baseGrossSalary,
      seniorityAmount: empSal.seniorityAmount,
      presenteeismAmount: empSal.presenteeismAmount,
      totalBaseSalary: empSal.totalBaseSalary,
      regularHourlyRate: empSal.regularHourlyRate,
      overtime50HourlyRate: empSal.overtime50HourlyRate,
      overtime100HourlyRate: empSal.overtime100HourlyRate,
      regularHours: Math.round(regularHours * 100) / 100,
      overtime50Hours: Math.round(overtime50Hours * 100) / 100,
      overtime100Hours: Math.round(overtime100Hours * 100) / 100,
      plusCatAmount: Math.round(plusCatAmount * 100) / 100,
      plusDDAmount: Math.round(plusDDAmount * 100) / 100,
      plusIncidenceAmount: Math.round(plusIncidenceAmount * 100) / 100,
      advancesAmount: Math.round(advancesAmount * 100) / 100,
      bonusAmount: Math.round((plusCatAmount + plusDDAmount + plusIncidenceAmount) * 100) / 100,
      grossAmount,
      netAmount,
      shiftsCount: shifts.length,
      shifts,
    });
  }

  // Sort employees: active with shifts first (descending netAmount), then alphabetically
  records.sort((a, b) => {
    if (a.shiftsCount > 0 && b.shiftsCount === 0) return -1;
    if (a.shiftsCount === 0 && b.shiftsCount > 0) return 1;
    if (a.shiftsCount > 0 && b.shiftsCount > 0) return b.netAmount - a.netAmount;
    return a.fullName.localeCompare(b.fullName);
  });

  return records;
}

// ============================================================================
// EXCEL XML SPREADSHEET 2003 ENGINE (NATIVE, FULLY SUMMABLE IN EXCEL)
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface ExcelExportCell {
  value: string | number;
  type?: 'Number' | 'String';
  style?:
    | 'header'
    | 'subheader'
    | 'summary_header'
    | 'label'
    | 'center'
    | 'number'
    | 'integer'
    | 'currency'
    | 'total_label'
    | 'total_number'
    | 'total_integer'
    | 'total_currency';
  formula?: string;
  colSpan?: number;
}

export interface ExcelExportSheet {
  name: string;
  colWidths: number[];
  rows: (ExcelExportCell | null)[][];
}

export function generateExcelWorkbookXml(sheets: ExcelExportSheet[]): string {
  const worksheetsXml = sheets
    .map((sheet) => {
      const safeSheetName = escapeXml(sheet.name.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31));
      const colsXml = sheet.colWidths
        .map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`)
        .join('');

      const rowsXml = sheet.rows
        .map((row) => {
          if (!row || row.length === 0) return '<Row ss:Height="14"/>';
          let cellsXml = '';
          row.forEach((cell, cIdx) => {
            if (!cell) return;
            const isNum = cell.type === 'Number' || (typeof cell.value === 'number' && !Number.isNaN(cell.value));
            const dataType = isNum ? 'Number' : 'String';
            const styleId = cell.style || (isNum ? 'number' : 'label');
            const formulaAttr = cell.formula ? ` ss:Formula="${escapeXml(cell.formula)}"` : '';
            const spanAttr = cell.colSpan && cell.colSpan > 1 ? ` ss:MergeAcross="${cell.colSpan - 1}"` : '';
            const valStr = isNum ? String(cell.value) : escapeXml(String(cell.value));

            cellsXml += `<Cell ss:Index="${cIdx + 1}" ss:StyleID="${styleId}"${formulaAttr}${spanAttr}><Data ss:Type="${dataType}">${valStr}</Data></Cell>`;
          });
          return `<Row ss:Height="19">${cellsXml}</Row>`;
        })
        .join('\n');

      return `<Worksheet ss:Name="${safeSheetName}"><Table>${colsXml}\n${rowsXml}</Table></Worksheet>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0B1C30"/>
  </Style>
  <Style ss:ID="header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F2547"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F2547"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2547" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="subheader">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F2547"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="summary_header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="label">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0B1C30"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="integer">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0B1C30"/>
   <NumberFormat ss:Format="0"/>
  </Style>
  <Style ss:ID="currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0B1C30"/>
   <NumberFormat ss:Format="&quot;$&quot;\ #,##0.00;[Red](&quot;$&quot;\ #,##0.00);&quot;$&quot;\ 0.00"/>
  </Style>
  <Style ss:ID="total_label">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2547" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="total_number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2547" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="total_integer">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2547" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="0"/>
  </Style>
  <Style ss:ID="total_currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F2547" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;\ #,##0.00;[Red](&quot;$&quot;\ #,##0.00);&quot;$&quot;\ 0.00"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;
}

function triggerDownload(xmlContent: string, filename: string) {
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera la planilla Excel oficial de Pre-Liquidación con celdas numéricas y de moneda
 * 100% compatibles con las fórmulas de autosuma de Microsoft Excel (=SUMA).
 */
export function exportPayrollToExcel(records: PayrollRecord[], startDate: string, endDate: string) {
  const rows: (ExcelExportCell | null)[][] = [];

  // Fila 0: Título principal
  rows.push([
    { value: `MTS MARITIME & TERMINAL SERVICES - PRE-LIQUIDACIÓN DE SUELDOS`, style: 'subheader', colSpan: 12 },
  ]);
  // Fila 1: Subtítulo de período
  rows.push([
    { value: `Período Operativo: ${startDate} al ${endDate} | Total Registros: ${records.length}`, style: 'label', colSpan: 12 },
  ]);
  // Fila 2: Separador
  rows.push([]);

  // Fila 3: Encabezados de columnas
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
    'Pluses / Adicionales',
    'Total Neto',
  ];

  rows.push(headers.map((h) => ({ value: h, style: 'header' })));

  const startDataRow = 5; // Excel 1-indexed row for data (index 4 in 0-indexed)

  records.forEach((r) => {
    rows.push([
      { value: r.fileNumber, style: 'center' },
      { value: r.fullName, style: 'label' },
      { value: r.position, style: 'label' },
      { value: r.contractType, style: 'center' },
      { value: r.shiftsCount, type: 'Number', style: 'integer' },
      { value: r.regularHours, type: 'Number', style: 'number' },
      { value: r.overtime50Hours, type: 'Number', style: 'number' },
      { value: r.overtime100Hours, type: 'Number', style: 'number' },
      { value: r.grossAmount, type: 'Number', style: 'currency' },
      { value: r.advancesAmount, type: 'Number', style: 'currency' },
      { value: r.bonusAmount, type: 'Number', style: 'currency' },
      { value: r.netAmount, type: 'Number', style: 'currency' },
    ]);
  });

  const endDataRow = startDataRow + records.length - 1;

  // Fila de Totales con fórmula nativa de Excel =SUM(R5C:R{end}C)
  if (records.length > 0) {
    const totShifts = records.reduce((acc, r) => acc + r.shiftsCount, 0);
    const totReg = records.reduce((acc, r) => acc + r.regularHours, 0);
    const totOt50 = records.reduce((acc, r) => acc + r.overtime50Hours, 0);
    const totOt100 = records.reduce((acc, r) => acc + r.overtime100Hours, 0);
    const totGross = records.reduce((acc, r) => acc + r.grossAmount, 0);
    const totAdv = records.reduce((acc, r) => acc + r.advancesAmount, 0);
    const totBonus = records.reduce((acc, r) => acc + r.bonusAmount, 0);
    const totNet = records.reduce((acc, r) => acc + r.netAmount, 0);

    rows.push([
      { value: 'TOTALES', style: 'total_label', colSpan: 4 },
      null,
      null,
      null,
      { value: totShifts, type: 'Number', style: 'total_integer', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totReg * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt50 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt100 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totGross * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totAdv * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totBonus * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totNet * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
    ]);
  }

  const sheet: ExcelExportSheet = {
    name: 'Pre-Liquidación',
    colWidths: [80, 200, 130, 95, 60, 85, 85, 85, 110, 95, 120, 115],
    rows,
  };

  const xml = generateExcelWorkbookXml([sheet]);
  triggerDownload(xml, `Pre-liquidacion_${startDate}_al_${endDate}.xls`);
}

// Backward compatibility alias
export function exportPayrollToCSV(records: PayrollRecord[], startDate: string, endDate: string) {
  exportPayrollToExcel(records, startDate, endDate);
}

export interface LiquidationFlatRecord {
  employeeName: string;
  regularHours: number;
  overtime50Hours: number;
  overtime100Hours: number;
  vehicleBonus: number;
  grossAmount?: number;
  netAmount?: number;
  fileNumber?: string;
  position?: string;
}

/**
 * Genera el reporte oficial de Liquidación para el estudio contable / auditoría.
 * Ahora exporta una planilla Excel (.xls) real con celdas numéricas y sumables.
 */
export function exportLiquidationToExcel(
  records: LiquidationFlatRecord[],
  periodLabel?: string
) {
  const rows: (ExcelExportCell | null)[][] = [];

  rows.push([
    { value: `MTS LOGÍSTICA - LIQUIDACIÓN DE SUELDOS Y HORAS OPERATIVAS`, style: 'subheader', colSpan: 9 },
  ]);
  rows.push([
    { value: `Período: ${periodLabel || 'Consolidado'} | Total Colaboradores: ${records.length}`, style: 'label', colSpan: 9 },
  ]);
  rows.push([]);

  const headers = [
    'Legajo',
    'Empleado',
    'Puesto',
    'Horas Normales',
    'Horas Extras 50%',
    'Horas Extras 100%',
    'Plus por Vehículos / Pluses',
    'Total Bruto',
    'Total Neto',
  ];

  rows.push(headers.map((h) => ({ value: h, style: 'header' })));

  const startDataRow = 5;

  records.forEach((r) => {
    rows.push([
      { value: r.fileNumber || '-', style: 'center' },
      { value: r.employeeName, style: 'label' },
      { value: r.position || 'Operario', style: 'label' },
      { value: r.regularHours, type: 'Number', style: 'number' },
      { value: r.overtime50Hours, type: 'Number', style: 'number' },
      { value: r.overtime100Hours, type: 'Number', style: 'number' },
      { value: r.vehicleBonus, type: 'Number', style: 'currency' },
      { value: r.grossAmount ?? (r.regularHours * 8983.68 + r.vehicleBonus), type: 'Number', style: 'currency' },
      { value: r.netAmount ?? ((r.grossAmount ?? (r.regularHours * 8983.68 + r.vehicleBonus)) * 0.79), type: 'Number', style: 'currency' },
    ]);
  });

  const endDataRow = startDataRow + records.length - 1;

  if (records.length > 0) {
    const totReg = records.reduce((acc, r) => acc + r.regularHours, 0);
    const totOt50 = records.reduce((acc, r) => acc + r.overtime50Hours, 0);
    const totOt100 = records.reduce((acc, r) => acc + r.overtime100Hours, 0);
    const totBonus = records.reduce((acc, r) => acc + r.vehicleBonus, 0);
    const totGross = records.reduce((acc, r) => acc + (r.grossAmount ?? 0), 0);
    const totNet = records.reduce((acc, r) => acc + (r.netAmount ?? 0), 0);

    rows.push([
      { value: 'TOTALES', style: 'total_label', colSpan: 3 },
      null,
      null,
      { value: Math.round(totReg * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt50 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totOt100 * 100) / 100, type: 'Number', style: 'total_number', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totBonus * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totGross * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totNet * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
    ]);
  }

  const sheet: ExcelExportSheet = {
    name: 'Liquidación',
    colWidths: [75, 220, 130, 100, 100, 100, 150, 115, 115],
    rows,
  };

  const xml = generateExcelWorkbookXml([sheet]);
  const filename = periodLabel ? `Liquidacion_${periodLabel}.xls` : 'Liquidacion_Sueldos.xls';
  triggerDownload(xml, filename);
}

// Backward compatibility alias (now downloads Excel .xls instead of plain CSV/txt)
export function exportLiquidationFlatCSV(
  records: LiquidationFlatRecord[],
  periodLabel?: string
) {
  exportLiquidationToExcel(records, periodLabel);
}

/**
 * Genera la planilla completa de Estimación de Sueldos que reproduce fielmente
 * la estructura y las 24 columnas de CALCULO DE SUELDOS.xls (Antigüedad, Presentismo,
 * Básico, Divisor 8hs/192hs, Pluses, Anticipos, Bruto y Neto con factor 0.79).
 */
export function exportFullSalaryEstimationExcel(
  records: PayrollRecord[],
  periodLabel?: string
) {
  const rows: (ExcelExportCell | null)[][] = [];

  // Fila 0: Barra superior informativa
  rows.push([
    null,
    { value: periodLabel ? periodLabel.toUpperCase() : 'ESTIMACIÓN DE SUELDOS', style: 'summary_header' },
    null,
    null,
    { value: 'Basico Bruto', style: 'summary_header' },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    { value: 'ESTAS DATOS VIENEN DE CARGA DIARIA DE HORAS', style: 'summary_header', colSpan: 3 },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    { value: 'TOTAL BRUTO', style: 'summary_header' },
    { value: 'TOTAL NETO', style: 'summary_header' },
  ]);

  // Fila 1: 24 Columnas exactas de CALCULO DE SUELDOS.xls
  const headers = [
    'Legajo',
    'Apellido y nombre',
    'Puesto',
    'Estado',
    'Jornal Bruto',
    'Fecha Ingreso',
    'Antigüed. %',
    'Antigüedad',
    'Presentismo',
    'Total Basico',
    'Valor Hora Norm.',
    'Valor Hora 50%',
    'Valor hora 100%',
    'HORA NORMAL',
    'HS 50%',
    'HS 100%',
    'PLUS CAT',
    'PLUS DD',
    'INCIDENCIA PLUS',
    'ANTICIPO',
    'SAC',
    'VACAC',
    'TOTAL BRUTO',
    'TOTAL NETO',
  ];

  rows.push(headers.map((h) => ({ value: h, style: 'header' })));

  const startDataRow = 3; // Fila 3 en Excel

  records.forEach((r, idx) => {
    const rowNum = startDataRow + idx;
    const isMensual = r.contractType === 'Mensualizado';
    const divisor = isMensual ? 192 : 8;

    // Excel Column references:
    // Col E (5): Jornal/Básico Bruto
    // Col G (7): Antigüedad %
    // Col H (8): Antigüedad $ -> =+RC[-3]*RC[-1]/100
    // Col I (9): Presentismo $ -> =+RC[-4]*0.03
    // Col J (10): Total Básico -> =+RC[-5]+RC[-2]+RC[-1]
    // Col K (11): Valor Hora Norm -> =+RC[-1]/divisor
    // Col L (12): Valor Hora 50% -> =+RC[-7]/8*1.5 (o =+RC[-1]*1.5)
    // Col M (13): Valor Hora 100% -> =+RC[-8]/8*2 (o =+RC[-2]*2)
    // Col N (14): HORA NORMAL
    // Col O (15): HS 50%
    // Col P (16): HS 100%
    // Col Q (17): PLUS CAT
    // Col R (18): PLUS DD
    // Col S (19): INCIDENCIA PLUS
    // Col T (20): ANTICIPO (en negativo)
    // Col U (21): SAC
    // Col V (22): VACAC
    // Col W (23): TOTAL BRUTO -> =+RC[-12]*RC[-9]+RC[-11]*RC[-8]+RC[-10]*RC[-7]+RC[-6]+RC[-5]+RC[-4]+RC[-2]+RC[-1]
    // Col X (24): TOTAL NETO -> =+RC[-1]*0.79+RC[-4] (suma el anticipo que viene en negativo)

    rows.push([
      { value: r.fileNumber, style: 'center' },
      { value: r.fullName, style: 'label' },
      { value: r.position, style: 'label' },
      { value: r.contractType, style: 'center' },
      { value: r.baseGrossSalary, type: 'Number', style: 'currency' },
      { value: r.hireDate ? r.hireDate.split('-').reverse().join('/') : '', style: 'center' },
      { value: r.seniorityPercentage, type: 'Number', style: 'integer' },
      {
        value: r.seniorityAmount,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-3]*RC[-1]/100`,
      },
      {
        value: r.presenteeismAmount,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-4]*0.03`,
      },
      {
        value: r.totalBaseSalary,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-5]+RC[-2]+RC[-1]`,
      },
      {
        value: r.regularHourlyRate,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-1]/${divisor}`,
      },
      {
        value: r.overtime50HourlyRate,
        type: 'Number',
        style: 'currency',
        formula: isMensual ? `=+RC[-1]*1.5` : `=+RC[-7]/8*1.5`,
      },
      {
        value: r.overtime100HourlyRate,
        type: 'Number',
        style: 'currency',
        formula: isMensual ? `=+RC[-2]*2` : `=+RC[-8]/8*2`,
      },
      { value: r.regularHours, type: 'Number', style: 'number' },
      { value: r.overtime50Hours, type: 'Number', style: 'number' },
      { value: r.overtime100Hours, type: 'Number', style: 'number' },
      { value: r.plusCatAmount, type: 'Number', style: 'currency' },
      { value: r.plusDDAmount, type: 'Number', style: 'currency' },
      { value: r.plusIncidenceAmount, type: 'Number', style: 'currency' },
      { value: r.advancesAmount > 0 ? -r.advancesAmount : 0, type: 'Number', style: 'currency' },
      { value: 0, type: 'Number', style: 'currency' }, // SAC
      { value: 0, type: 'Number', style: 'currency' }, // VACAC
      {
        value: r.grossAmount,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-12]*RC[-9]+RC[-11]*RC[-8]+RC[-10]*RC[-7]+RC[-6]+RC[-5]+RC[-4]+RC[-2]+RC[-1]`,
      },
      {
        value: r.netAmount,
        type: 'Number',
        style: 'currency',
        formula: `=+RC[-1]*0.79+RC[-4]`,
      },
    ]);
  });

  const endDataRow = startDataRow + records.length - 1;

  // Fila de Totales Generales
  if (records.length > 0) {
    const totGross = records.reduce((acc, r) => acc + r.grossAmount, 0);
    const totNet = records.reduce((acc, r) => acc + r.netAmount, 0);
    const totAdv = records.reduce((acc, r) => acc + r.advancesAmount, 0);
    const totCat = records.reduce((acc, r) => acc + r.plusCatAmount, 0);
    const totDD = records.reduce((acc, r) => acc + r.plusDDAmount, 0);
    const totInc = records.reduce((acc, r) => acc + r.plusIncidenceAmount, 0);

    rows.push([
      { value: 'TOTALES', style: 'total_label', colSpan: 16 },
      ...Array(15).fill(null),
      { value: Math.round(totCat * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totDD * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totInc * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: totAdv > 0 ? -Math.round(totAdv * 100) / 100 : 0, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: 0, type: 'Number', style: 'total_currency' },
      { value: 0, type: 'Number', style: 'total_currency' },
      { value: Math.round(totGross * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
      { value: Math.round(totNet * 100) / 100, type: 'Number', style: 'total_currency', formula: `=SUM(R${startDataRow}C:R${endDataRow}C)` },
    ]);
  }

  const sheet: ExcelExportSheet = {
    name: 'Cálculo de Sueldos',
    colWidths: [
      65,  // Legajo
      190, // Apellido y nombre
      110, // Puesto
      90,  // Estado
      95,  // Jornal Bruto
      85,  // Fecha Ingreso
      75,  // Antigüedad %
      90,  // Antigüedad $
      85,  // Presentismo
      95,  // Total Básico
      95,  // Valor Hora Norm.
      95,  // Valor Hora 50%
      95,  // Valor Hora 100%
      75,  // HORA NORMAL
      70,  // HS 50%
      70,  // HS 100%
      90,  // PLUS CAT
      85,  // PLUS DD
      95,  // INCIDENCIA PLUS
      85,  // ANTICIPO
      70,  // SAC
      70,  // VACAC
      110, // TOTAL BRUTO
      110, // TOTAL NETO
    ],
    rows,
  };

  const xml = generateExcelWorkbookXml([sheet]);
  const filename = periodLabel ? `Calculo_Sueldos_${periodLabel}.xls` : 'Calculo_Sueldos.xls';
  triggerDownload(xml, filename);
}
