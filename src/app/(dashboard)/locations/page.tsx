'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  LocationRow,
} from '@/lib/services/locations';

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form & Modal state
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingLocation, setDeletingLocation] = useState<LocationRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    port_city: '',
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  });

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLocations();
      setLocations(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los lugares de trabajo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingLocation(null);
    setFormData({
      code: '',
      name: '',
      port_city: '',
      status: 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleOpenEdit = (loc: LocationRow) => {
    setEditingLocation(loc);
    setFormData({
      code: loc.code || '',
      name: loc.name || '',
      port_city: loc.port_city || '',
      status: loc.status || 'active',
    });
    setFormError(null);
    setIsSlideoverOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('El código del lugar de trabajo es requerido.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('El nombre del lugar de trabajo es requerido.');
      return;
    }
    if (!formData.port_city.trim()) {
      setFormError('El puerto o ciudad es requerido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        port_city: formData.port_city.trim(),
        status: formData.status,
      };

      if (editingLocation) {
        const updated = await updateLocation(editingLocation.id, payload);
        setLocations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showNotification('Lugar de trabajo actualizado correctamente.');
      } else {
        const created = await createLocation(payload);
        setLocations((prev) => [created, ...prev]);
        showNotification('Nuevo lugar de trabajo creado correctamente.');
      }

      setIsSlideoverOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al guardar el lugar de trabajo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLocation) return;
    try {
      setIsDeleting(true);
      await deleteLocation(deletingLocation.id);
      setLocations((prev) => prev.filter((item) => item.id !== deletingLocation.id));
      setDeletingLocation(null);
      showNotification('Lugar de trabajo eliminado con éxito.');
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Search filter (code, name, port_city)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        loc.name.toLowerCase().includes(query) ||
        loc.code.toLowerCase().includes(query) ||
        loc.port_city.toLowerCase().includes(query);

      // Status filter
      const matchesStatus = !selectedStatus || loc.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [locations, searchQuery, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Activo
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            En Mantenimiento
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
    <div className="space-y-6 max-w-7xl mx-auto relative pb-10">
      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30]">Gestión de Lugares de Trabajo</h1>
          <p className="text-slate-500 text-sm mt-1">Administre predios, muelles, terminales y áreas de operaciones portuarias.</p>
        </div>
      </header>

      {/* Error alert */}
      {error && !isSlideoverOpen && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto underline text-xs font-semibold hover:text-red-900 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Section 1: Filters Card (Sky Blue B2B) */}
      <section className="bg-[#0EA5E9] text-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search Input */}
          <div className="flex-1 w-full flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" htmlFor="search-location">Buscar</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0F2547]" />
              <input
                id="search-location"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Código, Nombre o Puerto..."
                className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] placeholder-slate-400 focus:outline-none focus:border-[#1E5BB4]"
              />
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-64 flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white" htmlFor="filter-status">Estado</label>
            <div className="relative w-full">
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border-2 border-[#0F2547] rounded-lg px-3 py-2 text-sm text-[#0B1C30] appearance-none focus:outline-none focus:border-[#1E5BB4]"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="maintenance">En Mantenimiento</option>
                <option value="inactive">Inactivo</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F2547]" />
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full md:w-auto">
            <button
              onClick={handleOpenCreate}
              className="w-full md:w-auto bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Lugar de Trabajo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Data Table Card (White) */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
            <p className="text-sm font-medium">Cargando lugares de trabajo...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">No se encontraron lugares de trabajo</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros de búsqueda o crea un nuevo lugar de trabajo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50 border-b-2 border-[#0F2547]">
                <tr>
                  <th className="py-3 px-4 pl-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Código</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Nombre del Lugar</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Puerto / Ciudad</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#0F2547] uppercase tracking-wider whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 pr-6 text-xs font-bold text-[#0F2547] uppercase tracking-wider text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-[#0B1C30]">
                {filteredLocations.map((loc, index) => (
                  <tr
                    key={loc.id}
                    className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="py-3 px-4 pl-6 font-mono text-xs text-[#0F2547] font-semibold">
                      {loc.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0B1C30]">
                      {loc.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {loc.port_city}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(loc.status)}
                    </td>
                    <td className="py-3 px-4 pr-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(loc)}
                        className="text-[#0F2547] hover:text-[#1E5BB4] p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar Lugar de Trabajo"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingLocation(loc)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar Lugar de Trabajo"
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

      {/* Slide-over (Alta / Edición de Lugar de Trabajo) */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
          />
          <div className="relative w-screen max-w-md bg-[#0EA5E9] text-white shadow-xl z-50 flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-[#0F2547]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingLocation ? 'Editar Lugar de Trabajo' : 'Nuevo Lugar de Trabajo'}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsSlideoverOpen(false)}
                className="text-white hover:text-slate-200 p-1 rounded-md cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 space-y-4">
              {formError && (
                <div className="p-3 bg-red-600/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: LDT-001"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Nombre del Lugar de Trabajo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Muelle Norte 1"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Puerto / Ciudad *</label>
                <input
                  type="text"
                  value={formData.port_city}
                  onChange={(e) => setFormData({ ...formData, port_city: e.target.value })}
                  placeholder="Ej: Puerto Buenos Aires"
                  required
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-white">Estado *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'maintenance' | 'inactive' })
                  }
                  className="w-full p-2.5 bg-white border-2 border-[#0F2547] rounded-lg text-sm text-[#0B1C30] focus:outline-none focus:border-[#1E5BB4]"
                >
                  <option value="active">Activo</option>
                  <option value="maintenance">En Mantenimiento</option>
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#1E5BB4] hover:bg-[#004392] text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingLocation ? 'Guardar Cambios' : 'Crear Lugar de Trabajo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLocation && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isDeleting && setDeletingLocation(null)}
          />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl z-50 space-y-4 text-slate-800 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Eliminar Lugar de Trabajo?</h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar el lugar de trabajo{' '}
              <strong className="text-slate-900">{deletingLocation.name}</strong> (Código: {deletingLocation.code})?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingLocation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
