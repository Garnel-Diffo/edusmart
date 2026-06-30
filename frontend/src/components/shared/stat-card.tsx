'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet';
  delay?: number;
}

const COLOR_MAP: Record<string, string> = {
  brand: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
};

export function StatCard({ label, value, icon: Icon, trend, color = 'brand', delay = 0 }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4 sm:p-5">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', COLOR_MAP[color])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
