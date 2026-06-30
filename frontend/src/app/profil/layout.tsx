import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={['ETUDIANT', 'ENSEIGNANT', 'ADMIN_SCOLAIRE', 'DIRECTION', 'SUPER_ADMIN']}>{children}</DashboardShell>;
}
