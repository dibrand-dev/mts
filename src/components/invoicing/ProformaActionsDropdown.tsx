'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Eye,
  Link2,
  ExternalLink,
  Check,
  FileText,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface ProformaActionsDropdownProps {
  record: InvoicingRecord;
  rowIndex: number;
  totalRows: number;
  onOpenDetails: (record: InvoicingRecord) => void;
  onInvoiceClick: (record: InvoicingRecord) => void;
  onStatusChange: (record: InvoicingRecord, status: 'paid') => void;
  onDelete: (id: string) => void;
  copiedToken: string | null;
  onCopyPublicLink: (token: string) => void;
}

export function ProformaActionsDropdown({
  record,
  rowIndex,
  totalRows,
  onOpenDetails,
  onInvoiceClick,
  onStatusChange,
  onDelete,
  copiedToken,
  onCopyPublicLink,
}: ProformaActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCopied = copiedToken === record.public_token;
  // Si está en las últimas filas y la tabla tiene más de 2 registros, desplegar hacia arriba para no desbordar
  const isNearBottom = totalRows > 2 && rowIndex >= totalRows - 2;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Botón Trigger del Menú Desplegable */}
      <button
        type="button"
        data-testid={`invoicing-btn-actions-trigger-${record.id}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs select-none ${
          isOpen
            ? 'bg-slate-100 text-[#1E5BB4] border-slate-300 ring-2 ring-[#1E5BB4]/15'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#1E5BB4] hover:border-slate-300'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Opciones de la proforma"
      >
        <span>Acciones</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1E5BB4]' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          className={`absolute right-0 w-60 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Sección 1: Consulta y Enlaces */}
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Consulta & Portal
          </div>

          <button
            type="button"
            data-testid="invoicing-btn-view-details"
            onClick={() => {
              setIsOpen(false);
              onOpenDetails(record);
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1E5BB4] rounded-lg transition-colors cursor-pointer group text-left"
            role="menuitem"
          >
            <div className="flex items-center gap-2.5">
              <Eye className="h-4 w-4 text-slate-400 group-hover:text-[#1E5BB4] transition-colors" />
              <span>Ver Desglose</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Cálculo</span>
          </button>

          <button
            type="button"
            data-testid="invoicing-btn-copy-public-link"
            onClick={() => {
              onCopyPublicLink(record.public_token);
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1E5BB4] rounded-lg transition-colors cursor-pointer group text-left"
            role="menuitem"
          >
            <div className="flex items-center gap-2.5">
              {isCopied ? (
                <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
              ) : (
                <Link2 className="h-4 w-4 text-slate-400 group-hover:text-[#1E5BB4] transition-colors" />
              )}
              <span className={isCopied ? 'text-emerald-600 font-semibold' : ''}>
                {isCopied ? '¡Enlace Copiado!' : 'Copiar Enlace Público'}
              </span>
            </div>
          </button>

          <a
            data-testid="invoicing-btn-open-public-link"
            href={`/proforma/${record.public_token}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#1E5BB4] rounded-lg transition-colors cursor-pointer group text-left"
            role="menuitem"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-[#1E5BB4] transition-colors" />
              <span>Abrir Portal Cliente</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">↗</span>
          </a>

          {/* Sección 2: Operaciones Comerciales */}
          {(!record.invoice || record.status !== 'paid') && (
            <>
              <div className="h-px bg-slate-100 my-1" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operaciones
              </div>

              {!record.invoice && (
                <button
                  type="button"
                  data-testid="invoicing-btn-facturar"
                  onClick={() => {
                    setIsOpen(false);
                    onInvoiceClick(record);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer group text-left"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Emitir Factura Fiscal</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    ARCA
                  </span>
                </button>
              )}

              {record.status !== 'paid' && (
                <button
                  type="button"
                  data-testid="invoicing-btn-marcar-cobrada"
                  onClick={() => {
                    setIsOpen(false);
                    onStatusChange(record, 'paid');
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer group text-left mt-0.5"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Registrar Cobro</span>
                  </div>
                </button>
              )}
            </>
          )}

          {/* Sección 3: Zona de Peligro */}
          <div className="h-px bg-slate-100 my-1" />
          <button
            type="button"
            data-testid="invoicing-btn-delete-proforma"
            onClick={() => {
              setIsOpen(false);
              onDelete(record.id);
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer group text-left"
            role="menuitem"
          >
            <Trash2 className="h-4 w-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
            <span>Eliminar Proforma</span>
          </button>
        </div>
      )}
    </div>
  );
}
