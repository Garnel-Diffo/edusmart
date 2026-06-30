'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime, cn } from '@/lib/utils';
import Link from 'next/link';
import type { Notification, PaginatedResponse } from '@/types';

export function NotificationBell() {
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.countNonLues().then((r) => r.data as { count: number }),
    refetchInterval: 60_000,
  });

  const { data: listData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list({ pageSize: 8 }).then((r) => r.data as PaginatedResponse<Notification>),
  });

  const markLue = useMutation({
    mutationFn: (id: string) => notificationsApi.markLue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markToutesLues = useMutation({
    mutationFn: () => notificationsApi.markToutesLues(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const count = countData?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => markToutesLues.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[min(60vh,400px)]">
          {listData?.data.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Aucune notification</p>
          )}
          {listData?.data.map((n) => (
            <Link
              key={n.id}
              href={n.lien ?? '#'}
              onClick={() => !n.estLue && markLue.mutate(n.id)}
              className={cn(
                'block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent',
                !n.estLue && 'bg-primary/5',
              )}
            >
              <div className="flex items-start gap-2">
                {!n.estLue && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <div className={cn('flex-1', n.estLue && 'pl-4')}>
                  <p className="font-medium leading-tight">{n.titre}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.contenu}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
