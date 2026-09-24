'use client';

import React, { useState } from 'react';
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

      {/* TAB 2: PLAZOLETA FISCAL */}
      {activeTab === 'plazoleta' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Horas y Tarifas - Plazoleta Fiscal
              </h4>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3 pl-4">Categoría / Puesto</th>
                  <th className="p-3 text-center">Horas</th>
                  <th className="p-3 text-right">Tarifa ($)</th>
                  <th className="p-3 pr-4 text-right">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Normales Encargado</td>
                  <td className="p-3 text-center font-mono">{tabPlazoleta?.horas_encargado?.norm ?? 0}</td>
                  <td className="p-3 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_encargado?.REGULAR || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.enc_reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas 50% Encargado</td>
                  <td className="p-3 text-center font-mono">{tabPlazoleta?.horas_encargado?.ot50 ?? 0}</td>
                  <td className="p-3 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_encargado?.OVERTIME_50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.enc_ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas Normales Apuntador</td>
                  <td className="p-3 text-center font-mono">{tabPlazoleta?.horas_apuntador?.norm ?? 0}</td>
                  <td className="p-3 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_apuntador?.REGULAR || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.ap_reg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-4 font-semibold text-[#0B1C30]">Horas 50% Apuntador</td>
                  <td className="p-3 text-center font-mono">{tabPlazoleta?.horas_apuntador?.ot50 ?? 0}</td>
                  <td className="p-3 text-right font-mono">$ {Number(tabPlazoleta?.tarifas_apuntador?.OVERTIME_50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 pr-4 text-right font-mono font-semibold">$ {Number(tabPlazoleta?.importes?.ap_ot50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 max-w-md ml-auto text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Importe Personal Normal:</span>
              <span className="font-mono font-medium">$ {Number(tabPlazoleta?.importes?.neto_sin_bonif || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Bonificación ({proforma.discount_percentage || 3}%):</span>
              <span className="font-mono">- $ {Number(tabPlazoleta?.importes?.bonificacion || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
              <span>Subtotal Plazoleta Bonificada:</span>
              <span className="font-mono text-sm">$ {Number(tabPlazoleta?.importes?.subtotal_bonificado || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
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

