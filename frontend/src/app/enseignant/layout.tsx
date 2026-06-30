import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function EnseignantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={['ENSEIGNANT']}>{children}</DashboardShell>;
}
