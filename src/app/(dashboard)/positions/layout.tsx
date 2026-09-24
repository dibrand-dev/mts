import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Puestos de Trabajo',
  description: 'Gestión y catálogo de puestos de trabajo, asignación de personal y tarifario comercial',
};

export default function PositionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
