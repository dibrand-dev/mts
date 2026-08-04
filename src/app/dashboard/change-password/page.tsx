'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Save,
  Check
} from 'lucide-react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  // Requirement validations
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const validRequirementsCount = [hasMinLength, hasUppercase, hasNumber || hasSpecial].filter(Boolean).length;
  
  let strengthLabel = 'Muy débil';
  let strengthColor = 'bg-slate-200 text-slate-500';
  let strengthBarColor = 'bg-slate-300';
  let strengthWidth = 'w-0';

  if (newPassword.length > 0) {
    if (validRequirementsCount === 1) {
      strengthLabel = 'Débil';
      strengthColor = 'bg-red-100 text-red-700';
      strengthBarColor = 'bg-red-500';
      strengthWidth = 'w-1/3';
    } else if (validRequirementsCount === 2) {
      strengthLabel = 'Media';
      strengthColor = 'bg-amber-100 text-amber-700';
      strengthBarColor = 'bg-amber-500';
      strengthWidth = 'w-2/3';
    } else if (validRequirementsCount === 3) {
      strengthLabel = 'Fuerte';
      strengthColor = 'bg-emerald-100 text-emerald-700';
      strengthBarColor = 'bg-emerald-500';
      strengthWidth = 'w-full';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !hasMinLength || !passwordsMatch) return;

    setIsSubmitting(true);
    setSuccessMessage(false);

    // Simulate saving UI action
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-1">
            <Link 
              href="/dashboard/settings" 
              className="hover:text-[#1E5BB4] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Configuración</span>
            </Link>
            <span>/</span>
            <span className="text-[#0B1C30] font-medium">Seguridad de la Cuenta</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1C30] flex items-center gap-3">
            <KeyRound className="h-7 w-7 text-[#1E5BB4] shrink-0" />
            <span>Modificar Contraseña</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Actualiza la clave de acceso de tu usuario corporativo en MTS Logística.
          </p>
        </div>
      </header>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 text-emerald-900 shadow-xs animate-fadeIn">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base">¡Contraseña actualizada con éxito!</h3>
            <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
              Tu clave de acceso ha sido modificada. Utiliza tu nueva contraseña en el próximo inicio de sesión.
            </p>
          </div>
          <button 
            onClick={() => setSuccessMessage(false)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-semibold px-2 py-1 rounded-md"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Card */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#0EA5E9] text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 shrink-0" />
              <h2 className="font-semibold text-base sm:text-lg">Formulario de Seguridad</h2>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
              Acceso Privado
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#0F2547]" htmlFor="current-password">
                Contraseña Actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full bg-white text-[#0B1C30] border-2 border-[#0F2547]/30 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#1E5BB4] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#0F2547] transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <hr className="border-slate-200 my-2" />

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#0F2547]" htmlFor="new-password">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Introduce la nueva clave de acceso"
                  className="w-full bg-white text-[#0B1C30] border-2 border-[#0F2547]/30 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#1E5BB4] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#0F2547] transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Fortaleza:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${strengthColor}`}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strengthBarColor} ${strengthWidth}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#0F2547]" htmlFor="confirm-password">
                Confirmar Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva clave de acceso"
                  className={`w-full bg-white text-[#0B1C30] border-2 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : 'border-red-400 focus:border-red-500'
                      : 'border-[#0F2547]/30 focus:border-[#1E5BB4]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#0F2547] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Match status feedback */}
              {confirmPassword.length > 0 && (
                <p className={`text-xs flex items-center gap-1 font-medium mt-1 ${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passwordsMatch ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Las contraseñas coinciden perfectamente.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Las contraseñas no coinciden.</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
              <Link
                href="/dashboard/settings"
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !currentPassword || !hasMinLength || !passwordsMatch}
                className="w-full sm:w-auto bg-[#1E5BB4] hover:bg-[#004392] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg px-6 py-2.5 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Side Panel: Password Requirements & Guidelines */}
        <aside className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#0B1C30] flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="h-4 w-4 text-[#1E5BB4]" />
              <span>Requisitos de Seguridad</span>
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                {hasMinLength ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px] text-slate-400">•</div>
                )}
                <span className={hasMinLength ? 'font-semibold text-emerald-800' : ''}>
                  Mínimo 8 caracteres de longitud.
                </span>
              </li>

              <li className="flex items-center gap-2">
                {hasUppercase ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px] text-slate-400">•</div>
                )}
                <span className={hasUppercase ? 'font-semibold text-emerald-800' : ''}>
                  Al menos una letra mayúscula (A-Z).
                </span>
              </li>

              <li className="flex items-center gap-2">
                {hasNumber || hasSpecial ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0 flex items-center justify-center text-[10px] text-slate-400">•</div>
                )}
                <span className={(hasNumber || hasSpecial) ? 'font-semibold text-emerald-800' : ''}>
                  Al menos un número (0-9) o carácter especial.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1E5BB4]/5 border border-[#1E5BB4]/20 rounded-xl p-4 text-xs text-[#0F2547] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#1E5BB4]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Recomendación</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              No compartas tu contraseña corporativa con terceros. Ante cualquier sospecha de vulneración, modifica tu clave inmediatamente o notifica al administrador de IT.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
