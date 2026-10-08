'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  Mail,
  Calendar,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
  Sparkles,
  Search,
  Receipt,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  getTodayArgentina,
  calculateInvoiceDueDate,
  calculateDaysDifference,
  evaluateInvoiceReminderStatus,
} from '@/lib/services/invoice-reminders';
import { InvoiceRemindersModal } from '@/components/invoicing/InvoiceRemindersModal';

interface EvaluatedInvoiceRow {
  id: string;
  invoice_number: string;
  invoiced_amount: number;
  invoice_date: string;
  last_reminder_sent_at: string | null;
  last_reminder_type: string | null;
  reminders_sent_count: number;
  proforma_id: string;
  proforma_number: string;
  public_token: string;
  client_id: string;
  client_name: string;
  client_email: string;
  payment_due_days: number;
  overdue_cadence_days: number;
  calculated_due_date: string;
  days_difference: number;
  is_upcoming_3_days: boolean;
  is_due_today: boolean;
  is_overdue: boolean;
  should_send_today: boolean;
  status_category: 'upcoming' | 'today' | 'overdue' | 'future';
  badge_text: string;
  reason: string;
}

interface ReminderLogItem {
  id: string;
  invoice_number: string;
  client_name: string;
  reminder_type: string;
  days_difference: number;
  recipient_email: string;
  sent_date: string;
  sent_at: string;
  status: string;
  brevo_message_id: string | null;
}

export default function DueRemindersPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<EvaluatedInvoiceRow[]>([]);
  const [logs, setLogs] = useState<ReminderLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'today' | 'overdue' | 'future'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayDate] = useState(() => getTodayArgentina());

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient() as any;

      // 1. Fetch pending invoices with proformas and clients
      const { data: invData, error: invError } = await supabase
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
          proformas (
            id,
            proforma_number,
            public_token,
            clients (
              id,
              company_name,
              billing_email,
              payment_due_days,
              overdue_reminder_cadence_days
            )
          )
        `)
        .eq('status', 'pending')
        .order('invoice_date', { ascending: true });

      if (invError) {
        console.error('Error fetching invoices:', invError);
      } else {
        const rows: EvaluatedInvoiceRow[] = (invData || []).map((inv: any) => {
          const proforma = Array.isArray(inv.proformas) ? inv.proformas[0] : inv.proformas;
          const client = proforma?.clients
            ? (Array.isArray(proforma.clients) ? proforma.clients[0] : proforma.clients)
            : null;

          const paymentDueDays = Number(client?.payment_due_days) || 15;
          const overdueCadence = Number(client?.overdue_reminder_cadence_days) || 3;
          const dueDate = calculateInvoiceDueDate(inv.invoice_date, paymentDueDays);
          const daysDiff = calculateDaysDifference(todayDate, dueDate);

          const lastSentDate = inv.last_reminder_sent_at ? inv.last_reminder_sent_at.split('T')[0] : null;
          const evaluation = evaluateInvoiceReminderStatus({
            invoiceDate: inv.invoice_date,
            paymentDueDays,
            targetDate: todayDate,
            cadenceDays: overdueCadence,
            lastReminderSentDate: lastSentDate,
            lastReminderType: inv.last_reminder_type,
          });

          let statusCategory: 'upcoming' | 'today' | 'overdue' | 'future' = 'future';
          if (daysDiff === -3) statusCategory = 'upcoming';
          else if (daysDiff === 0) statusCategory = 'today';
          else if (daysDiff > 0) statusCategory = 'overdue';

          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoiced_amount: Number(inv.invoiced_amount || 0),
            invoice_date: inv.invoice_date,
            last_reminder_sent_at: inv.last_reminder_sent_at,
            last_reminder_type: inv.last_reminder_type,
            reminders_sent_count: Number(inv.reminders_sent_count || 0),
            proforma_id: proforma?.id || '',
            proforma_number: proforma?.proforma_number || '',
            public_token: proforma?.public_token || '',
            client_id: client?.id || '',
            client_name: client?.company_name || 'Sin Cliente',
            client_email: client?.billing_email || '',
            payment_due_days: paymentDueDays,
            overdue_cadence_days: overdueCadence,
            calculated_due_date: dueDate,
            days_difference: daysDiff,
            is_upcoming_3_days: daysDiff === -3,
            is_due_today: daysDiff === 0,
            is_overdue: daysDiff > 0,
            should_send_today: evaluation.shouldSend,
            status_category: statusCategory,
            badge_text: evaluation.badgeText || (daysDiff > 0 ? `Vencida (+${daysDiff} d)` : daysDiff === 0 ? 'Vence hoy' : `Faltan ${-daysDiff} d`),
            reason: evaluation.reason,
          };
        });

        setInvoices(rows);
      }

      // 2. Fetch recent reminder logs
      const { data: logsData } = await supabase
        .from('invoice_reminder_logs')
        .select(`
          id,
          reminder_type,
          days_difference,
          recipient_email,
          sent_date,
          sent_at,
          status,
          brevo_message_id,
          tax_invoices (invoice_number),
          clients (company_name)
        `)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (logsData) {
        setLogs(
          logsData.map((l: any) => ({
            id: l.id,
            invoice_number: l.tax_invoices?.invoice_number || 'N/A',
            client_name: l.clients?.company_name || 'Cliente',
            reminder_type: l.reminder_type,
            days_difference: Number(l.days_difference || 0),
            recipient_email: l.recipient_email,
            sent_date: l.sent_date,
            sent_at: l.sent_at,
            status: l.status,
            brevo_message_id: l.brevo_message_id,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading due reminders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const matchSearch =
        item.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      return item.status_category === statusFilter;
    });
  }, [invoices, searchQuery, statusFilter]);

  // KPIs
  const totalPendingAmount = invoices.reduce((acc, cur) => acc + cur.invoiced_amount, 0);
  const countUpcoming = invoices.filter((i) => i.is_upcoming_3_days).length;
  const countToday = invoices.filter((i) => i.is_due_today).length;
  const countOverdue = invoices.filter((i) => i.is_overdue).length;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/invoicing" className="hover:text-[#1E5BB4] flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Facturación</span>
            </Link>
            <span>/</span>
            <span className="text-[#0B1C30]">Avisos de Cobranza</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30] flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-[#0EA5E9]" />
            <span>Control de Vencimientos y Cobranzas</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Seguimiento de plazos de pago por cliente y envío programado de recordatorios por correo electrónico.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Actualizar listado"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            data-testid="btn-abrir-control-vencimientos"
            className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            <span>Revisar y Enviar Recordatorios</span>
          </button>
        </div>
      </header>

      {/* Info Banner */}
      <section className="bg-gradient-to-r from-[#0F2547] to-[#1E5BB4] rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">Envío Automático: Todos los días a medianoche (00:00 hs)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                ACTIVO
              </span>
            </div>
            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed max-w-3xl">
              Cada noche el sistema revisa las facturas pendientes de cobro, calcula la fecha de vencimiento según los días acordados con cada cliente y envía los correos de aviso de forma automática, sin requerir acciones manuales.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/15 text-xs text-sky-100">
          <Calendar className="h-4 w-4 text-sky-300" />
          <span>Fecha de hoy: <strong>{todayDate}</strong></span>
        </div>
      </section>

      {/* KPIs Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendiente */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facturación a Cobrar</span>
            <div className="text-2xl font-bold font-mono text-[#0B1C30] mt-1">
              ${totalPendingAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{invoices.length} facturas pendientes</span>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
        </article>

        {/* Card 2: Por Vencer (3 Días) */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Por Vencer (en 3 Días)</span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {countUpcoming}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Aviso preventivo listo</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
        </article>

        {/* Card 3: Vence Hoy */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Vencen Hoy</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
              {countToday}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Fecha límite cumplida</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
        </article>

        {/* Card 4: Facturas Vencidas */}
        <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Facturas Vencidas</span>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
              {countOverdue}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pendientes de regularización</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
        </article>
      </section>

      {/* Filters Section */}
      <section className="bg-[#0EA5E9] rounded-xl p-4 sm:p-5 shadow-sm text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Filtrar Facturas</h2>
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-[#0B1C30]' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Todas ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'upcoming' ? 'bg-white text-[#0B1C30]' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Por vencer en 3 días ({countUpcoming})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'today' ? 'bg-white text-[#0B1C30]' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Vencen hoy ({countToday})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'overdue' ? 'bg-white text-[#0B1C30]' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              Vencidas ({countOverdue})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold">Buscar por número de factura, cliente o correo de contacto</label>
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ej: FC-A-0001, CAT ARGENTINA, cobranzas@..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-[#0B1C30] rounded-lg pl-9 pr-3 py-2 text-sm border border-[#0F2547] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </div>

          <div className="text-right flex items-center justify-end gap-2">
            <span className="text-xs text-white/90">
              Mostrando <strong>{filteredInvoices.length}</strong> de {invoices.length} facturas
            </span>
          </div>
        </div>
      </section>

      {/* Main Table: Invoices with Due Calculation */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0B1C30]">
            Facturas Pendientes y Plazos de Pago
          </h3>
          <span className="text-xs text-slate-500">
            Plazo de pago según acuerdo comercial con cada cliente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">N° Factura</th>
                <th className="py-3 px-5">Cliente y Correo de Contacto</th>
                <th className="py-3 px-5 text-center">Fecha Emisión</th>
                <th className="py-3 px-5 text-center">Plazo Acordado</th>
                <th className="py-3 px-5 text-center">Fecha Límite</th>
                <th className="py-3 px-5 text-right">Importe a Cobrar</th>
                <th className="py-3 px-5 text-center">Estado del Pago</th>
                <th className="py-3 px-5 text-center">Último Aviso Enviado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#1E5BB4] mb-2" />
                    Cargando facturas y verificando plazos de pago...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    No se encontraron facturas pendientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (inv.is_upcoming_3_days) {
                    badgeBg = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
                  } else if (inv.is_due_today) {
                    badgeBg = 'bg-amber-100 text-amber-800 border-amber-400 font-bold animate-pulse';
                  } else if (inv.is_overdue) {
                    badgeBg = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1E5BB4]">
                        <Link
                          href={`/proforma/${inv.public_token}`}
                          target="_blank"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{inv.invoice_number}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#0B1C30]">{inv.client_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{inv.client_email || 'Sin correo asignado'}</div>
                      </td>

                      <td className="py-3.5 px-5 text-center font-mono text-xs text-slate-600">
                        {inv.invoice_date}
                      </td>

                      <td className="py-3.5 px-5 text-center font-mono text-xs text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                          {inv.payment_due_days} días
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center font-mono text-xs font-bold text-[#0B1C30]">
                        {inv.calculated_due_date}
                      </td>

                      <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0B1C30]">
                        ${inv.invoiced_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${badgeBg}`}>
                          {inv.badge_text}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center text-xs text-slate-500">
                        {inv.last_reminder_sent_at ? (
                          <div className="font-mono text-[11px]">
                            {inv.last_reminder_sent_at.split('T')[0]}
                            <span className="block text-[10px] text-slate-400">
                              ({inv.reminders_sent_count} {inv.reminders_sent_count === 1 ? 'aviso enviado' : 'avisos enviados'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin envíos aún</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Log Section */}
      {logs.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0B1C30] flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#1E5BB4]" />
              <span>Historial Reciente de Avisos Enviados a Clientes</span>
            </h3>
            <span className="text-xs text-slate-500">Últimos {logs.length} avisos enviados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-5">Fecha y Hora</th>
                  <th className="py-2.5 px-5">N° Factura</th>
                  <th className="py-2.5 px-5">Cliente y Destinatario</th>
                  <th className="py-2.5 px-5 text-center">Motivo del Aviso</th>
                  <th className="py-2.5 px-5 text-center">Días al Vencimiento</th>
                  <th className="py-2.5 px-5 text-center">Resultado del Envío</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-5 font-mono text-slate-600">
                      {log.sent_at.split('T')[0]} {log.sent_at.split('T')[1]?.slice(0, 5)}
                    </td>
                    <td className="py-2.5 px-5 font-mono font-bold text-[#1E5BB4]">
                      {log.invoice_number}
                    </td>
                    <td className="py-2.5 px-5">
                      <span className="font-semibold text-slate-800">{log.client_name}</span>
                      <span className="block text-slate-500 text-[11px] font-mono">{log.recipient_email}</span>
                    </td>
                    <td className="py-2.5 px-5 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {log.reminder_type === 'upcoming_3_days' && 'Aviso preventivo (3 días antes)'}
                        {log.reminder_type === 'due_today' && 'Aviso de vencimiento hoy'}
                        {log.reminder_type === 'overdue' && 'Reclamo de factura vencida'}
                      </span>
                    </td>
                    <td className="py-2.5 px-5 text-center font-mono font-bold">
                      {log.days_difference === 0
                        ? 'Hoy'
                        : log.days_difference > 0
                        ? `+${log.days_difference} d`
                        : `${log.days_difference} d`}
                    </td>
                    <td className="py-2.5 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'mocked'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'sent' ? 'Enviado' : log.status === 'mocked' ? 'Prueba' : 'Error'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Control Modal */}
      <InvoiceRemindersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
