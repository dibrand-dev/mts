import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Vencimientos de Facturas',
  description: 'Monitoreo de vencimientos, cron nocturno y cobranzas automatizadas por Brevo.',
};

export default function DueRemindersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
