import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Clientes',
};

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
