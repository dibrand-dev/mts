'use client';

import {
  X,
  Check,
  FileText,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  Ship,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';
import { VesselViewer } from './viewers/VesselViewer';
import { FiscalYardViewer } from './viewers/FiscalYardViewer';
import { FixedDepositViewer } from './viewers/FixedDepositViewer';
import { SharedExpoViewer } from './viewers/SharedExpoViewer';
import { StandardViewer } from './viewers/StandardViewer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proforma: InvoicingRecord | null;
  onStatusChange: (record: InvoicingRecord, status: InvoicingRecord['status']) => void;
  onInvoiceClick: (record: InvoicingRecord) => void;
}

export function ProformaDetailModal({
  isOpen,
  onClose,
  proforma,
  onStatusChange,
  onInvoiceClick,
}: Props) {
  if (!isOpen || !proforma) return null;

  const proformaType = proforma.proforma_type || 'vessel';
  const invoiceNumberDisplay = proforma.invoice?.invoice_number || 'A DEFINIR';
  const invoiceDateDisplay = proforma.invoice?.invoice_date || proforma.issue_date;
  const datesDisplay = proforma.operation_dates || proforma.fortnight_period;

  const typeLabels: Record<string, { label: string; icon: string }> = {
    vessel: { label: 'Buque Automotores (Ro-Ro)', icon: '🚢' },
    fiscal_yard: { label: 'Plazoleta Fiscal Quincenal', icon: '🏗️' },
    fixed_deposit: { label: 'Abono Depósitos / Almacenes', icon: '🏢' },
    shared_expo: { label: 'Horas Coparticipadas (10%)', icon: '📊' },
    standard: { label: 'Servicios Directos', icon: '📋' },
  };

  const currentTypeInfo = typeLabels[proformaType] || { label: proformaType, icon: '📄' };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-5 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase font-extrabold tracking-widest text-white bg-[#1E5BB4] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <span>{currentTypeInfo.icon}</span>
                <span>{currentTypeInfo.label}</span>
              </span>
              <span className="text-lg font-bold font-mono text-[#0B1C30]">
                {proforma.proforma_number}
              </span>
              {proforma.status === 'approved' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprobada
                </span>
              )}
              {proforma.status === 'invoiced' && (
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Facturada
                </span>
              )}
              {proforma.status === 'draft' && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Borrador
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Liquidación comercial generada exclusivamente a partir de horarios previamente aprobados en Carga Diaria.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {proforma.status !== 'approved' && proforma.status !== 'invoiced' && proforma.status !== 'paid' && (
              <button
                type="button"
                onClick={() => onStatusChange(proforma, 'approved')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Aprobar proforma comercial"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Aprobar Proforma</span>
              </button>
            )}
            {!proforma.invoice && (
              <button
                type="button"
                onClick={() => onInvoiceClick(proforma)}
                className="px-3.5 py-2 bg-[#1E5BB4] hover:bg-[#004392] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Emitir Factura</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              title="Imprimir Proforma"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 6 Key Proforma Header Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CLIENTE</span>
            <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-0.5" title={proforma.client_name}>
              {proforma.client_name}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Ship className="h-3 w-3 text-[#1E5BB4]" /> OPERACIÓN
            </span>
            <p className="text-xs sm:text-sm font-bold text-[#1E5BB4] truncate mt-0.5">
              {proforma.vessel_name || currentTypeInfo.label}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#1E5BB4]" /> FECHAS
            </span>
            <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-0.5">
              {datesDisplay}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">NRO FACTURA</span>
            <p className="text-xs sm:text-sm font-mono font-bold text-[#0B1C30] truncate mt-0.5">
              {invoiceNumberDisplay}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">FECHA FACTURA</span>
            <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-0.5">
              {invoiceDateDisplay}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">VENCIMIENTO</span>
            <p className="text-xs sm:text-sm font-bold text-rose-700 truncate mt-0.5">
              {proforma.due_date}
            </p>
          </div>
        </div>

        {/* Polymorphic Viewer Body */}
        <div className="min-h-[250px]">
          {proformaType === 'vessel' && <VesselViewer proforma={proforma} />}
          {proformaType === 'fiscal_yard' && <FiscalYardViewer proforma={proforma} />}
          {proformaType === 'fixed_deposit' && <FixedDepositViewer proforma={proforma} />}
          {proformaType === 'shared_expo' && <SharedExpoViewer proforma={proforma} />}
          {proformaType === 'standard' && <StandardViewer proforma={proforma} />}
          {!['vessel', 'fiscal_yard', 'fixed_deposit', 'shared_expo', 'standard'].includes(proformaType) && (
            <StandardViewer proforma={proforma} />
          )}
        </div>

        {/* Liquidación Final Banner (Navy Blue Box) */}
        <div className="bg-[#0B1C30] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-[#0F2547]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Neto Factura
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                $ {Number(proforma.total_neto || proforma.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 block">Suma de conceptos netos bonificados</span>
            </div>

            <div className="space-y-1 pt-3 md:pt-0 md:pl-6">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                IVA (21.00%)
              </span>
              <p className="text-xl sm:text-2xl font-mono font-bold text-sky-200">
                $ {Number(proforma.tax_amount || proforma.subtotal * 0.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 block">Alícuota general de ley</span>
            </div>

            <div className="space-y-1 pt-3 md:pt-0 md:pl-6">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                TOTAL FACTURA FINAL
              </span>
              <p className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-300">
                $ {Number(proforma.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-300 block">Importe total en pesos ARS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

