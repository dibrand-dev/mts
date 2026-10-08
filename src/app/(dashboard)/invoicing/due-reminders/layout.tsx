import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Vencimientos y Cobranzas',
  description: 'Monitoreo de vencimientos de facturas y envío automático de recordatorios de pago a clientes.',
};

export default function DueRemindersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
