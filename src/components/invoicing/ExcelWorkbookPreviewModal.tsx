'use client';

import { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Layers,
} from 'lucide-react';
import {
  InvoicingRecord,
  ProformaCalculationResult,
  buildProformaWorkbook,
  downloadProformaExcel,
  ExcelCell,
} from '@/lib/services/invoicing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  source: InvoicingRecord | ProformaCalculationResult | null;
  meta?: { issueDate?: string; dueDate?: string; invoiceNumber?: string };
}

function getColumnLetter(idx: number): string {
  let letter = '';
  let n = idx;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

function formatCellValue(cell: ExcelCell | null): string {
  if (!cell || cell.value === undefined || cell.value === null) return '';
  if (typeof cell.value === 'number') {
    if (cell.style?.includes('currency')) {
      return `$ ${cell.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (cell.value % 1 !== 0) {
      return cell.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return cell.value.toLocaleString('es-AR');
  }
  return String(cell.value);
}

function getCellClass(cell: ExcelCell | null): string {
  if (!cell) return 'text-slate-700 bg-white';
  switch (cell.style) {
    case 'header':
      return 'bg-[#0F2547] text-white font-bold uppercase tracking-wider text-[11px]';
    case 'subheader':
      return 'bg-sky-100 text-[#0B1C30] font-bold text-xs';
    case 'total_label':
      return 'bg-[#1E5BB4] text-white font-extrabold uppercase text-xs';
    case 'total_currency':
      return 'bg-[#1E5BB4] text-white font-mono font-extrabold text-right text-xs';
    case 'highlight_label':
      return 'bg-amber-100 text-amber-950 font-bold text-xs';
    case 'highlight_currency':
      return 'bg-amber-100 text-amber-950 font-mono font-bold text-right text-xs';
    case 'currency':
      return 'bg-white text-[#0B1C30] font-mono font-medium text-right text-xs';
    case 'number':
      return 'bg-white text-[#0B1C30] font-mono font-bold text-right text-xs';
    case 'center':
      return 'bg-white text-slate-700 font-mono text-center text-xs';
    case 'note':
      return 'bg-amber-50/60 text-slate-600 italic font-semibold text-[11px]';
    default:
      return 'bg-white text-slate-800 font-medium text-xs';
  }
}

export function ExcelWorkbookPreviewModal({ isOpen, onClose, source, meta }: Props) {
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);

  if (!isOpen || !source) return null;

  const workbook = buildProformaWorkbook(source, meta);
  const currentSheet = workbook.sheets[activeSheetIdx] || workbook.sheets[0];
  const maxCols = Math.max(
    currentSheet.colWidths.length,
    ...currentSheet.rows.map((r) => (r ? r.length : 0)),
    6
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-[98vw] max-w-[1600px] h-[92vh] flex flex-col shadow-2xl border-2 border-emerald-700 overflow-hidden">
        {/* Top Excel Ribbon Bar */}
        <div className="bg-[#107C41] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-widest bg-emerald-900/70 px-2 py-0.5 rounded text-emerald-100">
                  HOJA EXCEL OFICIAL (.XLS)
                </span>
                <span className="text-xs font-mono text-emerald-100">{workbook.filename}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {workbook.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => downloadProformaExcel(source, meta)}
              data-testid="excel-modal-btn-download"
              className="bg-white text-[#107C41] hover:bg-emerald-50 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Descargar y Abrir en Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/15 p-2 rounded-lg transition-colors cursor-pointer"
              title="Cerrar vista de hoja Excel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Formula / Info Bar */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-700">
              Hoja {activeSheetIdx + 1} de {workbook.sheets.length}: {currentSheet.name}
            </span>
            <span>
              Estructura idéntica a la plantilla Excel enviada a clientes (Liquidación a la izquierda + Grilla de turnos a la derecha).
            </span>
          </div>
          <span className="font-semibold text-[#107C41] hidden md:inline">
            Podés cambiar de pestaña abajo o descargar el archivo .xls completo
          </span>
        </div>

        {/* Main Spreadsheet Grid */}
        <div className="flex-1 overflow-auto bg-slate-200/70">
          <table className="border-collapse bg-white min-w-full">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                <th className="w-10 min-w-10 border border-slate-300 bg-slate-200 py-1 text-center sticky left-0 z-30">
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    style={{ minWidth: `${currentSheet.colWidths[cIdx] || 110}px` }}
                    className="border border-slate-300 bg-slate-200 py-1 px-2 text-center select-none"
                  >
                    {getColumnLetter(cIdx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSheet.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-sky-50/30">
                  <td className="border border-slate-300 bg-slate-100 text-slate-500 font-mono text-[11px] font-semibold text-center px-1.5 py-1 sticky left-0 z-10 select-none">
                    {rIdx + 1}
                  </td>
                  {Array.from({ length: maxCols }).map((_, cIdx) => {
                    const cell = row ? row[cIdx] || null : null;
                    return (
                      <td
                        key={cIdx}
                        className={`border border-slate-200 px-2.5 py-1.5 whitespace-nowrap ${getCellClass(cell)}`}
                      >
                        {formatCellValue(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Excel Sheet Tabs Bar */}
        <div className="bg-slate-200 border-t border-slate-300 px-3 py-2 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-[#107C41]" />
              Hojas del Libro:
            </span>
            {workbook.sheets.map((sh, idx) => {
              const isActive = idx === activeSheetIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSheetIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-white text-[#107C41] border-slate-300 border-b-2 border-b-[#107C41] shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  {sh.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => downloadProformaExcel(source, meta)}
            className="bg-[#107C41] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar .XLS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

