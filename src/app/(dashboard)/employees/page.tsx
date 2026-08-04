'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import {
  getEmployees,
  getPositions,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  EmployeeRow,
  PositionRow,
} from '@/lib/services/employees';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form & Modal state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    national_id: '',
    full_name: '',
    file_number: '',
    tax_id: '',
    default_position_id: '',
    phone_number: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [empData, posData] = await Promise.all([getEmployees(), getPositions()]);
      setEmployees(empData);
      setPositions(posData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      national_id: '',
      full_name: '',
      file_number: '',
      tax_id: '',
      default_position_id: positions[0]?.id || '',
      phone_number: '',
      status: 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeRow) => {
    setEditingEmployee(emp);
    setFormData({
      national_id: emp.national_id || '',
      full_name: emp.full_name || '',
      file_number: emp.file_number || '',
      tax_id: emp.tax_id || '',
      default_position_id: emp.default_position_id || '',
      phone_number: emp.phone_number || '',
      status: emp.status || 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setFormError('El nombre completo es requerido.');
      return;
    }
    if (!formData.national_id.trim()) {
      setFormError('El DNI es requerido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        full_name: formData.full_name.trim(),
        national_id: formData.national_id.trim(),
        file_number: formData.file_number.trim() || null,
        tax_id: formData.tax_id.trim() || null,
        default_position_id: formData.default_position_id || null,
        phone_number: formData.phone_number.trim() || null,
        status: formData.status,
      };

      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, payload);
        setEmployees((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createEmployee(payload);
        setEmployees((prev) => [created, ...prev]);
      }

      setIsSlideoverOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al guardar el empleado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      setIsDeleting(true);
      await deleteEmployee(deletingEmployee.id);
      setEmployees((prev) => prev.filter((item) => item.id !== deletingEmployee.id));
      setDeletingEmployee(null);
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter (name or national_id or file_number)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        emp.full_name.toLowerCase().includes(query) ||
        emp.national_id.toLowerCase().includes(query) ||
        (emp.file_number && emp.file_number.toLowerCase().includes(query));

      // Position filter
      const matchesPosition = !selectedPositionId || emp.default_position_id === selectedPositionId;

      // Status filter
      const matchesStatus = !selectedStatus || emp.status === selectedStatus;

      return matchesSearch && matchesPosition && matchesStatus;
    });
  }, [employees, searchQuery, selectedPositionId, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Activo
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            Vacaciones / Lic.
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Inactivo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Gestión de Personal</h1>
          <p className="text-slate-500 text-sm mt-1">Administración de empleados, altas, bajas y perfiles operativos</p>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto underline text-xs font-semibold hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Section 1: Filters Card */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="search">Buscar Empleado</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2547]" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, DNI o Legajo..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Position Dropdown */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="puesto">Puesto</label>
            <div className="relative w-full">
              <select
                id="puesto"
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Puestos</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-white" htmlFor="estado">Estado</label>
            <div className="relative w-full">
              <select
                id="estado"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0F2547] rounded-lg text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="on_leave">Vacaciones / Lic.</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Action Button */}
          <div className="md:col-span-3 flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#1E5BB4] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#004392] transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Empleado</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Data Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
            <p className="text-sm font-medium">Cargando personal...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron empleados</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros de búsqueda o agrega un nuevo empleado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider pl-6 whitespace-nowrap">DNI</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Nombre Completo</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Legajo / CUIL</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Puesto</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider text-right pr-6 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 pl-6 whitespace-nowrap font-mono text-xs text-[#0F2547] font-semibold">
                      {emp.national_id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">
                      {emp.full_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {emp.file_number ? `Leg: ${emp.file_number}` : '-'}
                      {emp.tax_id ? ` / CUIL: ${emp.tax_id}` : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                      {emp.default_position?.name || 'Sin especificar'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {emp.phone_number || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(emp.status)}
                    </td>
                    <td className="px-4 py-3 pr-6 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingEmployee(emp)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors"
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
        )}
      </section>

      {/* Slide-over (Alta / Edición de Personal) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 space-y-4">
              {formError && (
                <div className="p-3 bg-red-600/90 text-white rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ej: Carlos Ruiz"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">DNI *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder="Ej: 28456789"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">Nº Legajo</label>
                  <input
                    type="text"
                    value={formData.file_number}
                    onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                    placeholder="Ej: L-042"
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">CUIL</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="Ej: 20-28456789-8"
                    className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puesto Habitual</label>
                <select
                  value={formData.default_position_id}
                  onChange={(e) => setFormData({ ...formData, default_position_id: e.target.value })}
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="">Seleccionar Puesto...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Ej: +54 11 4567-8901"
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'on_leave' })
                  }
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="active">Activo</option>
                  <option value="on_leave">Vacaciones / Licencia</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isDeleting && setDeletingEmployee(null)}
          />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl z-50 space-y-4 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">¿Eliminar empleado?</h3>
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-slate-900">{deletingEmployee.full_name}</strong> (DNI: {deletingEmployee.national_id})?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
