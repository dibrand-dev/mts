import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Facturación',
};

export default function InvoicingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
