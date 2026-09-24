/**
 * Types and interfaces for the Brevo Email module in MTS Gestión Logística.
 */

export interface EmailContact {
  email: string;
  name?: string;
}

export type EmailRecipientInput =
  | string
  | EmailContact
  | (string | EmailContact)[];

export interface EmailAttachment {
  name: string;
  /**
   * Base64-encoded string content of the attachment (without data:... prefix)
   */
  content?: string;
  /**
   * Public URL pointing to the attachment (e.g., Supabase Storage bucket URL)
   */
  url?: string;
}

export type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';
export type ButtonVariant = 'primary' | 'secondary' | 'dark';

export interface SummaryItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface TableConfig {
  headers: string[];
  rows: (string | number)[][];
}

export type ContentBlock =
  | { type: 'badge'; text: string; variant: BadgeVariant }
  | { type: 'title'; heading: string; subtitle?: string }
  | { type: 'paragraph'; text: string; muted?: boolean }
  | { type: 'callout'; message: string; variant: CalloutVariant; title?: string }
  | { type: 'summary'; items: SummaryItem[] }
  | { type: 'table'; headers: string[]; rows: (string | number)[][] }
  | { type: 'button'; label: string; url: string; variant: ButtonVariant }
  | { type: 'divider' }
  | { type: 'rawHtml'; html: string };

/**
 * Brevo REST API v3 Payload definition
 * POST https://api.brevo.com/v3/smtp/email
 */
export interface BrevoApiRecipient {
  email: string;
  name?: string;
}

export interface BrevoApiAttachment {
  name: string;
  content?: string;
  url?: string;
}

export interface BrevoApiEmailPayload {
  sender?: BrevoApiRecipient;
  to: BrevoApiRecipient[];
  cc?: BrevoApiRecipient[];
  bcc?: BrevoApiRecipient[];
  replyTo?: BrevoApiRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachment?: BrevoApiAttachment[];
  tags?: string[];
  templateId?: number;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface BrevoSendResult {
  success: boolean;
  messageId?: string;
  mocked?: boolean;
  error?: string;
  details?: unknown;
}

export interface BaseEmailOptions {
  to: EmailRecipientInput;
  subject: string;
  cc?: EmailRecipientInput;
  bcc?: EmailRecipientInput;
  replyTo?: EmailContact | string;
  sender?: EmailContact;
  attachments?: EmailAttachment[];
  tags?: string[];
}

export interface ProformaEmailData {
  clientName: string;
  clientEmail: string;
  proformaNumber: string;
  fortnightPeriod: string;
  conceptType: 'general_hours' | 'shuttles' | 'export_tallymen';
  subtotal: number;
  total: number;
  dueDate: string;
  publicUrl?: string;
  pdfBase64?: string;
}

export interface InvoiceReminderData {
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  proformaNumber?: string;
  invoicedAmount: number;
  dueDate: string;
  daysRemainingOrOverdue: number; // e.g. -3 (3 days until due), 0 (due today), 5 (5 days overdue)
  paymentDetails?: string;
  publicUrl?: string;
}

