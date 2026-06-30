'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User as UserIcon, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { cn, getInitials, roleLabel } from '@/lib/utils';

export function TopBar({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:pl-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="flex-1 truncate text-base font-semibold sm:text-lg">{title}</h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Changer de thème"
      >
        <Sun className={cn('h-5 w-5 rotate-0 scale-100 transition-all', theme === 'dark' && '-rotate-90 scale-0 absolute')} />
        <Moon className={cn('h-5 w-5 rotate-90 scale-0 transition-all', theme === 'dark' && 'rotate-0 scale-100')} />
      </Button>

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.prenom} />}
              <AvatarFallback>{getInitials(user.nom, user.prenom)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user.prenom} {user.nom}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profil')}>
            <UserIcon className="mr-2 h-4 w-4" /> Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/parametres')}>
            <Settings className="mr-2 h-4 w-4" /> Paramètres
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
