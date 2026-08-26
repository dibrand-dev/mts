import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Personal',
};

export default function EmployeesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
