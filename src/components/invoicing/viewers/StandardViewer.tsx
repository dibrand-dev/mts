'use client';

import React from 'react';
import {
  FileText,
  Clock,
  Car,
  Utensils,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function StandardViewer({ proforma }: Props) {
  const payload = proforma.calculation_payload as any;
  const horas = payload?.horas;
  const tarifas = payload?.tarifas;
  const viandas = payload?.viandas;
  const transporte = payload?.transporte;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];

  return (
    <div className="space-y-6">
      {/* Items & Services Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-[#1E5BB4]" />
            Conceptos y Servicios Facturados
          </h4>
          <span className="text-xs text-slate-500 font-medium">{proforma.operation_dates || proforma.fortnight_period}</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="p-3 pl-4">Concepto / Servicio</th>
              <th className="p-3 text-center">Cant. / Horas</th>
              <th className="p-3 text-right">Tarifa Unitaria ($)</th>
              <th className="p-3 pr-4 text-right">Subtotal ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {proforma.details && proforma.details.length > 0 ? (
              proforma.details.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50">
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">{item.description}</td>
                  <td className="p-3 text-center font-mono text-slate-600">{Number(item.quantity).toFixed(1)}</td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    $ {Number(item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 pr-4 text-right font-mono font-bold text-[#0B1C30]">
                    $ {Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Operativas - {proforma.fortnight_period}</td>
                <td className="p-3 text-center font-mono text-slate-600">1.0</td>
                <td className="p-3 text-right font-mono text-slate-600">
                  $ {Number(proforma.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 pr-4 text-right font-mono font-bold text-[#0B1C30]">
                  $ {Number(proforma.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Breakdown Cards if payload available */}
      {horas && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#1E5BB4]" /> Horas Normales
            </span>
            <span className="text-base font-mono font-bold text-[#0B1C30] mt-1 block">
              {horas.reg} hs <span className="text-xs font-normal text-slate-400">($ {Number(tarifas?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
              <Utensils className="h-3 w-3 text-[#1E5BB4]" /> Viandas
            </span>
            <span className="text-base font-mono font-bold text-[#0B1C30] mt-1 block">
              {viandas?.count || 0} viandas <span className="text-xs font-normal text-slate-400">($ {Number(viandas?.rate || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
              <Car className="h-3 w-3 text-[#1E5BB4]" /> Transporte
            </span>
            <span className="text-base font-mono font-bold text-[#0B1C30] mt-1 block">
              {transporte?.trips || 0} viajes <span className="text-xs font-normal text-slate-400">($ {Number(transporte?.rate || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})</span>
            </span>
          </div>
        </div>
      )}

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de la Liquidación
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

