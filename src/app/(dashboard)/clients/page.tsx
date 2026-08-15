'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import {
  getClients,
  createClientService,
  updateClientService,
  deleteClientService,
  ClientRow
} from '@/lib/services/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'active' | 'inactive'

  // Slide-over state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [billingEmails, setBillingEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentDueDays, setPaymentDueDays] = useState<number>(15);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRow | null>(null);

  // Email tooltip / popover state for mobile click & desktop hover
  const [activeEmailTooltipId, setActiveEmailTooltipId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveEmailTooltipId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Load clients data
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClients();
      setClients(data);
    } catch (err: any) {
      console.error('Error loading clients:', err);
      setError(err.message || 'Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenSlideover = (client?: ClientRow) => {
    setError(null);
    setEmailInput('');
    if (client) {
      setEditingClient(client);
      setCompanyName(client.company_name);
      setTaxId(client.tax_id);
      const initialEmails = client.billing_email
        ? client.billing_email.split(',').map((e) => e.trim()).filter(Boolean)
        : [];
      setBillingEmails(initialEmails);
      setPhoneNumber(client.phone_number || '');
      setPaymentDueDays(client.payment_due_days);
      setIsActive(client.is_active);
    } else {
      setEditingClient(null);
      setCompanyName('');
      setTaxId('');
      setBillingEmails([]);
      setPhoneNumber('');
      setPaymentDueDays(15);
      setIsActive(true);
    }
    setIsSlideoverOpen(true);
  };

  const addEmailsFromText = (rawInput: string): boolean => {
    const parts = rawInput
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    if (parts.length === 0) return true;

    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = parts.find((e) => !validEmailRegex.test(e));
    if (invalid) {
      setError(`El formato del email "${invalid}" no es válido.`);
      return false;
    }

    setBillingEmails((prev) => {
      const updated = [...prev];
      for (const item of parts) {
        if (!updated.includes(item)) {
          updated.push(item);
        }
      }
      return updated;
    });
    setEmailInput('');
    setError(null);
    return true;
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (emailInput.trim()) {
        addEmailsFromText(emailInput);
      }
    } else if (e.key === 'Backspace' && !emailInput && billingEmails.length > 0) {
      setBillingEmails((prev) => prev.slice(0, -1));
    }
  };

  const removeEmail = (indexToRemove: number) => {
    setBillingEmails((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If there is text in the input, try adding it first
    let currentEmails = [...billingEmails];
    if (emailInput.trim()) {
      const parts = emailInput
        .split(/[\s,]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);

      const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = parts.find((item) => !validEmailRegex.test(item));
      if (invalid) {
        setError(`El formato del email "${invalid}" no es válido.`);
        return;
      }
      for (const item of parts) {
        if (!currentEmails.includes(item)) {
          currentEmails.push(item);
        }
      }
      setBillingEmails(currentEmails);
      setEmailInput('');
    }

    if (!companyName.trim()) {
      setError('Ingrese la razón social de la empresa.');
      return;
    }
    if (!taxId.trim()) {
      setError('Ingrese el CUIT del cliente.');
      return;
    }
    if (currentEmails.length === 0) {
      setError('Ingrese al menos un email de facturación válido.');
      return;
    }

    const billingEmailString = currentEmails.join(',');

    try {
      setSaving(true);
      if (editingClient) {
        await updateClientService(editingClient.id, {
          company_name: companyName.trim(),
          tax_id: taxId.trim(),
          billing_email: billingEmailString,
          phone_number: phoneNumber.trim() || null,
          payment_due_days: Number(paymentDueDays),
          is_active: isActive,
        });
        showNotification('Cliente actualizado correctamente.');
      } else {
        await createClientService({
          company_name: companyName.trim(),
          tax_id: taxId.trim(),
          billing_email: billingEmailString,
          phone_number: phoneNumber.trim() || null,
          payment_due_days: Number(paymentDueDays),
          is_active: isActive,
        });
        showNotification('Nuevo cliente creado correctamente.');
      }

      setIsSlideoverOpen(false);
      await loadClients();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.message || 'Error al guardar la información del cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (client: ClientRow) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const ConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteClientService(clientToDelete.id);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      await loadClients();
      showNotification('Cliente eliminado con éxito.');
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.message || 'Error al eliminar el cliente.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.billing_email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        !statusFilter ||
        (statusFilter === 'active' && c.is_active) ||
        (statusFilter === 'inactive' && !c.is_active);

      return matchSearch && matchStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-10">
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {error && !isSlideoverOpen && !isDeleteModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Administración de empresas, contactos y plazos de facturación</p>
        </div>
      </header>

      {/* Section 1: Filters (Celeste B2B Card) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center">
        {/* Input Buscar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="search">Buscar</label>
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Razón Social, CUIT o Email"
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
            />
          </div>
        </div>

        {/* Dropdown Estado */}
        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-white" htmlFor="status">Estado</label>
          <div className="relative w-full">
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
            >
              <option value="">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full lg:w-auto lg:ml-auto">
          <button
            onClick={() => handleOpenSlideover()}
            className="w-full lg:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </section>

      {/* Section 2: Data Table (White Card) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E5BB4]" />
            <p className="text-sm font-medium">Cargando datos de clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron clientes registrados.</p>
            <p className="text-sm mt-1 text-slate-400">Pruebe modificando los filtros o agregue un nuevo cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 pl-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">CUIT</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Razón Social</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Email Facturación</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Teléfono</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Plazo Pago</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 pr-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 pl-6 font-mono text-xs text-slate-600 font-medium whitespace-nowrap">
                      {client.tax_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0B1C30] whitespace-nowrap">
                      {client.company_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {(() => {
                        const emailList = client.billing_email
                          ? client.billing_email.split(',').map((e) => e.trim()).filter(Boolean)
                          : [];
                        if (emailList.length === 0) return <span className="text-slate-400">-</span>;
                        if (emailList.length === 1) {
                          return (
                            <span className="truncate block max-w-[240px] text-[#0B1C30]" title={emailList[0]}>
                              {emailList[0]}
                            </span>
                          );
                        }
                        
                        const primaryEmail = emailList[0];
                        const additionalEmails = emailList.slice(1);
                        const isTooltipOpen = activeEmailTooltipId === client.id;

                        return (
                          <div className="flex items-center gap-1.5 relative">
                            <span className="truncate max-w-[170px] text-[#0B1C30]" title={primaryEmail}>
                              {primaryEmail}
                            </span>
                            
                            {/* Badge with Click (Mobile) and Hover (Desktop) Popover */}
                            <div 
                              className="relative inline-flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEmailTooltipId(isTooltipOpen ? null : client.id);
                              }}
                              onMouseEnter={() => setActiveEmailTooltipId(client.id)}
                              onMouseLeave={() => setActiveEmailTooltipId(null)}
                            >
                              <button
                                type="button"
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                  isTooltipOpen
                                    ? 'bg-[#1E5BB4] text-white ring-2 ring-[#1E5BB4]/30'
                                    : 'bg-[#1E5BB4]/10 text-[#1E5BB4] border border-[#1E5BB4]/30 hover:bg-[#1E5BB4] hover:text-white'
                                }`}
                                aria-label={`Ver ${additionalEmails.length} emails adicionales`}
                              >
                                +{additionalEmails.length}
                              </button>

                              {/* Tooltip / Popover Content rendered downwards */}
                              {isTooltipOpen && (
                                <div 
                                  className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 flex flex-col bg-[#0B1C30] text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs w-max min-w-[210px] max-w-xs z-50 transition-all duration-150 animate-in fade-in zoom-in-95"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Arrow pointing up towards badge */}
                                  <div className="absolute bottom-full left-4 sm:left-1/2 sm:-translate-x-1/2 -mb-px border-4 border-transparent border-b-[#0B1C30]"></div>

                                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-sky-400 border-b border-slate-700/60 pb-1.5 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                      <span>{additionalEmails.length === 1 ? '1 Email adicional' : `${additionalEmails.length} Emails adicionales`}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {additionalEmails.map((em, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-slate-200 font-mono text-[11px] bg-slate-850 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-700/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                                        <span className="select-all break-all">{em}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {client.phone_number || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        {client.payment_due_days} Días
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {client.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 pr-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenSlideover(client)}
                        className="text-slate-600 hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(client)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Slide-over (Alta / Edición de Cliente) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-white/30 text-white p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Razón Social */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Logística Sur S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* CUIT */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">CUIT / Tax ID *</label>
                <input
                  type="text"
                  placeholder="Ej: 30-71234567-8"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Email(s) Facturación */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Email(s) de Facturación *
                  </label>
                  <span className="text-[11px] text-sky-100 font-medium">Coma (,) o Enter para agregar</span>
                </div>
                <div className="min-h-[46px] p-2 bg-white border-2 border-[#0F2547] rounded-lg focus-within:border-[#1E5BB4] flex flex-wrap items-center gap-1.5 transition-colors">
                  {billingEmails.map((email, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-[#1E5BB4] text-white text-xs px-2.5 py-1 rounded-md font-medium shadow-xs"
                    >
                      <Mail className="h-3 w-3 shrink-0 opacity-80" />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeEmail(idx)}
                        className="hover:bg-[#004392] rounded p-0.5 transition-colors text-white/80 hover:text-white cursor-pointer ml-0.5"
                        title="Eliminar email"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={billingEmails.length === 0 ? "facturacion@empresa.com" : "Escriba otro email..."}
                    value={emailInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes(',')) {
                        addEmailsFromText(val);
                      } else {
                        setEmailInput(val);
                      }
                    }}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={() => {
                      if (emailInput.trim()) {
                        addEmailsFromText(emailInput);
                      }
                    }}
                    onPaste={(e) => {
                      const pasteData = e.clipboardData.getData('text');
                      if (pasteData.includes(',') || pasteData.includes(' ') || pasteData.includes('\n')) {
                        e.preventDefault();
                        addEmailsFromText(pasteData);
                      }
                    }}
                    className="flex-1 min-w-[140px] text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none bg-transparent py-1 px-1"
                  />
                </div>
                <p className="text-[11px] text-sky-100">
                  Puede ingresar múltiples correos. Se guardarán asociados a la empresa.
                </p>
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="Ej: +54 11 4321-8765"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Plazo de Pago */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Plazo de Vencimiento de Pago (Días) *</label>
                <select
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value={7}>7 Días</option>
                  <option value={15}>15 Días (Estándar)</option>
                  <option value={30}>30 Días</option>
                  <option value={60}>60 Días</option>
                  <option value={90}>90 Días</option>
                </select>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Estado del Cliente *</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSlideoverOpen(false)}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Guardando...' : 'Guardar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !deleting && setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-50 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Eliminar Cliente</h3>
            </div>

            <p className="text-sm text-slate-600">
              ¿Está seguro de que desea eliminar la empresa{' '}
              <strong className="text-slate-900">{clientToDelete.company_name}</strong> (CUIT:{' '}
              {clientToDelete.tax_id})? Esta acción eliminará el registro de la base de datos.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={ConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
