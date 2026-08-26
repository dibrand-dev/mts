import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lugares de Trabajo',
};

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
