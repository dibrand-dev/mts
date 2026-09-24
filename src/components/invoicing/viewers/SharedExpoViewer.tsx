'use client';

import {
  Percent,
  Clock,
  Car,
  Utensils,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function SharedExpoViewer({ proforma }: Props) {
  const payload = proforma.calculation_payload as any;
  const factor = Number(payload?.factor_coparticipacion ?? 0.10);
  const horasTotales = payload?.horas_totales_base;
  const horasImputadas = payload?.horas_imputadas;
  const tarifas = payload?.tarifas;
  const importes = payload?.importes;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];

  return (
    <div className="space-y-6">
      {/* Coparticipation Factor Banner */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-100 rounded-lg text-[#1E5BB4]">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Esquema de Coparticipación</span>
            <h4 className="text-sm sm:text-base font-bold text-[#0B1C30]">
              Liquidación al {(factor * 100).toFixed(0)}% sobre Horas de Operación
            </h4>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Factor Aplicado</span>
          <span className="text-lg font-mono font-extrabold text-[#1E5BB4]">{factor.toFixed(2)}</span>
        </div>
      </div>

      {/* Comparison Table: Horas Base vs Imputadas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#1E5BB4]" />
            Prorrateo de Horas y Subtotales
          </h4>
          <span className="text-xs text-slate-500 font-medium">Horas Base x {(factor * 100).toFixed(0)}% = Horas a Facturar</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
            <tr>
              <th className="p-3 pl-4">Tipo de Hora</th>
              <th className="p-3 text-center">Horas Base</th>
              <th className="p-3 text-center">Horas Imputadas ({(factor * 100).toFixed(0)}%)</th>
              <th className="p-3 text-right">Tarifa ($)</th>
              <th className="p-3 pr-4 text-right">Importe ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            <tr>
              <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Normales</td>
              <td className="p-3 text-center font-mono text-slate-500">{horasTotales?.reg ?? 0} hs</td>
              <td className="p-3 text-center font-mono font-bold text-[#1E5BB4]">{horasImputadas?.reg ?? 0} hs</td>
              <td className="p-3 text-right font-mono">$ {Number(tarifas?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                $ {Number(importes?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Extras 50%</td>
              <td className="p-3 text-center font-mono text-slate-500">{horasTotales?.ot50 ?? 0} hs</td>
              <td className="p-3 text-center font-mono font-bold text-[#1E5BB4]">{horasImputadas?.ot50 ?? 0} hs</td>
              <td className="p-3 text-right font-mono">$ {Number(tarifas?.ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                $ {Number(importes?.ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            {Number(horasImputadas?.ot100 || 0) > 0 && (
              <tr>
                <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Extras 100%</td>
                <td className="p-3 text-center font-mono text-slate-500">{horasTotales?.ot100 ?? 0} hs</td>
                <td className="p-3 text-center font-mono font-bold text-[#1E5BB4]">{horasImputadas?.ot100 ?? 0} hs</td>
                <td className="p-3 text-right font-mono">$ {Number(tarifas?.ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                  $ {Number(importes?.ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Viandas y Transporte if any */}
      {(Number(importes?.viandas || 0) > 0 || Number(importes?.shuttles || 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-[#1E5BB4]" /> Viandas:
            </span>
            <span className="font-mono font-bold text-[#0B1C30]">
              $ {Number(importes?.viandas || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-[#1E5BB4]" /> Transporte / Remises:
            </span>
            <span className="font-mono font-bold text-[#0B1C30]">
              $ {Number(importes?.shuttles || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de Liquidación Coparticipada
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

