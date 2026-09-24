'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Users,
  Clock,
  Car,
  Layers,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function VesselViewer({ proforma }: Props) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'encargado' | 'compensacion'>('resumen');

  const payload = proforma.calculation_payload as any;
  const tab1 = payload?.tab1_resumen_general;
  const tab2 = payload?.tab2_encargado_a_bordo;
  const tab3 = payload?.tab3_hs_compensacion;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];
  const vesselDisplay = proforma.vessel_name || payload?.vessel_name || 'A DEFINIR';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('resumen')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'resumen'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Resumen General</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('encargado')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'encargado'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>ENCARGADO A BORDO</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compensacion')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'compensacion'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>HS COMPENSACIÓN</span>
        </button>
      </div>

      {/* TAB 1: RESUMEN GENERAL */}
      {activeTab === 'resumen' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Vehículos Totales */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#004392] flex items-center gap-1.5">
                <Car className="h-4 w-4 text-[#1E5BB4]" />
                Totales Operativos de Embarcación
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                Buque: <strong className="text-[#0B1C30]">{vesselDisplay}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Descargados</span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  {tab1?.vehiculos?.descargados ?? 0}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Cargados</span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  {tab1?.vehiculos?.cargados ?? 0}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Removidos</span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  {tab1?.vehiculos?.removidos ?? 0}
                </span>
              </div>
              <div className="bg-sky-100/70 p-2.5 rounded-lg border border-sky-300 shadow-2xs">
                <span className="text-[10px] font-bold text-[#004392] uppercase block">Total Movimientos</span>
                <span className="text-lg font-mono font-extrabold text-[#1E5BB4]">
                  {tab1?.vehiculos?.total_controlados ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose de Operativa Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Desglose de Operativa Portuaria
              </h4>
              <span className="text-xs text-slate-500 font-medium">Conceptos, Tarifas y Totales</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3 pl-4">Concepto</th>
                  <th className="p-3 text-right">Tarifa ($)</th>
                  <th className="p-3 pr-4 text-right">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tab1?.desglose?.map((row: any, idx: number) => {
                  const isTotal = row.is_total_row || row.concepto.startsWith('TOTAL');
                  return (
                    <tr
                      key={idx}
                      className={isTotal ? 'bg-amber-50/60 font-bold text-amber-950' : 'hover:bg-slate-50/80'}
                    >
                      <td className="p-3 pl-4">{row.concepto}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{row.tarifa || '-'}</td>
                      <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                        $ {Number(row.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3 Subtotales Consolidado */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#1E5BB4]" />
              Consolidado General de Proforma
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Subtotal Operativa</span>
                <span className="text-lg font-mono font-extrabold text-[#0B1C30] block">
                  $ {Number(tab1?.consolidado?.subtotal_operativa || proforma.subtotal_operativa || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block">Vehículos, apuntadores y remises</span>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Subtotal Hs Compensación</span>
                <span className="text-lg font-mono font-extrabold text-[#0B1C30] block">
                  $ {Number(tab1?.consolidado?.subtotal_compensacion || proforma.subtotal_compensacion || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block">Bonificado con {proforma.discount_percentage || 3}% comercial</span>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Subtotal Encargado a Bordo</span>
                <span className="text-lg font-mono font-extrabold text-[#0B1C30] block">
                  $ {Number(tab1?.consolidado?.subtotal_encargado || proforma.subtotal_encargado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block">Bonificado con {proforma.discount_percentage || 3}% comercial</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENCARGADO A BORDO */}
      {activeTab === 'encargado' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#1E5BB4]" />
                Liquidación Encargado a Bordo
              </h4>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3 pl-4">Concepto</th>
                  <th className="p-3 text-right">Tarifa ($)</th>
                  <th className="p-3 pr-4 text-right">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tab2?.conceptos?.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 pl-4 font-semibold text-[#0B1C30]">{c.concepto}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{c.tarifa}</td>
                    <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                      $ {Number(c.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 max-w-md ml-auto text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Importe Horas Encargados:</span>
              <span className="font-mono font-medium">$ {Number(tab2?.totales?.importe_encargados || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Plus Encargados (con markup):</span>
              <span className="font-mono font-medium">$ {Number(tab2?.totales?.plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0B1C30] border-t border-slate-200 pt-2">
              <span>Neto Factura Encargados:</span>
              <span className="font-mono">$ {Number(tab2?.totales?.neto_factura || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Bonificación ({tab2?.totales?.bonificacion_pct || 3}%):</span>
              <span className="font-mono">- $ {Number(tab2?.totales?.bonificacion_monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
              <span>Subtotal Factura Bonificada:</span>
              <span className="font-mono text-sm">$ {Number(tab2?.totales?.subtotal_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HS COMPENSACION */}
      {activeTab === 'compensacion' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#1E5BB4]" />
                Servicio Horas Compensación (Trabajo Corrido)
              </h4>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3 pl-4">Concepto</th>
                  <th className="p-3 text-right">Tarifa ($)</th>
                  <th className="p-3 pr-4 text-right">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {tab3?.conceptos?.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 pl-4 font-semibold text-[#0B1C30]">{c.concepto}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{c.tarifa}</td>
                    <td className="p-3 pr-4 text-right font-mono font-semibold text-[#0B1C30]">
                      $ {Number(c.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 max-w-md ml-auto text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Neto Horas Compensación:</span>
              <span className="font-mono font-medium">$ {Number(tab3?.totales?.neto_factura || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Bonificación ({tab3?.totales?.bonificacion_pct || 3}%):</span>
              <span className="font-mono">- $ {Number(tab3?.totales?.bonificacion_monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
              <span>Subtotal Factura Bonificada:</span>
              <span className="font-mono text-sm">$ {Number(tab3?.totales?.subtotal_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de la Liquidación Comercial
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

