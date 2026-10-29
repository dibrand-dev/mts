'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Users,
  Calculator,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function PlusIncidenceViewer({ proforma }: Props) {
  const [activeTab, setActiveTab] = useState<'operativa' | 'plus'>('operativa');
  const payload = proforma.calculation_payload as any;
  const vesselDisplay = proforma.vessel_name || payload?.vessel_name || 'INQUEBRANTABLE';
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];
  const turnos = payload?.turnos || [];
  const plusSummary = payload?.plus_summary || {};

  return (
    <div className="space-y-6">
      {/* Pestañas estilo Excel INQUEBRANTABLE */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('operativa')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'operativa'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>{vesselDisplay} — Horas y Transporte</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plus')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'plus'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Pestaña Plus (Incidencia Hs. Extras + Coef. 0,52)</span>
        </button>
      </div>

      {activeTab === 'operativa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Izquierda: Liquidación Horas + Plus + Viajes */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1C30]">
                  Liquidación Servicio: {vesselDisplay}
                </h4>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">HORAS NORMALES ENCARGADO ({payload?.horas_encargado?.norm || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_encargado?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HORAS 50% ENCARGADO ({payload?.horas_encargado?.ot50 || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_encargado?.ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">HORAS 100% ENCARGADO ({payload?.horas_encargado?.ot100 || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_encargado?.ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">HORAS NORMALES APUNTADOR ({payload?.horas_apuntador?.norm || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_apuntador?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HORAS 50% APUNTADOR ({payload?.horas_apuntador?.ot50 || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_apuntador?.ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">HORAS 100% APUNTADOR ({payload?.horas_apuntador?.ot100 || 0} hs):</span>
                  <span className="font-mono font-semibold">$ {Number(payload?.importes_apuntador?.ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between font-bold text-[#0B1C30] bg-slate-50 p-2 rounded">
                  <span>IMPORTE PERSONAL NORMAL:</span>
                  <span className="font-mono">$ {Number(payload?.importe_personal_normal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between font-bold text-amber-950 bg-amber-50 p-2 rounded border border-amber-200">
                  <span>Total a facturar por Plus e Inc. Hs. Extras:</span>
                  <span className="font-mono">$ {Number(plusSummary?.total_facturar_plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between font-bold text-purple-950 bg-purple-50 p-2 rounded border border-purple-200">
                  <span>TRANSPORTE - VIAJES ({payload?.transporte?.viajes || 0} viajes):</span>
                  <span className="font-mono">$ {Number(payload?.transporte?.total_viajes || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: Grilla de Turnos */}
          <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1C30] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#1E5BB4]" />
                <span>Dotación y Horas del Servicio</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-[#1E5BB4]">
                Unidades Operadas: {payload?.unidades_operadas || 355}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="p-2 pl-3">Puesto</th>
                    <th className="p-2">Apellido</th>
                    <th className="p-2 text-center">Fecha</th>
                    <th className="p-2 text-center">Desde-Hasta</th>
                    <th className="p-2 text-center">Horas</th>
                    <th className="p-2 text-center">Normales</th>
                    <th className="p-2 text-center">50%</th>
                    <th className="p-2 text-center">100%</th>
                    <th className="p-2 pr-3 text-center">Viajes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {turnos.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 pl-3 font-bold text-[#0B1C30]">{t.puesto}</td>
                      <td className="p-2">{t.apellido}</td>
                      <td className="p-2 text-center font-mono">{t.fecha}</td>
                      <td className="p-2 text-center font-mono">{t.desdeHasta}</td>
                      <td className="p-2 text-center font-mono">{t.totalHoras}</td>
                      <td className="p-2 text-center font-mono font-bold">{t.normales}</td>
                      <td className="p-2 text-center font-mono">{t.ot50 || 0}</td>
                      <td className="p-2 text-center font-mono">{t.ot100 || 0}</td>
                      <td className="p-2 pr-3 text-center font-mono font-bold text-purple-800">{t.viajes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Grilla Plus por Operario */}
          <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1C30]">
                Detalle Plus Productividad e Incidencia en Horas Extras
              </h4>
              <span className="text-xs font-mono font-bold text-[#1E5BB4]">
                Total unidades operadas: {payload?.unidades_operadas || 355}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                  <tr>
                    <th className="p-2 pl-3">Apellido</th>
                    <th className="p-2 text-center">Fecha</th>
                    <th className="p-2 text-center">Desde-Hasta</th>
                    <th className="p-2 text-center">Normal</th>
                    <th className="p-2 text-right">PLUS ($)</th>
                    <th className="p-2 text-center">HS.NORM.</th>
                    <th className="p-2 pr-3 text-right">INCID HE ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {turnos.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 pl-3 font-semibold text-[#0B1C30]">{t.apellido}</td>
                      <td className="p-2 text-center font-mono">{t.fecha}</td>
                      <td className="p-2 text-center font-mono">{t.desdeHasta}</td>
                      <td className="p-2 text-center font-mono">{t.normales}</td>
                      <td className="p-2 text-right font-mono font-bold">
                        $ {Number(t.plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center font-mono">{t.hsNormEq || 0}</td>
                      <td className="p-2 pr-3 text-right font-mono">
                        $ {Number(t.incidHe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cuadro Derecho CAT ARGENTINA S.A. Plus */}
          <div className="lg:col-span-4 border-2 border-amber-300 rounded-xl overflow-hidden shadow-xs bg-amber-50/40">
            <div className="bg-amber-100/80 px-4 py-2.5 border-b border-amber-200">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                {proforma.client_name || 'CAT ARGENTINA S.A.'} — Liquidación Plus
              </h4>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-700 font-medium">Plus:</span>
                <span className="font-mono font-bold">
                  $ {Number(plusSummary?.plus_base || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 font-medium">Incidencia plus Rem en Hs. Extras:</span>
                <span className="font-mono font-bold">
                  $ {Number(plusSummary?.incidencia_he || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-amber-200 font-bold text-[#0B1C30]">
                <span>Neto Plus + Inc. Hs. Extras:</span>
                <span className="font-mono">
                  $ {Number(plusSummary?.neto_plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Coeficiente costos: {plusSummary?.coeficiente ?? 0.52}:</span>
                <span className="font-mono font-semibold">
                  $ {Number(plusSummary?.coeficiente_monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-amber-300 font-extrabold text-amber-950 text-sm">
                <span>Total a facturar por Plus e Inc. Hs. Extras:</span>
                <span className="font-mono">
                  $ {Number(plusSummary?.total_facturar_plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de Liquidación Incidencia Plus
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

