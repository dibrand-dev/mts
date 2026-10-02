import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios y Roles',
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
