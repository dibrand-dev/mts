import { sendInvoiceReminderEmail } from '../brevo';

export type ReminderType = 'upcoming_3_days' | 'due_today' | 'overdue';

export interface ReminderEvaluationResult {
  dueDate: string;
  daysDifference: number; // targetDate - dueDate. Negative = days remaining, 0 = due today, Positive = days overdue
  isDueToday: boolean;
  isOverdue: boolean;
  isUpcoming3Days: boolean;
  shouldSend: boolean;
  reminderType: ReminderType | null;
  reason: string;
  badgeText?: string;
  subjectPrefix?: string;
}

export interface EvaluateReminderParams {
  invoiceDate: string; // YYYY-MM-DD
  paymentDueDays: number; // e.g. 15, 30, 7
  targetDate: string; // YYYY-MM-DD
  cadenceDays?: number; // e.g. 3 or 7
  lastReminderSentDate?: string | null; // YYYY-MM-DD
  lastReminderType?: string | null;
}

export interface ProcessPendingRemindersOptions {
  targetDate?: string; // Simulation date (YYYY-MM-DD)
  cadenceDays?: number; // Override cadence for overdue invoices
  dryRun?: boolean; // If true, evaluates without sending emails or modifying database
  supabaseClient?: any; // Optional injected supabase client (for server or testing)
  appBaseUrl?: string; // Optional URL for proforma public link
}

export interface InvoiceReminderDetail {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoicedAmount: number;
  invoiceDate: string;
  dueDate: string;
  paymentDueDays: number;
  daysDifference: number;
  action: 'sent' | 'skipped' | 'mocked' | 'failed' | 'dry_run';
  reminderType: ReminderType | null;
  reason: string;
  brevoMessageId?: string;
  error?: string;
}

export interface ProcessRemindersSummary {
  targetDate: string;
  totalPendingEvaluated: number;
  sentCount: number;
  skippedCount: number;
  errorCount: number;
  dryRun: boolean;
  details: InvoiceReminderDetail[];
}

/**
 * Returns current date in Argentina timezone (America/Argentina/Buenos_Aires) as YYYY-MM-DD.
 */
export function getTodayArgentina(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Pure function: calculates the due date from emission date + client payment due days.
 * Immune to server timezone issues by working strictly in UTC calendar days.
 */
export function calculateInvoiceDueDate(invoiceDate: string, paymentDueDays: number): string {
  if (!invoiceDate) return getTodayArgentina();
  const cleanDate = invoiceDate.includes('T') ? invoiceDate.split('T')[0] : invoiceDate;
  const [year, month, day] = cleanDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + (Number(paymentDueDays) || 0));
  return date.toISOString().split('T')[0];
}

/**
 * Pure function: calculates difference in calendar days: targetDate - dueDate.
 * Negative (< 0): targetDate is before dueDate (days remaining until due).
 * Zero (=== 0): targetDate is exactly dueDate.
 * Positive (> 0): targetDate is after dueDate (days overdue).
 */
export function calculateDaysDifference(targetDate: string, dueDate: string): number {
  const cleanTarget = targetDate.includes('T') ? targetDate.split('T')[0] : targetDate;
  const cleanDue = dueDate.includes('T') ? dueDate.split('T')[0] : dueDate;

  const [y1, m1, d1] = cleanTarget.split('-').map(Number);
  const [y2, m2, d2] = cleanDue.split('-').map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((t1 - t2) / MS_PER_DAY);
}

/**
 * Core business evaluation logic for invoice due date reminders.
 * Criteria:
 * - 3 days before due (daysDifference === -3): "Aviso de Próximo Vencimiento"
 * - Due today (daysDifference === 0): "Vencimiento Hoy"
 * - Overdue (daysDifference > 0): "Aviso de Factura Vencida" with configurable repetition cadence (e.g. 3 or 7 days)
 * - Includes daily idempotency protection: skips if already sent today for the same reminder type.
 */
export function evaluateInvoiceReminderStatus(params: EvaluateReminderParams): ReminderEvaluationResult {
  const {
    invoiceDate,
    paymentDueDays,
    targetDate,
    cadenceDays = 3,
    lastReminderSentDate,
    lastReminderType,
  } = params;

  const effectiveCadence = Math.max(1, Number(cadenceDays) || 3);
  const dueDate = calculateInvoiceDueDate(invoiceDate, paymentDueDays);
  const daysDifference = calculateDaysDifference(targetDate, dueDate);

  const isUpcoming3Days = daysDifference === -3;
  const isDueToday = daysDifference === 0;
  const isOverdue = daysDifference > 0;

  // Clean last reminder date if provided
  const cleanLastSentDate = lastReminderSentDate
    ? (lastReminderSentDate.includes('T') ? lastReminderSentDate.split('T')[0] : lastReminderSentDate)
    : null;

  // Check if reminder was already sent today for this invoice
  const alreadySentToday = cleanLastSentDate === targetDate;

  // 1. Condition: 3 days before due date
  if (isUpcoming3Days) {
    if (alreadySentToday && lastReminderType === 'upcoming_3_days') {
      return {
        dueDate,
        daysDifference,
        isDueToday: false,
        isOverdue: false,
        isUpcoming3Days: true,
        shouldSend: false,
        reminderType: 'upcoming_3_days',
        reason: 'Aviso de próximo vencimiento (-3 días) ya enviado en el día de hoy.',
        badgeText: 'AVISO DE PAGO PRÓXIMO',
        subjectPrefix: 'Recordatorio de Pago',
      };
    }

    return {
      dueDate,
      daysDifference,
      isDueToday: false,
      isOverdue: false,
      isUpcoming3Days: true,
      shouldSend: true,
      reminderType: 'upcoming_3_days',
      reason: 'Faltan 3 días para el vencimiento de la factura.',
      badgeText: 'AVISO DE PAGO PRÓXIMO',
      subjectPrefix: 'Recordatorio de Pago',
    };
  }

  // 2. Condition: Due today (Day 0)
  if (isDueToday) {
    if (alreadySentToday && lastReminderType === 'due_today') {
      return {
        dueDate,
        daysDifference,
        isDueToday: true,
        isOverdue: false,
        isUpcoming3Days: false,
        shouldSend: false,
        reminderType: 'due_today',
        reason: 'Aviso de vencimiento hoy (Día 0) ya enviado en el día de hoy.',
        badgeText: 'VENCE HOY',
        subjectPrefix: 'Factura con Vencimiento Hoy',
      };
    }

    return {
      dueDate,
      daysDifference,
      isDueToday: true,
      isOverdue: false,
      isUpcoming3Days: false,
      shouldSend: true,
      reminderType: 'due_today',
      reason: 'La factura vence en el día de la fecha (Día 0).',
      badgeText: 'VENCE HOY',
      subjectPrefix: 'Factura con Vencimiento Hoy',
    };
  }

  // 3. Condition: Overdue (daysDifference > 0)
  if (isOverdue) {
    const overdueDays = daysDifference;

    if (alreadySentToday && lastReminderType === 'overdue') {
      return {
        dueDate,
        daysDifference,
        isDueToday: false,
        isOverdue: true,
        isUpcoming3Days: false,
        shouldSend: false,
        reminderType: 'overdue',
        reason: `Aviso de factura vencida (+${overdueDays} días) ya enviado en el día de hoy.`,
        badgeText: `FACTURA VENCIDA (+${overdueDays} DÍAS)`,
        subjectPrefix: 'Factura Vencida',
      };
    }

    // Check cadence:
    // Matches if overdueDays is an exact multiple of cadence (e.g. 3, 6, 9... or 7, 14, 21...)
    const isModuloMatch = overdueDays % effectiveCadence === 0;

    // Or if last overdue reminder was sent >= cadenceDays ago (fail-safe if a cron was missed)
    const daysSinceLastSent = cleanLastSentDate
      ? calculateDaysDifference(targetDate, cleanLastSentDate)
      : null;
    const isCadenceElapsed = daysSinceLastSent !== null && daysSinceLastSent >= effectiveCadence;

    const isCadenceTrigger = isModuloMatch || isCadenceElapsed;

    if (isCadenceTrigger) {
      return {
        dueDate,
        daysDifference,
        isDueToday: false,
        isOverdue: true,
        isUpcoming3Days: false,
        shouldSend: true,
        reminderType: 'overdue',
        reason: `Factura vencida por ${overdueDays} días (cadencia cada ${effectiveCadence} días).`,
        badgeText: `FACTURA VENCIDA (+${overdueDays} DÍAS)`,
        subjectPrefix: 'Factura Vencida',
      };
    }

    return {
      dueDate,
      daysDifference,
      isDueToday: false,
      isOverdue: true,
      isUpcoming3Days: false,
      shouldSend: false,
      reminderType: 'overdue',
      reason: `Factura vencida por ${overdueDays} días, pero no coincide con la cadencia de repetición (${effectiveCadence} días).`,
      badgeText: `FACTURA VENCIDA (+${overdueDays} DÍAS)`,
      subjectPrefix: 'Factura Vencida',
    };
  }

  // 4. Any other date (e.g., -10, -5, -2, -1 days before due)
  const remainingDays = -daysDifference;
  return {
    dueDate,
    daysDifference,
    isDueToday: false,
    isOverdue: false,
    isUpcoming3Days: false,
    shouldSend: false,
    reminderType: null,
    reason: `No corresponde aviso (faltan ${remainingDays} días para el vencimiento).`,
  };
}

/**
 * Main Orchestrator:
 * Reads all pending invoices, joins client payment due days and email,
 * evaluates due status, dispatches Brevo emails, records audit logs,
 * and updates invoice metadata.
 */
export async function processPendingInvoiceReminders(
  options: ProcessPendingRemindersOptions = {}
): Promise<ProcessRemindersSummary> {
  const targetDate = options.targetDate || getTodayArgentina();
  const dryRun = options.dryRun ?? false;
  const baseUrl = options.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let supabase = options.supabaseClient;
  if (!supabase) {
    try {
      const { createClient } = await import('../supabase/client');
      supabase = createClient();
    } catch {
      // In environment without cookies/server context, create direct client if available
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  // 1. Fetch global overdue cadence setting if available
  let globalCadence = options.cadenceDays;
  if (!globalCadence) {
    try {
      const { data: varData } = await supabase
        .from('master_variables')
        .select('numeric_value')
        .eq('code', 'OVERDUE_CADENCE_DAYS')
        .eq('is_active', true)
        .maybeSingle();

      if (varData?.numeric_value) {
        globalCadence = Number(varData.numeric_value);
      }
    } catch {
      // Fallback
    }
  }
  const defaultCadence = globalCadence || 3;

  // 2. Fetch all pending tax invoices
  const { data: rawInvoices, error: fetchError } = await supabase
    .from('tax_invoices')
    .select(`
      id,
      invoice_number,
      invoiced_amount,
      status,
      invoice_date,
      last_reminder_sent_at,
      last_reminder_type,
      reminders_sent_count,
      pdf_storage_path,
      proformas (
        id,
        proforma_number,
        public_token,
        due_date,
        clients (
          id,
          company_name,
          billing_email,
          payment_due_days,
          overdue_reminder_cadence_days
        )
      )
    `)
    .eq('status', 'pending');

  if (fetchError) {
    console.error('[Invoice Reminders] Error fetching pending invoices:', fetchError);
    throw new Error(`Error al consultar facturas pendientes: ${fetchError.message}`);
  }

  const invoices = rawInvoices || [];
  const details: InvoiceReminderDetail[] = [];
  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const inv of invoices) {
    // Proformas & Client data resolution
    const proforma = Array.isArray(inv.proformas) ? inv.proformas[0] : inv.proformas;
    const client = proforma?.clients
      ? (Array.isArray(proforma.clients) ? proforma.clients[0] : proforma.clients)
      : null;

    const clientId = client?.id || '';
    const clientName = client?.company_name || 'Cliente Desconocido';
    const clientEmail = client?.billing_email || '';
    const paymentDueDays = Number(client?.payment_due_days) || 15;
    const clientCadence = options.cadenceDays || Number(client?.overdue_reminder_cadence_days) || defaultCadence;

    // Check last reminder date
    const lastReminderDate = inv.last_reminder_sent_at
      ? inv.last_reminder_sent_at.split('T')[0]
      : null;

    // Evaluate reminder status
    const evaluation = evaluateInvoiceReminderStatus({
      invoiceDate: inv.invoice_date,
      paymentDueDays,
      targetDate,
      cadenceDays: clientCadence,
      lastReminderSentDate: lastReminderDate,
      lastReminderType: inv.last_reminder_type,
    });

    const detailItem: InvoiceReminderDetail = {
      invoiceId: inv.id,
      invoiceNumber: inv.invoice_number,
      clientId,
      clientName,
      clientEmail,
      invoicedAmount: Number(inv.invoiced_amount || 0),
      invoiceDate: inv.invoice_date,
      dueDate: evaluation.dueDate,
      paymentDueDays,
      daysDifference: evaluation.daysDifference,
      action: 'skipped',
      reminderType: evaluation.reminderType,
      reason: evaluation.reason,
    };

    if (!evaluation.shouldSend) {
      skippedCount++;
      details.push(detailItem);
      continue;
    }

    // Client must have an email configured
    if (!clientEmail || !clientEmail.includes('@')) {
      detailItem.action = 'failed';
      detailItem.error = 'Cliente no posee un correo electrónico de facturación válido configurado.';
      detailItem.reason = 'Email faltante o inválido.';
      errorCount++;
      details.push(detailItem);
      continue;
    }

    if (dryRun) {
      detailItem.action = 'dry_run';
      detailItem.reason = `[Simulación DRY-RUN] Se habría enviado recordatorio: ${evaluation.reason}`;
      sentCount++;
      details.push(detailItem);
      continue;
    }

    // 3. Dispatch Email via Brevo
    try {
      const publicUrl = proforma?.public_token
        ? `${baseUrl}/proforma/${proforma.public_token}`
        : undefined;

      const brevoResult = await sendInvoiceReminderEmail({
        clientName,
        clientEmail,
        invoiceNumber: inv.invoice_number,
        proformaNumber: proforma?.proforma_number,
        invoicedAmount: Number(inv.invoiced_amount || 0),
        dueDate: evaluation.dueDate,
        daysRemainingOrOverdue: evaluation.daysDifference,
        publicUrl,
      });

      if (!brevoResult.success) {
        detailItem.action = 'failed';
        detailItem.error = brevoResult.error || 'Fallo desconocido en el envío por Brevo.';
        errorCount++;
        details.push(detailItem);
        continue;
      }

      detailItem.action = brevoResult.mocked ? 'mocked' : 'sent';
      detailItem.brevoMessageId = brevoResult.messageId;
      sentCount++;

      // 4. Record audit log in invoice_reminder_logs
      try {
        await supabase.from('invoice_reminder_logs').insert({
          tax_invoice_id: inv.id,
          client_id: clientId,
          reminder_type: evaluation.reminderType || 'unknown',
          days_difference: evaluation.daysDifference,
          recipient_email: clientEmail,
          sent_date: targetDate,
          brevo_message_id: brevoResult.messageId || null,
          status: brevoResult.mocked ? 'mocked' : 'sent',
        });
      } catch (logErr) {
        console.warn('[Invoice Reminders] Warning recording log:', logErr);
      }

      // 5. Update metadata in tax_invoices
      try {
        await supabase
          .from('tax_invoices')
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            last_reminder_type: evaluation.reminderType,
            reminders_sent_count: (Number(inv.reminders_sent_count) || 0) + 1,
          })
          .eq('id', inv.id);
      } catch (updErr) {
        console.warn('[Invoice Reminders] Warning updating tax_invoice metadata:', updErr);
      }

      details.push(detailItem);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error inesperado al despachar recordatorio';
      console.error('[Invoice Reminders] Dispatch error:', err);
      detailItem.action = 'failed';
      detailItem.error = errMsg;
      errorCount++;
      details.push(detailItem);
    }
  }

  return {
    targetDate,
    totalPendingEvaluated: invoices.length,
    sentCount,
    skippedCount,
    errorCount,
    dryRun,
    details,
  };
}

