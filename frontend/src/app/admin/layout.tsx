import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell allowedRoles={['ADMIN_SCOLAIRE', 'SUPER_ADMIN', 'DIRECTION']}>{children}</DashboardShell>;
}
