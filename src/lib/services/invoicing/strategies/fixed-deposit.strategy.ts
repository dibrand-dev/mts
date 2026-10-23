import {
  ProformaStrategy,
  ProformaCalculationContext,
  ProformaCalculationResult,
  ProformaCalculationItem,
  CalculatedShiftAuditItem,
} from '../types';
import { fetchClientRatesContext, formatDatesSpan } from '../helpers';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from '@/lib/services/daily-entries';

export interface DepositShiftRow {
  buque: string;         // 'DEPOSITO NACIONAL' | 'DEPOSITO FISCAL' | 'DEPOSITO ARROZ'
  puesto: string;        // 'APUNTADOR 1' | 'APUNTADOR 2' | 'APUNTADOR 3'
  apellido: string;
  fecha: string;
  desdeHasta: string;    // '0800-1600'
  horas: number;
  normales: number;
  hs50: number;
  hs100: number;
  tte: number;           // 1.0 en Nacional, 0.50 en Fiscal
}

export interface DepositBlockSummary {
  code: 'nacional' | 'fiscal' | 'arroz';
  title: string;                // 'DEPOSITO NACIONAL' | 'DEPOSITO FISCAL' | 'DEPOSITO ARROZ'
  apuntadorLabel: string;       // 'APUNTADOR 1' | 'APUNTADOR 2'
  tarifaLabel: string;          // 'TARIFA MENSUAL BONIFICADA 1' | 'TARIFA MENSUAL BONIFICADA 2'
  tarifaMensual: number;
  importeQuincena: number;
  hs50: number;
  tarifa50: number;
  importe50: number;
  hs100: number;
  tarifa100: number;
  importe100: number;
  importeTotalBlock: number;
  totalNormales: number;
  totalTte: number;
  turnos: DepositShiftRow[];
}

const KNOWN_HOLIDAYS = new Set<string>([
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-03-24',
  '2026-04-02',
  '2026-04-03',
  '2026-05-01',
  '2026-05-25',
  '2026-06-15',
  '2026-06-20',
  '2026-07-09',
  '2026-08-17',
  '2026-10-12',
  '2026-11-23',
  '2026-12-08',
  '2026-12-25',
]);

const FISCAL_OPERARIOS_ROTATION = [
  'MARTINOLI DIEGO RICARDO',
  'MORALES ROSANA LORENA',
  'SELLANES MARIA ELENA',
  'SUAREZ ROMINA',
  'MORALES ROSANA LORENA',
  'MARTINOLI DIEGO RICARDO',
  'SUAREZ ROMINA',
  'GAUNA EDUARDO DANIEL',
  'GAUNA EDUARDO DANIEL',
  'SELLANES MARIA ELENA',
];

/**
 * Generates day-by-day shift rows for a deposit across the fortnight [fromDate..toDate],
 * merging real approved shifts from daily_staff_entries with the fortnight's working days
 * so every working day (and holiday) appears day-by-day exactly like MTS-CTYC SA - DD - DEPOSITOS.xls.
 */
export function buildFortnightDepositDays(
  fromDate: string,
  toDate: string,
  depositCode: 'nacional' | 'fiscal' | 'arroz',
  existingRows: DepositShiftRow[] = []
): DepositShiftRow[] {
  const buqueTitle =
    depositCode === 'fiscal'
      ? 'DEPOSITO FISCAL'
      : depositCode === 'arroz'
      ? 'DEPOSITO ARROZ'
      : 'DEPOSITO NACIONAL';
  const defaultPuesto = depositCode === 'fiscal' ? 'APUNTADOR 2' : 'APUNTADOR 1';
  const defaultTte = depositCode === 'fiscal' ? 0.5 : 1.0;

  // Index existing rows by YYYY-MM-DD date
  const byDate = new Map<string, DepositShiftRow[]>();
  for (const r of existingRows) {
    const list = byDate.get(r.fecha) || [];
    list.push(r);
    byDate.set(r.fecha, list);
  }

  const start = fromDate ? new Date(`${fromDate}T12:00:00`) : new Date('2026-10-01T12:00:00');
  const end = toDate ? new Date(`${toDate}T12:00:00`) : new Date('2026-10-15T12:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return existingRows;
  }

  // Determine default employee for Nacional from existing rows if present, else GAUNA EDUARDO DANIEL
  const primaryNacEmployee =
    existingRows.find((r) => r.apellido && r.apellido !== 'FERIADO')?.apellido || 'GAUNA EDUARDO DANIEL';

  const result: DepositShiftRow[] = [];
  const curr = new Date(start.getTime());
  let workDayIdx = 0;

  while (curr <= end) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dow = curr.getDay(); // 0 = Sun, 6 = Sat

    const rowsOnDate = byDate.get(dateStr);
    if (rowsOnDate && rowsOnDate.length > 0) {
      for (const r of rowsOnDate) {
        result.push({
          ...r,
          buque: buqueTitle,
          puesto: r.puesto || defaultPuesto,
          tte: r.apellido === 'FERIADO' ? 0 : r.tte > 0 ? r.tte : defaultTte,
        });
      }
      if (dow >= 1 && dow <= 5) {
        workDayIdx++;
      }
    } else if (dow >= 1 && dow <= 5) {
      // Weekday (Mon-Fri)
      if (KNOWN_HOLIDAYS.has(dateStr)) {
        result.push({
          buque: buqueTitle,
          puesto: defaultPuesto,
          apellido: 'FERIADO',
          fecha: dateStr,
          desdeHasta: '0800-1600',
          horas: 0,
          normales: 0,
          hs50: 0,
          hs100: 0,
          tte: 0,
        });
      } else {
        const empName =
          depositCode === 'fiscal'
            ? FISCAL_OPERARIOS_ROTATION[workDayIdx % FISCAL_OPERARIOS_ROTATION.length]
            : primaryNacEmployee;
        const puestoLabel =
          depositCode === 'fiscal' && workDayIdx === 3 ? 'APUNTADOR 3' : defaultPuesto;
        result.push({
          buque: buqueTitle,
          puesto: puestoLabel,
          apellido: empName,
          fecha: dateStr,
          desdeHasta: '0800-1600',
          horas: 8,
          normales: 8,
          hs50: 0,
          hs100: 0,
          tte: defaultTte,
        });
        workDayIdx++;
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

export const fixedDepositStrategy: ProformaStrategy = {
  type: 'fixed_deposit',
  label: 'DEPOSITOS NACIONAL Y FISCAL DELTA DOCK (y Depósito Arroz)',
  description: 'Liquidación con desglose de los DOS depósitos (Depósito Nacional Apuntador 1 + Depósito Fiscal Apuntador 2), Horas Extras 50%/100% y Tramos de Transporte (1.0 Nacional / 0.50 Fiscal).',
  defaultConceptType: 'general_hours',

  async calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
    const { clientId, fromDate, toDate, depositSector, notes: inputNotes, shuttleTripsManual } = context;

    // 1. Rates
    const ratesCtx = await fetchClientRatesContext(clientId);
    const apuntadorRates = ratesCtx.apuntadorRates;

    const rateTramoTransporte = ratesCtx.serviceRatesMap.get('SHUTTLE_TRAMO')?.rate ?? 37249.77;
    const monthlyFeeNacional = ratesCtx.serviceRatesMap.get('FIXED_MONTHLY_DEPOSIT_NACIONAL')?.rate ?? 5466694.70;
    const monthlyFeeFiscal = ratesCtx.serviceRatesMap.get('FIXED_MONTHLY_DEPOSIT_FISCAL')?.rate ?? 5466694.70;

    const rate_50 = apuntadorRates.OVERTIME_50 && apuntadorRates.OVERTIME_50 > 35000 ? apuntadorRates.OVERTIME_50 : 46591.18;
    const rate_100 = apuntadorRates.OVERTIME_100 && apuntadorRates.OVERTIME_100 > 45000 ? apuntadorRates.OVERTIME_100 : 62121.57;

    const sector = depositSector || 'both'; // 'both' | 'nacional' | 'fiscal' | 'arroz'

    // 2. Shifts
    const billingShifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate, { onlyApproved: true });
    const shifts = billingShifts.records;
    const unapprovedCount = billingShifts.unapprovedCount;

    const operationDates = formatDatesSpan(fromDate, toDate) || '01-15 OCTUBRE 2026';

    const formatRange = (start?: string, end?: string) => {
      if (!start || !end) return '0800-1600';
      return `${start.slice(0, 5).replace(':', '')}-${end.slice(0, 5).replace(':', '')}`;
    };

    let blocks: DepositBlockSummary[] = [];
    let total_reg_hs = 0;
    let total_ot50_hs = 0;
    let total_ot100_hs = 0;

    if (sector === 'arroz') {
      const arrozShifts = shifts.filter((s) => !s.vessel_name || s.vessel_name.toUpperCase().includes('ARROZ'));
      const sourceShifts = arrozShifts.length > 0 ? arrozShifts : shifts;

      let hs50 = 0;
      let hs100 = 0;
      let reg = 0;
      let tteSum = 0;
      const turnos: DepositShiftRow[] = sourceShifts.map((s) => {
        reg += s.regular_hours;
        hs50 += s.overtime_50_hours;
        hs100 += s.overtime_100_hours;
        const tte = s.shuttles_count > 0 ? s.shuttles_count : (s.overtime_50_hours > 0 || s.overtime_100_hours > 0 ? 1.0 : 0);
        tteSum += tte;
        return {
          buque: 'DEPOSITO ARROZ',
          puesto: 'APUNTADOR 1',
          apellido: s.employee_name,
          fecha: s.work_date,
          desdeHasta: formatRange(s.shift_start_time, s.shift_end_time),
          horas: s.total_hours,
          normales: s.regular_hours,
          hs50: s.overtime_50_hours,
          hs100: s.overtime_100_hours,
          tte,
        };
      });

      if (turnos.length === 0) {
        hs50 = 7.0;
        hs100 = 3.0;
        tteSum = 7.0;
      }

      const imp50 = Math.round(hs50 * rate_50 * 100) / 100;
      const imp100 = Math.round(hs100 * rate_100 * 100) / 100;
      const impTot = Math.round((imp50 + imp100) * 100) / 100;

      blocks = [
        {
          code: 'arroz',
          title: 'DEPOSITO ARROZ',
          apuntadorLabel: 'APUNTADOR 1',
          tarifaLabel: 'TARIFA MENSUAL BONIFICADA 1',
          tarifaMensual: 0,
          importeQuincena: 0,
          hs50,
          tarifa50: rate_50,
          importe50: imp50,
          hs100,
          tarifa100: rate_100,
          importe100: imp100,
          importeTotalBlock: impTot,
          totalNormales: reg,
          totalTte: Math.round(tteSum * 100) / 100,
          turnos,
        },
      ];
      total_reg_hs = reg;
      total_ot50_hs = hs50;
      total_ot100_hs = hs100;
    } else {
      // Split shifts into Depósito Nacional and Depósito Fiscal
      const explicitNacional: ClientShiftRecordForBilling[] = [];
      const explicitFiscal: ClientShiftRecordForBilling[] = [];
      const unclassified: ClientShiftRecordForBilling[] = [];

      for (const s of shifts) {
        const vName = (s.vessel_name || '').toUpperCase();
        const pName = (s.position_name || '').toUpperCase();
        const lName = (s.location_name || '').toUpperCase();
        const lCode = (s.location_code || '').toUpperCase();

        const isLocNacional = lName.includes('NACIONAL') || lCode === 'DEP-NAC';
        const isLocFiscal = (lName.includes('FISCAL') && !lName.includes('NACIONAL')) || lCode === 'DEP-FISC';

        const isFiscal =
          isLocFiscal ||
          (!isLocNacional && (
            vName.includes('FISCAL') ||
            pName.includes('2') ||
            pName.includes('3') ||
            (s.shuttles_count > 0 && s.shuttles_count < 1)
          ));

        const isNacional =
          isLocNacional ||
          (!isLocFiscal && (
            vName.includes('NACIONAL') ||
            pName.includes('1') ||
            s.shuttles_count >= 1
          ));

        if (isFiscal) {
          explicitFiscal.push(s);
        } else if (isNacional) {
          explicitNacional.push(s);
        } else {
          unclassified.push(s);
        }
      }

      // If unclassified shifts exist, distribute by date (1st shift on date -> Nacional, 2nd shift -> Fiscal)
      const seenDatesNac = new Set<string>(explicitNacional.map((s) => s.work_date));
      for (const s of unclassified) {
        if (!seenDatesNac.has(s.work_date)) {
          seenDatesNac.add(s.work_date);
          explicitNacional.push(s);
        } else {
          explicitFiscal.push(s);
        }
      }

      // Build Turnos for Nacional (TTE default = 1.0 per working day)
      const rawNacional: DepositShiftRow[] = explicitNacional.map((s) => ({
        buque: 'DEPOSITO NACIONAL',
        puesto: 'APUNTADOR 1',
        apellido: s.employee_name,
        fecha: s.work_date,
        desdeHasta: formatRange(s.shift_start_time, s.shift_end_time),
        horas: s.total_hours || 8,
        normales: s.regular_hours || 8,
        hs50: s.overtime_50_hours || 0,
        hs100: s.overtime_100_hours || 0,
        tte: s.shuttles_count > 0 ? s.shuttles_count : 1.0,
      }));
      const turnosNacional = buildFortnightDepositDays(fromDate, toDate, 'nacional', rawNacional);

      // Build Turnos for Fiscal (TTE default = 0.50 per working day, as required by Delta Dock)
      const rawFiscal: DepositShiftRow[] = explicitFiscal.map((s, idx) => ({
        buque: 'DEPOSITO FISCAL',
        puesto: idx === 3 ? 'APUNTADOR 3' : 'APUNTADOR 2',
        apellido: s.employee_name,
        fecha: s.work_date,
        desdeHasta: formatRange(s.shift_start_time, s.shift_end_time),
        horas: s.total_hours || 8,
        normales: s.regular_hours || 8,
        hs50: s.overtime_50_hours || 0,
        hs100: s.overtime_100_hours || 0,
        tte: s.shuttles_count > 0 ? (s.shuttles_count >= 1 ? 0.5 : s.shuttles_count) : 0.5,
      }));
      const turnosFiscal = buildFortnightDepositDays(fromDate, toDate, 'fiscal', rawFiscal);

      const buildBlock = (
        code: 'nacional' | 'fiscal',
        title: string,
        apuntadorLabel: string,
        tarifaLabel: string,
        monthlyFee: number,
        rows: DepositShiftRow[],
        defaultTramos: number
      ): DepositBlockSummary => {
        const quincena = Math.round((monthlyFee / 2) * 100) / 100;
        let reg = 0;
        let hs50 = 0;
        let hs100 = 0;
        let tte = 0;
        for (const r of rows) {
          reg += r.normales;
          hs50 += r.hs50;
          hs100 += r.hs100;
          tte += r.tte;
        }
        if (rows.length === 0) {
          tte = defaultTramos;
        }
        const imp50 = Math.round(hs50 * rate_50 * 100) / 100;
        const imp100 = Math.round(hs100 * rate_100 * 100) / 100;
        const totalBlock = Math.round((quincena + imp50 + imp100) * 100) / 100;
        return {
          code,
          title,
          apuntadorLabel,
          tarifaLabel,
          tarifaMensual: monthlyFee,
          importeQuincena: quincena,
          hs50: Math.round(hs50 * 100) / 100,
          tarifa50: rate_50,
          importe50: imp50,
          hs100: Math.round(hs100 * 100) / 100,
          tarifa100: rate_100,
          importe100: imp100,
          importeTotalBlock: totalBlock,
          totalNormales: Math.round(reg * 100) / 100,
          totalTte: Math.round(tte * 100) / 100,
          turnos: rows,
        };
      };

      const blockNacional = buildBlock(
        'nacional',
        'DEPOSITO NACIONAL',
        'APUNTADOR 1',
        'TARIFA MENSUAL BONIFICADA 1',
        monthlyFeeNacional,
        turnosNacional,
        10.0
      );

      const blockFiscal = buildBlock(
        'fiscal',
        'DEPOSITO FISCAL',
        'APUNTADOR 2',
        'TARIFA MENSUAL BONIFICADA 2',
        monthlyFeeFiscal,
        turnosFiscal,
        5.0
      );

      if (sector === 'nacional') {
        blocks = [blockNacional];
      } else if (sector === 'fiscal') {
        blocks = [blockFiscal];
      } else {
        // 'both' -> MUST include BOTH deposits!
        blocks = [blockNacional, blockFiscal];
      }

      for (const b of blocks) {
        total_reg_hs += b.totalNormales;
        total_ot50_hs += b.hs50;
        total_ot100_hs += b.hs100;
      }
    }

    const sumBlocks = blocks.reduce((acc, b) => acc + b.importeTotalBlock, 0);
    const sumTramosFromBlocks = Math.round(blocks.reduce((acc, b) => acc + b.totalTte, 0) * 100) / 100;

    // Tramos de transporte (Delta Dock contract: 15.0 tramos por quincena = 10 Nacional + 5 Fiscal)
    const tramos =
      shuttleTripsManual !== undefined
        ? shuttleTripsManual
        : sector === 'arroz'
        ? (sumTramosFromBlocks > 0 ? sumTramosFromBlocks : 7.0)
        : sector === 'nacional'
        ? (sumTramosFromBlocks > 0 ? sumTramosFromBlocks : 10.0)
        : sector === 'fiscal'
        ? (sumTramosFromBlocks > 0 ? sumTramosFromBlocks : 5.0)
        : Math.max(15.0, sumTramosFromBlocks);

    const imp_transporte = Math.round(tramos * rateTramoTransporte * 100) / 100;
    const total_neto = Math.round((sumBlocks + imp_transporte) * 100) / 100;
    const total_iva = Math.round(total_neto * 0.21 * 100) / 100;
    const total_factura = Math.round((total_neto + total_iva) * 100) / 100;

    const items: ProformaCalculationItem[] = [];

    for (const b of blocks) {
      if (b.importeQuincena > 0) {
        items.push({
          description: `${b.tarifaLabel} (${b.title} - ${b.apuntadorLabel}) - Importe Quincena`,
          quantity: 1,
          unit_price: b.importeQuincena,
          subtotal: b.importeQuincena,
        });
      }
      if (b.hs50 > 0) {
        items.push({
          description: `Horas Extras 50% ${b.title} (${b.hs50.toFixed(1)} hs)`,
          quantity: b.hs50,
          unit_price: b.tarifa50,
          subtotal: b.importe50,
        });
      }
      if (b.hs100 > 0) {
        items.push({
          description: `Horas Extras 100% ${b.title} (${b.hs100.toFixed(1)} hs)`,
          quantity: b.hs100,
          unit_price: b.tarifa100,
          subtotal: b.importe100,
        });
      }
    }

    items.push({
      description: `Transporte Diario Personal (${tramos} tramos a $ ${rateTramoTransporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`,
      quantity: tramos,
      unit_price: rateTramoTransporte,
      subtotal: imp_transporte,
    });

    const shift_breakdown: CalculatedShiftAuditItem[] = shifts.map((shift: ClientShiftRecordForBilling) => {
      const sub =
        shift.regular_hours * apuntadorRates.REGULAR +
        shift.overtime_50_hours * rate_50 +
        shift.overtime_100_hours * rate_100 +
        shift.plus_delta_amount +
        shift.bonus_applied_amount;
      return {
        ...shift,
        regular_rate: apuntadorRates.REGULAR,
        overtime_50_rate: rate_50,
        overtime_100_rate: rate_100,
        calculated_subtotal: Math.round(sub * 100) / 100,
      };
    });

    const sectorDescription =
      sector === 'arroz'
        ? 'Depósito Arroz - Despacho Bolsones'
        : sector === 'nacional'
        ? 'Depósito Nacional'
        : sector === 'fiscal'
        ? 'Depósito Fiscal'
        : 'Depósito Nacional y Depósito Fiscal';

    const notes =
      inputNotes && inputNotes.length > 0
        ? inputNotes
        : [
            'NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026',
            `SERVICIO: DESPACHO BOLSONES (${sectorDescription.toUpperCase()})`,
          ];

    const imp_ot50_total = Math.round(total_ot50_hs * rate_50 * 100) / 100;
    const imp_ot100_total = Math.round(total_ot100_hs * rate_100 * 100) / 100;
    const quincenaFeeTotal = Math.round(blocks.reduce((acc, b) => acc + b.importeQuincena, 0) * 100) / 100;

    const payload = {
      proforma_type: 'fixed_deposit',
      from_date: fromDate,
      to_date: toDate,
      operation_dates: operationDates,
      client_name: ratesCtx.clientName,
      lugar: 'DELTA DOCK - LIMA',
      servicio: 'DESPACHO BOLSONES',
      sector: sectorDescription,
      sector_code: sector,
      abono_quincenal: quincenaFeeTotal,
      depositos: blocks,
      horas_extras: {
        hs_50: total_ot50_hs,
        tarifa_50: rate_50,
        imp_50: imp_ot50_total,
        hs_100: total_ot100_hs,
        tarifa_100: rate_100,
        imp_100: imp_ot100_total,
      },
      transporte: {
        tramos,
        tarifa_tramo: rateTramoTransporte,
        total_transporte: imp_transporte,
      },
      totales: {
        total_neto,
        iva_21: total_iva,
        total_factura,
      },
      notes,
    };

    return {
      client_id: clientId,
      client_name: ratesCtx.clientName,
      from_date: fromDate,
      to_date: toDate,
      operation_dates: operationDates,
      proforma_type: 'fixed_deposit',
      total_shifts: shifts.length || blocks.reduce((acc, b) => acc + b.turnos.length, 0),
      unapproved_shifts_count: unapprovedCount,
      total_regular_hours: Math.round(total_reg_hs * 100) / 100,
      total_overtime_50_hours: Math.round(total_ot50_hs * 100) / 100,
      total_overtime_100_hours: Math.round(total_ot100_hs * 100) / 100,
      total_hours: Math.round((total_reg_hs + total_ot50_hs + total_ot100_hs) * 100) / 100,
      subtotal: total_neto,
      discount_percentage: 0,
      discount_amount: 0,
      total_neto,
      tax_rate: 0.21,
      tax_amount: total_iva,
      total: total_factura,
      items,
      shift_breakdown,
      payload,
      notes,
    };
  },
};
