import { InvoicingRecord } from './types';

/**
 * Generates and triggers the download of a UTF-8 BOM CSV representation of a Proforma.
 * Works seamlessly in Excel and spreadsheet viewers.
 */
export function downloadProformaCSV(proforma: InvoicingRecord): void {
  const rows: (string | number)[][] = [
    ['MTS MARITIME & TERMINAL SERVICES - LIQUIDACIÓN PROFORMA'],
    [''],
    ['Número de Proforma', proforma.proforma_number],
    ['Estado', proforma.status.toUpperCase()],
    ['Modelo de Facturación', proforma.proforma_type],
    ['Cliente / Razón Social', proforma.client_name || 'Sin Cliente'],
    ['CUIT / Identificación Fiscal', proforma.client_tax_id || '-'],
    ['Email de Facturación', proforma.client_billing_email || '-'],
    ['Teléfono de Contacto', proforma.client_phone_number || '-'],
    ['Operación / Buque', proforma.vessel_name || '-'],
    ['Período Quincenal', proforma.fortnight_period],
    ['Fechas de Operación', proforma.operation_dates || '-'],
    ['Fecha de Emisión', proforma.issue_date],
    ['Fecha de Vencimiento', proforma.due_date],
    ['Factura AFIP Asociada', proforma.invoice?.invoice_number || 'Pendiente de emisión'],
    [''],
    ['DETALLE DE CONCEPTOS OPERATIVOS'],
    ['Descripción del Concepto', 'Cantidad', 'Precio Unitario ($)', 'Subtotal ($)'],
  ];

  if (proforma.details && proforma.details.length > 0) {
    proforma.details.forEach((item) => {
      rows.push([
        item.description,
        item.quantity,
        item.unit_price.toFixed(2),
        item.subtotal.toFixed(2),
      ]);
    });
  } else {
    rows.push([
      `Servicios operativos según modelo ${proforma.proforma_type}`,
      1,
      proforma.subtotal.toFixed(2),
      proforma.subtotal.toFixed(2),
    ]);
  }

  rows.push(['']);
  rows.push(['RESUMEN DE LIQUIDACIÓN FINANCIERA', '', '', '']);

  if (proforma.subtotal_operativa && proforma.subtotal_operativa > 0) {
    rows.push(['Subtotal Operativa / Rampa', '', '', proforma.subtotal_operativa.toFixed(2)]);
  }
  if (proforma.subtotal_encargado && proforma.subtotal_encargado > 0) {
    rows.push(['Subtotal Encargado a Bordo', '', '', proforma.subtotal_encargado.toFixed(2)]);
  }
  if (proforma.subtotal_compensacion && proforma.subtotal_compensacion > 0) {
    rows.push(['Subtotal Horas Compensación Trabajo Corrido', '', '', proforma.subtotal_compensacion.toFixed(2)]);
  }
  if (proforma.discount_amount && proforma.discount_amount > 0) {
    rows.push([`Descuento / Bonificación Comercial (${proforma.discount_percentage}%)`, '', '', (-proforma.discount_amount).toFixed(2)]);
  }

  const subtotalNeto = proforma.total_neto || proforma.subtotal;
  const taxAmount = proforma.tax_amount || subtotalNeto * 0.21;

  rows.push(['Total Neto Gravado', '', '', subtotalNeto.toFixed(2)]);
  rows.push(['IVA (21.00%)', '', '', taxAmount.toFixed(2)]);
  rows.push(['TOTAL FACTURA FINAL (ARS)', '', '', proforma.total.toFixed(2)]);

  if (proforma.notes && proforma.notes.length > 0) {
    rows.push(['']);
    rows.push(['OBSERVACIONES OPERATIVAS']);
    proforma.notes.forEach((note, idx) => {
      rows.push([`${idx + 1}. ${note}`]);
    });
  }

  // Format as CSV with semicolon delimiter and UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Proforma_${proforma.proforma_number}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
