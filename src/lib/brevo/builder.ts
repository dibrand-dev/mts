import {
  BadgeVariant,
  ButtonVariant,
  CalloutVariant,
  ContentBlock,
  EmailAttachment,
  EmailContact,
  EmailRecipientInput,
  SummaryItem,
  BrevoApiEmailPayload,
  BrevoSendResult,
} from './types';
import { normalizeAttachments, normalizeRecipients, sendBrevoEmail } from './client';

export class EmailBuilder {
  private _to: EmailRecipientInput[] = [];
  private _cc: EmailRecipientInput[] = [];
  private _bcc: EmailRecipientInput[] = [];
  private _sender?: EmailContact;
  private _replyTo?: EmailContact;
  private _subject = '';
  private _preheader = '';
  private _blocks: ContentBlock[] = [];
  private _attachments: EmailAttachment[] = [];
  private _tags: string[] = [];

  public static create(): EmailBuilder {
    return new EmailBuilder();
  }

  public to(recipients: EmailRecipientInput): this {
    this._to.push(recipients);
    return this;
  }

  public cc(recipients: EmailRecipientInput): this {
    this._cc.push(recipients);
    return this;
  }

  public bcc(recipients: EmailRecipientInput): this {
    this._bcc.push(recipients);
    return this;
  }

  public from(email: string, name?: string): this {
    this._sender = { email, name };
    return this;
  }

  public replyTo(email: string, name?: string): this {
    this._replyTo = { email, name };
    return this;
  }

  public subject(subject: string): this {
    this._subject = subject;
    return this;
  }

  public preheader(text: string): this {
    this._preheader = text;
    return this;
  }

  public badge(text: string, variant: BadgeVariant = 'info'): this {
    this._blocks.push({ type: 'badge', text, variant });
    return this;
  }

  public title(heading: string, subtitle?: string): this {
    this._blocks.push({ type: 'title', heading, subtitle });
    return this;
  }

  public paragraph(text: string, muted = false): this {
    this._blocks.push({ type: 'paragraph', text, muted });
    return this;
  }

  public callout(message: string, variant: CalloutVariant = 'info', title?: string): this {
    this._blocks.push({ type: 'callout', message, variant, title });
    return this;
  }

  public summary(items: SummaryItem[]): this {
    this._blocks.push({ type: 'summary', items });
    return this;
  }

  public table(headers: string[], rows: (string | number)[][]): this {
    this._blocks.push({ type: 'table', headers, rows });
    return this;
  }

  public button(label: string, url: string, variant: ButtonVariant = 'primary'): this {
    this._blocks.push({ type: 'button', label, url, variant });
    return this;
  }

  public divider(): this {
    this._blocks.push({ type: 'divider' });
    return this;
  }

  public rawHtml(html: string): this {
    this._blocks.push({ type: 'rawHtml', html });
    return this;
  }

  public attach(attachment: EmailAttachment): this {
    this._attachments.push(attachment);
    return this;
  }

  public attachFromBase64(name: string, content: string): this {
    this._attachments.push({ name, content });
    return this;
  }

  public attachFromUrl(name: string, url: string): this {
    this._attachments.push({ name, url });
    return this;
  }

  public tag(tag: string): this {
    if (tag && !this._tags.includes(tag)) {
      this._tags.push(tag);
    }
    return this;
  }

  public tags(tags: string[]): this {
    tags.forEach((t) => this.tag(t));
    return this;
  }

  /**
   * Generates the plain-text alternative of the email.
   */
  public buildText(): string {
    const lines: string[] = [];

    if (this._subject) {
      lines.push(this._subject.toUpperCase());
      lines.push('='.repeat(this._subject.length));
      lines.push('');
    }

    for (const block of this._blocks) {
      switch (block.type) {
        case 'badge':
          lines.push(`[${block.text.toUpperCase()}]`);
          lines.push('');
          break;
        case 'title':
          lines.push(block.heading);
          if (block.subtitle) lines.push(block.subtitle);
          lines.push('-'.repeat(Math.max(block.heading.length, 20)));
          lines.push('');
          break;
        case 'paragraph':
          lines.push(block.text);
          lines.push('');
          break;
        case 'callout':
          lines.push(`*** ${block.title ? block.title + ': ' : ''}${block.message} ***`);
          lines.push('');
          break;
        case 'summary':
          for (const item of block.items) {
            lines.push(`• ${item.label}: ${item.value}`);
          }
          lines.push('');
          break;
        case 'table':
          lines.push(block.headers.join(' | '));
          lines.push(block.headers.map(() => '---').join(' | '));
          for (const row of block.rows) {
            lines.push(row.join(' | '));
          }
          lines.push('');
          break;
        case 'button':
          lines.push(`${block.label}: ${block.url}`);
          lines.push('');
          break;
        case 'divider':
          lines.push('----------------------------------------');
          lines.push('');
          break;
      }
    }

    lines.push('');
    lines.push('---');
    lines.push('MTS Gestión Logística - Sistema Automatizado');

    return lines.join('\n');
  }

  /**
   * Generates bulletproof responsive HTML with MTS B2B corporate styling.
   */
  public buildHtml(): string {
    const renderedBlocks = this._blocks.map((b) => this.renderBlockHtml(b)).join('\n');

    const preheaderHtml = this._preheader
      ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${this.escapeHtml(this._preheader)}
          &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this._subject)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #0f172a;">
  ${preheaderHtml}

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; width: 100%;">
    <tr>
      <td align="center" style="padding: 24px 12px 36px 12px;">
        <!-- Email Card (Max 600px) -->
        <table role="presentation" class="email-container" width="600" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Bar with MTS Palette -->
          <tr>
            <td style="background-color: #0f2547; padding: 20px 28px; border-bottom: 3px solid #0ea5e9;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: inline-block;">
                      MTS <span style="color: #0ea5e9; font-weight: 400; font-size: 15px; letter-spacing: 0.5px; text-transform: uppercase;">Logística</span>
                    </span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background-color: rgba(255, 255, 255, 0.12); color: #94a3b8; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                      Sistema de Gestión
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="email-content" style="padding: 32px 28px 24px 28px;">
              ${renderedBlocks}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                MTS Gestión Logística • Plazoleta Fiscal
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                Este es un mensaje automático generado por la plataforma operativa de MTS Logística.<br>
                Por consultas administrativas o de facturación, comuníquese con administración.
              </p>
            </td>
          </tr>

        </table>

        <!-- Security / Sub-footer note -->
        <table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 16px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} MTS Logística. Desarrollado por Dibrand.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Builds the complete BrevoApiEmailPayload object.
   */
  public build(): BrevoApiEmailPayload {
    const toRecipients = normalizeRecipients(this._to.flat());
    if (toRecipients.length === 0) {
      throw new Error('EmailBuilder: Se debe especificar al menos un destinatario (to).');
    }

    if (!this._subject) {
      throw new Error('EmailBuilder: Se debe especificar un asunto (subject).');
    }

    const payload: BrevoApiEmailPayload = {
      to: toRecipients,
      subject: this._subject,
      htmlContent: this.buildHtml(),
      textContent: this.buildText(),
    };

    if (this._cc.length > 0) {
      const cc = normalizeRecipients(this._cc.flat());
      if (cc.length > 0) payload.cc = cc;
    }

    if (this._bcc.length > 0) {
      const bcc = normalizeRecipients(this._bcc.flat());
      if (bcc.length > 0) payload.bcc = bcc;
    }

    if (this._sender) {
      payload.sender = { email: this._sender.email, name: this._sender.name };
    }

    if (this._replyTo) {
      payload.replyTo = { email: this._replyTo.email, name: this._replyTo.name };
    }

    if (this._attachments.length > 0) {
      payload.attachment = normalizeAttachments(this._attachments);
    }

    if (this._tags.length > 0) {
      payload.tags = this._tags;
    }

    return payload;
  }

  /**
   * Builds and immediately sends the email using Brevo.
   */
  public async send(): Promise<BrevoSendResult> {
    const payload = this.build();
    return sendBrevoEmail(payload);
  }

  // --- Internal HTML Block Renderers ---

  private renderBlockHtml(block: ContentBlock): string {
    switch (block.type) {
      case 'badge': {
        const styles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
          info: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
          success: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
          warning: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
          danger: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
          neutral: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
        };
        const st = styles[block.variant] || styles.info;
        return `
          <div style="margin-bottom: 12px;">
            <span style="display: inline-block; background-color: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 9999px;">
              ${this.escapeHtml(block.text)}
            </span>
          </div>`;
      }

      case 'title':
        return `
          <div style="margin-bottom: 16px;">
            <h1 style="margin: 0 0 6px 0; color: #0f2547; font-size: 22px; font-weight: 800; line-height: 1.3;">
              ${this.escapeHtml(block.heading)}
            </h1>
            ${
              block.subtitle
                ? `<p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.4;">${this.escapeHtml(block.subtitle)}</p>`
                : ''
            }
          </div>`;

      case 'paragraph':
        return `
          <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: ${block.muted ? '#64748b' : '#334155'};">
            ${this.escapeHtml(block.text)}
          </p>`;

      case 'callout': {
        const variants: Record<CalloutVariant, { bg: string; border: string; text: string; titleCol: string }> = {
          info: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1', titleCol: '#0284c7' },
          success: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', titleCol: '#16a34a' },
          warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', titleCol: '#d97706' },
          danger: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', titleCol: '#dc2626' },
        };
        const cfg = variants[block.variant] || variants.info;
        return `
          <div style="margin: 16px 0; padding: 14px 18px; background-color: ${cfg.bg}; border-left: 4px solid ${cfg.border}; border-radius: 6px;">
            ${
              block.title
                ? `<div style="font-size: 13px; font-weight: 700; color: ${cfg.titleCol}; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${this.escapeHtml(block.title)}</div>`
                : ''
            }
            <div style="font-size: 13px; line-height: 1.5; color: ${cfg.text};">
              ${this.escapeHtml(block.message)}
            </div>
          </div>`;
      }

      case 'summary':
        return `
          <div style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              ${block.items
                .map(
                  (item, idx) => `
                <tr style="${idx > 0 ? 'border-top: 1px solid #e2e8f0;' : ''} ${item.highlight ? 'background-color: #f0f9ff;' : ''}">
                  <td style="padding: 10px 16px; font-size: 13px; color: #64748b; font-weight: 500; width: 40%; vertical-align: top;">
                    ${this.escapeHtml(item.label)}
                  </td>
                  <td align="right" style="padding: 10px 16px; font-size: 13px; color: ${item.highlight ? '#0369a1' : '#0f172a'}; font-weight: ${item.highlight ? '700' : '600'}; width: 60%; vertical-align: top;">
                    ${this.escapeHtml(String(item.value))}
                  </td>
                </tr>`
                )
                .join('')}
            </table>
          </div>`;

      case 'table':
        return `
          <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px;">
              <thead>
                <tr style="background-color: #0f2547; color: #ffffff;">
                  ${block.headers
                    .map(
                      (h) => `
                    <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${this.escapeHtml(h)}
                    </th>`
                    )
                    .join('')}
                </tr>
              </thead>
              <tbody>
                ${block.rows
                  .map(
                    (row, rIdx) => `
                  <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    ${row
                      .map(
                        (cell) => `
                      <td style="padding: 9px 14px; color: #334155;">
                        ${this.escapeHtml(String(cell))}
                      </td>`
                      )
                      .join('')}
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`;

      case 'button': {
        const btnStyles: Record<ButtonVariant, { bg: string; text: string; hover: string }> = {
          primary: { bg: '#0ea5e9', text: '#ffffff', hover: '#0284c7' },
          secondary: { bg: '#f1f5f9', text: '#0f2547', hover: '#e2e8f0' },
          dark: { bg: '#0f2547', text: '#ffffff', hover: '#1e3a8a' },
        };
        const bStyle = btnStyles[block.variant] || btnStyles.primary;
        return `
          <div style="margin: 24px 0 16px 0; text-align: center;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${block.url}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="14%" stroke="f" fillcolor="${bStyle.bg}">
              <w:anchorlock/>
              <center style="color:${bStyle.text};font-family:sans-serif;font-size:14px;font-weight:bold;">${this.escapeHtml(block.label)}</center>
            </v:roundrect>
            <![endif]-->
            <a href="${block.url}" target="_blank" style="mso-hide:all; display: inline-block; background-color: ${bStyle.bg}; color: ${bStyle.text}; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); text-align: center;">
              ${this.escapeHtml(block.label)}
            </a>
          </div>`;
      }

      case 'divider':
        return `<div style="margin: 24px 0; border-top: 1px solid #e2e8f0;"></div>`;

      case 'rawHtml':
        return block.html;

      default:
        return '';
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

