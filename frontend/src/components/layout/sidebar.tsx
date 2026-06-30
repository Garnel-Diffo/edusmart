'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/components/layout/nav-items';
import type { Role } from '@/types';

interface SidebarProps {
  role: Role;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role] ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">EduSmart</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 text-center text-xs text-muted-foreground">
        EduSmart © {new Date().getFullYear()}
      </div>
    </div>
  );
}

export function Sidebar({ role, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Sidebar fixe desktop (mobile-first : cachée sous lg) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
        <SidebarContent role={role} />
      </aside>

      {/* Drawer animé mobile/tablette */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card shadow-2xl lg:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent role={role} onNavigate={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
