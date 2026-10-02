'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  ShieldCheck,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  RefreshCw,
  Lock,
  UserCheck,
  UserX,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'accounting_auditor';
  isActive: boolean;
  createdAt: string;
  lastSignInAt?: string | null;
}

export default function UsersManagementPage() {
  // Authentication & Access state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Users data state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'accounting_auditor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Slide-over for Inviting Users
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'accounting_auditor'>('accounting_auditor');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [slideoverError, setSlideoverError] = useState<string | null>(null);

  // Modals & Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    actionLink?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status toggle confirmation modal
  const [pendingStatusUser, setPendingStatusUser] = useState<UserItem | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // 1. Verify access role on mount and fetch users
  useEffect(() => {
    async function checkAuthAndLoad() {
      setAuthLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUserRole(profile.role);
          if (profile.role === 'admin') {
            try {
              setLoading(true);
              const res = await fetch('/api/users');
              const data = await res.json();
              if (data.success && Array.isArray(data.users)) {
                setUsers(data.users);
              }
            } catch (err) {
              console.error('Error fetching users on mount:', err);
            } finally {
              setLoading(false);
            }
          }
        }
      }
      setAuthLoading(false);
    }
    checkAuthAndLoad();
  }, []);

  // 2. Refresh users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Error al cargar el listado de usuarios.',
        });
      }
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      setNotification({
        type: 'error',
        message: 'No se pudo conectar con el servidor para obtener los usuarios.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // KPIs
  const totalCount = users.length;
  const activeAdminsCount = users.filter((u) => u.role === 'admin' && u.isActive).length;
  const activeAuditorsCount = users.filter(
    (u) => u.role === 'accounting_auditor' && u.isActive
  ).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  // Handlers
  const handleOpenInvite = () => {
    setInviteFullName('');
    setInviteEmail('');
    setInviteRole('accounting_auditor');
    setSlideoverError(null);
    setIsSlideoverOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFullName.trim()) {
      setSlideoverError('Por favor ingresa el nombre y apellido del usuario.');
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setSlideoverError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    try {
      setSubmittingInvite(true);
      setSlideoverError(null);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inviteFullName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al procesar la invitación.');
      }

      setIsSlideoverOpen(false);
      setNotification({
        type: 'success',
        message: `Invitación enviada exitosamente a ${inviteEmail}. Se ha disparado el correo electrónico con el enlace para generar su contraseña.`,
        actionLink: data.inviteUrl,
      });

      // Reload list
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al invitar al usuario.';
      setSlideoverError(msg);
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!pendingStatusUser) return;
    try {
      setTogglingStatus(true);
      const newActive = !pendingStatusUser.isActive;
      const res = await fetch(`/api/users/${pendingStatusUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          isActive: newActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo modificar el estado del usuario.');
      }

      setNotification({
        type: 'success',
        message: newActive
          ? `La cuenta de ${pendingStatusUser.fullName} ha sido reactivada.`
          : `La cuenta de ${pendingStatusUser.fullName} ha sido bloqueada. El acceso queda revocado de forma inmediata.`,
      });

      setPendingStatusUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado.';
      setNotification({
        type: 'error',
        message: msg,
      });
      setPendingStatusUser(null);
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleResendInvite = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_invite',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al reenviar invitación.');
      }

      setNotification({
        type: 'success',
        message: `Se ha reenviado el correo de invitación a ${user.email} con un nuevo enlace de activación.`,
        actionLink: data.inviteUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo reenviar la invitación.';
      setNotification({
        type: 'error',
        message: msg,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // If loading authentication state
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-[#1E5BB4] mb-3" />
        <p className="text-sm font-medium">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  // Criterio de Aceptación: Restricción de Acceso exclusiva para Owner/Administrador Principal
  if (currentUserRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#0B1C30] mb-2">Acceso Restringido</h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Esta pantalla es de uso exclusivo para usuarios con el rol de{' '}
          <strong className="text-[#0B1C30]">Owner / Administrador Principal</strong>. Tu perfil
          actual no cuenta con los privilegios requeridos para gestionar usuarios de la plataforma.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#1E5BB4] hover:bg-[#004392] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
        >
          <span>Regresar al Tablero Principal</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <header
        data-testid="users-page-header"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">
              Gestión de Usuarios y Roles
            </h1>
            <span className="bg-[#1E5BB4]/10 text-[#1E5BB4] border border-[#1E5BB4]/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Owner / Admin Principal
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl">
            Invita colaboradores administrativos y contables, asigna permisos operativos y gestiona
            el bloqueo inmediato de cuentas inactivas.
          </p>
        </div>

        <button
          onClick={handleOpenInvite}
          data-testid="users-btn-invite"
          className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invitar Nuevo Usuario</span>
        </button>
      </header>

      {/* Notifications Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-xs animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span className="font-semibold">{notification.message}</span>
              {notification.actionLink && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-600">Enlace de contraseña generado:</span>
                  <button
                    onClick={() => copyToClipboard(notification.actionLink!)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-mono hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Enlace Directo</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer self-start sm:self-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Usuarios</span>
            <UserCheck className="h-4 w-4 text-[#1E5BB4]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Registrados en la plataforma</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Administradores</span>
            <ShieldCheck className="h-4 w-4 text-[#1E5BB4]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#1E5BB4]">{activeAdminsCount}</p>
          <span className="text-[11px] text-slate-400">Acceso total operativo</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Personal Contable</span>
            <FileSpreadsheet className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700">{activeAuditorsCount}</p>
          <span className="text-[11px] text-slate-400">Solo Lectura (Reportes y Excel)</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Cuentas Inactivas</span>
            <UserX className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{inactiveCount}</p>
          <span className="text-[11px] text-slate-400">Acceso bloqueado de inmediato</span>
        </div>
      </section>

      {/* Search and Filters Card (High contrast B2B) */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="users-search-input"
            placeholder="Buscar por nombre o correo electrónico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EFF4FF] border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E5BB4] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <select
            data-testid="users-filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'accounting_auditor')}
            className="bg-[#EFF4FF] border border-slate-200 text-xs sm:text-sm text-[#0B1C30] font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador (Acceso Total)</option>
            <option value="accounting_auditor">Contable (Solo Lectura)</option>
          </select>

          {/* Status Filter */}
          <select
            data-testid="users-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="bg-[#EFF4FF] border border-slate-200 text-xs sm:text-sm text-[#0B1C30] font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E5BB4]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <button
            onClick={() => fetchUsers()}
            title="Refrescar lista"
            className="p-2 bg-[#EFF4FF] hover:bg-[#dce9ff] text-[#1E5BB4] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* Users Table */}
      <section
        data-testid="users-table"
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-[#0F2547] text-[#0F2547] font-bold text-xs uppercase tracking-wider">
                <th className="p-3 pl-4 sm:pl-6">Usuario</th>
                <th className="p-3">Rol Asignado</th>
                <th className="p-3">Alcance de Permisos</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Fecha de Alta</th>
                <th className="p-3 pr-4 sm:pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#1E5BB4]" />
                    <span>Cargando usuarios...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron usuarios con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isSelf = user.id === currentUserId;
                  const initials = user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      data-testid={`users-table-row-${user.id}`}
                      className={`hover:bg-slate-50 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      } ${!user.isActive ? 'opacity-70 bg-red-50/20' : ''}`}
                    >
                      {/* User Info */}
                      <td className="p-3 pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-[#1E5BB4] text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {initials || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#0B1C30]">{user.fullName}</span>
                              {isSelf && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 block">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-3">
                        <span
                          data-testid={`users-badge-role-${user.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-[#004392] border border-blue-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Administrador</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Contable</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Permissions Summary */}
                      <td className="p-3 text-xs text-slate-600 max-w-xs">
                        {user.role === 'admin' ? (
                          <span className="text-blue-900 font-medium">
                            Acceso total (Carga, catálogos, facturación, finanzas)
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            Solo Lectura (Visualización de reportes y exportación Excel)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span
                          data-testid={`users-badge-status-${user.id}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800 font-bold'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-xs text-slate-500 font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Resend Invite */}
                          <button
                            onClick={() => handleResendInvite(user)}
                            title="Reenviar enlace de invitación"
                            data-testid={`users-btn-resend-invite-${user.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#1E5BB4] transition-colors cursor-pointer"
                          >
                            <Mail className="h-4 w-4" />
                          </button>

                          {/* Toggle Active / Inactive Button */}
                          <button
                            onClick={() => setPendingStatusUser(user)}
                            disabled={isSelf}
                            data-testid={`users-btn-toggle-status-${user.id}`}
                            title={
                              isSelf
                                ? 'No puedes desactivar tu propia cuenta'
                                : user.isActive
                                ? 'Bloquear / Desactivar cuenta'
                                : 'Reactivar cuenta'
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                                : user.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 px-4 sm:px-6">
          <span>Mostrando {filteredUsers.length} de {totalCount} colaboradores</span>
        </div>
      </section>

      {/* Slideover: Invitar Nuevo Usuario (High contrast B2B #0EA5E9) */}
      {isSlideoverOpen && (
        <div data-testid="users-slideover" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSlideoverOpen(false)}
          />

          <div className="relative w-screen max-w-lg bg-[#0EA5E9] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-[#0F2547]/20 text-white">
            {/* Slideover Header */}
            <div className="p-5 sm:p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Invitar Nuevo Usuario</span>
                </h2>
                <p className="text-white/80 text-xs mt-1">
                  Se creará la cuenta en Supabase y se despachará el enlace para generar contraseña.
                </p>
              </div>
              <button
                onClick={() => setIsSlideoverOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Slideover Form */}
            <form onSubmit={handleSendInvite} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {slideoverError && (
                <div className="p-3 bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{slideoverError}</span>
                </div>
              )}

              {/* Nombre Completo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-white">
                  Nombre Completo <span className="text-red-200">*</span>
                </label>
                <input
                  type="text"
                  required
                  data-testid="users-input-fullname"
                  placeholder="Ej: Lic. Martín Fernández"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-white">
                  Correo Electrónico Corporativo <span className="text-red-200">*</span>
                </label>
                <input
                  type="email"
                  required
                  data-testid="users-input-email"
                  placeholder="usuario@mtslogistica.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3.5 py-2.5 text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
                />
                <span className="text-[11px] text-white/80">
                  A esta dirección se enviará el correo con el enlace para generar su contraseña.
                </span>
              </div>

              {/* Selector de Rol */}
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs sm:text-sm font-semibold text-white">
                  Rol y Nivel de Acceso <span className="text-red-200">*</span>
                </label>

                <div className="space-y-3">
                  {/* Rol 1: Contable */}
                  <label
                    className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      inviteRole === 'accounting_auditor'
                        ? 'bg-white text-[#0B1C30] border-[#0F2547] shadow-md ring-2 ring-white/50'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="userRole"
                        value="accounting_auditor"
                        checked={inviteRole === 'accounting_auditor'}
                        onChange={() => setInviteRole('accounting_auditor')}
                        className="mt-1 h-4 w-4 text-[#1E5BB4] focus:ring-[#1E5BB4]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet
                            className={`h-4 w-4 ${
                              inviteRole === 'accounting_auditor' ? 'text-purple-600' : 'text-white'
                            }`}
                          />
                          <span className="font-bold text-sm">Contable (Solo Lectura)</span>
                        </div>
                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            inviteRole === 'accounting_auditor' ? 'text-slate-600' : 'text-white/80'
                          }`}
                        >
                          Acceso restringido de <strong>Solo Lectura</strong>. Limitado a
                          visualizar reportes y exportar el Excel de liquidación mensual. No puede
                          cargar horas ni modificar catálogos.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Rol 2: Administrador */}
                  <label
                    className={`block p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      inviteRole === 'admin'
                        ? 'bg-white text-[#0B1C30] border-[#0F2547] shadow-md ring-2 ring-white/50'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={inviteRole === 'admin'}
                        onChange={() => setInviteRole('admin')}
                        className="mt-1 h-4 w-4 text-[#1E5BB4] focus:ring-[#1E5BB4]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck
                            className={`h-4 w-4 ${
                              inviteRole === 'admin' ? 'text-[#1E5BB4]' : 'text-white'
                            }`}
                          />
                          <span className="font-bold text-sm">Administrador</span>
                        </div>
                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            inviteRole === 'admin' ? 'text-slate-600' : 'text-white/80'
                          }`}
                        >
                          <strong>Acceso total</strong> a carga de datos diarios, mantenedores de
                          catálogos (clientes, lugares, puestos), tarifarios, facturación, sueldos y
                          finanzas.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botones de Acción */}
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
                  disabled={submittingInvite}
                  data-testid="users-btn-submit-invite"
                  className="bg-[#1E5BB4] hover:bg-[#004392] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingInvite ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Enviando invitación...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Invitar y Enviar Correo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación: Cambiar Estado a Inactivo / Activo */}
      {pendingStatusUser && (
        <div
          data-testid="users-modal-confirm-status"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-xl ${
                  pendingStatusUser.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {pendingStatusUser.isActive ? (
                  <UserX className="h-6 w-6" />
                ) : (
                  <UserCheck className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1C30]">
                  {pendingStatusUser.isActive
                    ? '¿Bloquear acceso de cuenta?'
                    : '¿Reactivar acceso de cuenta?'}
                </h3>
                <p className="text-xs text-slate-500">{pendingStatusUser.fullName}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {pendingStatusUser.isActive ? (
                <>
                  Al cambiar el estado a <strong className="text-red-600">Inactivo</strong>, se
                  revocarán las sesiones y se bloqueará el acceso a la plataforma de forma inmediata.
                  El colaborador no podrá volver a iniciar sesión hasta que un Administrador vuelva a
                  habilitar su cuenta.
                </>
              ) : (
                <>
                  La cuenta pasará a estado <strong className="text-emerald-600">Activo</strong> y el
                  colaborador podrá iniciar sesión nuevamente con sus credenciales habituales.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingStatusUser(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={togglingStatus}
                onClick={handleConfirmToggleStatus}
                className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
                  pendingStatusUser.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {togglingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : pendingStatusUser.isActive ? (
                  'Sí, Bloquear Acceso'
                ) : (
                  'Sí, Reactivar Cuenta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
