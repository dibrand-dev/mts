'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Link2,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Ship,
  Calendar,
  Building2,
  Receipt,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { InvoicingRecord, downloadProformaCSV } from '@/lib/services/invoicing';
import { VesselViewer } from './viewers/VesselViewer';
import { FiscalYardViewer } from './viewers/FiscalYardViewer';
import { FixedDepositViewer } from './viewers/FixedDepositViewer';
import { SharedExpoViewer } from './viewers/SharedExpoViewer';
import { StandardViewer } from './viewers/StandardViewer';

interface Props {
  proforma: InvoicingRecord;
}

export function ProformaPublicView({ proforma }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadCSV = () => {
    downloadProformaCSV(proforma);
  };

  const proformaType = proforma.proforma_type || 'vessel';
  const invoiceNumberDisplay = proforma.invoice?.invoice_number || 'Pendiente de emisión';
  const datesDisplay = proforma.operation_dates || proforma.fortnight_period;

  const typeLabels: Record<string, { label: string; icon: string }> = {
    vessel: { label: 'Operativa Buque Automotores (Ro-Ro)', icon: '🚢' },
    fiscal_yard: { label: 'Plazoleta Fiscal Quincenal', icon: '🏗️' },
    fixed_deposit: { label: 'Abono Depósitos / Almacenes', icon: '🏢' },
    shared_expo: { label: 'Horas Coparticipadas (10%)', icon: '📊' },
    standard: { label: 'Servicios Directos y Operativos', icon: '📋' },
  };

  const currentTypeInfo = typeLabels[proformaType] || { label: proformaType, icon: '📄' };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0B1C30] pb-16 print:bg-white print:p-0 print:pb-0">
      {/* Top Navbar for Public Portal */}
      <header className="sticky top-0 z-30 bg-[#0B1C30] text-white border-b border-[#0F2547] shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-28 bg-white/10 rounded-md p-1 flex items-center justify-center">
              <Image
                src="/mts_logo.png"
                alt="MTS Logística"
                width={100}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Portal de Documentos Públicos
              </span>
              <span className="text-sm font-bold text-white">
                Liquidación de Servicios Portuarios
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={handleCopyLink}
              data-testid="public-btn-copy-link"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Copiar enlace directo a esta proforma"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              data-testid="public-btn-download-csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Descargar detalle completo en planilla CSV (Excel)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Descargar CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              data-testid="public-btn-download-pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1E5BB4] hover:bg-[#004392] text-white shadow-xs transition-colors cursor-pointer"
              title="Imprimir o Descargar como PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Descargar / Imprimir PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 print:p-0 print:pt-2">
        {/* Document Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs uppercase font-extrabold tracking-wider text-white bg-[#1E5BB4] px-3 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                  <span>{currentTypeInfo.icon}</span>
                  <span>{currentTypeInfo.label}</span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#0B1C30]">
                  PROFORMA N° {proforma.proforma_number}
                </h1>
                {proforma.status === 'paid' && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cobrada
                  </span>
                )}
                {proforma.status === 'invoiced' && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-300 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Facturada
                  </span>
                )}
                {proforma.status === 'approved' && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aprobada
                  </span>
                )}
                {proforma.status === 'sent' && (
                  <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full border border-sky-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Emitida / En Revisión
                  </span>
                )}
                {proforma.status === 'draft' && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Borrador
                  </span>
                )}
                {proforma.status === 'overdue' && (
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-300 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Vencida
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Documento comercial de pre-liquidación operativa emitido por MTS Servicios Portuarios.
              </p>
            </div>

            <div className="text-left md:text-right text-xs text-slate-500 space-y-0.5">
              <div>
                Emisión: <strong className="text-slate-800">{proforma.issue_date}</strong>
              </div>
              <div>
                Vencimiento para Observaciones: <strong className="text-rose-700">{proforma.due_date}</strong>
              </div>
            </div>
          </div>

          {/* 6 Key Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Building2 className="h-3 w-3 text-[#1E5BB4]" /> CLIENTE
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-1" title={proforma.client_name}>
                {proforma.client_name}
              </p>
              {proforma.client_tax_id && (
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                  CUIT: {proforma.client_tax_id}
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Ship className="h-3 w-3 text-[#1E5BB4]" /> OPERACIÓN
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#1E5BB4] truncate mt-1">
                {proforma.vessel_name || currentTypeInfo.label}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {proforma.fortnight_period}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#1E5BB4]" /> FECHAS
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-1">
                {datesDisplay}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Receipt className="h-3 w-3 text-[#1E5BB4]" /> NRO FACTURA AFIP
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#0B1C30] truncate mt-1">
                {invoiceNumberDisplay}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                FECHA FACTURA
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#0B1C30] truncate mt-1">
                {proforma.invoice?.invoice_date || proforma.issue_date}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                PLAZO REVISIÓN
              </span>
              <p className="text-xs sm:text-sm font-bold text-rose-700 truncate mt-1">
                5 días corridos
              </p>
              <span className="text-[10px] text-slate-500 block">Vence: {proforma.due_date}</span>
            </div>
          </div>
        </div>

        {/* Detailed Viewer Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
          <div className="pb-4 mb-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-[#0B1C30]">Desglose Operativo y Matemático</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculos determinados exclusivamente por horas de servicio auditadas y tarifas comerciales acordadas.
            </p>
          </div>

          <div className="min-h-[260px]">
            {proformaType === 'vessel' && <VesselViewer proforma={proforma} />}
            {proformaType === 'fiscal_yard' && <FiscalYardViewer proforma={proforma} />}
            {proformaType === 'fixed_deposit' && <FixedDepositViewer proforma={proforma} />}
            {proformaType === 'shared_expo' && <SharedExpoViewer proforma={proforma} />}
            {proformaType === 'standard' && <StandardViewer proforma={proforma} />}
            {!['vessel', 'fiscal_yard', 'fixed_deposit', 'shared_expo', 'standard'].includes(proformaType) && (
              <StandardViewer proforma={proforma} />
            )}
          </div>
        </div>

        {/* Final Settlement Navy Banner */}
        <div className="bg-[#0B1C30] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#0F2547] print:bg-white print:text-black print:border-2 print:border-black print:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-700 print:divide-slate-300">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 print:text-slate-600 uppercase tracking-wider block">
                Total Neto Factura
              </span>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-white print:text-black">
                $ {Number(proforma.total_neto || proforma.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400 print:text-slate-600 block">
                Suma de conceptos operativos netos bonificados
              </span>
            </div>

            <div className="space-y-1 pt-4 md:pt-0 md:pl-8">
              <span className="text-xs font-semibold text-sky-400 print:text-slate-800 uppercase tracking-wider block">
                IVA (21.00%)
              </span>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-sky-200 print:text-black">
                $ {Number(proforma.tax_amount || proforma.subtotal * 0.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400 print:text-slate-600 block">
                Alícuota general de valor agregado
              </span>
            </div>

            <div className="space-y-1 pt-4 md:pt-0 md:pl-8">
              <span className="text-xs font-extrabold text-amber-400 print:text-slate-900 uppercase tracking-wider block">
                TOTAL FACTURA FINAL
              </span>
              <p className="text-3xl sm:text-4xl font-mono font-extrabold text-amber-300 print:text-black">
                $ {Number(proforma.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-300 print:text-slate-700 block">
                Moneda de facturación: Pesos Argentinos (ARS)
              </span>
            </div>
          </div>
        </div>

        {/* Operational & Legal Notices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 print:border-slate-300">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <ShieldCheck className="h-4 w-4 text-[#1E5BB4]" />
            <span>Condiciones Operativas y Procedimiento de Conformidad</span>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              • <strong>Plazo de Observación:</strong> Conforme a las normativas comerciales de MTS Servicios Portuarios, el cliente dispone de <strong>5 (cinco) días corridos</strong> desde la fecha de recepción de la presente proforma para formular consultas u observaciones fundadas sobre los turnos e importes consignados.
            </p>
            <p>
              • <strong>Aprobación Tácita:</strong> Vencido dicho plazo sin que se hayan interpuesto observaciones, la proforma se considerará firme y aprobada automáticamente, procediéndose a la emisión de la Factura Fiscal correspondiente ante la AFIP/ARCA.
            </p>
            {proforma.notes && proforma.notes.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <strong className="block text-slate-700 mb-1">Notas específicas de la liquidación:</strong>
                <ul className="list-disc pl-5 space-y-1">
                  {proforma.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Contact and Direct Downloads Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-100 rounded-xl text-xs text-slate-600 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">MTS Servicios Portuarios y Terminales:</span>
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-[#1E5BB4]" /> facturacion@mtslogistica.com.ar
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-[#1E5BB4]" /> (+54 11) 5219-0000
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-[#1E5BB4] hover:text-[#004392] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Descargar PDF
            </button>
            <span>•</span>
            <button
              onClick={handleDownloadCSV}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Descargar CSV
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400 no-print">
        © {new Date().getFullYear()} MTS Logística Portuaria. Todos los derechos reservados.
      </footer>
    </div>
  );
}
