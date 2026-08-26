import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modificación de Contraseña',
};

export default function ChangePasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
