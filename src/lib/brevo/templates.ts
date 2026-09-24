import { EmailBuilder } from './builder';
import {
  BadgeVariant,
  CalloutVariant,
  EmailRecipientInput,
  InvoiceReminderData,
  ProformaEmailData,
  SummaryItem,
} from './types';

/**
 * Formats a number to Argentine currency format (e.g. $ 1.250.000,00).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Translates concept_type enum to human-friendly Spanish.
 */
export function formatConceptType(
  concept: 'general_hours' | 'shuttles' | 'export_tallymen'
): string {
  switch (concept) {
    case 'general_hours':
      return 'Horas Operativas Generales';
    case 'shuttles':
      return 'Servicio de Remises';
    case 'export_tallymen':
      return 'Apuntadores de Exportación';
    default:
      return concept;
  }
}

/**
 * Creates an EmailBuilder pre-configured for a Proforma notification.
 */
export function createProformaEmail(data: ProformaEmailData): EmailBuilder {
  const builder = EmailBuilder.create()
    .to(data.clientEmail)
    .subject(`Liquidación Proforma N° ${data.proformaNumber} - Período ${data.fortnightPeriod}`)
    .preheader(
      `Detalle de liquidación quincenal ${data.fortnightPeriod} para ${data.clientName} por ${formatCurrency(data.total)}.`
    )
    .badge('PROFORMA EMITIDA', 'info')
    .title(
      `Liquidación de Servicios N° ${data.proformaNumber}`,
      `Período Quincenal: ${data.fortnightPeriod} • ${data.clientName}`
    )
    .paragraph(
      `Estimado/a cliente de ${data.clientName}, ponemos a su disposición el resumen detallado de la proforma correspondiente al período operativo indicado.`
    )
    .summary([
      { label: 'Razón Social', value: data.clientName },
      { label: 'Período', value: data.fortnightPeriod },
      { label: 'Concepto', value: formatConceptType(data.conceptType) },
      { label: 'Subtotal Operativo', value: formatCurrency(data.subtotal) },
      { label: 'Importe Total', value: formatCurrency(data.total), highlight: true },
      { label: 'Vencimiento para Aprobación', value: data.dueDate },
    ])
    .callout(
      'Conforme a los procedimientos de Plazoleta Fiscal, dispone de un plazo de 5 días corridos para formular observaciones. Transcurrido dicho plazo sin requerimientos, la liquidación quedará automáticamente aprobada para su facturación fiscal.',
      'info',
      'Plazo de Revisión Operativa'
    );

  if (data.publicUrl) {
    builder.button('Ver Proforma en Línea', data.publicUrl, 'primary');
  }

  if (data.pdfBase64) {
    builder.attachFromBase64(`Proforma-${data.proformaNumber}.pdf`, data.pdfBase64);
  }

  builder.tag('proforma');
  return builder;
}

/**
 * Creates an EmailBuilder pre-configured for Invoice payment reminders (Collection automated flow).
 * Handles:
 * - 3 days before due (daysRemainingOrOverdue < 0)
 * - Due day (daysRemainingOrOverdue === 0)
 * - Overdue (daysRemainingOrOverdue > 0)
 */
export function createInvoiceReminderEmail(data: InvoiceReminderData): EmailBuilder {
  const isOverdue = data.daysRemainingOrOverdue > 0;
  const isDueToday = data.daysRemainingOrOverdue === 0;

  let badgeText = 'AVISO DE PAGO PRÓXIMO';
  let badgeVariant: BadgeVariant = 'warning';
  let calloutVariant: CalloutVariant = 'warning';
  let calloutTitle = 'Aviso de Vencimiento de Factura';
  let subjectPrefix = 'Recordatorio de Pago';
  let introMessage = `Le informamos que la factura ${data.invoiceNumber} vencerá el ${data.dueDate}.`;

  if (isDueToday) {
    badgeText = 'VENCE HOY';
    badgeVariant = 'warning';
    calloutVariant = 'warning';
    calloutTitle = 'Vencimiento Hoy';
    subjectPrefix = 'Factura con Vencimiento Hoy';
    introMessage = `Le recordamos que la factura ${data.invoiceNumber} vence en el día de la fecha (${data.dueDate}).`;
  } else if (isOverdue) {
    badgeText = `FACTURA VENCIDA (+${data.daysRemainingOrOverdue} DÍAS)`;
    badgeVariant = 'danger';
    calloutVariant = 'danger';
    calloutTitle = 'Aviso de Pago Pendiente';
    subjectPrefix = 'Factura Vencida';
    introMessage = `Nos comunicamos para informarle que registramos la factura ${data.invoiceNumber} con fecha de vencimiento superada (${data.dueDate}) y saldo pendiente de regularización.`;
  }

  const summaryItems: SummaryItem[] = [
    { label: 'Cliente', value: data.clientName },
    { label: 'Factura N°', value: data.invoiceNumber },
    ...(data.proformaNumber ? [{ label: 'Proforma Asociada', value: data.proformaNumber }] : []),
    { label: 'Saldo Pendiente', value: formatCurrency(data.invoicedAmount), highlight: true },
    { label: 'Fecha de Vencimiento', value: data.dueDate },
  ];

  const builder = EmailBuilder.create()
    .to(data.clientEmail)
    .subject(`${subjectPrefix}: Factura ${data.invoiceNumber} - ${data.clientName}`)
    .preheader(
      `${badgeText}: Saldo pendiente de ${formatCurrency(data.invoicedAmount)} sobre la factura ${data.invoiceNumber}.`
    )
    .badge(badgeText, badgeVariant)
    .title(
      isOverdue ? 'Aviso de Factura Vencida' : 'Estado de Facturación Pendiente',
      `Factura N° ${data.invoiceNumber} • ${data.clientName}`
    )
    .paragraph(introMessage)
    .summary(summaryItems);

  if (data.paymentDetails) {
    builder.callout(data.paymentDetails, calloutVariant, 'Datos para Transferencia Bancaria');
  } else {
    builder.callout(
      'Si ya ha emitido la orden de pago o realizado la transferencia bancaria en las últimas 24 horas, por favor desestime este aviso o envíenos el comprobante correspondiente respondiendo a este correo.',
      calloutVariant,
      calloutTitle
    );
  }

  if (data.publicUrl) {
    builder.button('Ver Comprobante / Factura', data.publicUrl, isOverdue ? 'dark' : 'primary');
  }

  builder.tag('cobranzas');
  return builder;
}

/**
 * Options for a generic corporate notification.
 */
export interface GenericNotificationOptions {
  to: EmailRecipientInput;
  subject: string;
  title: string;
  subtitle?: string;
  message: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  summaryItems?: SummaryItem[];
  calloutMessage?: string;
  calloutVariant?: CalloutVariant;
  calloutTitle?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionVariant?: 'primary' | 'secondary' | 'dark';
  tags?: string[];
}

/**
 * Creates an EmailBuilder for a generic corporate notification.
 */
export function createGenericNotificationEmail(options: GenericNotificationOptions): EmailBuilder {
  const builder = EmailBuilder.create()
    .to(options.to)
    .subject(options.subject)
    .preheader(options.message.slice(0, 100));

  if (options.badgeText) {
    builder.badge(options.badgeText, options.badgeVariant || 'info');
  }

  builder.title(options.title, options.subtitle);
  builder.paragraph(options.message);

  if (options.summaryItems && options.summaryItems.length > 0) {
    builder.summary(options.summaryItems);
  }

  if (options.calloutMessage) {
    builder.callout(
      options.calloutMessage,
      options.calloutVariant || 'info',
      options.calloutTitle
    );
  }

  if (options.actionLabel && options.actionUrl) {
    builder.button(options.actionLabel, options.actionUrl, options.actionVariant || 'primary');
  }

  if (options.tags && options.tags.length > 0) {
    builder.tags(options.tags);
  }

  return builder;
}

