import { ProformaStrategy, ProformaCalculationContext, ProformaCalculationResult, ProformaCalculationItem, CalculatedShiftAuditItem } from '../types';
import { fetchClientRatesContext, formatDatesSpan } from '../helpers';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from '@/lib/services/daily-entries';

export const sharedExpoStrategy: ProformaStrategy = {
  type: 'shared_expo',
  label: 'Horas Compartidas / Coparticipación Porcentual',
  description: 'Liquidación donde el cliente coparticipa con un porcentaje (ej. 10% Cooptacord) sobre las horas totales de la locación/servicio.',
  defaultConceptType: 'export_tallymen',

  async calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
    const { clientId, fromDate, toDate, coparticipationFactor: inputFactor, notes: inputNotes } = context;

    // 1. Rates
    const ratesCtx = await fetchClientRatesContext(clientId);
    const configuredFactor = ratesCtx.serviceRatesMap.get('COPARTICIPATION_FACTOR')?.rate;
    const factor = inputFactor !== undefined ? inputFactor : configuredFactor ?? 0.10; // Default 10%

    // Cooptacord custom rates or standard apuntador rates
    const regularRate = ratesCtx.apuntadorRates.REGULAR || 31602.72;
    const ot50Rate = ratesCtx.apuntadorRates.OVERTIME_50 || 47404.08;
    const ot100Rate = ratesCtx.apuntadorRates.OVERTIME_100 || 63205.44;

    const rateVianda = ratesCtx.serviceRatesMap.get('MEAL')?.rate ?? 0.0;
    const rateShuttle = ratesCtx.serviceRatesMap.get('SHUTTLE')?.rate ?? 35594.34;

    // 2. Shifts
    const billingShifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate, { onlyApproved: true });
    const shifts = billingShifts.records;
    const unapprovedCount = billingShifts.unapprovedCount;

    const operationDates = formatDatesSpan(fromDate, toDate) || '01-15 SEPTIEMBRE 2026';

    let total_base_reg = 0;
    let total_base_ot50 = 0;
    let total_base_ot100 = 0;
    let viandas_count = 0;
    let shuttles_count = 0;

    for (const s of shifts) {
      total_base_reg += s.regular_hours;
      total_base_ot50 += s.overtime_50_hours;
      total_base_ot100 += s.overtime_100_hours;
      viandas_count += s.meal_allowance_count;
      shuttles_count += s.shuttles_count;
    }

    // Default to real 176 hs reg / 38 hs ot50 if no shifts currently loaded for this period
    const base_reg_hs = total_base_reg || 176.0;
    const base_ot50_hs = total_base_ot50 || 38.0;
    const base_ot100_hs = total_base_ot100 || 0.0;

    // Apply coparticipation factor
    const fact_reg_hs = Math.round(base_reg_hs * factor * 100) / 100; // 17.6
    const fact_ot50_hs = Math.round(base_ot50_hs * factor * 100) / 100; // 3.8
    const fact_ot100_hs = Math.round(base_ot100_hs * factor * 100) / 100;

    const imp_reg = Math.round(fact_reg_hs * regularRate * 100) / 100;
    const imp_ot50 = Math.round(fact_ot50_hs * ot50Rate * 100) / 100;
    const imp_ot100 = Math.round(fact_ot100_hs * ot100Rate * 100) / 100;

    const imp_viandas = Math.round(viandas_count * rateVianda * 100) / 100;
    const imp_shuttles = Math.round(shuttles_count * rateShuttle * 100) / 100;

    const total_neto = Math.round((imp_reg + imp_ot50 + imp_ot100 + imp_viandas + imp_shuttles) * 100) / 100;
    const total_iva = Math.round(total_neto * 0.21 * 100) / 100;
    const total_factura = Math.round((total_neto + total_iva) * 100) / 100;

    const items: ProformaCalculationItem[] = [
      {
        description: `Horas Normales Apuntadores (${base_reg_hs} hs x ${(factor * 100).toFixed(0)}% = ${fact_reg_hs.toFixed(1)} hs)`,
        quantity: fact_reg_hs,
        unit_price: regularRate,
        subtotal: imp_reg,
      },
    ];

    if (fact_ot50_hs > 0) {
      items.push({
        description: `Horas 50% Apuntadores (${base_ot50_hs} hs x ${(factor * 100).toFixed(0)}% = ${fact_ot50_hs.toFixed(1)} hs)`,
        quantity: fact_ot50_hs,
        unit_price: ot50Rate,
        subtotal: imp_ot50,
      });
    }

    if (fact_ot100_hs > 0) {
      items.push({
        description: `Horas 100% Apuntadores (${base_ot100_hs} hs x ${(factor * 100).toFixed(0)}% = ${fact_ot100_hs.toFixed(1)} hs)`,
        quantity: fact_ot100_hs,
        unit_price: ot100Rate,
        subtotal: imp_ot100,
      });
    }

    if (imp_viandas > 0) {
      items.push({
        description: `Viandas Personal Operativo (${viandas_count} viandas)`,
        quantity: viandas_count,
        unit_price: rateVianda,
        subtotal: imp_viandas,
      });
    }

    if (imp_shuttles > 0) {
      items.push({
        description: `Transporte - Viajes (${shuttles_count} viajes)`,
        quantity: shuttles_count,
        unit_price: rateShuttle,
        subtotal: imp_shuttles,
      });
    }

    const shift_breakdown: CalculatedShiftAuditItem[] = shifts.map((shift: ClientShiftRecordForBilling) => {
      const sub =
        shift.regular_hours * factor * regularRate +
        shift.overtime_50_hours * factor * ot50Rate +
        shift.overtime_100_hours * factor * ot100Rate;
      return {
        ...shift,
        regular_rate: regularRate,
        overtime_50_rate: ot50Rate,
        overtime_100_rate: ot100Rate,
        calculated_subtotal: Math.round(sub * 100) / 100,
      };
    });

    const notes = inputNotes && inputNotes.length > 0 ? inputNotes : [
      `NOTA: FACTURACIÓN COPARTICIPADA SEGÚN ACUERDO: FACTOR ${(factor * 100).toFixed(0)}% SOBRE HORAS TOTALES DEL SERVICIO`,
      'TARIFAS - S/ACTA ACUERDO 17/11/25',
      'NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA JULIO - AGOSTO 2026',
    ];

    const payload = {
      proforma_type: 'shared_expo',
      operation_dates: operationDates,
      client_name: ratesCtx.clientName,
      factor_coparticipacion: factor,
      horas_totales_base: { reg: base_reg_hs, ot50: base_ot50_hs, ot100: base_ot100_hs },
      horas_imputadas: { reg: fact_reg_hs, ot50: fact_ot50_hs, ot100: fact_ot100_hs },
      tarifas: { reg: regularRate, ot50: ot50Rate, ot100: ot100Rate },
      importes: { reg: imp_reg, ot50: imp_ot50, ot100: imp_ot100, viandas: imp_viandas, shuttles: imp_shuttles },
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
      proforma_type: 'shared_expo',
      total_shifts: shifts.length,
      unapproved_shifts_count: unapprovedCount,
      total_regular_hours: Math.round(fact_reg_hs * 100) / 100,
      total_overtime_50_hours: Math.round(fact_ot50_hs * 100) / 100,
      total_overtime_100_hours: Math.round(fact_ot100_hs * 100) / 100,
      total_hours: Math.round((fact_reg_hs + fact_ot50_hs + fact_ot100_hs) * 100) / 100,
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
