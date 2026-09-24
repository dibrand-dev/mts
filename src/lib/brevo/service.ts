import { EmailBuilder } from './builder';
import { sendBrevoEmail } from './client';
import {
  createGenericNotificationEmail,
  createInvoiceReminderEmail,
  createProformaEmail,
  GenericNotificationOptions,
} from './templates';
import {
  BrevoApiEmailPayload,
  BrevoSendResult,
  EmailRecipientInput,
  InvoiceReminderData,
  ProformaEmailData,
} from './types';

/**
 * Sends an email using either an EmailBuilder instance or a raw BrevoApiEmailPayload.
 */
export async function sendEmail(
  input: EmailBuilder | BrevoApiEmailPayload
): Promise<BrevoSendResult> {
  const payload = input instanceof EmailBuilder ? input.build() : input;
  return sendBrevoEmail(payload);
}

/**
 * High-level service: Sends a Proforma notification email.
 */
export async function sendProformaEmail(data: ProformaEmailData): Promise<BrevoSendResult> {
  const builder = createProformaEmail(data);
  return builder.send();
}

/**
 * High-level service: Sends a Collection/Payment reminder email.
 */
export async function sendInvoiceReminderEmail(
  data: InvoiceReminderData
): Promise<BrevoSendResult> {
  const builder = createInvoiceReminderEmail(data);
  return builder.send();
}

/**
 * High-level service: Sends a generic corporate notification.
 */
export async function sendGenericNotification(
  options: GenericNotificationOptions
): Promise<BrevoSendResult> {
  const builder = createGenericNotificationEmail(options);
  return builder.send();
}

/**
 * Quick helper: Sends a simple text/HTML email in a single function call.
 */
export async function sendSimpleEmail(params: {
  to: EmailRecipientInput;
  subject: string;
  message: string;
  title?: string;
  action?: { label: string; url: string };
}): Promise<BrevoSendResult> {
  const builder = EmailBuilder.create()
    .to(params.to)
    .subject(params.subject)
    .title(params.title || params.subject)
    .paragraph(params.message);

  if (params.action) {
    builder.button(params.action.label, params.action.url, 'primary');
  }

  return builder.send();
}

