import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cálculo de Sueldos',
};

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
