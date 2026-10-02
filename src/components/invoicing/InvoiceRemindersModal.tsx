'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { InvoiceReminderDetail, ProcessRemindersSummary } from '@/lib/services/invoice-reminders';

interface InvoiceRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InvoiceRemindersModal({ isOpen, onClose, onSuccess }: InvoiceRemindersModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationDate, setSimulationDate] = useState('');
  const [cadenceOverride, setCadenceOverride] = useState('');
  const [isDryRun, setIsDryRun] = useState(false);
  const [runResult, setRunResult] = useState<ProcessRemindersSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteCheck = async (dry: boolean) => {
    setIsRunning(true);
    setError(null);
    setIsDryRun(dry);

    try {
      const params = new URLSearchParams();
      if (simulationDate) params.set('date', simulationDate);
      if (cadenceOverride) params.set('cadence', cadenceOverride);
      if (dry) params.set('dryRun', 'true');

      const res = await fetch(`/api/cron/check-due-invoices?${params.toString()}`, {
        method: 'GET',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo al ejecutar el control de vencimientos');
      }

      setRunResult(data);
      if (onSuccess && !dry) {
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 bg-[#0F2547] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Control Automático de Vencimientos</h2>
              <p className="text-xs text-sky-200">
                Cron nocturno (00:00 hs) y disparador inteligente de cobranzas vía Brevo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Status Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0EA5E9] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-[#0F2547]">
                Programación Activa: Cron Job Nocturno (00:00 hs ART / 03:00 UTC)
              </p>
              <p className="text-slate-600 leading-relaxed">
                El sistema evalúa diariamente todas las facturas en estado <span className="font-semibold text-amber-700">Pendiente</span>, cruzando la fecha de emisión con el plazo comercial en días de cada cliente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                <div className="bg-white p-2 rounded border border-sky-100 font-medium text-slate-700">
                  <span className="text-amber-600 font-bold">● -3 Días:</span> Aviso de Próximo Vencimiento
                </div>
                <div className="bg-white p-2 rounded border border-sky-100 font-medium text-slate-700">
                  <span className="text-amber-700 font-bold">● Día 0 (Hoy):</span> Vencimiento en la fecha
                </div>
                <div className="bg-white p-2 rounded border border-sky-100 font-medium text-slate-700">
                  <span className="text-rose-600 font-bold">● Vencidas:</span> Aviso de Factura Vencida (cada 3/7 días)
                </div>
              </div>
            </div>
          </div>

          {/* Manual Run Controls */}
          <div className="bg-[#0EA5E9] rounded-xl p-4 sm:p-5 text-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Ejecución Manual / Simulación de Fecha</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">Vercel & Supabase Ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Simular Fecha (Opcional)</label>
                <div className="relative">
                  <input
                    type="date"
                    value={simulationDate}
                    onChange={(e) => setSimulationDate(e.target.value)}
                    className="w-full bg-white text-[#0F2547] text-xs font-medium rounded-lg px-3 py-2 border border-[#0F2547] focus:ring-2 focus:ring-sky-300 outline-none"
                    placeholder="Hoy por defecto"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Cadencia Vencidas (Días)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={cadenceOverride}
                  onChange={(e) => setCadenceOverride(e.target.value)}
                  placeholder="Por defecto: 3 días (o cliente)"
                  className="w-full bg-white text-[#0F2547] text-xs font-medium rounded-lg px-3 py-2 border border-[#0F2547] focus:ring-2 focus:ring-sky-300 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => handleExecuteCheck(true)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Simular (DRY-RUN)</span>
              </button>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => handleExecuteCheck(false)}
                className="bg-[#0F2547] hover:bg-[#001737] text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isRunning ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Ejecutar Control y Disparar Correos</span>
              </button>

              {simulationDate && (
                <button
                  type="button"
                  onClick={() => setSimulationDate('')}
                  className="text-xs text-white/80 hover:text-white underline ml-auto cursor-pointer"
                >
                  Restablecer fecha a hoy
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Summary */}
          {runResult && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#0F2547] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Resultado de la Ejecución ({runResult.targetDate})</span>
                </h3>
                {runResult.dryRun && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Modo Simulación (DRY-RUN)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-500 block">Analizadas</span>
                  <span className="text-xl font-bold font-mono text-[#0F2547]">{runResult.totalPendingEvaluated}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-emerald-700 block">Disparadas</span>
                  <span className="text-xl font-bold font-mono text-emerald-700">{runResult.sentCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-slate-500 block">Omitidas</span>
                  <span className="text-xl font-bold font-mono text-slate-600">{runResult.skippedCount}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <span className="text-xs text-rose-700 block">Errores</span>
                  <span className="text-xl font-bold font-mono text-rose-700">{runResult.errorCount}</span>
                </div>
              </div>

              {/* Items Detail List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {runResult.details.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    No se registraron facturas pendientes de evaluación.
                  </p>
                ) : (
                  runResult.details.map((item, idx) => (
                    <div
                      key={item.invoiceId || idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F2547] font-mono">{item.invoiceNumber}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-700">{item.clientName}</span>
                          <span className="font-mono text-slate-500 text-[11px]">(${item.invoicedAmount.toLocaleString('es-AR')})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Emisión: {item.invoiceDate} • Vencimiento: <strong className="text-slate-700">{item.dueDate}</strong> ({item.daysDifference >= 0 ? `+${item.daysDifference}` : item.daysDifference} días)
                        </p>
                        <p className="text-[11px] text-slate-600 italic">
                          {item.reason}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {item.action === 'sent' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Enviado Brevo
                          </span>
                        )}
                        {item.action === 'mocked' && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                            Simulado (Mock)
                          </span>
                        )}
                        {item.action === 'dry_run' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Disparo Positivo
                          </span>
                        )}
                        {item.action === 'skipped' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                            Omitido
                          </span>
                        )}
                        {item.action === 'failed' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Error
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

