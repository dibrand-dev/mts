'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Code2,
  Save,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Shield,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MasterVariable {
  id: string;
  code: string;
  name: string;
  value: string;
  updatedAt: string;
  status: 'Activo' | 'Inactivo';
}

const INITIAL_VARIABLES: MasterVariable[] = [
  {
    id: '1',
    code: 'VAR-001',
    name: 'Tasa de Seguro de Carga (%)',
    value: '1.25',
    updatedAt: '12/05/2026',
    status: 'Activo',
  },
  {
    id: '2',
    code: 'VAR-002',
    name: 'Costo Mínimo por Tonelada (USD)',
    value: '45.00',
    updatedAt: '08/05/2026',
    status: 'Activo',
  },
  {
    id: '3',
    code: 'VAR-003',
    name: 'Margen Operativo Objetivo (%)',
    value: '18.50',
    updatedAt: '01/01/2026',
    status: 'Activo',
  },
  {
    id: '4',
    code: 'VAR-004',
    name: 'Recargo Combustible Base (USD)',
    value: '12.00',
    updatedAt: '15/12/2025',
    status: 'Inactivo',
  },
];

export default function SystemSettingsPage() {
  // Company Info State
  const [companyName, setCompanyName] = useState('MTS Logística Integral S.A.');
  const [taxId, setTaxId] = useState('30-71234567-8');
  const [supportEmail, setSupportEmail] = useState('operaciones@mtslogistica.com');
  const [baseCurrency, setBaseCurrency] = useState('USD');

  // Master Variables State
  const [variables, setVariables] = useState<MasterVariable[]>(INITIAL_VARIABLES);

  // Slideover State
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [varCode, setVarCode] = useState('');
  const [varName, setVarName] = useState('');
  const [varValue, setVarValue] = useState('');
  const [varStatus, setVarStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [slideoverError, setSlideoverError] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification({
      type: 'success',
      message: 'Parámetros de la empresa guardados correctamente.',
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenNewVar = () => {
    setEditingVarId(null);
    setVarCode(`VAR-00${variables.length + 1}`);
    setVarName('');
    setVarValue('');
    setVarStatus('Activo');
    setSlideoverError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEditVar = (v: MasterVariable) => {
    setEditingVarId(v.id);
    setVarCode(v.code);
    setVarName(v.name);
    setVarValue(v.value);
    setVarStatus(v.status);
    setSlideoverError(null);
    setIsSlideoverOpen(true);
  };

  const handleDeleteVar = (id: string) => {
    if (!confirm('¿Deseas eliminar esta variable maestra?')) return;
    setVariables((prev) => prev.filter((v) => v.id !== id));
    setNotification({
      type: 'success',
      message: 'Variable maestra eliminada.',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!varName.trim()) {
      setSlideoverError('Por favor ingresa el nombre de la variable.');
      return;
    }
    if (!varValue.trim()) {
      setSlideoverError('Por favor ingresa el valor numérico o porcentual.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('es-AR');

    if (editingVarId) {
      setVariables((prev) =>
        prev.map((v) =>
          v.id === editingVarId
            ? {
                ...v,
                code: varCode.trim() || v.code,
                name: varName.trim(),
                value: varValue.trim(),
                status: varStatus,
                updatedAt: todayStr,
              }
            : v
        )
      );
      setNotification({
        type: 'success',
        message: 'Variable maestra actualizada exitosamente.',
      });
    } else {
      const newVar: MasterVariable = {
        id: String(Date.now()),
        code: varCode.trim() || `VAR-00${variables.length + 1}`,
        name: varName.trim(),
        value: varValue.trim(),
        status: varStatus,
        updatedAt: todayStr,
      };
      setVariables((prev) => [...prev, newVar]);
      setNotification({
        type: 'success',
        message: 'Nueva variable maestra creada exitosamente.',
      });
    }

    setIsSlideoverOpen(false);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Configuración del Sistema</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Administración de parámetros globales, valores maestros y preferencias de la empresa.
          </p>
        </div>
      </header>

      {/* Notifications Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-xs animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Account Security Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#1E5BB4]/10 p-3 rounded-xl text-[#1E5BB4]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0B1C30]">Seguridad y Acceso de la Cuenta</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Modifica la clave de acceso corporativa y gestiona las credenciales de tu usuario.
            </p>
          </div>
        </div>
        <Link
          href="/change-password"
          className="w-full sm:w-auto bg-[#0F2547] hover:bg-[#1E5BB4] text-white font-semibold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <KeyRound className="h-4 w-4 text-[#0EA5E9]" />
          <span>Cambiar Contraseña</span>
        </Link>
      </section>

      {/* Section 1: Form Card (Company Info) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-6 w-6 shrink-0" />
          <span>Información de la Empresa</span>
        </h2>
        <form onSubmit={handleSaveCompanyInfo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white" htmlFor="company-name">
              Razón Social Operativa
            </label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white" htmlFor="tax-id">
              CUIT Principal
            </label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="tax-id"
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white" htmlFor="support-email">
              Email de Soporte
            </label>
            <input
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="support-email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-semibold text-white" htmlFor="base-currency">
              Moneda Base
            </label>
            <select
              className="bg-white text-[#0B1C30] border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1E5BB4]"
              id="base-currency"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-5 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
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
            onClick={handleOpenNewVar}
            className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
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
              {variables.map((v, idx) => (
                <tr
                  key={v.id}
                  className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                  <td className="p-3 pl-4 sm:pl-6 font-mono text-xs text-slate-600 font-semibold">{v.code}</td>
                  <td className="p-3 font-medium">{v.name}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#0B1C30]">{v.value}</td>
                  <td className="p-3 text-slate-500 text-xs font-mono">{v.updatedAt}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        v.status === 'Activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 pr-4 sm:pr-6 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEditVar(v)}
                      className="text-[#1E5BB4] hover:text-[#004392] p-1.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVar(v.id)}
                      className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {variables.length} variables maestras</span>
        </div>
      </section>

      {/* Slideover: Alta / Edición de Variable Maestra */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSlideoverOpen(false)}
          />

          <div className="relative w-screen max-w-md bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="font-bold text-lg sm:text-xl text-white">
                {editingVarId ? 'Editar Variable Maestra' : 'Alta de Variable Maestra'}
              </h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveVariable} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {slideoverError && (
                <div className="p-3 bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{slideoverError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Código Identificador</label>
                <input
                  type="text"
                  placeholder="Ej: VAR-001"
                  value={varCode}
                  onChange={(e) => setVarCode(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Nombre de la Variable</label>
                <input
                  type="text"
                  placeholder="Ej: Costo Operativo por Turno"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Valor Numérico / Porcentaje</label>
                <input
                  type="text"
                  placeholder="Ej: 15.50"
                  value={varValue}
                  onChange={(e) => setVarValue(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-white">Estado</label>
                <select
                  value={varStatus}
                  onChange={(e) => setVarStatus(e.target.value as 'Activo' | 'Inactivo')}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="pt-6 border-t border-[#0F2547]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm text-[#0F2547] bg-white border-2 border-transparent hover:border-[#0F2547] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95"
                >
                  {editingVarId ? 'Guardar Cambios' : 'Crear Variable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

