import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processPendingInvoiceReminders } from '@/lib/services/invoice-reminders';

/**
 * Validates request authorization against Vercel CRON_SECRET, INTERNAL_API_SECRET,
 * or an authenticated admin session in Supabase.
 */
async function authorizeRequest(request: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const internalSecret = process.env.INTERNAL_API_SECRET;

  // 1. Check Bearer CRON_SECRET (Official Vercel Cron Header)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true };
  }

  // 2. Check Bearer INTERNAL_API_SECRET
  if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
    return { authorized: true };
  }

  // 3. Check query param secret (?secret=...)
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  if (cronSecret && querySecret === cronSecret) {
    return { authorized: true };
  }
  if (internalSecret && querySecret === internalSecret) {
    return { authorized: true };
  }

  // 4. Check active authenticated session with admin role
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: profile } = (await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()) as { data: { role?: string } | null };

      if (profile?.role === 'admin') {
        return { authorized: true };
      }
    }
  } catch {
    // Session check fallback
  }

  // 5. Allow in local development when no secrets are set yet
  if (process.env.NODE_ENV === 'development' && !cronSecret && !internalSecret) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: 'No autorizado. Se requiere header Authorization con Bearer CRON_SECRET o sesión de Administrador.',
  };
}

/**
 * GET Handler: Standard Vercel Cron Job Trigger (00:00 hs / 03:00 UTC)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || undefined;
    const cadenceParam = searchParams.get('cadence') ? Number(searchParams.get('cadence')) : undefined;
    const dryRunParam = searchParams.get('dryRun') === 'true' || searchParams.get('dryRun') === '1';

    const summary = await processPendingInvoiceReminders({
      targetDate: dateParam,
      cadenceDays: cadenceParam,
      dryRun: dryRunParam,
    });

    return NextResponse.json({
      success: true,
      message: `Control de vencimientos ejecutado exitosamente para la fecha ${summary.targetDate}.`,
      ...summary,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno al procesar vencimientos de facturas';
    console.error('[API /api/cron/check-due-invoices GET Error]', error);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

/**
 * POST Handler: For manual triggers, webhook calls, or Supabase Edge Functions / pg_net
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.reason }, { status: 401 });
    }

    let bodyData: any = {};
    try {
      bodyData = await request.json();
    } catch {
      // Empty or non-JSON body is acceptable
    }

    const { searchParams } = new URL(request.url);
    const targetDate = bodyData.date || searchParams.get('date') || undefined;
    const cadenceDays = bodyData.cadence || (searchParams.get('cadence') ? Number(searchParams.get('cadence')) : undefined);
    const dryRun = bodyData.dryRun ?? (searchParams.get('dryRun') === 'true' || searchParams.get('dryRun') === '1');

    const summary = await processPendingInvoiceReminders({
      targetDate,
      cadenceDays,
      dryRun,
    });

    return NextResponse.json({
      success: true,
      message: `Control de vencimientos ejecutado exitosamente para la fecha ${summary.targetDate}.`,
      ...summary,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Error interno al procesar vencimientos de facturas';
    console.error('[API /api/cron/check-due-invoices POST Error]', error);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

