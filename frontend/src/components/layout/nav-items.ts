import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  GraduationCap,
  MessageCircle,
  FileText,
  FolderOpen,
  Search,
  Megaphone,
  MessagesSquare,
  Users,
  Building2,
  BarChart3,
  FileBadge,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  ETUDIANT: [
    { label: 'Tableau de bord', href: '/etudiant', icon: LayoutDashboard },
    { label: 'Mes cours', href: '/etudiant/cours', icon: BookOpen },
    { label: 'Emploi du temps', href: '/etudiant/edt', icon: CalendarDays },
    { label: 'Mes notes', href: '/etudiant/notes', icon: GraduationCap },
    { label: 'Chatbot IA', href: '/etudiant/chatbot', icon: MessageCircle },
    { label: 'Fiches de révision', href: '/etudiant/fiches', icon: FileText },
    { label: 'Documents personnels', href: '/etudiant/documents-personnels', icon: FolderOpen },
    { label: 'Recherche intelligente', href: '/etudiant/recherche', icon: Search },
    { label: 'Annonces', href: '/etudiant/annonces', icon: Megaphone },
    { label: 'Messagerie', href: '/etudiant/messagerie', icon: MessagesSquare },
  ],
  ENSEIGNANT: [
    { label: 'Tableau de bord', href: '/enseignant', icon: LayoutDashboard },
    { label: 'Mes cours', href: '/enseignant/cours', icon: BookOpen },
    { label: 'Emploi du temps', href: '/enseignant/edt', icon: CalendarDays },
    { label: 'Gestion des notes', href: '/enseignant/notes', icon: GraduationCap },
    { label: 'Annonces', href: '/enseignant/annonces', icon: Megaphone },
  ],
  ADMIN_SCOLAIRE: [
    { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
    { label: 'Structures', href: '/admin/structures', icon: Building2 },
    { label: 'Emploi du temps', href: '/admin/edt', icon: CalendarDays },
    { label: 'Validation des notes', href: '/admin/notes', icon: GraduationCap },
    { label: 'Documents officiels', href: '/admin/bulletins', icon: FileBadge },
    { label: 'Annonces', href: '/admin/annonces', icon: Megaphone },
    { label: 'Statistiques', href: '/admin/stats', icon: BarChart3 },
    { label: "Journal d'audit", href: '/admin/audit', icon: ShieldCheck },
  ],
  SUPER_ADMIN: [],
  DIRECTION: [
    { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { label: 'Statistiques', href: '/admin/stats', icon: BarChart3 },
  ],
};

NAV_ITEMS.SUPER_ADMIN = NAV_ITEMS.ADMIN_SCOLAIRE;
