'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message === 'Invalid login credentials' 
        ? 'Credenciales inválidas. Verifica tu correo y contraseña.' 
        : error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen bg-white font-sans text-gray-800">
      {/* Left Section: Background Image with Overlay */}
      <section 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuARxQYroca6yIbIOLnGwgOrjLa31UNay3_a6VTFrAYhqKEPwEbfN8kWJMl6w5bVYCHhX5rlxTADWkqubAcRMOc5TIey-ejhAX-7tK5uKQIteppundTrbChIwAsqi1munFI9HB9piC_3VGMZFGcbAovnz3UAAXrmEPE4n3lSKTHFhXB9QryAWx3ZSjXL9Rn6gTn26KfGAatOPt87-7rgkweEUh2BwSxYvbOaTCoTZ22lb7mTSDD3o5FMYnyb_S46XdERXJ4")' 
        }}
      >
        <div className="absolute inset-0 bg-[#2b56a3]/40 mix-blend-multiply" />
      </section>

      {/* Right Section: Login Form */}
      <section className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img 
              alt="MTS Logo" 
              className="h-20 object-contain" 
              src="/mts_logo.png" 
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Ingresa a tu cuenta
          </h1>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Correo electrónico
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@mtscaetano.com"
                  className="focus:ring-2 focus:ring-[#2b56a3] focus:border-[#2b56a3] block w-full pl-10 sm:text-sm border border-gray-300 rounded-md py-3 text-gray-900 placeholder-gray-500 outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus:ring-2 focus:ring-[#2b56a3] focus:border-[#2b56a3] block w-full pl-10 pr-10 sm:text-sm border border-gray-300 rounded-md py-3 text-gray-900 placeholder-gray-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a className="font-medium text-[#2b56a3] hover:underline" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-[#2b56a3] hover:bg-[#1e4280] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b56a3] transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>
          </form>

          {/* Footer Text */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500">
              Si no tienes cuenta o perdiste el acceso, contacta al administrador del sistema.
            </p>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="absolute bottom-8 text-center w-full">
          <p className="text-xs text-gray-400">
            Desarrollado por Dibrand
          </p>
        </div>
      </section>
    </main>
  );
}
