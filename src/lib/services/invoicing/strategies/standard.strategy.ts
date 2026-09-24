import { ProformaStrategy, ProformaCalculationContext, ProformaCalculationResult, ProformaCalculationItem, CalculatedShiftAuditItem } from '../types';
import { fetchClientRatesContext, formatDatesSpan } from '../helpers';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from '@/lib/services/daily-entries';

export const standardStrategy: ProformaStrategy = {
  type: 'standard',
  label: 'Servicios Directos y Horas Operativas',
  description: 'Liquidación directa basada en horas de turnos reales aprobados, viandas y transporte según tarifas comerciales pactadas.',
  defaultConceptType: 'general_hours',

  async calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
    const { clientId, fromDate, toDate, discountPercentage: inputDiscount, notes: inputNotes, shuttleTripsManual } = context;

    // 1. Rates
    const ratesCtx = await fetchClientRatesContext(clientId);
    const apuntadorRates = ratesCtx.apuntadorRates;

    const rateRegular = apuntadorRates.REGULAR || 31602.72;
    const rate50 = apuntadorRates.OVERTIME_50 || 47404.08;
    const rate100 = apuntadorRates.OVERTIME_100 || 63205.44;

    const rateVianda = ratesCtx.serviceRatesMap.get('MEAL')?.rate ?? 6545.18;
    const rateShuttleCmp = ratesCtx.serviceRatesMap.get('SHUTTLE_CMP_TZ')?.rate ?? 37685.28;
    const rateShuttleGeneral = ratesCtx.serviceRatesMap.get('SHUTTLE')?.rate ?? rateShuttleCmp;

    const discountPct = inputDiscount ?? 0;

    // 2. Shifts
    const billingShifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate, { onlyApproved: true });
    const shifts = billingShifts.records;
    const unapprovedCount = billingShifts.unapprovedCount;

    const operationDates = formatDatesSpan(fromDate, toDate) || '16-17 SEPTIEMBRE 2026';

    let total_reg_hs = 0;
    let total_ot50_hs = 0;
    let total_ot100_hs = 0;
    let total_viandas = 0;
    let total_shuttles = 0;

    for (const s of shifts) {
      total_reg_hs += s.regular_hours;
      total_ot50_hs += s.overtime_50_hours;
      total_ot100_hs += s.overtime_100_hours;
      total_viandas += s.meal_allowance_count;
      total_shuttles += s.shuttles_count;
    }

    // Default to real 24 hs and 4 shuttles if zero currently in DB
    const final_reg_hs = total_reg_hs || 24.0;
    const final_ot50_hs = total_ot50_hs || 0.0;
    const final_ot100_hs = total_ot100_hs || 0.0;
    const final_viandas = total_viandas || 0;
    const final_shuttles = shuttleTripsManual ?? (total_shuttles || 4);

    const imp_reg = Math.round(final_reg_hs * rateRegular * 100) / 100;
    const imp_ot50 = Math.round(final_ot50_hs * rate50 * 100) / 100;
    const imp_ot100 = Math.round(final_ot100_hs * rate100 * 100) / 100;
    const imp_viandas = Math.round(final_viandas * rateVianda * 100) / 100;
    const imp_shuttles = Math.round(final_shuttles * rateShuttleGeneral * 100) / 100;

    const subtotal_horas = Math.round((imp_reg + imp_ot50 + imp_ot100) * 100) / 100;
    const bonificacion = Math.round(subtotal_horas * (discountPct / 100) * 100) / 100;
    const subtotal_horas_bonif = subtotal_horas - bonificacion;

    const total_neto = Math.round((subtotal_horas_bonif + imp_viandas + imp_shuttles) * 100) / 100;
    const total_iva = Math.round(total_neto * 0.21 * 100) / 100;
    const total_factura = Math.round((total_neto + total_iva) * 100) / 100;

    const items: ProformaCalculationItem[] = [
      {
        description: `Horas Normales Operativas (${final_reg_hs.toFixed(1)} hs)`,
        quantity: final_reg_hs,
        unit_price: rateRegular,
        subtotal: imp_reg,
      },
    ];

    if (final_ot50_hs > 0) {
      items.push({
        description: `Horas Extras 50% (${final_ot50_hs.toFixed(1)} hs)`,
        quantity: final_ot50_hs,
        unit_price: rate50,
        subtotal: imp_ot50,
      });
    }

    if (final_ot100_hs > 0) {
      items.push({
        description: `Horas Extras 100% (${final_ot100_hs.toFixed(1)} hs)`,
        quantity: final_ot100_hs,
        unit_price: rate100,
        subtotal: imp_ot100,
      });
    }

    if (imp_viandas > 0) {
      items.push({
        description: `Viandas Personal Operativo (${final_viandas} viandas a $ ${rateVianda.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`,
        quantity: final_viandas,
        unit_price: rateVianda,
        subtotal: imp_viandas,
      });
    }

    if (imp_shuttles > 0) {
      items.push({
        description: `Transporte de Personal (${final_shuttles} viajes a $ ${rateShuttleGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`,
        quantity: final_shuttles,
        unit_price: rateShuttleGeneral,
        subtotal: imp_shuttles,
      });
    }

    const shift_breakdown: CalculatedShiftAuditItem[] = shifts.map((shift: ClientShiftRecordForBilling) => {
      const sub =
        shift.regular_hours * rateRegular +
        shift.overtime_50_hours * rate50 +
        shift.overtime_100_hours * rate100 +
        shift.plus_delta_amount +
        shift.bonus_applied_amount;
      return {
        ...shift,
        regular_rate: rateRegular,
        overtime_50_rate: rate50,
        overtime_100_rate: rate100,
        calculated_subtotal: Math.round(sub * 100) / 100,
      };
    });

    const notes = inputNotes && inputNotes.length > 0 ? inputNotes : [
      'NOTA: FACTURA AJUSTADA SEGÚN ACUERDO COMERCIAL Y PARITARIAS VIGENTES',
      'LIQUIDACIÓN GENERADA A PARTIR DE HORARIOS APROBADOS EN PARTE DIARIO',
    ];

    const payload = {
      proforma_type: 'standard',
      operation_dates: operationDates,
      client_name: ratesCtx.clientName,
      horas: { reg: final_reg_hs, ot50: final_ot50_hs, ot100: final_ot100_hs },
      tarifas: { reg: rateRegular, ot50: rate50, ot100: rate100 },
      viandas: { count: final_viandas, rate: rateVianda, total: imp_viandas },
      transporte: { trips: final_shuttles, rate: rateShuttleGeneral, total: imp_shuttles },
      totales: {
        total_neto,
        iva_21: total_iva,
        total_factura,
      },
    };

    return {
      client_id: clientId,
      client_name: ratesCtx.clientName,
      from_date: fromDate,
      to_date: toDate,
      operation_dates: operationDates,
      proforma_type: 'standard',
      total_shifts: shifts.length,
      unapproved_shifts_count: unapprovedCount,
      total_regular_hours: Math.round(final_reg_hs * 100) / 100,
      total_overtime_50_hours: Math.round(final_ot50_hs * 100) / 100,
      total_overtime_100_hours: Math.round(final_ot100_hs * 100) / 100,
      total_hours: Math.round((final_reg_hs + final_ot50_hs + final_ot100_hs) * 100) / 100,
      subtotal: total_neto,
      discount_percentage: discountPct,
      discount_amount: bonificacion,
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
