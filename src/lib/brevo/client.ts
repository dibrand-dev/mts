import {
  BrevoApiEmailPayload,
  BrevoApiRecipient,
  BrevoApiAttachment,
  BrevoSendResult,
  EmailAttachment,
  EmailContact,
  EmailRecipientInput,
} from './types';

const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Normalizes email recipient inputs into an array of BrevoApiRecipient.
 * Handles strings, comma-separated lists (e.g. 'a@b.com, c@d.com'), and objects.
 */
export function normalizeRecipients(input?: EmailRecipientInput): BrevoApiRecipient[] {
  if (!input) return [];

  const recipients: BrevoApiRecipient[] = [];

  const processItem = (item: string | EmailContact) => {
    if (typeof item === 'string') {
      // Split comma or semicolon separated emails
      const parts = item.split(/[,;]/);
      for (const raw of parts) {
        const trimmed = raw.trim();
        if (trimmed && trimmed.includes('@')) {
          recipients.push({ email: trimmed });
        }
      }
    } else if (item && typeof item === 'object' && item.email) {
      const email = item.email.trim();
      if (email && email.includes('@')) {
        recipients.push({
          email,
          ...(item.name ? { name: item.name.trim() } : {}),
        });
      }
    }
  };

  if (Array.isArray(input)) {
    input.forEach(processItem);
  } else {
    processItem(input);
  }

  // Deduplicate by lowercase email
  const seen = new Set<string>();
  return recipients.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Normalizes attachments for the Brevo v3 API payload.
 */
export function normalizeAttachments(attachments?: EmailAttachment[]): BrevoApiAttachment[] {
  if (!attachments || attachments.length === 0) return [];

  return attachments.map((att) => {
    const payload: BrevoApiAttachment = { name: att.name };
    if (att.content) {
      // Strip data uri prefix if present (e.g., 'data:application/pdf;base64,')
      payload.content = att.content.replace(/^data:.*?;base64,/, '');
    } else if (att.url) {
      payload.url = att.url;
    }
    return payload;
  });
}

/**
 * Sends a transactional email through Brevo's REST API v3.
 * Supports safe mock execution when BREVO_API_KEY is not configured in development.
 */
export async function sendBrevoEmail(payload: BrevoApiEmailPayload): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const defaultSenderEmail = process.env.BREVO_SENDER_EMAIL || 'facturacion@mtslogistica.com';
  const defaultSenderName = process.env.BREVO_SENDER_NAME || 'MTS Gestión Logística';

  // Ensure sender is populated
  const sender: BrevoApiRecipient = payload.sender?.email
    ? payload.sender
    : { email: defaultSenderEmail, name: defaultSenderName };

  const finalPayload: BrevoApiEmailPayload = {
    ...payload,
    sender,
  };

  // Safe development / mock mode if API key is missing
  if (!apiKey) {
    const toSummary = finalPayload.to.map((r) => r.email).join(', ');
    console.warn(
      `[Brevo Email Mock] BREVO_API_KEY no configurada. Simulando envío exitoso:\n` +
      `  Remitente: "${sender.name}" <${sender.email}>\n` +
      `  Para: ${toSummary}\n` +
      `  Asunto: "${finalPayload.subject}"\n` +
      `  Adjuntos: ${finalPayload.attachment?.length || 0}`
    );

    return {
      success: true,
      messageId: `<mock-${Date.now()}@mtslogistica.local>`,
      mocked: true,
    };
  }

  try {
    const response = await fetch(BREVO_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        responseData && typeof responseData === 'object' && 'message' in responseData
          ? String(responseData.message)
          : `Error HTTP ${response.status}: ${response.statusText}`;

      console.error('[Brevo Error]', {
        status: response.status,
        data: responseData,
      });

      return {
        success: false,
        error: errorMsg,
        details: responseData,
      };
    }

    const messageId =
      responseData && typeof responseData === 'object' && 'messageId' in responseData
        ? String(responseData.messageId)
        : undefined;

    return {
      success: true,
      messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido al conectar con Brevo';
    console.error('[Brevo Fetch Error]', err);
    return {
      success: false,
      error: errorMsg,
      details: err,
    };
  }
}

