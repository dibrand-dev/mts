import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendGenericNotification,
  sendInvoiceReminderEmail,
  sendProformaEmail,
} from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication via Supabase session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // In local development, allow calls if authenticated or if explicitly testing
    if (authError || !user) {
      // If there's an internal service header or auth bearer token, check here
      const authHeader = request.headers.get('authorization');
      const expectedSecret = process.env.INTERNAL_API_SECRET;

      if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
        return NextResponse.json(
          { success: false, error: 'No autorizado. Se requiere sesión activa de usuario.' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'El campo "type" es obligatorio (custom, proforma, invoice_reminder).' },
        { status: 400 }
      );
    }

    // 2. Dispatch according to email type
    if (type === 'proforma') {
      const { clientName, clientEmail, proformaNumber, fortnightPeriod, conceptType, subtotal, total, dueDate, publicUrl } = body;

      if (!clientEmail || !proformaNumber || !total) {
        return NextResponse.json(
          { success: false, error: 'Faltan campos obligatorios para el envío de proforma.' },
          { status: 400 }
        );
      }

      const result = await sendProformaEmail({
        clientName: clientName || 'Estimado Cliente',
        clientEmail,
        proformaNumber,
        fortnightPeriod: fortnightPeriod || 'Actual',
        conceptType: conceptType || 'general_hours',
        subtotal: Number(subtotal) || Number(total),
        total: Number(total),
        dueDate: dueDate || 'A coordinar',
        publicUrl,
      });

      return NextResponse.json(result);
    }

    if (type === 'invoice_reminder') {
      const { clientName, clientEmail, invoiceNumber, proformaNumber, invoicedAmount, dueDate, daysRemainingOrOverdue, paymentDetails, publicUrl } = body;

      if (!clientEmail || !invoiceNumber || invoicedAmount === undefined) {
        return NextResponse.json(
          { success: false, error: 'Faltan campos obligatorios para el recordatorio de cobro.' },
          { status: 400 }
        );
      }

      const result = await sendInvoiceReminderEmail({
        clientName: clientName || 'Estimado Cliente',
        clientEmail,
        invoiceNumber,
        proformaNumber,
        invoicedAmount: Number(invoicedAmount),
        dueDate: dueDate || 'Vencida',
        daysRemainingOrOverdue: Number(daysRemainingOrOverdue) || 0,
        paymentDetails,
        publicUrl,
      });

      return NextResponse.json(result);
    }

    if (type === 'custom') {
      const { to, subject, title, subtitle, message, badgeText, badgeVariant, calloutMessage, calloutVariant, actionLabel, actionUrl, summaryItems, tags } = body;

      if (!to || !subject || !message) {
        return NextResponse.json(
          { success: false, error: 'Campos requeridos para custom: to, subject, message.' },
          { status: 400 }
        );
      }

      const result = await sendGenericNotification({
        to,
        subject,
        title: title || subject,
        subtitle,
        message,
        badgeText,
        badgeVariant,
        calloutMessage,
        calloutVariant,
        actionLabel,
        actionUrl,
        summaryItems,
        tags,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: `Tipo de envío no reconocido: ${type}` },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno al procesar el envío de correo';
    console.error('[API /api/mail/send Error]', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

