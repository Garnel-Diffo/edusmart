import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function EtudiantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={['ETUDIANT']}>{children}</DashboardShell>;
}
