/**
 * scripts/check-due-invoices.ts
 * 
 * Script CLI para ejecutar el control nocturno de vencimientos de facturas.
 * Lee facturas "Pendiente", cruza con días de vencimiento del cliente y despacha emails vía Brevo.
 * 
 * Uso:
 *   npx tsx scripts/check-due-invoices.ts
 *   npx tsx scripts/check-due-invoices.ts --date=2026-10-16
 *   npx tsx scripts/check-due-invoices.ts --cadence=7
 *   npx tsx scripts/check-due-invoices.ts --dry-run
 *   npx tsx scripts/check-due-invoices.ts --mock-db --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { processPendingInvoiceReminders } from '../src/lib/services/invoice-reminders';

// Load environment variables without external dependencies
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  console.log('===============================================================');
  console.log(' MTS GESTIÓN LOGÍSTICA - CONTROL DE VENCIMIENTOS DE FACTURAS  ');
  console.log('===============================================================\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  let targetDate: string | undefined;
  let cadence: number | undefined;
  let dryRun = false;
  let mockDb = false;

  for (const arg of args) {
    if (arg.startsWith('--date=')) {
      targetDate = arg.split('=')[1];
    } else if (arg.startsWith('--cadence=')) {
      cadence = Number(arg.split('=')[1]);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--mock-db') {
      mockDb = true;
    }
  }

  let supabaseClient: any;
  if (mockDb) {
    console.log('🧪 Modo --mock-db activo: Utilizando datos simulados de facturas.');
    supabaseClient = {
      from: (table: string) => {
        if (table === 'master_variables') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { numeric_value: 3 } }),
                }),
              }),
            }),
          };
        }
        if (table === 'tax_invoices') {
          return {
            select: () => ({
              eq: async () => ({
                data: [
                  {
                    id: 'inv-mock-01',
                    invoice_number: 'FC-A-0001-00000042',
                    invoiced_amount: 5466694.70,
                    status: 'pending',
                    invoice_date: '2026-10-01',
                    last_reminder_sent_at: null,
                    last_reminder_type: null,
                    reminders_sent_count: 0,
                    proformas: {
                      id: 'prof-01',
                      proforma_number: 'PRF-2026-0042',
                      public_token: 'tok-mock-42',
                      clients: {
                        id: 'cli-01',
                        company_name: 'DELTA DOCK SA',
                        billing_email: 'administracion@deltadock.com.ar',
                        payment_due_days: 15,
                        overdue_reminder_cadence_days: 3,
                      },
                    },
                  },
                  {
                    id: 'inv-mock-02',
                    invoice_number: 'FC-A-0001-00000043',
                    invoiced_amount: 12500000.00,
                    status: 'pending',
                    invoice_date: '2026-09-15',
                    last_reminder_sent_at: null,
                    last_reminder_type: null,
                    reminders_sent_count: 0,
                    proformas: {
                      id: 'prof-02',
                      proforma_number: 'PRF-2026-0043',
                      public_token: 'tok-mock-43',
                      clients: {
                        id: 'cli-02',
                        company_name: 'CAT ARGENTINA SA',
                        billing_email: 'facturacion@catargentina.com.ar',
                        payment_due_days: 30,
                        overdue_reminder_cadence_days: 3,
                      },
                    },
                  },
                ],
                error: null,
              }),
            }),
            update: () => ({ eq: async () => ({ error: null }) }),
          };
        }
        return {
          insert: async () => ({ error: null }),
        };
      },
    };
  } else if (supabaseUrl && serviceRoleKey) {
    supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  console.log(`[Configuración]`);
  console.log(`- Fecha de evaluación: ${targetDate || 'Hoy (Argentina ART)'}`);
  console.log(`- Cadencia configurada: ${cadence ? `${cadence} días` : 'Por defecto de cliente/sistema (3 días)'}`);
  console.log(`- Modo: ${dryRun ? 'DRY-RUN (Simulación sin envíos)' : 'PRODUCCIÓN / REAL'}\n`);

  try {
    const summary = await processPendingInvoiceReminders({
      targetDate,
      cadenceDays: cadence,
      dryRun,
      supabaseClient,
    });

    console.log('\n---------------------------------------------------------------');
    console.log(`RESULTADO DE LA EVALUACIÓN (${summary.targetDate}):`);
    console.log(`- Facturas pendientes analizadas: ${summary.totalPendingEvaluated}`);
    console.log(`- Notificaciones disparadas:      ${summary.sentCount}`);
    console.log(`- Omitidas (no requiere acción):  ${summary.skippedCount}`);
    console.log(`- Errores detectados:            ${summary.errorCount}`);
    console.log('---------------------------------------------------------------\n');

    if (summary.details.length > 0) {
      console.log('Detalle por factura:');
      summary.details.forEach((d, idx) => {
        const statusIcon = d.action === 'sent' ? '📧' : d.action === 'mocked' ? '🧪' : d.action === 'dry_run' ? '🔍' : d.action === 'skipped' ? '⏭️' : '❌';
        console.log(`  ${idx + 1}. [${statusIcon} ${d.action.toUpperCase()}] Factura: ${d.invoiceNumber} | Cliente: ${d.clientName} ($${d.invoicedAmount})`);
        console.log(`     Emisión: ${d.invoiceDate} | Vence: ${d.dueDate} (Días: ${d.daysDifference >= 0 ? `+${d.daysDifference}` : d.daysDifference})`);
        console.log(`     Motivo: ${d.reason}`);
        if (d.error) console.log(`     Error: ${d.error}`);
      });
    }

    console.log('\n===============================================================');
    console.log(' PROCESO FINALIZADO EXITOSAMENTE');
    console.log('===============================================================');
  } catch (error: any) {
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      console.error('\n⚠️ AVISO: El servidor local de base de datos Supabase no se encuentra activo (ECONNREFUSED).');
      console.error('💡 Para probar el script en modo de desarrollo sin base de datos activa, agregue la bandera --mock-db:');
      console.error('   pnpm run cron:invoices -- --mock-db --dry-run\n');
    } else {
      console.error('\n❌ ERROR EN LA EJECUCIÓN:', error.message || error);
    }
    process.exit(1);
  }
}

main();
