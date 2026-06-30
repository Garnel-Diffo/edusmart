'use client';

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { NAV_ITEMS } from '@/components/layout/nav-items';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types';

interface DashboardShellProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function DashboardShell({ allowedRoles, children }: DashboardShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentItem = (NAV_ITEMS[user.role] ?? []).find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/'),
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar role={user.role} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-64">
        <TopBar onMenuClick={() => setMobileOpen(true)} title={currentItem?.label ?? 'EduSmart'} />
        <main className="animate-fade-in p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
