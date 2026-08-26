'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  ChevronDown,
  Building2,
  Receipt,
  DollarSign,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  TrendingUp,
  CreditCard,
  Building,
  Landmark,
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'flujo'>('dashboard');
  const [dashboardDate, setDashboardDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [flujoDate, setFlujoDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Accordion open states (all open by default for rich visibility)
  const [openAccordionsDash, setOpenAccordionsDash] = useState<Record<string, boolean>>({
    proformas: true,
    facturasEnviar: true,
    facturasCobrar: true,
  });

  const [openAccordionsFlujo, setOpenAccordionsFlujo] = useState<Record<string, boolean>>({
    proformasFlujo: true,
    facturasEnviarFlujo: true,
    facturasCobrarFlujo: true,
  });

  const toggleAccordionDash = (key: string) => {
    setOpenAccordionsDash((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAccordionFlujo = (key: string) => {
    setOpenAccordionsFlujo((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Top Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'dashboard'
              ? 'text-[#002d67] border-[#002d67] font-bold'
              : 'text-slate-500 border-transparent hover:text-[#0b1c30]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flujo')}
          className={`px-5 py-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'flujo'
              ? 'text-[#002d67] border-[#002d67] font-bold'
              : 'text-slate-500 border-transparent hover:text-[#0b1c30]'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Flujo de Caja</span>
        </button>
      </div>

      {/* VIEW 1: Dashboard (Situación al Día de Hoy) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30]">Situación al Día de Hoy</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Métricas operativas consolidadas y estados de comprobantes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  value={dashboardDate}
                  onChange={(e) => setDashboardDate(e.target.value)}
                  className="bg-white border border-slate-300 text-[#0b1c30] text-sm font-medium rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#002d67] focus:border-[#002d67] outline-none shadow-xs"
                />
              </div>
            </div>
          </header>

          {/* KPI Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Saldo Banco */}
            <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo Banco</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] font-mono">$4,520,300.00</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Landmark className="h-3.5 w-3.5 text-slate-400" />
                <span>Disponible en cuentas operativas</span>
              </div>
            </article>

            {/* Card 2: Total Facturado en el Mes */}
            <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Facturado en el Mes
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] font-mono">$8,900,150.00</h2>
              </div>
              <div className="pt-2">
                <Link
                  href="/invoicing"
                  className="text-[#0EA5E9] hover:text-[#004392] text-xs font-bold hover:underline inline-flex items-center group"
                >
                  Ver Detalles{' '}
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>

            {/* Card 3: Total Sueldos Acumulados */}
            <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-36">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Total Sueldos Acumulados
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] font-mono">$3,150,000.00</h2>
              </div>
              <div className="pt-2">
                <Link
                  href="/payroll"
                  className="text-[#0EA5E9] hover:text-[#004392] text-xs font-bold hover:underline inline-flex items-center group"
                >
                  Ver Detalles{' '}
                  <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          </section>

          {/* Accordions */}
          <section className="space-y-4">
            {/* Accordion 1: Proformas a Enviar */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                onClick={() => toggleAccordionDash('proformas')}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#002d67]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Proformas a Enviar</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-[#002d67] rounded-full">
                    3 pendientes
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                    openAccordionsDash.proformas ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openAccordionsDash.proformas && (
                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-5">Cliente</th>
                        <th className="py-3 px-5">Fecha</th>
                        <th className="py-3 px-5 text-right font-mono pr-5">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">TechNova Solutions</td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">12/10/2023</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$45,000</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Global Industries</td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">14/10/2023</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$12,500</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Synergy Corp</td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">15/10/2023</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$8,900</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Accordion 2: Facturas a Enviar */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                onClick={() => toggleAccordionDash('facturasEnviar')}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#002d67]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Facturas a Enviar</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-[#002d67] rounded-full">
                    3 comprobantes
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                    openAccordionsDash.facturasEnviar ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openAccordionsDash.facturasEnviar && (
                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-5 font-mono">Factura #</th>
                        <th className="py-3 px-5">Cliente</th>
                        <th className="py-3 px-5 text-right font-mono pr-5">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1E5BB4]">INV-2023-089</td>
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Acme Corp</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$15,200</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1E5BB4]">INV-2023-090</td>
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Beta LLC</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$3,400</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1E5BB4]">INV-2023-091</td>
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Gamma Inc</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$9,150</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Accordion 3: Facturas a Cobrar */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                onClick={() => toggleAccordionDash('facturasCobrar')}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Facturas a Cobrar</h3>
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full">
                    Cobranzas críticas
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                    openAccordionsDash.facturasCobrar ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openAccordionsDash.facturasCobrar && (
                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-5">Cliente</th>
                        <th className="py-3 px-5">Vencimiento</th>
                        <th className="py-3 px-5 text-right font-mono pr-5">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Delta Services</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Vencido (5 días)
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$22,000</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Epsilon Group</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Mañana
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$5,500</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Zeta Tech</td>
                        <td className="py-3.5 px-5 font-mono text-xs text-slate-600">25/10/2023</td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">$18,750</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: Flujo de Caja (Proyección Financiera) */}
      {activeTab === 'flujo' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30]">Proyección Financiera</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Estimación y calendarización de ingresos y egresos
              </p>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={flujoDate}
                onChange={(e) => setFlujoDate(e.target.value)}
                className="bg-white border border-slate-300 text-[#0b1c30] text-sm font-medium rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-[#002d67] focus:border-[#002d67] outline-none shadow-xs"
              />
            </div>
          </header>

          {/* Section: Egresos Proyectados */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#ba1a1a]" />
              Egresos Proyectados
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Pagos ARCA */}
              <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pagos ARCA</p>
                  <h3 className="text-xl font-bold font-mono text-[#0b1c30]">$120,500</h3>
                </div>
                <div>
                  <Link
                    href="/cash-flow"
                    className="text-[#0EA5E9] hover:text-[#004392] text-xs font-bold hover:underline inline-flex items-center group"
                  >
                    Ver Detalles{' '}
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>

              {/* Pagos ARBA */}
              <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pagos ARBA</p>
                  <h3 className="text-xl font-bold font-mono text-[#0b1c30]">$45,200</h3>
                </div>
                <div>
                  <Link
                    href="/cash-flow"
                    className="text-[#0EA5E9] hover:text-[#004392] text-xs font-bold hover:underline inline-flex items-center group"
                  >
                    Ver Detalles{' '}
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>

              {/* ECHEQS */}
              <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ECHEQS</p>
                  <h3 className="text-xl font-bold font-mono text-[#0b1c30]">$850,000</h3>
                </div>
                <span className="text-[11px] text-slate-400">Emisiones electrónicas</span>
              </article>

              {/* Cheques */}
              <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cheques</p>
                  <h3 className="text-xl font-bold font-mono text-[#0b1c30]">$320,000</h3>
                </div>
                <span className="text-[11px] text-slate-400">Cheques físicos</span>
              </article>

              {/* Servicios a Pagar */}
              <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Servicios a Pagar
                  </p>
                  <h3 className="text-xl font-bold font-mono text-[#0b1c30]">$95,000</h3>
                </div>
                <span className="text-[11px] text-slate-400">Servicios operativos</span>
              </article>
            </div>
          </section>

          {/* Section: Ingresos Proyectados */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#0b1c30] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Ingresos Proyectados
            </h2>

            <div className="space-y-4">
              {/* Accordion 1 Flujo: Proformas a Enviar */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  onClick={() => toggleAccordionFlujo('proformasFlujo')}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#002d67]" />
                    <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Proformas a Enviar</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      openAccordionsFlujo.proformasFlujo ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openAccordionsFlujo.proformasFlujo && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Cliente A</td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">
                            $45,000
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Accordion 2 Flujo: Facturas a Enviar */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  onClick={() => toggleAccordionFlujo('facturasEnviarFlujo')}
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#002d67]" />
                    <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Facturas a Enviar</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      openAccordionsFlujo.facturasEnviarFlujo ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openAccordionsFlujo.facturasEnviarFlujo && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-xs font-bold text-[#1E5BB4]">
                            INV-PROJ-001
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">
                            $15,200
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Accordion 3 Flujo: Facturas a Cobrar */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  onClick={() => toggleAccordionFlujo('facturasCobrarFlujo')}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base sm:text-lg font-bold text-[#0b1c30]">Facturas a Cobrar</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      openAccordionsFlujo.facturasCobrarFlujo ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openAccordionsFlujo.facturasCobrarFlujo && (
                  <div className="border-t border-slate-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-[#0b1c30]">Cliente C</td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-[#0b1c30] pr-5">
                            $22,000
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
