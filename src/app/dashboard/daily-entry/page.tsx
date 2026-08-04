'use client';

import React from 'react';

export default function DailyEntryPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0B1C30]">Carga Diaria de Horas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Registro de turnos, conceptos y personal operativo.
        </p>
      </div>

      {/* Section 1: Shift Parameters */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Parámetros del Turno</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Fecha del Turno</label>
            <input
              type="date"
              className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Cliente</label>
            <select className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]">
              <option>Seleccionar Cliente</option>
              <option>Terminal Puerto Rosario S.A.</option>
              <option>DP World Buenos Aires</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Ubicación / Muelle</label>
            <select className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]">
              <option>Seleccionar Ubicación</option>
              <option>Muelle Sur - Sitio 1</option>
              <option>Muelle Norte - Sitio 2</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 2: Add Staff Form */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Ingresar Personal al Turno</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-sm font-medium">Empleado</label>
            <input
              type="text"
              placeholder="Buscar por legajo o nombre..."
              className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-sm font-medium">Función / Puesto</label>
            <select className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]">
              <option>Seleccionar Función</option>
              <option>Capataz de Operaciones</option>
              <option>Apuntador</option>
              <option>Conductor / Chofer</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Hs. Normales</label>
            <input
              type="number"
              defaultValue={8}
              className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
            />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Hs. Extras (50%)</label>
            <input
              type="number"
              defaultValue={0}
              className="w-full p-2 border-2 border-[#0F2547] rounded-lg bg-white text-[#0B1C30] focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button className="bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-6 py-2 flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Agregar Legajo
          </button>
        </div>
      </section>

      {/* Section 3: Staff List */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[#0B1C30]">Detalle de Novedades del Turno</h2>
          <span className="text-sm text-slate-500 font-medium">Total Registros: 2</span>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-[#0F2547] text-[#0F2547] font-bold text-xs uppercase tracking-wider">
                <th className="p-3 pl-6">Legajo</th>
                <th className="p-3">Nombre y Apellido</th>
                <th className="p-3">Función</th>
                <th className="p-3 text-center">Hs. Norm.</th>
                <th className="p-3 text-center">Hs. 50%</th>
                <th className="p-3 text-center">Hs. 100%</th>
                <th className="p-3 text-center">Viáticos</th>
                <th className="p-3 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-6 font-mono text-xs text-slate-500">LEG-1002</td>
                <td className="p-3 font-medium">González, Juan Carlos</td>
                <td className="p-3">Capataz de Operaciones</td>
                <td className="p-3 text-center font-mono">8</td>
                <td className="p-3 text-center font-mono">2</td>
                <td className="p-3 text-center font-mono">0</td>
                <td className="p-3 text-center font-mono">$ 15.000</td>
                <td className="p-3 pr-6 text-right space-x-2">
                  <button className="text-[#1E5BB4] hover:text-[#004392] p-1 rounded-full hover:bg-blue-50 transition-colors" title="Editar">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-3 pl-6 font-mono text-xs text-slate-500">LEG-1045</td>
                <td className="p-3 font-medium">Martínez, Pedro Luis</td>
                <td className="p-3">Apuntador</td>
                <td className="p-3 text-center font-mono">8</td>
                <td className="p-3 text-center font-mono">0</td>
                <td className="p-3 text-center font-mono">0</td>
                <td className="p-3 text-center font-mono">$ 10.000</td>
                <td className="p-3 pr-6 text-right space-x-2">
                  <button className="text-[#1E5BB4] hover:text-[#004392] p-1 rounded-full hover:bg-blue-50 transition-colors" title="Editar">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors" title="Eliminar">
                    <span className="material-symbols-outlined text-sm">delete</span>
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
