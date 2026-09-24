'use client';

import React from 'react';
import {
  Building2,
  Clock,
  Car,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function FixedDepositViewer({ proforma }: Props) {
  const payload = proforma.calculation_payload as any;
  const sector = payload?.sector || 'Depósito';
  const abonoQuincenal = payload?.abono_quincenal || 0;
  const horasExtras = payload?.horas_extras;
  const transporte = payload?.transporte;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];

  return (
    <div className="space-y-6">
      {/* Sector Header Card */}
      <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#1E5BB4]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Sector Asignado</span>
            <h4 className="text-base font-bold text-[#0B1C30]">{sector}</h4>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Abono Quincenal Base</span>
          <span className="text-lg font-mono font-extrabold text-[#1E5BB4]">
            $ {Number(abonoQuincenal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Horas Extras */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#1E5BB4]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Horas Extras del Período
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Horas Extras 50% ({horasExtras?.hs_50 || 0} hs):</span>
              <span className="font-mono font-semibold text-[#0B1C30]">
                $ {Number(horasExtras?.imp_50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Horas Extras 100% ({horasExtras?.hs_100 || 0} hs):</span>
              <span className="font-mono font-semibold text-[#0B1C30]">
                $ {Number(horasExtras?.imp_100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 font-bold text-[#0B1C30]">
              <span>Total Horas Extras:</span>
              <span className="font-mono text-sm">
                $ {Number((horasExtras?.imp_50 || 0) + (horasExtras?.imp_100 || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Transporte Diario por Tramos */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-1.5">
            <Car className="h-4 w-4 text-[#1E5BB4]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transporte Diario (por tramos)
            </h4>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Cantidad de Tramos:</span>
              <span className="font-mono font-bold text-[#0B1C30]">{transporte?.tramos || 0} tramos</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-600">Tarifa por Tramo:</span>
              <span className="font-mono text-[#0B1C30]">
                $ {Number(transporte?.tarifa_tramo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 font-bold text-[#1E5BB4]">
              <span>Total Transporte:</span>
              <span className="font-mono text-sm">
                $ {Number(transporte?.total_transporte || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de Liquidación Depósitos
          </h5>
          <ul className="space-y-1 text-xs text-amber-950/90 pl-5 list-disc">
            {notes.map((note: string, idx: number) => (
              <li key={idx} className="leading-relaxed font-medium">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

