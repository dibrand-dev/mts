import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifario Comercial',
};

export default function RatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
