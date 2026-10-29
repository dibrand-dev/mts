'use client';

import {
  Building2,
  Car,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { InvoicingRecord } from '@/lib/services/invoicing';
import { buildFortnightDepositDays } from '@/lib/services/invoicing/strategies/fixed-deposit.strategy';

interface Props {
  proforma: InvoicingRecord;
}

export function FixedDepositViewer({ proforma }: Props) {
  const payload = proforma.calculation_payload as any;
  const sector = payload?.sector || 'Depósito Nacional y Depósito Fiscal';
  const abonoQuincenal = payload?.abono_quincenal || 0;
  const horasExtras = payload?.horas_extras;
  const transporte = payload?.transporte;
  const isArroz = sector.toLowerCase().includes('arroz');
  const tramosCount =
    Number(transporte?.tramos || 0) >= 15
      ? Number(transporte?.tramos)
      : isArroz
      ? Number(transporte?.tramos || 7)
      : 15.0;
  const tarifaTramo = Number(transporte?.tarifa_tramo || 37249.77);
  const totalTransporte = tramosCount * tarifaTramo;
  const notes = proforma.notes?.length ? proforma.notes : payload?.notes || [];
  const opDates = String(proforma.operation_dates || payload?.operation_dates || '');
  const isQ1Dates = opDates.includes('1-15') || opDates.includes('01-15') || opDates.toLowerCase().includes('primera');
  const isQ2 = !isQ1Dates && String(proforma.fortnight_period || '').toUpperCase().includes('Q2');
  const fromDate = payload?.from_date || (isQ2 ? '2026-10-16' : '2026-10-01');
  const toDate = payload?.to_date || (isQ2 ? '2026-10-31' : '2026-10-15');

  // Fallback blocks if proforma was generated before `depositos` array existed
  const rawDepositos: any[] =
    payload?.depositos && Array.isArray(payload.depositos) && payload.depositos.length > 0
      ? payload.depositos
      : sector.toLowerCase().includes('arroz')
      ? [
          {
            code: 'arroz',
            title: 'DEPOSITO ARROZ',
            apuntadorLabel: 'APUNTADOR 1',
            tarifaLabel: 'TARIFA MENSUAL BONIFICADA 1',
            tarifaMensual: 0,
            importeQuincena: 0,
            hs50: horasExtras?.hs_50 || 0,
            tarifa50: horasExtras?.tarifa_50 || 46591.18,
            importe50: horasExtras?.imp_50 || 0,
            hs100: horasExtras?.hs_100 || 0,
            tarifa100: horasExtras?.tarifa_100 || 62121.57,
            importe100: horasExtras?.imp_100 || 0,
            importeTotalBlock: (horasExtras?.imp_50 || 0) + (horasExtras?.imp_100 || 0),
            totalNormales: 0,
            totalTte: transporte?.tramos || 7,
            turnos: [],
          },
        ]
      : [
          {
            code: 'nacional',
            title: 'DEPOSITO NACIONAL',
            apuntadorLabel: 'APUNTADOR 1',
            tarifaLabel: 'TARIFA MENSUAL BONIFICADA 1',
            tarifaMensual: 5466694.70,
            importeQuincena: abonoQuincenal > 3000000 ? abonoQuincenal / 2 : abonoQuincenal || 2733347.35,
            hs50: horasExtras?.hs_50 || 0,
            tarifa50: horasExtras?.tarifa_50 || 46591.18,
            importe50: horasExtras?.imp_50 || 0,
            hs100: horasExtras?.hs_100 || 0,
            tarifa100: horasExtras?.tarifa_100 || 62121.57,
            importe100: horasExtras?.imp_100 || 0,
            importeTotalBlock:
              (abonoQuincenal > 3000000 ? abonoQuincenal / 2 : abonoQuincenal || 2733347.35) +
              (horasExtras?.imp_50 || 0) +
              (horasExtras?.imp_100 || 0),
            totalNormales: 80,
            totalTte: 10.0,
            turnos: [],
          },
          {
            code: 'fiscal',
            title: 'DEPOSITO FISCAL',
            apuntadorLabel: 'APUNTADOR 2',
            tarifaLabel: 'TARIFA MENSUAL BONIFICADA 2',
            tarifaMensual: 5466694.70,
            importeQuincena: abonoQuincenal > 3000000 ? abonoQuincenal / 2 : abonoQuincenal || 2733347.35,
            hs50: 0,
            tarifa50: horasExtras?.tarifa_50 || 46591.18,
            importe50: 0,
            hs100: 0,
            tarifa100: horasExtras?.tarifa_100 || 62121.57,
            importe100: 0,
            importeTotalBlock: abonoQuincenal > 3000000 ? abonoQuincenal / 2 : abonoQuincenal || 2733347.35,
            totalNormales: 80,
            totalTte: 5.0,
            turnos: [],
          },
        ];

  const depositos = rawDepositos.map((dep) => {
    const depCode: 'nacional' | 'fiscal' | 'arroz' =
      dep.code === 'fiscal' || String(dep.title || '').toUpperCase().includes('FISCAL')
        ? 'fiscal'
        : dep.code === 'arroz' || String(dep.title || '').toUpperCase().includes('ARROZ')
        ? 'arroz'
        : 'nacional';
    const turnos = buildFortnightDepositDays(
      fromDate,
      toDate,
      depCode,
      Array.isArray(dep.turnos) ? dep.turnos : []
    );
    return {
      ...dep,
      code: depCode,
      turnos,
    };
  });

  return (
    <div className="space-y-6">
      {/* Cabecera de Servicio Depósitos Delta Dock */}
      <div className="bg-[#0B1C30] text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1E5BB4] rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
              {payload?.lugar || 'DELTA DOCK - LIMA'} • SERVICIO: {payload?.servicio || 'DESPACHO BOLSONES'}
            </span>
            <h4 className="text-base font-bold text-white">{sector}</h4>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {depositos.map((dep, idx) => (
            <div key={idx} className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-right">
              <span className="text-[10px] uppercase font-bold text-sky-300 block">
                {dep.title} ({dep.apuntadorLabel})
              </span>
              <span className="font-mono text-sm font-extrabold text-white">
                $ {Number(dep.importeTotalBlock || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Layout estilo Hoja Excel Delta Dock: Izquierda Liquidación de los 2 Depósitos / Derecha Grillas por Depósito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Liquidación de Depósito Nacional (Apuntador 1), Depósito Fiscal (Apuntador 2) y Transporte */}
        <div className="lg:col-span-5 space-y-4">
          {depositos.map((dep, idx) => (
            <div
              key={idx}
              className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white"
            >
              <div className="bg-sky-50 px-4 py-2.5 border-b border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E5BB4] block">
                    {dep.title}
                  </span>
                  <h5 className="text-xs font-extrabold text-[#0B1C30] uppercase">
                    {dep.apuntadorLabel} — {dep.tarifaLabel}
                  </h5>
                </div>
                <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-sky-200 text-[#0B1C30]">
                  TTE: {Number(dep.totalTte || 0).toFixed(2)} tramos
                </span>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-100">
                  <span className="font-semibold">{dep.tarifaLabel}:</span>
                  <span className="font-mono text-slate-800">
                    $ {Number(dep.tarifaMensual || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-[#0B1C30] pb-1.5 border-b border-slate-100 bg-slate-50/70 px-2 py-1 rounded">
                  <span>IMPORTE QUINCENA:</span>
                  <span className="font-mono text-sm text-[#1E5BB4]">
                    $ {Number(dep.importeQuincena || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 pt-1">
                  <span>HORAS 50% ({Number(dep.hs50 || 0).toFixed(1)} hs a $ {Number(dep.tarifa50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}):</span>
                  <span className="font-mono font-semibold text-[#0B1C30]">
                    $ {Number(dep.importe50 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 pb-1.5 border-b border-slate-100">
                  <span>HORAS 100% ({Number(dep.hs100 || 0).toFixed(1)} hs a $ {Number(dep.tarifa100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}):</span>
                  <span className="font-mono font-semibold text-[#0B1C30]">
                    $ {Number(dep.importe100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 font-extrabold text-[#0B1C30] text-xs bg-amber-50/70 px-2.5 py-2 rounded-lg border border-amber-200">
                  <span>IMPORTE TOTAL {dep.apuntadorLabel}:</span>
                  <span className="font-mono text-sm text-amber-950">
                    $ {Number(dep.importeTotalBlock || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Transporte Diario por Tramos */}
          <div className="border-2 border-purple-200 rounded-xl overflow-hidden shadow-xs bg-white">
            <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-200 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-purple-700" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-950">
                Transporte Diario Personal (Tramos)
              </h4>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">TRANSPORTE DIARIO PERSONAL (Tarifa):</span>
                <span className="font-mono text-[#0B1C30]">
                  $ {tarifaTramo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-semibold">TRAMOS COMPUTADOS:</span>
                <span className="font-mono font-bold text-purple-900">
                  {tramosCount.toFixed(2)} tramos
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 font-extrabold text-purple-950 bg-purple-50/60 px-2.5 py-2 rounded-lg border border-purple-200">
                <span>IMPORTE TOTAL TTE. PERSONAL:</span>
                <span className="font-mono text-sm">
                  $ {totalTransporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Tablas de Turnos de Depósito Nacional y Depósito Fiscal */}
        <div className="lg:col-span-7 space-y-5">
          {depositos.map((dep, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1C30] flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-[#1E5BB4]" />
                  <span>{dep.title} — {dep.apuntadorLabel}</span>
                </h4>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    Hs 50%: <strong>{Number(dep.hs50 || 0).toFixed(1)}</strong>
                  </span>
                  <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-800 font-bold">
                    Total TTE: {Number(dep.totalTte || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase sticky top-0">
                    <tr>
                      <th className="p-2 pl-3">Depósito</th>
                      <th className="p-2">Puesto</th>
                      <th className="p-2">Apellido y Nombre</th>
                      <th className="p-2 text-center">Fecha</th>
                      <th className="p-2 text-center">Desde-Hasta</th>
                      <th className="p-2 text-center">Hs</th>
                      <th className="p-2 text-center">Norm</th>
                      <th className="p-2 text-center">50%</th>
                      <th className="p-2 pr-3 text-center text-purple-800">TTE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {dep.turnos && dep.turnos.length > 0 ? (
                      dep.turnos.map((t: any, rIdx: number) => {
                        const isFeriado = Boolean(t.isHoliday) || String(t.apellido || '').toUpperCase() === 'FERIADO';
                        const rawDate = String(t.fecha || '');
                        const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                          ? rawDate.split('-').reverse().join('/')
                          : rawDate;
                        return (
                          <tr
                            key={rIdx}
                            className={
                              isFeriado
                                ? 'bg-amber-50/80 text-amber-900 font-bold'
                                : 'hover:bg-slate-50'
                            }
                          >
                            <td className="p-2 pl-3 font-bold text-[#0B1C30] whitespace-nowrap">{t.buque}</td>
                            <td className="p-2 font-mono text-slate-700 whitespace-nowrap">{t.puesto}</td>
                            <td className={`p-2 whitespace-nowrap ${isFeriado ? 'text-amber-800 font-extrabold uppercase' : 'text-slate-800'}`}>
                              {t.apellido}
                            </td>
                            <td className="p-2 text-center font-mono text-slate-600 whitespace-nowrap">{formattedDate}</td>
                            <td className="p-2 text-center font-mono text-slate-600">{t.desdeHasta}</td>
                            <td className="p-2 text-center font-mono font-bold">{isFeriado ? '' : t.horas || ''}</td>
                            <td className="p-2 text-center font-mono">{isFeriado ? '' : t.normales || ''}</td>
                            <td className="p-2 text-center font-mono text-sky-700">{isFeriado ? '' : t.hs50 || ''}</td>
                            <td className="p-2 pr-3 text-center font-mono font-bold text-purple-800">
                              {!isFeriado && t.tte ? Number(t.tte).toFixed(t.tte % 1 !== 0 ? 2 : 1) : ''}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-500">
                          Abono quincenal computable ({dep.title} — {dep.apuntadorLabel} • TTE por jornada: {dep.code === 'fiscal' ? '0.50' : '1.00'} tramo)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notas */}
      {notes.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-amber-600" />
            Notas de Liquidación Depósitos Delta Dock
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
