'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Users,
  Car,
  Layers,
  Info,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';

interface Props {
  proforma: InvoicingRecord;
}

export function FiscalYardViewer({ proforma }: Props) {
  const [activeTab, setActiveTab] = useState<'consolidado' | 'plazoleta' | 'transporte' | 'expo'>('consolidado');

  const payload = proforma.calculation_payload as any;
  const consolidado = payload?.consolidado;
  const tabPlazoleta = payload?.tab_plazoleta;
  const tabTransporte = payload?.tab_transporte;
  const tabExpo = payload?.tab_expo;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('consolidado')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'consolidado'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Resumen Consolidado</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plazoleta')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'plazoleta'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>PLAZOLETA FISCAL</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transporte')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'transporte'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <Car className="h-4 w-4" />
          <span>TRANSPORTE (TTE)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expo')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'expo'
              ? 'bg-[#0B1C30] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>CONTROL EXPO</span>
        </button>
      </div>

      {/* TAB 1: RESUMEN CONSOLIDADO */}
      {activeTab === 'consolidado' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Plazoleta Fiscal</span>
              <span className="text-xl font-mono font-extrabold text-[#0B1C30] block">
                $ {Number(consolidado?.plazoleta_fiscal || proforma.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block">Horas de encargados y apuntadores con 3% bonif.</span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Transporte Personal (TTE)</span>
              <span className="text-xl font-mono font-extrabold text-[#0B1C30] block">
                $ {Number(consolidado?.transporte_personal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block">{tabTransporte?.viajes || 0} viajes de remis</span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Control EXPO</span>
              <span className="text-xl font-mono font-extrabold text-[#0B1C30] block">
                $ {Number(consolidado?.control_expo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block">Horas con asignación del 90%</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAZOLETA FISCAL (Plantilla Excel Histórica) */}
      {activeTab === 'plazoleta' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header con Totales Consolidados de la Grilla Excel */}
          <div className="bg-[#0B1C30] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-sky-400 block">
                Plantilla Operativa de Plazoleta Fiscal
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Personal Operativo Quincenal (PF 01 al PF 13)</span>
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase font-bold">Total Hs Normales</span>
                <span className="font-mono text-base font-extrabold text-white">
                  {Number(tabPlazoleta?.totales_grilla?.total_regular ?? ((tabPlazoleta?.horas_encargado?.norm || 0) + (tabPlazoleta?.horas_apuntador?.norm || 0))).toFixed(1)} hs
                </span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase font-bold">Total Hs 50%</span>
                <span className="font-mono text-base font-extrabold text-sky-300">
                  {Number(tabPlazoleta?.totales_grilla?.total_ot50 ?? ((tabPlazoleta?.horas_encargado?.ot50 || 0) + (tabPlazoleta?.horas_apuntador?.ot50 || 0))).toFixed(1)} hs
                </span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-slate-300 block text-[10px] uppercase font-bold">Total Hs 100%</span>
                <span className="font-mono text-base font-extrabold text-amber-300">
                  {Number(tabPlazoleta?.totales_grilla?.total_ot100 ?? ((tabPlazoleta?.horas_encargado?.ot100 || 0) + (tabPlazoleta?.horas_apuntador?.ot100 || 0))).toFixed(1)} hs
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANEL DERECHO EXCEL (GRILLA PF 01 AL PF 13): 7 Columnas en escritorio */}
            <div className="lg:col-span-8 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#1E5BB4]" />
                  <span>Grilla de Apuntadores y Encargado (Plantilla Histórica)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  13 Puestos Fijos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-2.5 pl-3">Puesto / Código</th>
                      <th className="p-2.5">Operario Asignado</th>
                      <th className="p-2.5 text-center">Normales</th>
                      <th className="p-2.5 text-center">50%</th>
                      <th className="p-2.5 text-center">100%</th>
                      <th className="p-2.5 text-center font-extrabold">Total Hs</th>
                      <th className="p-2.5 pr-3 text-right">Subtotal ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {tabPlazoleta?.slots_summary && tabPlazoleta.slots_summary.length > 0 ? (
                      tabPlazoleta.slots_summary.map((slot: any, idx: number) => {
                        const isEnc = slot.slotCode?.includes('ENCARGADO');
                        const isBonif = slot.isBonificado || slot.assignedEmployee === 'BONIFICADO';
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${
                              isEnc
                                ? 'bg-sky-50/70 font-semibold'
                                : isBonif
                                ? 'bg-amber-50/40 text-amber-900'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-slate-50/30'
                            }`}
                          >
                            <td className="p-2.5 pl-3 whitespace-nowrap font-mono text-[11px] font-bold text-[#0B1C30]">
                              {slot.slotCode}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={isBonif ? 'font-bold text-amber-800' : 'text-slate-800'}>
                                {slot.assignedEmployee || '-'}
                              </span>
                              {isBonif && (
                                <span className="ml-1.5 text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                  CAT Acordado
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{slot.totalRegular ?? 0}</td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{slot.totalOt50 ?? 0}</td>
                            <td className="p-2.5 text-center font-mono text-slate-700">{slot.totalOt100 ?? 0}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-[#0B1C30]">
                              {slot.totalHours ?? 0}
                            </td>
                            <td className="p-2.5 pr-3 text-right font-mono font-semibold text-slate-900">
                              $ {Number(slot.subtotalAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // Fallback visual directo si la proforma fue emitida antes de guardar slots_summary
                      Array.from({ length: 13 }).map((_, i) => {
                        const numStr = String(i + 1).padStart(2, '0');
                        const isBonif = (i === 12);
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 pl-3 font-mono text-[11px] font-bold text-[#0B1C30]">
                              APUNTADOR PF {numStr}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {isBonif ? <span className="font-bold text-amber-800">BONIFICADO</span> : 'Apuntador Plazoleta'}
                            </td>
                            <td className="p-2.5 text-center font-mono">-</td>
                            <td className="p-2.5 text-center font-mono">-</td>
                            <td className="p-2.5 text-center font-mono">-</td>
                            <td className="p-2.5 text-center font-mono font-bold">-</td>
                            <td className="p-2.5 pr-3 text-right font-mono font-semibold text-slate-400">$ 0,00</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PANEL IZQUIERDO EXCEL (LIQUIDACIÓN Y TARIFAS): 4 Columnas en escritorio */}
            <div className="lg:col-span-4 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Tarifas y Liquidación de Horas
                  </h4>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-2.5 pl-3">Concepto</th>
                      <th className="p-2.5 text-center">Hs</th>
                      <th className="p-2.5 text-right">Tarifa ($)</th>
                      <th className="p-2.5 pr-3 text-right">Importe ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {/* Encargado */}
                    <tr className="bg-sky-50/40">
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs Normales Encargado</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_encargado?.norm ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_encargado?.REGULAR || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.enc_reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-sky-50/40">
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs 50% Encargado</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_encargado?.ot50 ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_encargado?.OVERTIME_50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.enc_ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-sky-50/40">
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs 100% Encargado</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_encargado?.ot100 ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_encargado?.OVERTIME_100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.enc_ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>

                    {/* Apuntadores */}
                    <tr>
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs Normales Apuntadores</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_apuntador?.norm ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_apuntador?.REGULAR || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.ap_reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs 50% Apuntadores</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_apuntador?.ot50 ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_apuntador?.OVERTIME_50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.ap_ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">Hs 100% Apuntadores</td>
                      <td className="p-2.5 text-center font-mono">{tabPlazoleta?.horas_apuntador?.ot100 ?? 0}</td>
                      <td className="p-2.5 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_apuntador?.OVERTIME_100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2.5 pr-3 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.ap_ot100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tarjeta de Liquidación Neta */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 text-xs shadow-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Importe Personal Normal (Neto):</span>
                  <span className="font-mono font-bold text-slate-800">$ {Number(tabPlazoleta?.importes?.neto_sin_bonif || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Bonificación ({proforma.discount_percentage || 3}%):</span>
                  <span className="font-mono font-medium">- $ {Number(tabPlazoleta?.importes?.bonificacion || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-extrabold text-[#1E5BB4] border-t border-slate-200 pt-2.5 text-sm">
                  <span>Subtotal Factura Bonificada:</span>
                  <span className="font-mono text-base">$ {Number(tabPlazoleta?.importes?.subtotal_bonificado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PARTE DIARIO DETALLADO POR TURNO (Auditoría cronológica como en el Excel) */}
          {tabPlazoleta?.shift_rows && tabPlazoleta.shift_rows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white mt-4">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-[#1E5BB4]" />
                  <span>Detalle Cronológico de Partes Diarios Aprobados ({tabPlazoleta.shift_rows.length} turnos)</span>
                </h4>
                <span className="text-[11px] text-slate-500">Auditoría CCT</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5 pl-3">Fecha</th>
                      <th className="p-2.5">Puesto Asignado</th>
                      <th className="p-2.5">Apellido y Nombre</th>
                      <th className="p-2.5 text-center">Horario</th>
                      <th className="p-2.5 text-center">Normales</th>
                      <th className="p-2.5 text-center">50%</th>
                      <th className="p-2.5 text-center">100%</th>
                      <th className="p-2.5 pr-3 text-center font-bold">Total Hs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {tabPlazoleta.shift_rows.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 pl-3 font-mono text-slate-600">{row.workDate}</td>
                        <td className="p-2.5 font-mono font-bold text-[#0B1C30]">{row.slotPosition}</td>
                        <td className="p-2.5 text-slate-800">{row.employeeName}</td>
                        <td className="p-2.5 text-center font-mono text-slate-600">{row.timeRange}</td>
                        <td className="p-2.5 text-center font-mono">{row.regularHours}</td>
                        <td className="p-2.5 text-center font-mono text-sky-700">{row.overtime50Hours}</td>
                        <td className="p-2.5 text-center font-mono text-amber-700">{row.overtime100Hours}</td>
                        <td className="p-2.5 pr-3 text-center font-mono font-bold text-[#0B1C30]">{row.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRANSPORTE TTE */}
      {activeTab === 'transporte' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Transporte de Personal - Remises
              </h4>
            </div>
            <div className="p-6 bg-white space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Viajes</span>
                  <span className="text-xl font-mono font-bold text-[#0B1C30]">{tabTransporte?.viajes || 0}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tarifa por Viaje</span>
                  <span className="text-xl font-mono font-bold text-[#0B1C30]">$ {Number(tabTransporte?.tarifa_por_viaje || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[10px] font-bold text-[#1E5BB4] uppercase block">Subtotal Transporte</span>
                  <span className="text-xl font-mono font-extrabold text-[#1E5BB4]">$ {Number(tabTransporte?.total_transporte || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTROL EXPO */}
      {activeTab === 'expo' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Control EXPO (Asignación {(Number(tabExpo?.factor_asignacion || 0.9) * 100).toFixed(0)}%)
              </h4>
              <span className="text-xs text-slate-500 font-medium">Horas base x Factor = Horas a Facturar</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3 pl-4">Concepto</th>
                  <th className="p-3 text-center">Horas Base</th>
                  <th className="p-3 text-center">Horas Facturadas (90%)</th>
                  <th className="p-3 pr-4 text-right">Subtotal ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Normales Apuntador</td>
                  <td className="p-3 text-center font-mono">{tabExpo?.horas_base?.norm || 0}</td>
                  <td className="p-3 text-center font-mono font-bold text-[#1E5BB4]">{tabExpo?.horas_facturadas?.norm || 0}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabExpo?.importes?.reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas 50% Apuntador</td>
                  <td className="p-3 text-center font-mono">{tabExpo?.horas_base?.ot50 || 0}</td>
                  <td className="p-3 text-center font-mono font-bold text-[#1E5BB4]">{tabExpo?.horas_facturadas?.ot50 || 0}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabExpo?.importes?.ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center max-w-md ml-auto text-xs">
            <span className="font-bold text-[#0B1C30]">Subtotal Control EXPO:</span>
            <span className="font-mono font-extrabold text-sm text-[#1E5BB4]">$ {Number(tabExpo?.importes?.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de Liquidación Plazoleta Fiscal
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

