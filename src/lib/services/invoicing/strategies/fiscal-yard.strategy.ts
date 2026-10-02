import { 
  ProformaStrategy, 
  ProformaCalculationContext, 
  ProformaCalculationResult, 
  ProformaCalculationItem, 
  CalculatedShiftAuditItem,
  FiscalYardShiftRow,
  FiscalYardPositionSummary,
  FiscalYardPayload 
} from '../types';
import { fetchClientRatesContext, formatDatesSpan } from '../helpers';
import { getStaffEntriesForClientAndPeriod, ClientShiftRecordForBilling } from '@/lib/services/daily-entries';

export const fiscalYardStrategy: ProformaStrategy = {
  type: 'fiscal_yard',
  label: 'Plazoleta Fiscal Quincenal Consolidada',
  description: 'Liquidación quincenal que consolida Horas de Plazoleta (con 3% bonif.), Transporte Personal (remises) y Control EXPO.',
  defaultConceptType: 'general_hours',

  async calculate(context: ProformaCalculationContext): Promise<ProformaCalculationResult> {
    const { clientId, fromDate, toDate, discountPercentage: inputDiscount, notes: inputNotes, shuttleTripsManual } = context;

    // 1. Fetch rates
    const ratesCtx = await fetchClientRatesContext(clientId);
    const encargadoRates = ratesCtx.encargadoRates;
    const apuntadorRates = ratesCtx.apuntadorRates;
    const shuttleRate = ratesCtx.serviceRatesMap.get('SHUTTLE')?.rate ?? 35594.34;
    const discountPct = inputDiscount !== undefined ? inputDiscount : 3.0;

    // 2. Fetch approved shifts strictly from daily_staff_entries
    const billingShifts = await getStaffEntriesForClientAndPeriod(clientId, fromDate, toDate, { onlyApproved: true });
    const shifts = billingShifts.records;
    const unapprovedCount = billingShifts.unapprovedCount;

    const operationDates = formatDatesSpan(fromDate, toDate) || '01-15 SEPTIEMBRE 2026';

    // 3. Separate standard yard shifts vs expo shifts
    const expoShifts = shifts.filter((s: ClientShiftRecordForBilling) => s.is_export_day);
    const yardShifts = shifts.filter((s: ClientShiftRecordForBilling) => !s.is_export_day);

    const encargadoShifts = yardShifts.filter((s: ClientShiftRecordForBilling) => s.position_name.toLowerCase().includes('encargad'));
    const apuntadorShifts = yardShifts.filter((s: ClientShiftRecordForBilling) => !s.position_name.toLowerCase().includes('encargad'));

    // Encargado totals
    let yard_enc_reg = 0;
    let yard_enc_ot50 = 0;
    let yard_enc_ot100 = 0;
    for (const s of encargadoShifts) {
      yard_enc_reg += s.regular_hours;
      yard_enc_ot50 += s.overtime_50_hours;
      yard_enc_ot100 += s.overtime_100_hours;
    }

    // Apuntador totals
    let yard_ap_reg = 0;
    let yard_ap_ot50 = 0;
    let yard_ap_ot100 = 0;
    for (const s of apuntadorShifts) {
      yard_ap_reg += s.regular_hours;
      yard_ap_ot50 += s.overtime_50_hours;
      yard_ap_ot100 += s.overtime_100_hours;
    }

    // Round accumulated hours
    yard_enc_reg = Math.round(yard_enc_reg * 100) / 100;
    yard_enc_ot50 = Math.round(yard_enc_ot50 * 100) / 100;
    yard_enc_ot100 = Math.round(yard_enc_ot100 * 100) / 100;

    yard_ap_reg = Math.round(yard_ap_reg * 100) / 100;
    yard_ap_ot50 = Math.round(yard_ap_ot50 * 100) / 100;
    yard_ap_ot100 = Math.round(yard_ap_ot100 * 100) / 100;

    // Financial calculation for Encargado
    const imp_y_enc_reg = Math.round(yard_enc_reg * encargadoRates.REGULAR * 100) / 100;
    const imp_y_enc_ot50 = Math.round(yard_enc_ot50 * encargadoRates.OVERTIME_50 * 100) / 100;
    const imp_y_enc_ot100 = Math.round(yard_enc_ot100 * encargadoRates.OVERTIME_100 * 100) / 100;

    // Financial calculation for Apuntador
    const imp_y_ap_reg = Math.round(yard_ap_reg * apuntadorRates.REGULAR * 100) / 100;
    const imp_y_ap_ot50 = Math.round(yard_ap_ot50 * apuntadorRates.OVERTIME_50 * 100) / 100;
    const imp_y_ap_ot100 = Math.round(yard_ap_ot100 * apuntadorRates.OVERTIME_100 * 100) / 100;

    const subtotal_personal_plazoleta = Math.round(
      (imp_y_enc_reg + imp_y_enc_ot50 + imp_y_enc_ot100 + imp_y_ap_reg + imp_y_ap_ot50 + imp_y_ap_ot100) * 100
    ) / 100;
    const bonif_plazoleta = Math.round(subtotal_personal_plazoleta * (discountPct / 100) * 100) / 100;
    const subtotal_plazoleta_bonif = Math.round((subtotal_personal_plazoleta - bonif_plazoleta) * 100) / 100;

    // 4. Mapeo a Slots PF 01 al PF 13 (Plantilla Excel Histórica)
    // Agrupar turnos de apuntadores por operario
    const apuntadorOperariosMap = new Map<string, { employeeName: string; shifts: ClientShiftRecordForBilling[] }>();
    for (const s of apuntadorShifts) {
      const key = s.employee_id || s.employee_name;
      if (!apuntadorOperariosMap.has(key)) {
        apuntadorOperariosMap.set(key, { employeeName: s.employee_name, shifts: [] });
      }
      apuntadorOperariosMap.get(key)!.shifts.push(s);
    }

    const uniqueApuntadores = Array.from(apuntadorOperariosMap.entries());
    const totalSlotsCount = Math.max(13, uniqueApuntadores.length);
    const slots_summary: FiscalYardPositionSummary[] = [];
    const employeeToSlotMap = new Map<string, string>();

    for (let i = 0; i < totalSlotsCount; i++) {
      const slotNumStr = String(i + 1).padStart(2, '0');
      const slotCode = `APUNTADOR PF ${slotNumStr}`;
      const isBonificado = (i === 12); // PF 13 en el Excel histórico de CAT figura como BONIFICADO

      if (i < uniqueApuntadores.length) {
        const [empKey, empData] = uniqueApuntadores[i];
        employeeToSlotMap.set(empKey, slotCode);

        let reg = 0;
        let ot50 = 0;
        let ot100 = 0;
        for (const sh of empData.shifts) {
          reg += sh.regular_hours;
          ot50 += sh.overtime_50_hours;
          ot100 += sh.overtime_100_hours;
        }
        reg = Math.round(reg * 100) / 100;
        ot50 = Math.round(ot50 * 100) / 100;
        ot100 = Math.round(ot100 * 100) / 100;
        const tot = Math.round((reg + ot50 + ot100) * 100) / 100;
        const sub = Math.round((reg * apuntadorRates.REGULAR + ot50 * apuntadorRates.OVERTIME_50 + ot100 * apuntadorRates.OVERTIME_100) * 100) / 100;

        slots_summary.push({
          slotCode,
          positionTitle: 'Apuntador Plazoleta',
          assignedEmployee: empData.employeeName,
          totalRegular: reg,
          totalOt50: ot50,
          totalOt100: ot100,
          totalHours: tot,
          regularRate: apuntadorRates.REGULAR,
          ot50Rate: apuntadorRates.OVERTIME_50,
          ot100Rate: apuntadorRates.OVERTIME_100,
          subtotalAmount: sub,
          isBonificado,
        });
      } else {
        // Slot sin operario asignado en el período (mantiene la grilla fija 13x1 del Excel)
        slots_summary.push({
          slotCode,
          positionTitle: 'Apuntador Plazoleta',
          assignedEmployee: isBonificado ? 'BONIFICADO' : '(Sin turno asignado)',
          totalRegular: 0,
          totalOt50: 0,
          totalOt100: 0,
          totalHours: 0,
          regularRate: apuntadorRates.REGULAR,
          ot50Rate: apuntadorRates.OVERTIME_50,
          ot100Rate: apuntadorRates.OVERTIME_100,
          subtotalAmount: 0,
          isBonificado,
        });
      }
    }

    // Encargado summary slot
    const encargadoSummary: FiscalYardPositionSummary = {
      slotCode: 'ENCARGADO PF',
      positionTitle: 'Encargado Plazoleta',
      assignedEmployee: encargadoShifts[0]?.employee_name || '(Sin turno asignado)',
      totalRegular: yard_enc_reg,
      totalOt50: yard_enc_ot50,
      totalOt100: yard_enc_ot100,
      totalHours: Math.round((yard_enc_reg + yard_enc_ot50 + yard_enc_ot100) * 100) / 100,
      regularRate: encargadoRates.REGULAR,
      ot50Rate: encargadoRates.OVERTIME_50,
      ot100Rate: encargadoRates.OVERTIME_100,
      subtotalAmount: Math.round((imp_y_enc_reg + imp_y_enc_ot50 + imp_y_enc_ot100) * 100) / 100,
      isBonificado: false,
    };

    // 5. Construcción de Filas de Turnos Diarios (Panel Derecho del Excel)
    const shift_rows: FiscalYardShiftRow[] = yardShifts.map((s: ClientShiftRecordForBilling) => {
      const isEnc = s.position_name.toLowerCase().includes('encargad');
      const empKey = s.employee_id || s.employee_name;
      const slotPos = isEnc ? 'ENCARGADO PF' : (employeeToSlotMap.get(empKey) || 'APUNTADOR PF');
      const timeRange = s.shift_start_time && s.shift_end_time
        ? `${s.shift_start_time.slice(0, 5)}-${s.shift_end_time.slice(0, 5)}`
        : '07:00-17:00';
      const tot = Math.round((s.regular_hours + s.overtime_50_hours + s.overtime_100_hours) * 100) / 100;

      return {
        slotPosition: slotPos,
        employeeName: s.employee_name,
        workDate: s.work_date,
        timeRange,
        totalHours: tot,
        regularHours: s.regular_hours,
        overtime50Hours: s.overtime_50_hours,
        overtime100Hours: s.overtime_100_hours,
        isBonificado: slotPos === 'APUNTADOR PF 13',
      };
    });

    // Ordenar turnos cronológicamente y luego por puesto
    shift_rows.sort((a, b) => {
      if (a.workDate !== b.workDate) return a.workDate.localeCompare(b.workDate);
      return a.slotPosition.localeCompare(b.slotPosition);
    });

    // 6. Transporte (TTE)
    const total_viajes_tte = shuttleTripsManual !== undefined 
      ? shuttleTripsManual 
      : (billingShifts.totalShuttles || 0);
    const subtotal_transporte = Math.round(total_viajes_tte * shuttleRate * 100) / 100;

    // 7. Control EXPO (Factor 0.90 de coparticipación / asignación CAT)
    let expo_reg = 0;
    let expo_ot50 = 0;
    let expo_ot100 = 0;
    for (const s of expoShifts) {
      expo_reg += s.regular_hours;
      expo_ot50 += s.overtime_50_hours;
      expo_ot100 += s.overtime_100_hours;
    }

    const expo_factor = 0.90;
    const expo_base_reg = Math.round(expo_reg * 100) / 100;
    const expo_base_ot50 = Math.round(expo_ot50 * 100) / 100;
    const expo_base_ot100 = Math.round(expo_ot100 * 100) / 100;

    const expo_fact_reg = Math.round(expo_base_reg * expo_factor * 100) / 100;
    const expo_fact_ot50 = Math.round(expo_base_ot50 * expo_factor * 100) / 100;
    const expo_fact_ot100 = Math.round(expo_base_ot100 * expo_factor * 100) / 100;

    const imp_expo_reg = Math.round(expo_fact_reg * apuntadorRates.REGULAR * 100) / 100;
    const imp_expo_ot50 = Math.round(expo_fact_ot50 * apuntadorRates.OVERTIME_50 * 100) / 100;
    const imp_expo_ot100 = Math.round(expo_fact_ot100 * apuntadorRates.OVERTIME_100 * 100) / 100;
    const subtotal_expo = Math.round((imp_expo_reg + imp_expo_ot50 + imp_expo_ot100) * 100) / 100;

    // 8. Consolidado General
    const total_neto = Math.round((subtotal_plazoleta_bonif + subtotal_transporte + subtotal_expo) * 100) / 100;
    const total_iva = Math.round(total_neto * 0.21 * 100) / 100;
    const total_factura = Math.round((total_neto + total_iva) * 100) / 100;

    const items: ProformaCalculationItem[] = [
      {
        description: `Servicio Apuntadores Plazoleta Fiscal (${operationDates}) - Bonificado ${discountPct}%`,
        quantity: 1,
        unit_price: subtotal_plazoleta_bonif,
        subtotal: subtotal_plazoleta_bonif,
      },
    ];

    if (total_viajes_tte > 0 || subtotal_transporte > 0) {
      items.push({
        description: `Transporte Personal Plazoleta Fiscal (${total_viajes_tte} viajes a $ ${shuttleRate.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`,
        quantity: total_viajes_tte,
        unit_price: shuttleRate,
        subtotal: subtotal_transporte,
      });
    }

    if (subtotal_expo > 0 || expo_base_reg > 0) {
      items.push({
        description: `Control EXPO Plazoleta Fiscal (${operationDates}) - Asignación ${(expo_factor * 100).toFixed(0)}%`,
        quantity: 1,
        unit_price: subtotal_expo,
        subtotal: subtotal_expo,
      });
    }

    const shift_breakdown: CalculatedShiftAuditItem[] = shifts.map((shift: ClientShiftRecordForBilling) => {
      const isEnc = shift.position_name.toLowerCase().includes('encargad');
      const r = isEnc ? encargadoRates : apuntadorRates;
      const sub =
        shift.regular_hours * r.REGULAR +
        shift.overtime_50_hours * r.OVERTIME_50 +
        shift.overtime_100_hours * r.OVERTIME_100 +
        shift.plus_delta_amount +
        shift.bonus_applied_amount;
      return {
        ...shift,
        regular_rate: r.REGULAR,
        overtime_50_rate: r.OVERTIME_50,
        overtime_100_rate: r.OVERTIME_100,
        calculated_subtotal: Math.round(sub * 100) / 100,
      };
    });

    const notes = inputNotes && inputNotes.length > 0 ? inputNotes : [
      'NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026',
      '(*) PERSONAL ADICIONAL ACORDADO CON LA EMPRESA',
      'PENDIENTE AJUSTAR PORCENTAJE UTILIDAD QUE ACORDEMOS SEGÚN ANÁLISIS DE ESTRUCTURAS DE COSTOS',
    ];

    const payload: FiscalYardPayload = {
      proforma_type: 'fiscal_yard',
      operation_dates: operationDates,
      client_name: ratesCtx.clientName,
      discount_percentage: discountPct,
      consolidado: {
        plazoleta_fiscal: subtotal_plazoleta_bonif,
        transporte_personal: subtotal_transporte,
        control_expo: subtotal_expo,
        total_neto,
        iva_21: total_iva,
        total_factura,
      },
      tab_plazoleta: {
        horas_encargado: { norm: yard_enc_reg, ot50: yard_enc_ot50, ot100: yard_enc_ot100 },
        horas_apuntador: { norm: yard_ap_reg, ot50: yard_ap_ot50, ot100: yard_ap_ot100 },
        tarifas_encargado: encargadoRates,
        tarifas_apuntador: apuntadorRates,
        importes: {
          enc_reg: imp_y_enc_reg,
          enc_ot50: imp_y_enc_ot50,
          enc_ot100: imp_y_enc_ot100,
          ap_reg: imp_y_ap_reg,
          ap_ot50: imp_y_ap_ot50,
          ap_ot100: imp_y_ap_ot100,
          neto_sin_bonif: subtotal_personal_plazoleta,
          bonificacion: bonif_plazoleta,
          subtotal_bonificado: subtotal_plazoleta_bonif,
        },
        shift_rows,
        slots_summary: [encargadoSummary, ...slots_summary],
        totales_grilla: {
          total_regular: Math.round((yard_enc_reg + yard_ap_reg) * 100) / 100,
          total_ot50: Math.round((yard_enc_ot50 + yard_ap_ot50) * 100) / 100,
          total_ot100: Math.round((yard_enc_ot100 + yard_ap_ot100) * 100) / 100,
          total_hours: Math.round((yard_enc_reg + yard_ap_reg + yard_enc_ot50 + yard_ap_ot50 + yard_enc_ot100 + yard_ap_ot100) * 100) / 100,
        },
      },
      tab_transporte: {
        viajes: total_viajes_tte,
        tarifa_por_viaje: shuttleRate,
        total_transporte: subtotal_transporte,
      },
      tab_expo: {
        horas_base: { norm: expo_base_reg, ot50: expo_base_ot50, ot100: expo_base_ot100 },
        factor_asignacion: expo_factor,
        horas_facturadas: { norm: expo_fact_reg, ot50: expo_fact_ot50, ot100: expo_fact_ot100 },
        importes: { reg: imp_expo_reg, ot50: imp_expo_ot50, ot100: imp_expo_ot100, total: subtotal_expo },
      },
      notes,
    };

    const finalTotalRegular = Math.round((yard_enc_reg + yard_ap_reg + expo_fact_reg) * 100) / 100;
    const finalTotalOt50 = Math.round((yard_enc_ot50 + yard_ap_ot50 + expo_fact_ot50) * 100) / 100;
    const finalTotalOt100 = Math.round((yard_enc_ot100 + yard_ap_ot100 + expo_fact_ot100) * 100) / 100;
    const finalTotalHours = Math.round((finalTotalRegular + finalTotalOt50 + finalTotalOt100) * 100) / 100;

    return {
      client_id: clientId,
      client_name: ratesCtx.clientName,
      from_date: fromDate,
      to_date: toDate,
      operation_dates: operationDates,
      proforma_type: 'fiscal_yard',
      total_shifts: shifts.length,
      unapproved_shifts_count: unapprovedCount,
      total_regular_hours: finalTotalRegular,
      total_overtime_50_hours: finalTotalOt50,
      total_overtime_100_hours: finalTotalOt100,
      total_hours: finalTotalHours,
      subtotal: total_neto,
      discount_percentage: discountPct,
      discount_amount: bonif_plazoleta,
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

