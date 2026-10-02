import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileQuestion, ArrowLeft, Mail, Phone } from 'lucide-react';
import { getProformaByToken } from '@/lib/services/invoicing';
import { ProformaPublicView } from '@/components/invoicing/ProformaPublicView';

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const proforma = await getProformaByToken(token);

  if (!proforma) {
    return {
      title: 'Proforma No Encontrada | MTS Logística',
      description: 'El enlace de la proforma es inválido o ha caducado.',
    };
  }

  return {
    title: `Proforma N° ${proforma.proforma_number} - ${proforma.client_name} | MTS Logística`,
    description: `Liquidación de servicios operativos N° ${proforma.proforma_number} para ${proforma.client_name}. Importe total: $ ${proforma.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`,
  };
}

export default async function ProformaPublicPage({ params }: Props) {
  const { token } = await params;
  const proforma = await getProformaByToken(token);

  if (!proforma) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="flex justify-center">
            <div className="h-12 w-32 bg-slate-900 rounded-lg p-2 flex items-center justify-center">
              <Image
                src="/mts_logo.png"
                alt="MTS Logística"
                width={110}
                height={36}
                className="object-contain"
              />
            </div>
          </div>

          <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <FileQuestion className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#0B1C30]">Proforma No Encontrada</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              El enlace público ingresado no corresponde a ninguna proforma activa, ha sido removido o el token es incorrecto.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1 text-left">
            <div className="font-semibold text-slate-800">¿Necesita asistencia?</div>
            <div className="flex items-center gap-1.5 pt-1">
              <Mail className="h-3.5 w-3.5 text-[#1E5BB4]" />
              <span>facturacion@mtslogistica.com.ar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#1E5BB4]" />
              <span>(+54 11) 5219-0000</span>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#1E5BB4] hover:bg-[#004392] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Acceso al Sistema MTS</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProformaPublicView proforma={proforma} />;
}
