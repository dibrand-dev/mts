'use client';

import React from 'react';
import { Building2, Code2, Save, Plus, Edit2, Trash2 } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Configuración del Sistema</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Administración de parámetros globales, valores maestros y preferencias de la empresa.
          </p>
        </div>
      </header>

      {/* Section 1: Form Card (Company Info) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-6 w-6 shrink-0" />
          <span>Información de la Empresa</span>
        </h2>
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="company-name">Razón Social Operativa</label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="company-name"
              type="text"
              defaultValue="MTS Logística Integral S.A."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="tax-id">CUIT Principal</label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="tax-id"
              type="text"
              defaultValue="30-71234567-8"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="support-email">Email de Soporte</label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="support-email"
              type="email"
              defaultValue="operaciones@mtslogistica.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="base-currency">Moneda Base</label>
            <select
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="base-currency"
              defaultValue="USD"
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button
              className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-5 py-2 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              type="button"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Master Variables Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#0B1C30] flex items-center gap-2">
              <Code2 className="h-6 w-6 shrink-0 text-[#1E5BB4]" />
              <span>Gestión de Variables Maestras</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Valores utilizados en cálculos automáticos y reportes.</p>
          </div>
          <button
            className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Variable</span>
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-[#0F2547] text-[#0F2547] font-bold text-xs uppercase tracking-wider">
                <th className="p-3 pl-4 sm:pl-6">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3">Última Actualización</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-4 sm:pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs text-slate-500">VAR-001</td>
                <td className="p-3 font-medium">Tasa de Seguro de Carga (%)</td>
                <td className="p-3 text-right font-mono font-semibold">1.25</td>
                <td className="p-3 text-slate-500 text-xs">12/05/2026</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right space-x-1">
                  <button className="text-[#1E5BB4] hover:text-[#004392] p-1.5 rounded-full hover:bg-blue-50 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-4 sm:pl-6 font-mono text-xs text-slate-500">VAR-002</td>
                <td className="p-3 font-medium">Tarifa Estándar de Traslados</td>
                <td className="p-3 text-right font-mono font-semibold">15.00</td>
                <td className="p-3 text-slate-500 text-xs">01/06/2026</td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </td>
                <td className="p-3 pr-4 sm:pr-6 text-right space-x-1">
                  <button className="text-[#1E5BB4] hover:text-[#004392] p-1.5 rounded-full hover:bg-blue-50 transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
