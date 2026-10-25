import { InvoicingRecord, ProformaCalculationResult } from './types';
import { buildFortnightDepositDays } from './strategies/fixed-deposit.strategy';

export interface ExcelCell {
  value: string | number;
  style?: 'header' | 'subheader' | 'label' | 'currency' | 'number' | 'total_label' | 'total_currency' | 'note' | 'highlight_label' | 'highlight_currency' | 'center';
  colSpan?: number;
  formula?: string;
}

export interface ExcelWorksheetData {
  name: string;
  colWidths: number[];
  rows: (ExcelCell | null)[][];
}

export interface ExcelWorkbookData {
  filename: string;
  title: string;
  proformaType: string;
  sheets: ExcelWorksheetData[];
}

function c(
  value: string | number,
  style?: ExcelCell['style'],
  formula?: string,
  colSpan?: number
): ExcelCell {
  return { value, style, formula, colSpan };
}

function formatDateExcel(rawDate?: string): string {
  if (!rawDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [y, m, d] = rawDate.split('-');
    return `${d}/${m}/${y}`;
  }
  return rawDate;
}

function setRowCells(
  grid: (ExcelCell | null)[][],
  rowIdx: number,
  entries: Record<number, ExcelCell>
) {
  while (grid.length <= rowIdx) {
    grid.push([]);
  }
  const row = grid[rowIdx];
  const maxCol = Math.max(...Object.keys(entries).map(Number), row.length - 1);
  while (row.length <= maxCol) {
    row.push(null);
  }
  for (const [colStr, cell] of Object.entries(entries)) {
    row[Number(colStr)] = cell;
  }
}

/**
 * Converts either an InvoicingRecord or a live ProformaCalculationResult into an ExcelWorkbookData
 * matching the exact multi-tab structure of docs/plantillas-excel/*.xls
 */
export function buildProformaWorkbook(
  source: InvoicingRecord | ProformaCalculationResult,
  meta?: { issueDate?: string; dueDate?: string; invoiceNumber?: string }
): ExcelWorkbookData {
  const isRecord = 'proforma_number' in source;
  const proformaType = source.proforma_type || 'vessel';
  const payload = (isRecord ? source.calculation_payload : source.payload) || {};
  const clientName = source.client_name || payload.client_name || 'CLIENTE';
  const operationDates = source.operation_dates || payload.operation_dates || (isRecord ? source.fortnight_period : '');
  const vesselName = source.vessel_name || payload.vessel_name || 'BUQUE';
  const issueDate = (isRecord ? source.invoice?.invoice_date || source.issue_date : meta?.issueDate) || new Date().toISOString().split('T')[0];
  const dueDate = (isRecord ? source.due_date : meta?.dueDate) || issueDate;
  const invoiceNumber = (isRecord ? source.invoice?.invoice_number : meta?.invoiceNumber) || 'A DEFINIR';
  const notes: string[] = (source.notes && source.notes.length > 0 ? source.notes : payload.notes) || [
    'NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026',
  ];

  // =========================================================================
  // MODELO 1: BUQUE (5 PESTAÑAS: FACTURA, BUQUE, PLUS, HS COMPENSACION, ENCARGADO A BORDO)
  // =========================================================================
  if (proformaType === 'vessel') {
    const tab1 = payload.tab1_resumen_general || {};
    const tab2 = payload.tab2_encargado_a_bordo || {};
    const tab3 = payload.tab3_hs_compensacion || {};
    const tabPlus = payload.tab_plus || {};
    const shiftRows: any[] = payload.shift_rows || [];

    const subOp = Number(tab1.consolidado?.subtotal_operativa ?? source.subtotal_operativa ?? 0);
    const subComp = Number(tab1.consolidado?.subtotal_compensacion ?? source.subtotal_compensacion ?? 0);
    const subEnc = Number(tab1.consolidado?.subtotal_encargado ?? source.subtotal_encargado ?? 0);
    const totalNeto = Number(tab1.consolidado?.total_neto ?? source.total_neto ?? source.subtotal ?? 0);
    const iva = Number(tab1.consolidado?.iva_21 ?? source.tax_amount ?? totalNeto * 0.21);
    const totalFinal = Number(tab1.consolidado?.total_factura_final ?? source.total ?? totalNeto + iva);

    // Sheet 1: FACTURA BUQUE
    const s1: (ExcelCell | null)[][] = [];
    setRowCells(s1, 0, { 0: c('FACTURA ELECTRONICA', 'header'), 1: c(invoiceNumber, 'subheader') });
    setRowCells(s1, 1, { 0: c('FECHA FACTURA', 'label'), 1: c(issueDate, 'center') });
    setRowCells(s1, 2, { 0: c('FECHA VENCIMIENTO', 'label'), 1: c(dueDate, 'center') });
    setRowCells(s1, 3, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
    setRowCells(s1, 4, { 0: c('LUGAR', 'label'), 1: c('DELTA DOCK - LIMA', 'label') });
    setRowCells(s1, 6, { 0: c(`${vesselName} - ${operationDates}`, 'label'), 1: c(subOp, 'currency') });
    setRowCells(s1, 7, { 0: c(`HORAS COMPENSACION - ${operationDates}`, 'label'), 1: c(subComp, 'currency') });
    setRowCells(s1, 8, { 0: c(`ENCARGADO A BORDO - ${operationDates}`, 'label'), 1: c(subEnc, 'currency') });
    setRowCells(s1, 10, { 0: c('TOTAL NETO FACTURA', 'total_label'), 1: c(totalNeto, 'total_currency') });
    setRowCells(s1, 11, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency') });
    setRowCells(s1, 12, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFinal, 'total_currency') });

    // Sheet 2: OPERATIVA BUQUE + GRILLA DE TURNOS A LA DERECHA
    const s2: (ExcelCell | null)[][] = [];
    const veh = tab1.vehiculos || {};
    const desglose: any[] = tab1.desglose || [];
    const sumNorm = shiftRows.reduce((a, r) => a + Number(r.normales || 0), 0);
    const sum50 = shiftRows.reduce((a, r) => a + Number(r.ot50 || 0), 0);
    const sum100 = shiftRows.reduce((a, r) => a + Number(r.ot100 || 0), 0);
    const sumRem = shiftRows.reduce((a, r) => a + Number(r.remises || 0), 0);

    setRowCells(s2, 0, {
      0: c('SERVICIO', 'header'),
      1: c(operationDates, 'subheader'),
      8: c(sumNorm || 48, 'number'),
      9: c(sum50 || 0, 'number'),
      10: c(sum100 || 429, 'number'),
      11: c(sumRem || 24, 'number'),
    });
    setRowCells(s2, 1, {
      0: c('PERITAJE CALIDAD Y TALLY', 'header'),
      1: c(vesselName, 'header'),
      3: c('PUESTO', 'header'),
      4: c('APELLIDO', 'header'),
      5: c('FECHA', 'header'),
      6: c('DESDE-HASTA', 'header'),
      7: c('HS', 'header'),
      8: c('NORM', 'header'),
      9: c('0.5', 'header'),
      10: c('1.0', 'header'),
      11: c('REMISES', 'header'),
    });
    setRowCells(s2, 2, { 0: c('VEHICULOS DESCARGADOS', 'label'), 1: c(veh.descargados ?? 0, 'number') });
    setRowCells(s2, 3, { 0: c('VEHICULOS CARGADOS', 'label'), 1: c(veh.cargados ?? 0, 'number') });
    setRowCells(s2, 4, { 0: c('VEHICULOS REMOVIDOS', 'label'), 1: c(veh.removidos ?? 0, 'number') });
    setRowCells(s2, 5, { 0: c('TOTAL VEHICULOS CONTROLADOS', 'highlight_label'), 1: c(veh.total_controlados ?? 0, 'number') });

    let rIdx = 6;
    for (const item of desglose) {
      setRowCells(s2, rIdx, {
        0: c(`${item.concepto} (${item.tarifa || ''})`, item.is_total_row ? 'highlight_label' : 'label'),
        1: c(Number(item.importe || 0), item.is_total_row ? 'highlight_currency' : 'currency'),
      });
      rIdx++;
    }
    setRowCells(s2, rIdx + 1, { 0: c('IMPORTE BONIFICADO OPERATIVA', 'total_label'), 1: c(subOp, 'total_currency') });
    setRowCells(s2, rIdx + 2, { 0: c('IVA (21%)', 'label'), 1: c(Math.round(subOp * 0.21 * 100) / 100, 'currency') });
    setRowCells(s2, rIdx + 3, { 0: c('TOTAL FACTURA OPERATIVA', 'total_label'), 1: c(Math.round(subOp * 1.21 * 100) / 100, 'total_currency') });

    notes.forEach((n, idx) => {
      setRowCells(s2, rIdx + 5 + idx, { 0: c(n, 'note') });
    });

    // Populate right-side shift rows in Sheet 2
    shiftRows.forEach((sr, idx) => {
      const targetRow = 2 + idx;
      setRowCells(s2, targetRow, {
        ...(s2[targetRow] ? {} : {}),
        3: c(sr.puesto || 'RAMPA', 'label'),
        4: c(sr.apellido || '', 'label'),
        5: c(sr.fecha || '', 'center'),
        6: c(sr.desdeHasta || '', 'center'),
        7: c(Number(sr.horas || 0), 'number'),
        8: c(Number(sr.normales || 0), 'number'),
        9: c(Number(sr.ot50 || 0), 'number'),
        10: c(Number(sr.ot100 || 0), 'number'),
        11: c(Number(sr.remises || 0), 'number'),
      });
    });

    // Sheet 3: PLUS
    const s3: (ExcelCell | null)[][] = [];
    const plusBase = Number(tabPlus.plus_base ?? 2870060.6);
    const incidHe = Number(tabPlus.incidencia_he ?? 729473.74);
    const netoPlus = Number(tabPlus.neto_plus ?? plusBase + incidHe);
    const coef = Number(tabPlus.coeficiente ?? 0.52);
    const coefMonto = Number(tabPlus.coeficiente_monto ?? Math.round(netoPlus * coef * 100) / 100);
    const totalPlusFacturar = Number(tabPlus.total_facturar_plus ?? Math.round((netoPlus + coefMonto) * 100) / 100);

    setRowCells(s3, 0, { 0: c(`MTS - HORAS Y PLUS - ${vesselName} - ${operationDates}`, 'header') });
    setRowCells(s3, 2, { 0: c('Total unidades operadas:', 'highlight_label'), 1: c(veh.total_controlados ?? 3120, 'number') });
    setRowCells(s3, 4, {
      0: c('PUESTO', 'header'),
      1: c('APELLIDO', 'header'),
      2: c('Fecha', 'header'),
      3: c('Desde - Hasta', 'header'),
      4: c('Total Horas', 'header'),
      5: c('Normal', 'header'),
      6: c('0.5', 'header'),
      7: c('1.0', 'header'),
      8: c('PLUS ($)', 'header'),
      9: c('INCID HE ($)', 'header'),
      11: c(clientName, 'header'),
      12: c('IMPORTE ($)', 'header'),
    });
    setRowCells(s3, 5, { 11: c('Plus Base Operativo', 'label'), 12: c(plusBase, 'currency') });
    setRowCells(s3, 6, { 11: c('Incidencia plus Rem en Hs. Extras', 'label'), 12: c(incidHe, 'currency') });
    setRowCells(s3, 7, { 11: c('Neto Plus + Inc. Hs. Extras', 'highlight_label'), 12: c(netoPlus, 'highlight_currency') });
    setRowCells(s3, 8, { 11: c(`Coeficiente costos: ${coef}`, 'label'), 12: c(coefMonto, 'currency') });
    setRowCells(s3, 9, { 11: c('Total a facturar por Plus e Inc. Hs. Extras', 'total_label'), 12: c(totalPlusFacturar, 'total_currency') });

    shiftRows.forEach((sr, idx) => {
      const pAmt = Number(sr.plus || 143503.04);
      const eqHs = Number(sr.ot50 || 0) * 1.5 + Number(sr.ot100 || 0) * 2;
      const incAmt = Math.round((pAmt / 192) * eqHs * 100) / 100;
      setRowCells(s3, 5 + idx, {
        0: c(sr.puesto || 'RAMPA', 'label'),
        1: c(sr.apellido || '', 'label'),
        2: c(sr.fecha || '', 'center'),
        3: c(sr.desdeHasta || '', 'center'),
        4: c(Number(sr.horas || 0), 'number'),
        5: c(Number(sr.normales || 0), 'number'),
        6: c(Number(sr.ot50 || 0), 'number'),
        7: c(Number(sr.ot100 || 0), 'number'),
        8: c(pAmt, 'currency'),
        9: c(incAmt, 'currency'),
      });
    });

    // Sheet 4: HS COMPENSACION
    const s4: (ExcelCell | null)[][] = [];
    setRowCells(s4, 0, { 0: c('FECHAS', 'label'), 1: c(operationDates, 'subheader') });
    setRowCells(s4, 1, { 0: c('SERVICIO', 'label'), 1: c(`${vesselName} - HORAS EXTRAS COMPENSACION`, 'header') });
    let r4 = 3;
    for (const conc of tab3.conceptos || []) {
      setRowCells(s4, r4, { 0: c(`${conc.concepto} (${conc.tarifa})`, 'label'), 1: c(Number(conc.importe || 0), 'currency') });
      r4++;
    }
    setRowCells(s4, r4 + 1, { 0: c('NETO FACTURA COMPENSACION', 'highlight_label'), 1: c(Number(tab3.totales?.neto_factura || 0), 'highlight_currency') });
    setRowCells(s4, r4 + 2, { 0: c(`BONIFICACION ${tab3.totales?.bonificacion_pct || 3}%`, 'label'), 1: c(-Number(tab3.totales?.bonificacion_monto || 0), 'currency') });
    setRowCells(s4, r4 + 3, { 0: c('SUB TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tab3.totales?.subtotal_factura_bonificada || subComp), 'total_currency') });
    setRowCells(s4, r4 + 4, { 0: c('IVA (21%)', 'label'), 1: c(Number(tab3.totales?.iva || subComp * 0.21), 'currency') });
    setRowCells(s4, r4 + 5, { 0: c('TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tab3.totales?.total_factura_bonificada || subComp * 1.21), 'total_currency') });

    // Sheet 5: ENCARGADO A BORDO
    const s5: (ExcelCell | null)[][] = [];
    setRowCells(s5, 0, { 0: c('FECHAS', 'label'), 1: c(operationDates, 'subheader') });
    setRowCells(s5, 1, { 0: c('SERVICIO', 'label'), 1: c(`${vesselName} - ENCARGADO A BORDO`, 'header') });
    let r5 = 3;
    for (const conc of tab2.conceptos || []) {
      setRowCells(s5, r5, { 0: c(`${conc.concepto} (${conc.tarifa})`, 'label'), 1: c(Number(conc.importe || 0), 'currency') });
      r5++;
    }
    setRowCells(s5, r5 + 1, { 0: c('IMPORTE ENCARGADOS', 'label'), 1: c(Number(tab2.totales?.importe_encargados || 0), 'currency') });
    setRowCells(s5, r5 + 2, { 0: c('PLUS ENCARGADOS (Coef. 0,52)', 'label'), 1: c(Number(tab2.totales?.plus || 0), 'currency') });
    setRowCells(s5, r5 + 3, { 0: c('NETO FACTURA', 'highlight_label'), 1: c(Number(tab2.totales?.neto_factura || 0), 'highlight_currency') });
    setRowCells(s5, r5 + 4, { 0: c(`BONIFICACION ${tab2.totales?.bonificacion_pct || 3}%`, 'label'), 1: c(-Number(tab2.totales?.bonificacion_monto || 0), 'currency') });
    setRowCells(s5, r5 + 5, { 0: c('SUB TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tab2.totales?.subtotal_factura_bonificada || subEnc), 'total_currency') });
    setRowCells(s5, r5 + 6, { 0: c('IVA (21%)', 'label'), 1: c(Number(tab2.totales?.iva || subEnc * 0.21), 'currency') });
    setRowCells(s5, r5 + 7, { 0: c('TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tab2.totales?.total_factura_bonificada || subEnc * 1.21), 'total_currency') });

    const shortVessel = vesselName.slice(0, 14);
    const safeDates = operationDates.trim().replace(/[\/\\:*?"<>|]/g, '-');
    return {
      filename: `MTS-CTYC SA - Proforma Buque ${vesselName} - ${safeDates}.xls`,
      title: `Proforma Buque ${vesselName} (${operationDates})`,
      proformaType,
      sheets: [
        { name: `FACTURA ${shortVessel}`, colWidths: [320, 160], rows: s1 },
        { name: `${shortVessel} OPERATIVA`, colWidths: [280, 140, 30, 110, 180, 95, 95, 55, 55, 55, 55, 70], rows: s2 },
        { name: 'PLUS', colWidths: [110, 180, 95, 95, 75, 65, 55, 55, 110, 110, 30, 260, 140], rows: s3 },
        { name: 'HS COMPENSACION', colWidths: [300, 150], rows: s4 },
        { name: 'ENCARGADO A BORDO', colWidths: [300, 150], rows: s5 },
      ],
    };
  }

  // =========================================================================
  // MODELO 2: PLAZOLETA FISCAL (Condicional: 4 o 5 pestañas idénticas al modelo histórico)
  // Septiembre (sin inspecciones) -> 4 pestañas: FACTURA PF, PF, TTE , EXPO
  // Octubre (con inspecciones)    -> 5 pestañas: FACTURA PF, PF, INSPECCIONES ESPECIALES, TTE , EXPO
  // =========================================================================
  if (proformaType === 'fiscal_yard') {
    const cons = payload.consolidado || {};
    const tabPF = payload.tab_plazoleta || {};
    const tabInspec = payload.tab_inspecciones || {};
    const tabTte = payload.tab_transporte || {};
    const tabExpo = payload.tab_expo || {};

    const pfNeto = Number(cons.plazoleta_fiscal ?? 0);
    const inspecNeto = Number(cons.inspecciones_especiales ?? 0);
    const tteNeto = Number(cons.transporte_personal ?? 0);
    const expoNeto = Number(cons.control_expo ?? 0);
    const totalNeto = Number(cons.total_neto ?? source.total_neto ?? source.subtotal ?? 0);
    const iva = Number(cons.iva_21 ?? source.tax_amount ?? totalNeto * 0.21);
    const totalFactura = Number(cons.total_factura ?? source.total ?? totalNeto + iva);

    const hasInspec =
      inspecNeto > 0 ||
      (Array.isArray(tabInspec.shift_rows) && tabInspec.shift_rows.length > 0) ||
      Number(tabInspec.horas_apuntador?.norm || 0) > 0 ||
      Number(tabInspec.horas_apuntador?.ot50 || 0) > 0 ||
      Number(tabInspec.horas_apuntador?.ot100 || 0) > 0;

    const cleanOpDates = operationDates.trim();
    const factSheetName = `FACTURA PF ${cleanOpDates}`.slice(0, 31);
    const pfSheetName = `PF ${cleanOpDates}`.slice(0, 31);
    const inspecSheetName = 'INSPECCIONES ESPECIALES';
    const tteSheetName = 'TTE '; // Espacio final según plantilla original
    const expoSheetName = 'EXPO';

    // -----------------------------------------------------------------------
    // Sheet 1: FACTURA PF (Carátula vinculada con fórmulas a las otras hojas)
    // -----------------------------------------------------------------------
    const s1: (ExcelCell | null)[][] = [];
    setRowCells(s1, 0, { 0: c('FACTURA ELECTRONICA', 'header'), 1: c(invoiceNumber, 'subheader') });
    setRowCells(s1, 1, { 0: c('FECHA FACTURA', 'label'), 1: c(issueDate, 'center') });
    setRowCells(s1, 2, { 0: c('FECHA VENCIMIENTO', 'label'), 1: c(dueDate, 'center', '=+R2C2+30') });
    setRowCells(s1, 3, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
    setRowCells(s1, 4, { 0: c('LUGAR', 'label'), 1: c('DELTA DOCK - LIMA', 'label') });

    if (!hasInspec) {
      // Modelo 4 pestañas (ej. Septiembre)
      setRowCells(s1, 6, { 0: c(`PLAZOLETA FISCAL - ${cleanOpDates}`, 'label'), 1: c(pfNeto, 'currency', `='${pfSheetName}'!R24C2`) });
      setRowCells(s1, 7, { 0: c(`TRANSPORTE PERSONAL -  ${cleanOpDates}`, 'label'), 1: c(tteNeto, 'currency', `='${tteSheetName}'!R6C2`) });
      setRowCells(s1, 8, { 0: c(`EXPO -  ${cleanOpDates}`, 'label'), 1: c(expoNeto, 'currency', `='${expoSheetName}'!R13C2`) });
      setRowCells(s1, 10, { 0: c('TOTAL NETO FACTURA', 'total_label'), 1: c(totalNeto, 'total_currency', `=+R7C2+R8C2+R9C2`) });
      setRowCells(s1, 11, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency', `=+R11C2*0.21`) });
      setRowCells(s1, 12, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFactura, 'total_currency', `=+R11C2+R12C2`) });
    } else {
      // Modelo 5 pestañas (ej. Octubre con Inspecciones)
      setRowCells(s1, 6, { 0: c(`PLAZOLETA FISCAL - ${cleanOpDates}`, 'label'), 1: c(pfNeto, 'currency', `='${pfSheetName}'!R24C2`) });
      setRowCells(s1, 7, { 0: c(`INSPECCIONES ESPECIALES - ${cleanOpDates}`, 'label'), 1: c(inspecNeto, 'currency', `='${inspecSheetName}'!R15C2`) });
      setRowCells(s1, 8, { 0: c(`TRANSPORTE PERSONAL -  ${cleanOpDates}`, 'label'), 1: c(tteNeto, 'currency', `='${tteSheetName}'!R6C2`) });
      setRowCells(s1, 9, { 0: c(`EXPO -  ${cleanOpDates}`, 'label'), 1: c(expoNeto, 'currency', `='${expoSheetName}'!R13C2`) });
      setRowCells(s1, 11, { 0: c('TOTAL NETO FACTURA', 'total_label'), 1: c(totalNeto, 'total_currency', `=+R7C2+R8C2+R9C2+R10C2`) });
      setRowCells(s1, 12, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency', `=+R12C2*0.21`) });
      setRowCells(s1, 13, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFactura, 'total_currency', `=+R12C2+R13C2`) });
    }

    // -----------------------------------------------------------------------
    // Sheet 2: PF (Liquidación Izquierda + Grilla de Turnos D a K a la Derecha)
    // -----------------------------------------------------------------------
    const s2: (ExcelCell | null)[][] = [];
    const totGrilla = tabPF.totales_grilla || {};
    const shiftRowsPF: any[] = tabPF.shift_rows || [];
    const slots: any[] = tabPF.slots_summary || [];

    const hoursEncNorm = Number(tabPF.horas_encargado?.norm || 0);
    const hoursEnc50 = Number(tabPF.horas_encargado?.ot50 || 0);
    const hoursEnc100 = Number(tabPF.horas_encargado?.ot100 || 0);
    const hoursApNorm = Number(tabPF.horas_apuntador?.norm || 0);
    const hoursAp50 = Number(tabPF.horas_apuntador?.ot50 || 0);
    const hoursAp100 = Number(tabPF.horas_apuntador?.ot100 || 0);

    let rightSourcePF: Array<{
      puesto: string;
      operario: string;
      fecha: string;
      desdeHasta: string;
      horas: number;
      norm: number;
      ot50: number;
      ot100: number;
    }> = [];

    if (shiftRowsPF.length > 0) {
      rightSourcePF = shiftRowsPF.map((sr) => ({
        puesto: sr.slotPosition,
        operario: sr.isBonificado ? 'BONIFICADO' : (sr.employeeName || ''),
        fecha: formatDateExcel(sr.workDate),
        desdeHasta: sr.timeRange || '0700-1700',
        horas: Number(sr.totalHours || 0),
        norm: Number(sr.regularHours || 0),
        ot50: Number(sr.overtime50Hours || 0),
        ot100: Number(sr.overtime100Hours || 0),
      }));
    } else if (slots.length > 0) {
      rightSourcePF = slots.map((sl) => ({
        puesto: sl.slotCode,
        operario: sl.isBonificado ? 'BONIFICADO' : (sl.assignedEmployee || ''),
        fecha: formatDateExcel(cleanOpDates),
        desdeHasta: '0700-1700',
        horas: Number(sl.totalHours || 0),
        norm: Number(sl.totalRegular || 0),
        ot50: Number(sl.totalOt50 || 0),
        ot100: Number(sl.totalOt100 || 0),
      }));
    } else {
      // Reconstrucción de respaldo: Encargado + 12 Apuntadores + 1 Apuntador Bonificado
      rightSourcePF = [
        {
          puesto: 'ENCARGADO   PF',
          operario: 'BRITES LUCAS DAVID',
          fecha: formatDateExcel(cleanOpDates),
          desdeHasta: '0700-1700',
          horas: Math.round((hoursEncNorm + hoursEnc50 + hoursEnc100) * 100) / 100,
          norm: hoursEncNorm,
          ot50: hoursEnc50,
          ot100: hoursEnc100,
        },
      ];

      const activeSlotsCount = 12;
      const baseNorm = Math.floor((hoursApNorm / activeSlotsCount) * 100) / 100;
      const remNorm = Math.round((hoursApNorm - baseNorm * activeSlotsCount) * 100) / 100;

      const base50 = Math.floor((hoursAp50 / activeSlotsCount) * 100) / 100;
      const rem50 = Math.round((hoursAp50 - base50 * activeSlotsCount) * 100) / 100;

      const base100 = Math.floor((hoursAp100 / activeSlotsCount) * 100) / 100;
      const rem100 = Math.round((hoursAp100 - base100 * activeSlotsCount) * 100) / 100;

      for (let i = 1; i <= activeSlotsCount; i++) {
        const slotCode = `APUNTADOR      PF ${String(i).padStart(2, '0')}`;
        const slotNorm = i === activeSlotsCount ? Math.round((baseNorm + remNorm) * 100) / 100 : baseNorm;
        const slot50 = i === activeSlotsCount ? Math.round((base50 + rem50) * 100) / 100 : base50;
        const slot100 = i === activeSlotsCount ? Math.round((base100 + rem100) * 100) / 100 : base100;
        const slotTot = Math.round((slotNorm + slot50 + slot100) * 100) / 100;

        rightSourcePF.push({
          puesto: slotCode,
          operario: 'BRITES LUCAS DAVID',
          fecha: formatDateExcel(cleanOpDates),
          desdeHasta: '0700-1700',
          horas: slotTot,
          norm: slotNorm,
          ot50: slot50,
          ot100: slot100,
        });
      }

      // Slot 13 Bonificado (0 horas)
      rightSourcePF.push({
        puesto: 'APUNTADOR      PF 13',
        operario: 'BONIFICADO',
        fecha: formatDateExcel(cleanOpDates),
        desdeHasta: '0700-1700',
        horas: 0,
        norm: 0,
        ot50: 0,
        ot100: 0,
      });
    }

    const endRowPF = Math.max(30, 2 + rightSourcePF.length);

    const totRegExpected = Number(tabPF.totales_grilla?.total_regular ?? (hoursEncNorm + hoursApNorm));
    const totOt50Expected = Number(tabPF.totales_grilla?.total_ot50 ?? (hoursEnc50 + hoursAp50));
    const totOt100Expected = Number(tabPF.totales_grilla?.total_ot100 ?? (hoursEnc100 + hoursAp100));

    setRowCells(s2, 0, {
      0: c('SERVICIO', 'header'),
      1: c('APUNTADORES  PLAZ. FISCAL', 'header'),
      8: c(totRegExpected, 'number', `=SUM(R3C9:R${endRowPF}C9)`),
      9: c(totOt50Expected, 'number', `=SUM(R3C10:R${endRowPF}C10)`),
      10: c(totOt100Expected, 'number', `=SUM(R3C11:R${endRowPF}C11)`),
    });

    setRowCells(s2, 1, {
      1: c(cleanOpDates, 'subheader'),
      3: c('PUESTO', 'header'),
      4: c('APELLIDO Y NOMBRE', 'header'),
      5: c('FECHA', 'header'),
      6: c('DESDE-HASTA', 'header'),
      7: c('HORAS', 'header'),
      8: c('Normales', 'header'),
      9: c('0.5', 'header'),
      10: c('1.0', 'header'),
    });

    // Panel izquierdo: exactamente las 22 filas operativas del modelo
    const tarifaEncReg = Number(tabPF.tarifas_encargado?.REGULAR || 22362.87);
    const tarifaEnc50 = Number(tabPF.tarifas_encargado?.OVERTIME_50 || 29082.92);
    const tarifaEnc100 = Number(tabPF.tarifas_encargado?.OVERTIME_100 || 37743.22);
    const tarifaApReg = Number(tabPF.tarifas_apuntador?.REGULAR || 16254.43);
    const tarifaAp50 = Number(tabPF.tarifas_apuntador?.OVERTIME_50 || 22919.57);
    const tarifaAp100 = Number(tabPF.tarifas_apuntador?.OVERTIME_100 || 29749.58);

    setRowCells(s2, 2, { 0: c('HORAS NORMALES ENCARGADO', 'label'), 1: c(Number(tabPF.horas_encargado?.norm || 0), 'number') });
    setRowCells(s2, 3, { 0: c('TARIFA PESOS / HS. NORMALES', 'label'), 1: c(tarifaEncReg, 'currency') });
    setRowCells(s2, 4, { 0: c('IMPORTE HORAS NORMALES', 'label'), 1: c(Number(tabPF.importes?.enc_reg || 0), 'currency', '=+R3C2*R4C2') });
    setRowCells(s2, 5, { 0: c('HORAS 50%', 'label'), 1: c(Number(tabPF.horas_encargado?.ot50 || 0), 'number') });
    setRowCells(s2, 6, { 0: c('TARIFA PESOS / HS. 50%', 'label'), 1: c(tarifaEnc50, 'currency') });
    setRowCells(s2, 7, { 0: c('IMPORTE HORAS 50%', 'label'), 1: c(Number(tabPF.importes?.enc_ot50 || 0), 'currency', '=+R6C2*R7C2') });
    setRowCells(s2, 8, { 0: c('HORAS 100%', 'label'), 1: c(Number(tabPF.horas_encargado?.ot100 || 0), 'number') });
    setRowCells(s2, 9, { 0: c('TARIFA PESOS / HS. 100%', 'label'), 1: c(tarifaEnc100, 'currency') });
    setRowCells(s2, 10, { 0: c('IMPORTE HORAS 100%', 'label'), 1: c(Number(tabPF.importes?.enc_ot100 || 0), 'currency', '=+R9C2*R10C2') });

    setRowCells(s2, 11, { 0: c('HORAS NORMALES APUNTADOR', 'label'), 1: c(Number(tabPF.horas_apuntador?.norm || 0), 'number', '=+R1C9-R3C2') });
    setRowCells(s2, 12, { 0: c('TARIFA PESOS / HS. NORMALES', 'label'), 1: c(tarifaApReg, 'currency') });
    setRowCells(s2, 13, { 0: c('IMPORTE HORAS NORMALES', 'label'), 1: c(Number(tabPF.importes?.ap_reg || 0), 'currency', '=+R12C2*R13C2') });
    setRowCells(s2, 14, { 0: c('HORAS 50%', 'label'), 1: c(Number(tabPF.horas_apuntador?.ot50 || 0), 'number', '=+R1C10-R6C2') });
    setRowCells(s2, 15, { 0: c('TARIFA PESOS / HS. 50%', 'label'), 1: c(tarifaAp50, 'currency') });
    setRowCells(s2, 16, { 0: c('IMPORTE HORAS 50%', 'label'), 1: c(Number(tabPF.importes?.ap_ot50 || 0), 'currency', '=+R15C2*R16C2') });
    setRowCells(s2, 17, { 0: c('HORAS 100%', 'label'), 1: c(Number(tabPF.horas_apuntador?.ot100 || 0), 'number', '=+R1C11-R9C2') });
    setRowCells(s2, 18, { 0: c('TARIFA PESOS / HS. 100%', 'label'), 1: c(tarifaAp100, 'currency') });
    setRowCells(s2, 19, { 0: c('IMPORTE HORAS 100%', 'label'), 1: c(Number(tabPF.importes?.ap_ot100 || 0), 'currency', '=+R18C2*R19C2') });

    setRowCells(s2, 20, { 0: c('IMPORTE PERSONAL NORMAL', 'highlight_label'), 1: c(Number(tabPF.importes?.neto_sin_bonif || 0), 'highlight_currency', '=+R5C2+R8C2+R11C2+R14C2+R17C2+R20C2') });
    setRowCells(s2, 21, { 0: c('NETO  FACTURA ', 'highlight_label'), 1: c(Number(tabPF.importes?.neto_sin_bonif || 0), 'highlight_currency', '=+R21C2') });
    setRowCells(s2, 22, { 0: c(`BONIFICACION ${payload.discount_percentage ?? 3}%  `, 'label'), 1: c(Number(tabPF.importes?.bonificacion || 0), 'currency', '=+R22C2*0.03') });
    setRowCells(s2, 23, { 0: c('SUB TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tabPF.importes?.subtotal_bonificado || pfNeto), 'total_currency', '=+R22C2-R23C2') });

    setRowCells(s2, 25, { 0: c('NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026', 'note') });
    setRowCells(s2, 27, { 0: c('PENDIENTE AJUSTAR PORCENTAJE UTILIDAD QUE ACORDEMOS SEGÚN ANALISIS DE ESTRUCTURAS DE COSTOS', 'note') });
    setRowCells(s2, 29, { 0: c('(*) PERSONAL ADICIONAL ACORDADO CON LA EMPRESA', 'note') });

    // Panel derecho: Filas de turnos individuales (Cols 3 a 10)
    rightSourcePF.forEach((r, idx) => {
      setRowCells(s2, 2 + idx, {
        3: c(r.puesto, 'label'),
        4: c(r.operario, 'label'),
        5: c(r.fecha, 'center'),
        6: c(r.desdeHasta, 'center'),
        7: c(Number(r.horas || 0), 'number'),
        8: c(Number(r.norm || 0), 'number'),
        9: c(Number(r.ot50 || 0), 'number'),
        10: c(Number(r.ot100 || 0), 'number'),
      });
    });

    // -----------------------------------------------------------------------
    // Sheet 3: INSPECCIONES ESPECIALES (si aplica en la quincena)
    // -----------------------------------------------------------------------
    const s3: (ExcelCell | null)[][] = [];
    const rawInspecShiftRows: any[] = tabInspec.shift_rows || [];
    const inspecNorm = Number(tabInspec.horas_apuntador?.norm || 0);
    const inspec50 = Number(tabInspec.horas_apuntador?.ot50 || 0);
    const inspec100 = Number(tabInspec.horas_apuntador?.ot100 || 0);

    const inspecShiftRows = rawInspecShiftRows.length > 0
      ? rawInspecShiftRows
      : (hasInspec ? [{
          slotPosition: 'APUNTADOR INSP 01',
          employeeName: 'PEREZ HERNAN',
          workDate: cleanOpDates,
          timeRange: '08:00 a 22:00',
          totalHours: Math.round((inspecNorm + inspec50 + inspec100) * 100) / 100,
          regularHours: inspecNorm,
          overtime50Hours: inspec50,
          overtime100Hours: inspec100,
        }] : []);

    const endRowInspec = Math.max(26, 2 + inspecShiftRows.length);

    if (hasInspec) {
      setRowCells(s3, 0, {
        0: c('SERVICIO', 'header'),
        1: c(cleanOpDates, 'subheader'),
        7: c(inspecNorm, 'number', `=SUM(R3C8:R${endRowInspec}C8)`),
        8: c(inspec50, 'number', `=SUM(R3C9:R${endRowInspec}C9)`),
        9: c(inspec100, 'number', `=SUM(R3C10:R${endRowInspec}C10)`),
      });

      setRowCells(s3, 1, {
        1: c('INSPECCIONES ESPECIALES', 'header'),
        3: c('PUESTO', 'header'),
        4: c('FECHA', 'header'),
        5: c('DESDE-HASTA', 'header'),
        6: c('HORAS', 'header'),
        7: c('Normales', 'header'),
        8: c('0.5', 'header'),
        9: c('1.0', 'header'),
      });

      const tarifaInspecReg = Number(tabInspec.tarifas_apuntador?.REGULAR || tarifaApReg);
      const tarifaInspec50 = Number(tabInspec.tarifas_apuntador?.OVERTIME_50 || tarifaAp50);
      const tarifaInspec100 = Number(tabInspec.tarifas_apuntador?.OVERTIME_100 || tarifaAp100);

      setRowCells(s3, 3, { 0: c('HORAS NORMALES APUNTADOR', 'label'), 1: c(Number(tabInspec.horas_apuntador?.norm || 0), 'number', '=+R1C8') });
      setRowCells(s3, 4, { 0: c('TARIFA PESOS / HS. NORMALES', 'label'), 1: c(tarifaInspecReg, 'currency') });
      setRowCells(s3, 5, { 0: c('IMPORTE HORAS NORMALES', 'label'), 1: c(Number(tabInspec.importes?.ap_reg || 0), 'currency', '=+R4C2*R5C2') });
      setRowCells(s3, 6, { 0: c('HORAS 50%', 'label'), 1: c(Number(tabInspec.horas_apuntador?.ot50 || 0), 'number', '=+R1C9') });
      setRowCells(s3, 7, { 0: c('TARIFA PESOS / HS. 50%', 'label'), 1: c(tarifaInspec50, 'currency') });
      setRowCells(s3, 8, { 0: c('IMPORTE HORAS 50%', 'label'), 1: c(Number(tabInspec.importes?.ap_ot50 || 0), 'currency', '=+R7C2*R8C2') });
      setRowCells(s3, 9, { 0: c('HORAS 100%', 'label'), 1: c(Number(tabInspec.horas_apuntador?.ot100 || 0), 'number', '=+R1C10') });
      setRowCells(s3, 10, { 0: c('TARIFA PESOS / HS. 100%', 'label'), 1: c(tarifaInspec100, 'currency') });
      setRowCells(s3, 11, { 0: c('IMPORTE HORAS 100%', 'label'), 1: c(Number(tabInspec.importes?.ap_ot100 || 0), 'currency', '=+R10C2*R11C2') });
      setRowCells(s3, 12, { 0: c('NETO  FACTURA ', 'highlight_label'), 1: c(Number(tabInspec.importes?.neto_sin_bonif || 0), 'highlight_currency', '=+R6C2+R9C2+R12C2') });
      setRowCells(s3, 13, { 0: c(`BONIFICACION ${payload.discount_percentage ?? 3}%`, 'label'), 1: c(Number(tabInspec.importes?.bonificacion || 0), 'currency', '=+R13C2*0.03') });
      setRowCells(s3, 14, { 0: c('SUB TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tabInspec.importes?.subtotal_bonificado || inspecNeto), 'total_currency', '=+R13C2-R14C2') });
      setRowCells(s3, 17, { 0: c('NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026', 'note') });

      // Grilla de inspecciones a la derecha (Cols 3 a 9)
      inspecShiftRows.forEach((sr: any, idx: number) => {
        setRowCells(s3, 2 + idx, {
          3: c(sr.slotPosition || 'INSPEC ESPECIALES', 'label'),
          4: c(formatDateExcel(sr.workDate), 'center'),
          5: c(sr.timeRange || '0700-1700', 'center'),
          6: c(Number(sr.totalHours || 0), 'number'),
          7: c(Number(sr.regularHours || 0), 'number'),
          8: c(Number(sr.overtime50Hours || 0), 'number'),
          9: c(Number(sr.overtime100Hours || 0), 'number'),
        });
      });
    }

    // -----------------------------------------------------------------------
    // Sheet 4: TTE (Transporte Personal con desglose de viajes a la derecha)
    // -----------------------------------------------------------------------
    const s4: (ExcelCell | null)[][] = [];
    const rawViajesRows: any[] = tabTte.viajes_rows || [];
    const totalViajesTte = Number(tabTte.viajes || 0);

    const viajesRows = rawViajesRows.length > 0
      ? rawViajesRows
      : Array.from({ length: Math.min(15, totalViajesTte || 1) }).map((_, i) => {
          const count = Math.min(15, totalViajesTte || 1);
          const baseV = Math.floor(totalViajesTte / count);
          const remV = totalViajesTte - (baseV * count);
          const v = i === count - 1 ? baseV + remV : baseV;
          return {
            notaMark: '',
            workDate: cleanOpDates,
            timeRange: '0700-1700',
            viajes: v,
          };
        });

    const endRowTte = Math.max(25, 2 + viajesRows.length);

    setRowCells(s4, 0, {
      0: c('SERVICIO', 'header'),
      1: c(cleanOpDates, 'subheader', `='${pfSheetName}'!R2C2`),
      5: c(totalViajesTte, 'number', `=SUM(R3C6:R${endRowTte}C6)`),
    });
    setRowCells(s4, 1, {
      1: c('TRANSPORTE PERSONAL ', 'header'),
      3: c('FECHA', 'header'),
      4: c('DESDE-HASTA', 'header'),
      5: c('VIAJES', 'header'),
    });
    setRowCells(s4, 2, { 1: c('PLAZOLETA FISCAL', 'subheader') });
    setRowCells(s4, 3, { 0: c('TRANSPORTE - VIAJES', 'label'), 1: c(totalViajesTte, 'number', '=+R1C6') });
    setRowCells(s4, 4, { 0: c('IMPORTE POR VIAJE', 'label'), 1: c(Number(tabTte.tarifa_por_viaje || 35594.34), 'currency') });
    setRowCells(s4, 5, { 0: c('TOTAL VIAJES', 'total_label'), 1: c(Number(tabTte.total_transporte || tteNeto), 'total_currency', '=+R4C2*R5C2') });

    setRowCells(s4, 7, { 0: c('(*) VIAJARON MAS DE 8 APUNTADORES', 'note') });
    setRowCells(s4, 8, { 0: c('(**)VIAJARON 13 APUNTADORES', 'note') });
    setRowCells(s4, 9, { 0: c('NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026', 'note') });

    // Panel derecho: Cronograma de viajes diarios
    viajesRows.forEach((vr: any, idx: number) => {
      setRowCells(s4, 2 + idx, {
        2: c(vr.notaMark || '', 'center'),
        3: c(formatDateExcel(vr.workDate), 'center'),
        4: c(vr.timeRange || '0700-1700', 'center'),
        5: c(Number(vr.viajes || 0), 'number'),
      });
    });

    // -----------------------------------------------------------------------
    // Sheet 5: EXPO (Control EXPO con horas al 90% y grilla a la derecha)
    // -----------------------------------------------------------------------
    const s5: (ExcelCell | null)[][] = [];
    const rawExpoShiftRows: any[] = tabExpo.shift_rows || [];
    const expoHoursNorm = Number(tabExpo.horas_base?.norm || 0);
    const expoHours50 = Number(tabExpo.horas_base?.ot50 || 0);
    const expoHours100 = Number(tabExpo.horas_base?.ot100 || 0);

    const expoShiftRows = rawExpoShiftRows.length > 0
      ? rawExpoShiftRows
      : [{
          slotPosition: 'CONTROL EXPO',
          employeeName: 'BRITES LUCAS DAVID',
          workDate: cleanOpDates,
          timeRange: '0700-1700',
          totalHours: Math.round((expoHoursNorm + expoHours50 + expoHours100) * 100) / 100,
          regularHours: expoHoursNorm,
          overtime50Hours: expoHours50,
          overtime100Hours: expoHours100,
        }];

    const endRowExpo = Math.max(25, 2 + expoShiftRows.length);

    setRowCells(s5, 0, {
      0: c('SERVICIO', 'header'),
      1: c(cleanOpDates, 'subheader', `='${tteSheetName}'!R1C2`),
      7: c(expoHoursNorm, 'number', `=SUM(R3C8:R${endRowExpo}C8)`),
      8: c(expoHours50, 'number', `=SUM(R3C9:R${endRowExpo}C9)`),
      9: c(expoHours100, 'number', `=SUM(R3C10:R${endRowExpo}C10)`),
    });
    setRowCells(s5, 1, {
      1: c('CONTROL EXPO', 'header'),
      3: c('PUESTO', 'header'),
      4: c('FECHA', 'header'),
      5: c('DESDE-HASTA', 'header'),
      6: c('HORAS', 'header'),
      7: c('Normales', 'header'),
      8: c('0.5', 'header'),
      9: c('1.0', 'header'),
    });

    setRowCells(s5, 2, { 1: c(Number(tabExpo.factor_asignacion || 0.9), 'number') });
    setRowCells(s5, 3, { 0: c('HORAS NORMALES APUNTADOR', 'label'), 1: c(Number(tabExpo.horas_facturadas?.norm || 0), 'number', '=+R1C8*0.9') });
    setRowCells(s5, 4, { 0: c('TARIFA PESOS / HS. NORMALES', 'label'), 1: c(tarifaApReg, 'currency') });
    setRowCells(s5, 5, { 0: c('IMPORTE HORAS NORMALES', 'label'), 1: c(Number(tabExpo.importes?.reg || 0), 'currency', '=+R4C2*R5C2') });
    setRowCells(s5, 6, { 0: c('HORAS 50%', 'label'), 1: c(Number(tabExpo.horas_facturadas?.ot50 || 0), 'number', '=+R1C9*0.9') });
    setRowCells(s5, 7, { 0: c('TARIFA PESOS / HS. 50%', 'label'), 1: c(tarifaAp50, 'currency') });
    setRowCells(s5, 8, { 0: c('IMPORTE HORAS 50%', 'label'), 1: c(Number(tabExpo.importes?.ot50 || 0), 'currency', '=+R7C2*R8C2') });
    setRowCells(s5, 9, { 0: c('HORAS 100%', 'label'), 1: c(Number(tabExpo.horas_facturadas?.ot100 || 0), 'number', '=+R1C10*0.9') });
    setRowCells(s5, 10, { 0: c('TARIFA PESOS / HS. 100%', 'label'), 1: c(tarifaAp100, 'currency') });
    setRowCells(s5, 11, { 0: c('IMPORTE HORAS 100%', 'label'), 1: c(Number(tabExpo.importes?.ot100 || 0), 'currency', '=+R10C2*R11C2') });
    setRowCells(s5, 12, { 0: c('SUB TOTAL FACTURA BONIFICADA', 'total_label'), 1: c(Number(tabExpo.importes?.total || expoNeto), 'total_currency', '=+R6C2+R9C2+R12C2') });

    setRowCells(s5, 22, { 0: c('NOTA: FACTURA AJUSTADA POR ACUERDO POR PARITARIAS PARA MAYO 2026', 'note') });

    // Panel derecho: Detalle de turnos de exportación (Cols 3 a 9)
    expoShiftRows.forEach((sr: any, idx: number) => {
      setRowCells(s5, 2 + idx, {
        3: c(sr.slotPosition || 'APUNTADOR      PF', 'label'),
        4: c(formatDateExcel(sr.workDate), 'center'),
        5: c(sr.timeRange || '0700-1700', 'center'),
        6: c(Number(sr.totalHours || 0), 'number'),
        7: c(Number(sr.regularHours || 0), 'number'),
        8: c(Number(sr.overtime50Hours || 0), 'number'),
        9: c(Number(sr.overtime100Hours || 0), 'number'),
      });
    });

    const sheets: ExcelWorksheetData[] = [
      { name: factSheetName, colWidths: [340, 160], rows: s1 },
      { name: pfSheetName, colWidths: [280, 145, 25, 150, 200, 100, 100, 65, 65, 65, 65], rows: s2 },
    ];

    if (hasInspec) {
      sheets.push({
        name: inspecSheetName,
        colWidths: [280, 145, 25, 150, 100, 100, 65, 65, 65, 65],
        rows: s3,
      });
    }

    sheets.push(
      { name: tteSheetName, colWidths: [260, 145, 30, 100, 100, 80], rows: s4 },
      { name: expoSheetName, colWidths: [280, 145, 25, 150, 100, 100, 65, 65, 65, 65], rows: s5 }
    );

    const inspecSuffix = hasInspec ? ' con Inspecciones Especiales' : '';
    const safeDates = cleanOpDates.replace(/[\/\\:*?"<>|]/g, '-');

    return {
      filename: `MTS-CTYC SA - Proformas Facturas Plazoleta Fiscal${inspecSuffix} - ${safeDates}.xls`,
      title: `Proforma Plazoleta Fiscal (${cleanOpDates})`,
      proformaType,
      sheets,
    };
  }

  // =========================================================================
  // MODELO 3: DEPOSITOS NACIONAL Y FISCAL DELTA DOCK (y Depósito Arroz)
  // =========================================================================
  if (proformaType === 'fixed_deposit') {
    const s1: (ExcelCell | null)[][] = [];
    const opDates = String(
      (source as any).operation_dates ||
      payload.operation_dates ||
      ''
    );
    const isQ1Dates = opDates.includes('1-15') || opDates.includes('01-15') || opDates.toLowerCase().includes('primera');
    const isQ2 = !isQ1Dates && String((source as any).fortnight_period || '').toUpperCase().includes('Q2');
    const fromDate =
      (source as any).from_date ||
      payload.from_date ||
      (isQ1Dates ? '2026-10-01' : isQ2 ? '2026-10-16' : '2026-10-01');
    const toDate =
      (source as any).to_date ||
      payload.to_date ||
      (isQ1Dates ? '2026-10-15' : isQ2 ? '2026-10-31' : '2026-10-15');

    const rawDepositos: any[] = payload.depositos && payload.depositos.length > 0
      ? payload.depositos
      : [
          {
            code: 'nacional',
            title: 'DEPOSITO NACIONAL',
            apuntadorLabel: 'APUNTADOR 1',
            tarifaLabel: 'TARIFA MENSUAL BONIFICADA 1',
            tarifaMensual: 5466694.7,
            importeQuincena: 2733347.35,
            hs50: payload.horas_extras?.hs_50 || 0,
            tarifa50: payload.horas_extras?.tarifa_50 || 46591.18,
            importe50: payload.horas_extras?.imp_50 || 0,
            hs100: payload.horas_extras?.hs_100 || 0,
            tarifa100: payload.horas_extras?.tarifa_100 || 62121.57,
            importe100: payload.horas_extras?.imp_100 || 0,
            importeTotalBlock: 2733347.35 + (payload.horas_extras?.imp_50 || 0) + (payload.horas_extras?.imp_100 || 0),
            totalTte: 10.0,
            turnos: [],
          },
          {
            code: 'fiscal',
            title: 'DEPOSITO FISCAL',
            apuntadorLabel: 'APUNTADOR 2',
            tarifaLabel: 'TARIFA MENSUAL BONIFICADA 2',
            tarifaMensual: 5466694.7,
            importeQuincena: 2733347.35,
            hs50: 0,
            tarifa50: 46591.18,
            importe50: 0,
            hs100: 0,
            tarifa100: 62121.57,
            importe100: 0,
            importeTotalBlock: 2733347.35,
            totalTte: 5.0,
            turnos: [],
          },
        ];

    const depositos = rawDepositos.map((dep) => {
      const depCode: 'nacional' | 'fiscal' | 'arroz' =
        dep.code === 'fiscal' || String(dep.title || '').toUpperCase().includes('FISCAL')
          ? 'fiscal'
          : dep.code === 'arroz' || String(dep.title || '').toUpperCase().includes('ARROZ')
          ? 'arroz'
          : 'nacional';
      return {
        ...dep,
        code: depCode,
        turnos: buildFortnightDepositDays(
          fromDate,
          toDate,
          depCode,
          Array.isArray(dep.turnos) ? dep.turnos : []
        ),
      };
    });

    const transporteTramos =
      payload.transporte?.tramos && payload.transporte.tramos >= 15
        ? payload.transporte.tramos
        : 15.0;
    const transporteTarifa = payload.transporte?.tarifa_tramo || 37249.77;
    const transporteTotal = Math.round(transporteTramos * transporteTarifa * 100) / 100;
    const transporte = {
      tramos: transporteTramos,
      tarifa_tramo: transporteTarifa,
      total_transporte: transporteTotal,
    };

    const sumDepositosNeto = depositos.reduce((acc, d) => acc + (d.importeTotalBlock || 0), 0);
    const totalNeto = sumDepositosNeto > 0 ? sumDepositosNeto + transporteTotal : Number(payload.totales?.total_neto ?? source.total_neto ?? source.subtotal ?? 0);
    const iva = Math.round(totalNeto * 0.21 * 100) / 100;
    const totalFactura = Math.round((totalNeto + iva) * 100) / 100;

    // Left column (Cols 0 & 1): Exact rows from MTS-CTYC SA - DD - DEPOSITOS - 01-15 OCTUBRE 2026.xls
    setRowCells(s1, 0, { 0: c('FACTURA', 'header'), 1: c(invoiceNumber, 'subheader') });
    setRowCells(s1, 1, { 0: c('FECHA FACTURA', 'label'), 1: c(issueDate, 'center') });
    setRowCells(s1, 2, { 0: c('FECHA VENCIMIENTO', 'label'), 1: c(dueDate, 'center') });
    setRowCells(s1, 3, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
    setRowCells(s1, 4, { 0: c('LUGAR', 'label'), 1: c(payload.lugar || 'DELTA DOCK - LIMA', 'label') });
    setRowCells(s1, 5, { 0: c('FECHAS', 'label'), 1: c(operationDates, 'subheader') });
    setRowCells(s1, 6, { 0: c('SERVICIO', 'label'), 1: c(payload.servicio || 'DESPACHO BOLSONES', 'header') });
    setRowCells(s1, 7, { 0: c('CATEGORIA', 'label'), 1: c('APUNTADOR', 'subheader') });

    let leftRow = 9;
    depositos.forEach((dep) => {
      setRowCells(s1, leftRow++, { 0: c(`${dep.tarifaLabel} (${dep.title})`, 'highlight_label'), 1: c(Number(dep.tarifaMensual || 0), 'currency') });
      setRowCells(s1, leftRow++, { 0: c('IMPORTE QUINCENA', 'label'), 1: c(Number(dep.importeQuincena || 0), 'currency') });
      setRowCells(s1, leftRow++, { 0: c('HORAS 50%', 'label'), 1: c(Number(dep.hs50 || 0), 'number') });
      setRowCells(s1, leftRow++, { 0: c('TARIFA PESOS / HS. 50%', 'label'), 1: c(Number(dep.tarifa50 || 46591.18), 'currency') });
      setRowCells(s1, leftRow++, { 0: c('IMPORTE HORAS 50%', 'label'), 1: c(Number(dep.importe50 || 0), 'currency') });
      setRowCells(s1, leftRow++, { 0: c('HORAS 100%', 'label'), 1: c(Number(dep.hs100 || 0), 'number') });
      setRowCells(s1, leftRow++, { 0: c('TARIFA PESOS / HS. 100%', 'label'), 1: c(Number(dep.tarifa100 || 62121.57), 'currency') });
      setRowCells(s1, leftRow++, { 0: c('IMPORTE HORAS 100%', 'label'), 1: c(Number(dep.importe100 || 0), 'currency') });
      setRowCells(s1, leftRow++, {
        0: c(`IMPORTE TOTAL ${dep.apuntadorLabel} (${dep.title})`, 'highlight_label'),
        1: c(Number(dep.importeTotalBlock || 0), 'highlight_currency'),
      });
    });

    setRowCells(s1, leftRow++, { 0: c('TRANSPORTE DIARIO PERSONAL', 'label'), 1: c(Number(transporte.tarifa_tramo || 37249.77), 'currency') });
    setRowCells(s1, leftRow++, { 0: c('TRAMOS', 'label'), 1: c(Number(transporte.tramos || 0), 'number') });
    setRowCells(s1, leftRow++, { 0: c('IMPORTE TOTAL TTE. PERSONAL', 'highlight_label'), 1: c(Number(transporte.total_transporte || 0), 'highlight_currency') });
    setRowCells(s1, leftRow++, { 0: c('IMPORTE TOTAL', 'total_label'), 1: c(totalNeto, 'total_currency') });
    setRowCells(s1, leftRow++, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency') });
    setRowCells(s1, leftRow++, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFactura, 'total_currency') });

    notes.forEach((n, idx) => {
      setRowCells(s1, leftRow + 1 + idx, { 0: c(n, 'note') });
    });

    // Right side (Cols 3 to 11): Both deposits tables stacked (`DEPOSITO NACIONAL` then `DEPOSITO FISCAL`)
    let rightRow = 0;
    depositos.forEach((dep) => {
      setRowCells(s1, rightRow, {
        10: c(Number(dep.hs50 || 0), 'number'),
        11: c(Number(dep.totalTte || 0), 'number'),
      });
      rightRow++;
      setRowCells(s1, rightRow, {
        3: c('BUQUE', 'header'),
        4: c('PUESTO', 'header'),
        5: c('APELLIDO', 'header'),
        6: c('FECHA', 'header'),
        7: c('DESDE-HASTA', 'header'),
        8: c('HORAS', 'header'),
        9: c('Normales', 'header'),
        10: c('0.5', 'header'),
        11: c('TTE', 'header'),
      });
      rightRow++;

      const turnos: any[] = dep.turnos || [];
      turnos.forEach((t) => {
        const isFeriado = Boolean(t.isHoliday) || String(t.apellido || '').toUpperCase() === 'FERIADO';
        const rawDate = String(t.fecha || '');
        const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
          ? rawDate.split('-').reverse().join('/')
          : rawDate;

        if (isFeriado) {
          setRowCells(s1, rightRow, {
            3: c(t.buque || dep.title, 'label'),
            4: c(t.puesto || dep.apuntadorLabel, 'label'),
            5: c('FERIADO', 'highlight_label'),
            6: c(formattedDate, 'center'),
            7: c(t.desdeHasta || '0800-1600', 'center'),
            8: c('', 'center'),
            9: c('', 'center'),
            10: c('', 'center'),
            11: c('', 'center'),
          });
        } else {
          setRowCells(s1, rightRow, {
            3: c(t.buque || dep.title, 'label'),
            4: c(t.puesto || dep.apuntadorLabel, 'label'),
            5: c(t.apellido || '', 'label'),
            6: c(formattedDate, 'center'),
            7: c(t.desdeHasta || '0800-1600', 'center'),
            8: c(Number(t.horas ?? 8), 'number'),
            9: c(Number(t.normales ?? 8), 'number'),
            10: c(Number(t.hs50 ?? 0), 'number'),
            11: c(Number(t.tte ?? (dep.code === 'fiscal' ? 0.5 : 1.0)), 'number'),
          });
        }
        rightRow++;
      });
      rightRow++; // blank separator row between Nacional and Fiscal tables
    });

    const safeDates = operationDates.trim().replace(/[\/\\:*?"<>|]/g, '-');
    return {
      filename: `MTS-CTYC SA - DD - DEPOSITOS - ${safeDates}.xls`,
      title: `Proforma Depósitos Delta Dock (${operationDates})`,
      proformaType,
      sheets: [
        {
          name: 'DEPOSITOS DELTA DOCK',
          colWidths: [280, 145, 25, 155, 110, 190, 95, 95, 65, 70, 55, 65],
          rows: s1,
        },
      ],
    };
  }

  // =========================================================================
  // MODELO 4: INCIDENCIA PLUS (3 PESTAÑAS: FACTURA, OPERATIVA, PLUS)
  // =========================================================================
  if (proformaType === 'plus_incidence') {
    const plusSum = payload.plus_summary || {};
    const turnos: any[] = payload.turnos || [];
    const totalNeto = Number(payload.totales?.total_neto ?? source.total_neto ?? source.subtotal ?? 0);
    const iva = Number(payload.totales?.iva_21 ?? source.tax_amount ?? totalNeto * 0.21);
    const totalFactura = Number(payload.totales?.total_factura ?? source.total ?? totalNeto + iva);

    // Sheet 1: FACTURA
    const s1: (ExcelCell | null)[][] = [];
    setRowCells(s1, 0, { 0: c('FACTURA ELECTRONICA', 'header'), 1: c(invoiceNumber, 'subheader') });
    setRowCells(s1, 1, { 0: c('FECHA FACTURA', 'label'), 1: c(issueDate, 'center') });
    setRowCells(s1, 2, { 0: c('FECHA VENCIMIENTO', 'label'), 1: c(dueDate, 'center') });
    setRowCells(s1, 3, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
    setRowCells(s1, 4, { 0: c('LUGAR', 'label'), 1: c('DELTA DOCK - LIMA', 'label') });
    setRowCells(s1, 6, { 0: c(`${vesselName} - ${operationDates}`, 'label'), 1: c(totalNeto, 'currency') });
    setRowCells(s1, 8, { 0: c('TOTAL NETO FACTURA', 'total_label'), 1: c(totalNeto, 'total_currency') });
    setRowCells(s1, 9, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency') });
    setRowCells(s1, 10, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFactura, 'total_currency') });

    // Sheet 2: OPERATIVA + TURNOS
    const s2: (ExcelCell | null)[][] = [];
    setRowCells(s2, 0, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
    setRowCells(s2, 1, {
      0: c('LUGAR', 'label'),
      1: c('DELTA DOCK - LIMA', 'label'),
      3: c('PUESTO', 'header'),
      4: c('APELLIDO', 'header'),
      5: c('FECHA', 'header'),
      6: c('DESDE-HASTA', 'header'),
      7: c('HORAS', 'header'),
      8: c('Normales', 'header'),
      9: c('0.5', 'header'),
      10: c('1.0', 'header'),
      11: c('VIAJES', 'header'),
    });
    setRowCells(s2, 2, { 0: c('FECHAS', 'label'), 1: c(operationDates, 'subheader') });
    setRowCells(s2, 3, { 0: c('SERVICIO', 'label'), 1: c(vesselName, 'header') });

    const leftRows: [string, number, ExcelCell['style']][] = [
      ['HORAS NORMALES ENCARGADO', Number(payload.horas_encargado?.norm || 8), 'number'],
      ['TARIFA PESOS / HS. NORMALES', Number(payload.tarifas_encargado?.REGULAR || 22362.87), 'currency'],
      ['IMPORTE HORAS NORMALES ENCARGADO', Number(payload.importes_encargado?.reg || 178902.96), 'currency'],
      ['HORAS NORMALES APUNTADOR', Number(payload.horas_apuntador?.norm || 56), 'number'],
      ['TARIFA PESOS / HS. NORMALES APUNT.', Number(payload.tarifas_apuntador?.REGULAR || 16254.43), 'currency'],
      ['IMPORTE HORAS NORMALES APUNT.', Number(payload.importes_apuntador?.reg || 910248.08), 'currency'],
      ['IMPORTE PERSONAL NORMAL', Number(payload.importe_personal_normal || 1089151.04), 'highlight_currency'],
      ['Total a facturar por Plus e Inc. Hs. Extras', Number(plusSum.total_facturar_plus || 1072517.84), 'highlight_currency'],
      ['TRANSPORTE - VIAJES', Number(payload.transporte?.viajes || 4), 'number'],
      ['IMPORTE POR VIAJE', Number(payload.transporte?.tarifa_viaje || 35594.34), 'currency'],
      ['TOTAL VIAJES', Number(payload.transporte?.total_viajes || 142377.36), 'currency'],
      ['IMPORTE TOTAL BONIFICADO', totalNeto, 'total_currency'],
      ['IVA (21%)', iva, 'currency'],
      ['TOTAL FACTURA', totalFactura, 'total_currency'],
    ];
    leftRows.forEach(([lbl, val, st], i) => {
      setRowCells(s2, 5 + i, { 0: c(lbl, st === 'total_currency' ? 'total_label' : 'label'), 1: c(val, st) });
    });

    turnos.forEach((t, idx) => {
      setRowCells(s2, 2 + idx, {
        3: c(t.puesto, 'label'),
        4: c(t.apellido, 'label'),
        5: c(t.fecha, 'center'),
        6: c(t.desdeHasta, 'center'),
        7: c(Number(t.totalHoras || 0), 'number'),
        8: c(Number(t.normales || 0), 'number'),
        9: c(Number(t.ot50 || 0), 'number'),
        10: c(Number(t.ot100 || 0), 'number'),
        11: c(Number(t.viajes || 0), 'number'),
      });
    });

    // Sheet 3: Plus
    const s3: (ExcelCell | null)[][] = [];
    setRowCells(s3, 0, { 0: c(`${vesselName} - ${operationDates}`, 'header') });
    setRowCells(s3, 2, { 0: c('Total unidades operadas:', 'highlight_label'), 1: c(Number(payload.unidades_operadas || 355), 'number') });
    setRowCells(s3, 4, {
      0: c('APELLIDO', 'header'),
      1: c('Fecha', 'header'),
      2: c('Desde-Hasta', 'header'),
      3: c('Total Horas', 'header'),
      4: c('Normal', 'header'),
      5: c('PLUS ($)', 'header'),
      6: c('INCID HE ($)', 'header'),
      8: c(clientName, 'header'),
      9: c('IMPORTE ($)', 'header'),
    });
    setRowCells(s3, 5, { 8: c('Plus', 'label'), 9: c(Number(plusSum.plus_base || 0), 'currency') });
    setRowCells(s3, 6, { 8: c('Incidencia plus Rem en Hs. Extras', 'label'), 9: c(Number(plusSum.incidencia_he || 0), 'currency') });
    setRowCells(s3, 7, { 8: c('Neto Plus + Inc. Hs. Extras', 'highlight_label'), 9: c(Number(plusSum.neto_plus || 0), 'highlight_currency') });
    setRowCells(s3, 8, { 8: c(`Coeficiente costos: ${plusSum.coeficiente ?? 0.52}`, 'label'), 9: c(Number(plusSum.coeficiente_monto || 0), 'currency') });
    setRowCells(s3, 9, { 8: c('Total a facturar por Plus e Inc. Hs. Extras', 'total_label'), 9: c(Number(plusSum.total_facturar_plus || 0), 'total_currency') });

    turnos.forEach((t, idx) => {
      setRowCells(s3, 5 + idx, {
        0: c(t.apellido, 'label'),
        1: c(t.fecha, 'center'),
        2: c(t.desdeHasta, 'center'),
        3: c(Number(t.totalHoras || 0), 'number'),
        4: c(Number(t.normales || 0), 'number'),
        5: c(Number(t.plus || 0), 'currency'),
        6: c(Number(t.incidHe || 0), 'currency'),
      });
    });

    const safeDates = operationDates.trim().replace(/[\/\\:*?"<>|]/g, '-');
    return {
      filename: `MTS-CTYC SA - Proforma Incidencia Plus ${vesselName} - ${safeDates}.xls`,
      title: `Proforma Incidencia Plus — ${vesselName} (${operationDates})`,
      proformaType,
      sheets: [
        { name: `FACTURA ${vesselName.slice(0, 12)}`, colWidths: [320, 160], rows: s1 },
        { name: `${vesselName.slice(0, 15)}`, colWidths: [280, 145, 25, 130, 190, 95, 95, 65, 65, 55, 55, 65], rows: s2 },
        { name: 'Plus', colWidths: [190, 95, 95, 75, 65, 115, 115, 25, 260, 145], rows: s3 },
      ],
    };
  }

  // =========================================================================
  // MODELO 5 y 6: COOPTACORD (shared_expo) Y SERGIO DANCHUK (standard)
  // =========================================================================
  const s1: (ExcelCell | null)[][] = [];
  const totalNeto = Number(source.total_neto ?? source.subtotal ?? 0);
  const iva = Number(source.tax_amount ?? totalNeto * 0.21);
  const totalFactura = Number(source.total ?? totalNeto + iva);

  setRowCells(s1, 0, { 0: c('FACTURA ELECTRONICA', 'header'), 1: c(invoiceNumber, 'subheader') });
  setRowCells(s1, 1, { 0: c('FECHA FACTURA', 'label'), 1: c(issueDate, 'center') });
  setRowCells(s1, 2, { 0: c('FECHA VENCIMIENTO', 'label'), 1: c(dueDate, 'center') });
  setRowCells(s1, 3, { 0: c('CLIENTE', 'label'), 1: c(clientName, 'subheader') });
  setRowCells(s1, 4, { 0: c('LUGAR', 'label'), 1: c(proformaType === 'shared_expo' ? 'DELTA DOCK - LIMA' : 'TERMINAL ZARATE', 'label') });
  setRowCells(s1, 5, { 0: c('FECHAS', 'label'), 1: c(operationDates, 'subheader') });
  setRowCells(s1, 6, { 0: c('SERVICIO', 'label'), 1: c(proformaType === 'shared_expo' ? 'APUNTADORES PLAZ. FISCAL (10%)' : 'PLAZOLETA FISCAL - CONTROL DAÑOS', 'header') });

  const itemsList = (isRecord ? source.details : source.items) || [];
  let rIdx = 8;
  for (const item of itemsList) {
    setRowCells(s1, rIdx++, { 0: c(item.description, 'label'), 1: c(Number(item.subtotal ?? (item.quantity * item.unit_price)), 'currency') });
  }
  setRowCells(s1, rIdx + 1, { 0: c('IMPORTE TOTAL NETO', 'total_label'), 1: c(totalNeto, 'total_currency') });
  setRowCells(s1, rIdx + 2, { 0: c('IVA (21%)', 'label'), 1: c(iva, 'currency') });
  setRowCells(s1, rIdx + 3, { 0: c('TOTAL FACTURA', 'total_label'), 1: c(totalFactura, 'total_currency') });

  notes.forEach((n, idx) => {
    setRowCells(s1, rIdx + 5 + idx, { 0: c(n, 'note') });
  });

  const safeDatesStd = operationDates.trim().replace(/[\/\\:*?"<>|]/g, '-');
  return {
    filename: `MTS-CTYC SA - ${clientName} - ${safeDatesStd}.xls`,
    title: `Proforma ${clientName} (${operationDates})`,
    proformaType,
    sheets: [{ name: 'Hoja1', colWidths: [340, 160], rows: s1 }],
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a real multi-worksheet Excel 2003 XML (.xls) file and triggers download.
 * Opens directly in Microsoft Excel, LibreOffice Calc, and Google Sheets with all tabs, borders, colors, and number formats.
 */
export function downloadProformaExcel(
  source: InvoicingRecord | ProformaCalculationResult,
  meta?: { issueDate?: string; dueDate?: string; invoiceNumber?: string }
): void {
  const wb = buildProformaWorkbook(source, meta);

  const worksheetsXml = wb.sheets
    .map((sheet) => {
      const safeSheetName = escapeXml(sheet.name.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31));
      const colsXml = sheet.colWidths
        .map((w) => `<Column ss:AutoFitWidth="0" ss:Width="${w}"/>`)
        .join('');

      const rowsXml = sheet.rows
        .map((row) => {
          if (!row || row.length === 0) return '<Row/>';
          let cellsXml = '';
          row.forEach((cell, cIdx) => {
            if (!cell) return;
            const isNum = typeof cell.value === 'number' && !Number.isNaN(cell.value);
            const dataType = isNum ? 'Number' : 'String';
            const styleId = cell.style || 'Default';
            const formulaAttr = cell.formula ? ` ss:Formula="${escapeXml(cell.formula)}"` : '';
            const spanAttr = cell.colSpan && cell.colSpan > 1 ? ` ss:MergeAcross="${cell.colSpan - 1}"` : '';
            const valStr = isNum ? String(cell.value) : escapeXml(String(cell.value));
            cellsXml += `<Cell ss:Index="${cIdx + 1}" ss:StyleID="${styleId}"${formulaAttr}${spanAttr}><Data ss:Type="${dataType}">${valStr}</Data></Cell>`;
          });
          return `<Row ss:Height="18">${cellsXml}</Row>`;
        })
        .join('\n');

      return `<Worksheet ss:Name="${safeSheetName}"><Table>${colsXml}\n${rowsXml}</Table></Worksheet>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
   <Alignment ss:Vertical="Center"/>
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
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0B1C30"/>
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
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0B1C30"/>
   <NumberFormat ss:Format="0.00"/>
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
   <NumberFormat ss:Format="&quot;$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="highlight_label">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#78350F"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="highlight_currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F59E0B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#78350F"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="total_label">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E5BB4" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="total_currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F2547"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F2547"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E5BB4" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;$&quot;\ #,##0.00"/>
  </Style>
  <Style ss:ID="note">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Bold="1" ss:Color="#475569"/>
  </Style>
 </Styles>
 ${worksheetsXml}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', wb.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

