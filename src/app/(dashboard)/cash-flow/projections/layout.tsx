import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proyecciones de Flujo de Caja',
};

export default function ProjectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
