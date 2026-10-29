'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Users,
  Clock,
  Car,
  Layers,
  Info,
  DollarSign,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';
import {
  getNormalizedOperativaRows,
  getNormalizedPlusRows,
  getNormalizedCompensacionRows,
  getNormalizedEncargadoRows,
} from '@/lib/services/invoicing/vessel-roster-defaults';

interface Props {
  proforma: InvoicingRecord;
}

export function VesselViewer({ proforma }: Props) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'plus' | 'compensacion' | 'encargado'>('resumen');

  const payload = proforma.calculation_payload as any;
  const tab1 = payload?.tab1_resumen_general;
  const tab2 = payload?.tab2_encargado_a_bordo;
  const tab3 = payload?.tab3_hs_compensacion;
  const tabPlus = payload?.tab_plus || {};
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];
  const vesselDisplay = proforma.vessel_name || payload?.vessel_name || 'GOODWOOD';
  const isBarge = Boolean(
    proforma.proforma_type === 'barge' ||
    payload?.is_barge ||
    payload?.proforma_type === 'barge' ||
    vesselDisplay.toUpperCase().includes('JACKSON') ||
    vesselDisplay.toUpperCase().includes('INQUEBRANTABLE') ||
    vesselDisplay.toUpperCase().includes('BARCAZA') ||
    (Number(proforma.subtotal_compensacion || 0) === 0 &&
      Number(proforma.subtotal_encargado || 0) === 0 &&
      !vesselDisplay.toUpperCase().includes('GOODWOOD') &&
      !vesselDisplay.toUpperCase().includes('BRASILIA'))
  );

  // Normalized rosters for each sheet
  const operativaRows = getNormalizedOperativaRows(payload);
  const plusRows = getNormalizedPlusRows(payload);
  const compRows = getNormalizedCompensacionRows(payload);
  const encRows = getNormalizedEncargadoRows(payload);

  const opTotals = operativaRows.reduce(
    (acc, r) => ({
      hs: acc.hs + Number(r.horas || 0),
      norm: acc.norm + Number(r.normales || 0),
      ot50: acc.ot50 + Number(r.ot50 || 0),
      ot100: acc.ot100 + Number(r.ot100 || 0),
      remises: acc.remises + Number(r.remises || 0),
    }),
    { hs: 0, norm: 0, ot50: 0, ot100: 0, remises: 0 }
  );

  const plusTotals = plusRows.reduce(
    (acc, r) => ({
      hs: acc.hs + Number(r.horas || 0),
      norm: acc.norm + Number(r.normales || 0),
      ot50: acc.ot50 + Number(r.ot50 || 0),
      ot100: acc.ot100 + Number(r.ot100 || 0),
      plus: acc.plus + Number(r.plus || 0),
      hsNormEq: acc.hsNormEq + Number(r.hsNormEq || 0),
      incidHe: acc.incidHe + Number(r.incidHe || 0),
    }),
    { hs: 0, norm: 0, ot50: 0, ot100: 0, plus: 0, hsNormEq: 0, incidHe: 0 }
  );

  const compTotals = compRows.reduce(
    (acc, r) => ({
      hs: acc.hs + Number(r.horas || 0),
      norm: acc.norm + Number(r.normales || 0),
      ot50: acc.ot50 + Number(r.ot50 || 0),
      ot100: acc.ot100 + Number(r.ot100 || 0),
    }),
    { hs: 0, norm: 0, ot50: 0, ot100: 0 }
  );

  const encTotals = encRows.reduce(
    (acc, r) => ({
      hs: acc.hs + Number(r.horas || 0),
      norm: acc.norm + Number(r.normales || 0),
      ot50: acc.ot50 + Number(r.ot50 || 0),
      ot100: acc.ot100 + Number(r.ot100 || 0),
    }),
    { hs: 0, norm: 0, ot50: 0, ot100: 0 }
  );

  const cp = tab2?.cuadro_plus || {};
  const cantEnc = Number(cp.cantidad_encargados ?? 2);
  const plusUnitEnc = Number(cp.plus_unitario ?? 143503.03);
  const totalPlusBaseEnc = Number(cp.total_plus_base ?? Math.round(cantEnc * plusUnitEnc * 100) / 100);
  const hsNormEqEnc = Number(cp.horas_norm_eq ?? (encTotals.ot50 * 1.5 + encTotals.ot100 * 2 || 84));
  const incidHeEnc = Number(cp.incidencia_he ?? (Math.round((plusUnitEnc / 192) * hsNormEqEnc * 100) / 100 || 125565.15));
  const netoPlusEnc = Number(cp.neto_plus ?? Math.round((totalPlusBaseEnc + incidHeEnc) * 100) / 100);
  const coefEnc = Number(cp.coeficiente ?? 0.52);
  const coefMontoEnc = Number(cp.coeficiente_monto ?? Math.round(netoPlusEnc * coefEnc * 100) / 100);
  const totalPlusFactEnc = Number(cp.total_facturar_plus ?? Number(tab2?.totales?.plus || Math.round((netoPlusEnc + coefMontoEnc) * 100) / 100));

  return (
    <div className="space-y-6">
      {/* Tab Navigation: For Barcaza (Cap Jackson), show ONLY 2 tabs (Operativa and Plus). Ultramar vessels show all 4 tabs */}
      {isBarge ? (
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span>{vesselDisplay} OPERATIVA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plus')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'plus'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>PLUS</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 bg-slate-100/80 p-1.5 rounded-xl gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('resumen')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'resumen'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span>{vesselDisplay} OPERATIVA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plus')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'plus'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>PLUS (Con Encargados)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compensacion')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'compensacion'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>HS COMPENSACIÓN</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('encargado')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'encargado'
                ? 'bg-[#0B1C30] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#0B1C30] hover:bg-white/60'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>ENCARGADO A BORDO</span>
          </button>
        </div>
      )}

      {/* TAB 1: RESUMEN GENERAL & OPERATIVA (SÓLO APUNTADORES) */}
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

          {/* Subtotales Consolidado */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#1E5BB4]" />
              Consolidado General de Proforma
            </h4>
            <div className={`grid grid-cols-1 ${isBarge ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-3.5`}>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">Subtotal Operativa</span>
                <span className="text-lg font-mono font-extrabold text-[#0B1C30] block">
                  $ {Number(tab1?.consolidado?.subtotal_operativa || proforma.subtotal_operativa || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isBarge ? 'Peritaje Calidad y Tally + Plus + Transporte' : 'Vehículos, apuntadores y remises'}
                </span>
              </div>

              {!isBarge && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Planilla de Turnos Operativa */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider">
                  Detalle de Puestos y Turnos — {vesselDisplay} OPERATIVA {isBarge ? '(Barcaza)' : '(Sólo Apuntadores)'}
                </h4>
                <p className="text-[11px] text-sky-200">
                  {isBarge
                    ? 'Columna PUESTO indica el puesto operativo de cada empleado (ENCARGADO A BORDO, COLECTADO, DAÑOS, RAMPA) con su turno asignado.'
                    : 'Columna PUESTO indica el puesto operativo (RAMPA, DAÑOS, RELEVO). Los Encargados se excluyen de esta planilla y figuran en PLUS y ENCARGADO A BORDO.'}
                </p>
              </div>
              <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded border border-white/20">
                {operativaRows.length} turnos operativos
              </span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5 text-center">Turno</th>
                    <th className="p-2.5 text-center">(*)</th>
                    <th className="p-2.5">Puesto</th>
                    <th className="p-2.5">Apellido y Nombre</th>
                    <th className="p-2.5 text-center">Fecha</th>
                    <th className="p-2.5 text-center">Desde-Hasta</th>
                    <th className="p-2.5 text-right">HS</th>
                    <th className="p-2.5 text-right">Norm</th>
                    <th className="p-2.5 text-right">50%</th>
                    <th className="p-2.5 text-right">100%</th>
                    <th className="p-2.5 text-right pr-4">Remises</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {operativaRows.map((r, i) => {
                    const isFirstOfGroup = i === 0 || r.turnoGroup !== operativaRows[i - 1]?.turnoGroup;
                    return (
                      <tr key={i} className={isFirstOfGroup ? 'border-t-2 border-slate-300 bg-slate-50/50' : 'hover:bg-slate-50'}>
                        <td className="p-2 text-center font-mono font-extrabold text-[#0F2547]">{r.turno}</td>
                        <td className="p-2 text-center font-mono font-bold text-amber-700">{r.notaMark}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-[#0F2547] border border-sky-300">
                            {r.puesto}
                          </span>
                        </td>
                        <td className="p-2 font-semibold text-[#0B1C30]">{r.apellido}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{r.fecha}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{r.desdeHasta}</td>
                        <td className="p-2 text-right font-mono font-bold">{r.horas}</td>
                        <td className="p-2 text-right font-mono text-emerald-700">{r.normales}</td>
                        <td className="p-2 text-right font-mono text-sky-700">{r.ot50}</td>
                        <td className="p-2 text-right font-mono text-amber-700 font-bold">{r.ot100}</td>
                        <td className="p-2 text-right font-mono pr-4">{r.remises || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-extrabold text-[#0B1C30] border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="p-2.5 pl-4 uppercase">Totales Operativa</td>
                    <td className="p-2.5 text-right font-mono">{opTotals.hs}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-800">{opTotals.norm}</td>
                    <td className="p-2.5 text-right font-mono text-sky-800">{opTotals.ot50}</td>
                    <td className="p-2.5 text-right font-mono text-amber-800">{opTotals.ot100}</td>
                    <td className="p-2.5 text-right font-mono pr-4">{opTotals.remises}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLUS (CON ENCARGADOS Y APUNTADORES) */}
      {activeTab === 'plus' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider">
                  Planilla de Plus e Incidencia Horas Extras — {vesselDisplay} (Incluye Encargados y Apuntadores)
                </h4>
                <p className="text-[11px] text-sky-200">
                  Incluye a los Encargados (`ENCARGADO`) y Apuntadores con sus puestos operativos (`RAMPA`, `DAÑOS`, `RELEVO`).
                </p>
              </div>
              <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded border border-white/20">
                {plusRows.length} registros
              </span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase sticky top-0">
                  <tr>
                    <th className="p-2.5 pl-4">Puesto</th>
                    <th className="p-2.5">Apellido y Nombre</th>
                    <th className="p-2.5 text-center">Fecha</th>
                    <th className="p-2.5 text-center">Desde-Hasta</th>
                    <th className="p-2.5 text-right">Total Hs</th>
                    <th className="p-2.5 text-right">Normal</th>
                    <th className="p-2.5 text-right">50%</th>
                    <th className="p-2.5 text-right">100%</th>
                    <th className="p-2.5 text-right">Plus ($)</th>
                    <th className="p-2.5 text-right">Hs.Norm.</th>
                    <th className="p-2.5 text-right pr-4">Incid HE ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {plusRows.map((r, i) => {
                    const isEnc = r.puesto === 'ENCARGADO';
                    return (
                      <tr key={i} className={isEnc ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'}>
                        <td className="p-2 pl-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              isEnc
                                ? 'bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-sky-100 text-[#0F2547] border-sky-300'
                            }`}
                          >
                            {r.puesto}
                          </span>
                        </td>
                        <td className="p-2 font-semibold text-[#0B1C30]">{r.apellido}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{r.fecha}</td>
                        <td className="p-2 text-center font-mono text-slate-600">{r.desdeHasta}</td>
                        <td className="p-2 text-right font-mono">{r.horas}</td>
                        <td className="p-2 text-right font-mono">{r.normales}</td>
                        <td className="p-2 text-right font-mono">{r.ot50}</td>
                        <td className="p-2 text-right font-mono">{r.ot100}</td>
                        <td className="p-2 text-right font-mono text-emerald-700">
                          {r.plus > 0 ? `$ ${r.plus.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="p-2 text-right font-mono">{r.hsNormEq}</td>
                        <td className="p-2 text-right font-mono pr-4">
                          $ {r.incidHe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-extrabold text-[#0B1C30] border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="p-2.5 pl-4 uppercase">Totales Planilla Plus</td>
                    <td className="p-2.5 text-right font-mono">{plusTotals.hs}</td>
                    <td className="p-2.5 text-right font-mono">{plusTotals.norm}</td>
                    <td className="p-2.5 text-right font-mono">{plusTotals.ot50}</td>
                    <td className="p-2.5 text-right font-mono">{plusTotals.ot100}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-800">
                      $ {plusTotals.plus.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right font-mono">{plusTotals.hsNormEq}</td>
                    <td className="p-2.5 text-right font-mono pr-4">
                      $ {plusTotals.incidHe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 max-w-md ml-auto text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Plus Base Operativo:</span>
              <span className="font-mono font-medium">
                $ {Number(tabPlus.plus_base ?? plusTotals.plus).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Incidencia Plus Rem. en Hs. Extras:</span>
              <span className="font-mono font-medium">
                $ {Number(tabPlus.incidencia_he ?? plusTotals.incidHe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#0B1C30] border-t border-slate-200 pt-2">
              <span>Neto Plus + Inc. Hs. Extras:</span>
              <span className="font-mono">
                $ {Number(tabPlus.neto_plus ?? plusTotals.plus + plusTotals.incidHe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Coeficiente costos ({tabPlus.coeficiente ?? 0.52}):</span>
              <span className="font-mono">
                $ {Number(tabPlus.coeficiente_monto ?? 1871757.86).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
              <span>Total a Facturar por Plus e Inc. HE:</span>
              <span className="font-mono text-sm">
                $ {Number(tabPlus.total_facturar_plus ?? 5471292.19).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HS COMPENSACION (CON DETALLE DE PERSONAL Y HORAS) */}
      {activeTab === 'compensacion' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Conceptos y Liquidación */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#1E5BB4]" />
                    Liquidación Horas Compensación
                  </h4>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-2.5 pl-3">Concepto</th>
                      <th className="p-2.5 text-right">Tarifa</th>
                      <th className="p-2.5 pr-3 text-right">Importe ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {tab3?.conceptos?.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">{c.concepto}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{c.tarifa}</td>
                        <td className="p-2.5 pr-3 text-right font-mono font-semibold text-[#0B1C30]">
                          $ {Number(c.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Importe Personal Normal / Neto:</span>
                  <span className="font-mono font-medium">
                    $ {Number(tab3?.totales?.neto_factura || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Bonificación ({tab3?.totales?.bonificacion_pct || 3}%):</span>
                  <span className="font-mono">
                    - $ {Number(tab3?.totales?.bonificacion_monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
                  <span>Subtotal Factura Bonificada:</span>
                  <span className="font-mono text-sm">
                    $ {Number(tab3?.totales?.subtotal_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (21%):</span>
                  <span className="font-mono">
                    $ {Number(tab3?.totales?.iva || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-[#0B1C30] border-t border-slate-200 pt-2">
                  <span>Total Factura Bonificada:</span>
                  <span className="font-mono text-sm">
                    $ {Number(tab3?.totales?.total_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Detalle de a quiénes y qué horas les corresponden */}
            <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider">
                    Detalle de Personal y Horas de Compensación (*)
                  </h4>
                  <p className="text-[11px] text-sky-200">
                    Detalle nominal de a quiénes y qué horas les corresponden por acuerdo de trabajo corrido.
                  </p>
                </div>
                <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded border border-white/20">
                  {compRows.length} registros
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="p-2.5 text-center">(*)</th>
                      <th className="p-2.5">Puesto</th>
                      <th className="p-2.5">Apellido y Nombre</th>
                      <th className="p-2.5 text-center">Fecha</th>
                      <th className="p-2.5 text-center">Desde-Hasta</th>
                      <th className="p-2.5 text-right">HS</th>
                      <th className="p-2.5 text-right">Norm</th>
                      <th className="p-2.5 text-right">50%</th>
                      <th className="p-2.5 text-right pr-4">100%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {compRows.map((r, i) => {
                      const isEnc = r.categoria === 'ENCARGADO' || r.puesto === 'ENCARGADO';
                      return (
                        <tr key={i} className={isEnc ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'}>
                          <td className="p-2 text-center font-mono font-bold text-amber-700">{r.notaMark || '(*)'}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                isEnc
                                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                                  : 'bg-sky-100 text-[#0F2547] border-sky-300'
                              }`}
                            >
                              {r.puesto || r.categoria}
                            </span>
                          </td>
                          <td className="p-2 font-semibold text-[#0B1C30]">{r.apellido}</td>
                          <td className="p-2 text-center font-mono text-slate-600">{r.fecha}</td>
                          <td className="p-2 text-center font-mono text-slate-600">{r.desdeHasta}</td>
                          <td className="p-2 text-right font-mono font-bold">{r.horas}</td>
                          <td className="p-2 text-right font-mono text-emerald-700">{r.normales}</td>
                          <td className="p-2 text-right font-mono text-sky-700">{r.ot50}</td>
                          <td className="p-2 text-right font-mono text-amber-700 font-bold pr-4">{r.ot100}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold text-[#0B1C30] border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={5} className="p-2.5 pl-4 uppercase">Totales Horas Compensación</td>
                      <td className="p-2.5 text-right font-mono">{compTotals.hs}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-800">{compTotals.norm}</td>
                      <td className="p-2.5 text-right font-mono text-sky-800">{compTotals.ot50}</td>
                      <td className="p-2.5 text-right font-mono text-amber-800 pr-4">{compTotals.ot100}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="bg-amber-50 px-4 py-2.5 border-t border-amber-200 text-[11px] font-bold text-amber-900">
                (*) NOTA: ACUERDO CON CAT PARA RECONOCER HORAS DE TRABAJO CORRIDO.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ENCARGADO A BORDO (CON DETALLE DE TURNOS Y CUADRO DE PLUS) */}
      {activeTab === 'encargado' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Liquidación Encargado a Bordo */}
            <div className="lg:col-span-5 space-y-4">
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
                      <th className="p-2.5 pl-3">Concepto</th>
                      <th className="p-2.5 text-right">Tarifa ($)</th>
                      <th className="p-2.5 pr-3 text-right">Importe ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {tab2?.conceptos?.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-3 font-semibold text-[#0B1C30]">{c.concepto}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{c.tarifa}</td>
                        <td className="p-2.5 pr-3 text-right font-mono font-semibold text-[#0B1C30]">
                          $ {Number(c.importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Importe Horas Encargados:</span>
                  <span className="font-mono font-medium">
                    $ {Number(tab2?.totales?.importe_encargados || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Plus Encargados (con Coef. 0,52):</span>
                  <span className="font-mono font-medium">
                    $ {Number(tab2?.totales?.plus || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#0B1C30] border-t border-slate-200 pt-2">
                  <span>Neto Factura Encargados:</span>
                  <span className="font-mono">
                    $ {Number(tab2?.totales?.neto_factura || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Bonificación ({tab2?.totales?.bonificacion_pct || 3}%):</span>
                  <span className="font-mono">
                    - $ {Number(tab2?.totales?.bonificacion_monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#1E5BB4] border-t border-slate-200 pt-2">
                  <span>Subtotal Factura Bonificada:</span>
                  <span className="font-mono text-sm">
                    $ {Number(tab2?.totales?.subtotal_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (21%):</span>
                  <span className="font-mono">
                    $ {Number(tab2?.totales?.iva || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-extrabold text-[#0B1C30] border-t border-slate-200 pt-2">
                  <span>Total Factura Bonificada:</span>
                  <span className="font-mono text-sm">
                    $ {Number(tab2?.totales?.total_factura_bonificada || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Detalle de Turnos de Encargado a Bordo + Cuadro de Plus de Encargados */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">
                      Detalle de Turnos y Horas — Encargados a Bordo
                    </h4>
                    <p className="text-[11px] text-sky-200">
                      Detalle nominal de quiénes cumplieron turno de Encargado a Bordo y qué horas les corresponden.
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded border border-white/20">
                    {encRows.length} turnos
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-2.5 text-center">Turno</th>
                        <th className="p-2.5">Encargado</th>
                        <th className="p-2.5 text-center">Fecha</th>
                        <th className="p-2.5 text-center">Desde-Hasta</th>
                        <th className="p-2.5 text-right">HS</th>
                        <th className="p-2.5 text-right">Norm</th>
                        <th className="p-2.5 text-right">50%</th>
                        <th className="p-2.5 text-right pr-4">100%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {encRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-mono font-extrabold text-[#0F2547]">{r.turno}</td>
                          <td className="p-2.5 font-bold text-[#0B1C30]">{r.encargado}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{r.fecha}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{r.desdeHasta}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{r.horas}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-700">{r.normales}</td>
                          <td className="p-2.5 text-right font-mono text-sky-700">{r.ot50}</td>
                          <td className="p-2.5 text-right font-mono text-amber-700 font-bold pr-4">{r.ot100}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold text-[#0B1C30] border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="p-2.5 pl-4 uppercase">Totales Horas Encargado a Bordo</td>
                        <td className="p-2.5 text-right font-mono">{encTotals.hs}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-800">{encTotals.norm}</td>
                        <td className="p-2.5 text-right font-mono text-sky-800">{encTotals.ot50}</td>
                        <td className="p-2.5 text-right font-mono text-amber-800 pr-4">{encTotals.ot100}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Cuadro de Plus de Encargados */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cálculo de Plus e Incidencia Hs. Extras — Encargados a Bordo
                  </h5>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-5 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Encargados</span>
                      <span className="font-mono font-extrabold text-sm text-[#0B1C30]">{cantEnc}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Plus Unit.</span>
                      <span className="font-mono font-bold text-slate-800">
                        $ {plusUnitEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Plus</span>
                      <span className="font-mono font-bold text-emerald-700">
                        $ {totalPlusBaseEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Horas Norm Eq.</span>
                      <span className="font-mono font-bold text-slate-800">{hsNormEqEnc}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">Incid HE</span>
                      <span className="font-mono font-bold text-sky-800">
                        $ {incidHeEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Neto Plus + Inc. Hs. Extras:</span>
                      <span className="font-mono font-semibold">
                        $ {netoPlusEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Coeficiente costos ({coefEnc}):</span>
                      <span className="font-mono">
                        $ {coefMontoEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-extrabold text-[#1E5BB4] border-t border-slate-200 pt-1.5">
                      <span>Total a Facturar por Plus e Inc. HE (Encargados):</span>
                      <span className="font-mono">
                        $ {totalPlusFactEnc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
