import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ingreso y Flujo de Caja',
};

export default function CashFlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
