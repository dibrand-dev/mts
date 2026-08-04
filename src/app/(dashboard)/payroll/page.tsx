'use client';

import React from 'react';

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1C30]">Cálculo de Sueldos</h1>
          <p className="text-slate-500 text-sm mt-1">Auditoría y liquidación mensual de personal</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-300 text-[#0B1C30] hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            Exportar Pre-liquidación
          </button>
          <button className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Aprobar Mes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empleados Activos</span>
          <div className="text-2xl font-bold text-[#0B1C30] mt-2">45</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Básico Bruto</span>
          <div className="text-2xl font-bold text-[#0B1C30] mt-2">$ 8.240.000</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Anticipos</span>
          <div className="text-2xl font-bold text-red-600 mt-2">$ 450.000</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm border-l-4 border-l-[#1E5BB4]">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Neto a Pagar</span>
          <div className="text-2xl font-bold text-[#1E5BB4] mt-2">$ 7.790.000</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 border-b-2 border-[#0F2547] text-[#0F2547] text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="py-3 px-4 pl-6">Legajo</th>
              <th className="py-3 px-4">Empleado</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Total Hs Extra</th>
              <th className="py-3 px-4 text-right">Anticipos</th>
              <th className="py-3 px-4 text-right">Total Neto</th>
              <th className="py-3 px-4 pr-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-500">LEG-1042</td>
              <td className="py-3 px-4 font-semibold">BRITES LUCAS DAVID</td>
              <td className="py-3 px-4">
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full border border-slate-200 font-medium">Jornal</span>
              </td>
              <td className="py-3 px-4 text-right font-mono">32h</td>
              <td className="py-3 px-4 text-right font-mono text-red-600">-$ 15.000</td>
              <td className="py-3 px-4 text-right font-mono font-bold text-[#1E5BB4]">$ 342.500</td>
              <td className="py-3 px-4 pr-6 text-center">
                <button className="text-[#1E5BB4] hover:text-[#004392] p-1 rounded-full hover:bg-blue-50 transition-colors" title="Ver Detalle">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
