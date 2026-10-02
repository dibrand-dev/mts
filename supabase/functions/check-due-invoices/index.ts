// Supabase Edge Function: check-due-invoices
// Triggered daily at 00:00 hs via pg_cron or Supabase Scheduled Functions.
// Forwards or executes the invoice due date review and sends automated reminder emails via Brevo.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const APP_URL = Deno.env.get('APP_URL') || Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://mtslogistica.vercel.app';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || Deno.env.get('INTERNAL_API_SECRET') || '';

serve(async (req: Request) => {
  try {
    const targetUrl = new URL('/api/cron/check-due-invoices', APP_URL);
    
    // Pass query parameters if received (e.g. date, cadence, dryRun)
    const reqUrl = new URL(req.url);
    for (const [key, value] of reqUrl.searchParams.entries()) {
      targetUrl.searchParams.set(key, value);
    }

    const response = await fetch(targetUrl.toString(), {
      method: req.method === 'POST' ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
      },
      body: req.method === 'POST' ? await req.text() : undefined,
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error executing edge function' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

