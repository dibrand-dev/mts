import { ProformaStrategy, ProformaCalculationContext, ProformaCalculationResult, ProformaCalculationItem, CalculatedShiftAuditItem } from '../types';
import { fetchClientRatesContext, formatDatesSpan } from '../helpers';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from '@/lib/services/daily-entries';

export const fixedDepositStrategy: ProformaStrategy = {
  type: 'fixed_deposit',
  label: 'Abono Fijo Depósitos / Almacenes',
  description: 'Liquidación por Abono Mensual/Quincenal fijo por sector + Horas Extras al 50%/100% + Tramos de transporte diario.',
  defaultConceptType: 'general_hours',

  async calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
    const { clientId, fromDate, toDate, depositSector, notes: inputNotes, shuttleTripsManual } = context;

    // 1. Rates
    const ratesCtx = await fetchClientRatesContext(clientId);
    const apuntadorRates = ratesCtx.apuntadorRates;

    const rateTramoTransporte = ratesCtx.serviceRatesMap.get('SHUTTLE_TRAMO')?.rate ?? 37249.77;
    const monthlyFeeNacional = ratesCtx.serviceRatesMap.get('FIXED_MONTHLY_DEPOSIT_NACIONAL')?.rate ?? 5466694.70;
    const monthlyFeeFiscal = ratesCtx.serviceRatesMap.get('FIXED_MONTHLY_DEPOSIT_FISCAL')?.rate ?? 5466694.70;

    // Sector determines whether we bill both deposits or a specific one
    const sector = depositSector || 'both'; // 'both' | 'nacional' | 'fiscal' | 'arroz'

    let quincenaFee = 0;
    let sectorDescription = '';

    if (sector === 'nacional') {
      quincenaFee = Math.round((monthlyFeeNacional / 2) * 100) / 100;
      sectorDescription = 'Depósito Nacional';
    } else if (sector === 'fiscal') {
      quincenaFee = Math.round((monthlyFeeFiscal / 2) * 100) / 100;
      sectorDescription = 'Depósito Fiscal';
    } else if (sector === 'arroz') {
      quincenaFee = 0.0; // Despacho bolsones arroz se liquida solo por extras y transporte o según acuerdo
      sectorDescription = 'Depósito Arroz - Despacho Bolsones';
    } else {
      // Both deposits combined
      quincenaFee = Math.round(((monthlyFeeNacional + monthlyFeeFiscal) / 2) * 100) / 100; // 5.466.694,70
      sectorDescription = 'Depósito Nacional y Depósito Fiscal';
    }

    // 2. Shifts
    const billingShifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate, { onlyApproved: true });
    const shifts = billingShifts.records;
    const unapprovedCount = billingShifts.unapprovedCount;

    const operationDates = formatDatesSpan(fromDate, toDate) || '01-15 SEPTIEMBRE 2026';

    let total_ot50_hs = 0;
    let total_ot100_hs = 0;
    let total_reg_hs = 0;

    for (const s of shifts) {
      total_reg_hs += s.regular_hours;
      total_ot50_hs += s.overtime_50_hours;
      total_ot100_hs += s.overtime_100_hours;
    }

    // Extra hours rates (use ratesCtx.apuntadorRates or fallback from Delta Dock Excel: 50% = 46.591,18, 100% = 62.121,57)
    const rate_50 = apuntadorRates.OVERTIME_50 || 46591.18;
    const rate_100 = apuntadorRates.OVERTIME_100 || 62121.57;

    const imp_ot50 = Math.round(total_ot50_hs * rate_50 * 100) / 100;
    const imp_ot100 = Math.round(total_ot100_hs * rate_100 * 100) / 100;

    // Tramos de transporte (default 10.5 tramos for depósitos or 7 tramos for arroz if shifts shuttles count is 0)
    const tramos = shuttleTripsManual ?? (billingShifts.totalShuttles > 0 ? billingShifts.totalShuttles : sector === 'arroz' ? 7.0 : 10.5);
    const imp_transporte = Math.round(tramos * rateTramoTransporte * 100) / 100;

    // Subtotales y Total
    const subtotal_servicios = Math.round((quincenaFee + imp_ot50 + imp_ot100) * 100) / 100;
    const total_neto = Math.round((subtotal_servicios + imp_transporte) * 100) / 100;
    const total_iva = Math.round(total_neto * 0.21 * 100) / 100;
    const total_factura = Math.round((total_neto + total_iva) * 100) / 100;

    const items: ProformaCalculationItem[] = [];

    if (quincenaFee > 0) {
      items.push({
        description: `Tarifa Mensual Bonificada Quincenal - ${sectorDescription}`,
        quantity: 1,
        unit_price: quincenaFee,
        subtotal: quincenaFee,
      });
    }

    if (total_ot50_hs > 0) {
      items.push({
        description: `Horas Extras 50% (${total_ot50_hs.toFixed(1)} hs)`,
        quantity: total_ot50_hs,
        unit_price: rate_50,
        subtotal: imp_ot50,
      });
    }

    if (total_ot100_hs > 0) {
      items.push({
        description: `Horas Extras 100% (${total_ot100_hs.toFixed(1)} hs)`,
        quantity: total_ot100_hs,
        unit_price: rate_100,
        subtotal: imp_ot100,
      });
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

    const notes = inputNotes && inputNotes.length > 0 ? inputNotes : [
      'NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026',
      `SECTOR IMPUTADO: ${sectorDescription.toUpperCase()}`,
      `TRANSPORTE DIARIO LIQUIDADO POR TRAMOS A VALOR PARITARIA ($ ${rateTramoTransporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`,
    ];

    const payload = {
      proforma_type: 'fixed_deposit',
      operation_dates: operationDates,
      client_name: ratesCtx.clientName,
      sector: sectorDescription,
      abono_quincenal: quincenaFee,
      horas_extras: {
        hs_50: total_ot50_hs,
        tarifa_50: rate_50,
        imp_50: imp_ot50,
        hs_100: total_ot100_hs,
        tarifa_100: rate_100,
        imp_100: imp_ot100,
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
    };

    return {
      client_id: clientId,
      client_name: ratesCtx.clientName,
      from_date: fromDate,
      to_date: toDate,
      operation_dates: operationDates,
      proforma_type: 'fixed_deposit',
      total_shifts: shifts.length,
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
