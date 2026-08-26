import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carga Diaria de Horas',
};

export default function DailyEntryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
