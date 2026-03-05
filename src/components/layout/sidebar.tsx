'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, CalendarCheck, CreditCard, MessageSquare,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/app/actions/auth'
import { UserProfile } from '@/types'
import { ROLE_LABELS } from '@/constants'
import { useState } from 'react'
import Image from 'next/image'

const NAV_ITEMS = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, roles: ['all'] },
  { label: 'Étudiants', href: '/students', icon: Users, roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'] },
  { label: 'Enseignants', href: '/teachers', icon: GraduationCap, roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'] },
  { label: 'Formations', href: '/courses', icon: BookOpen, roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant'] },
  { label: 'Notes & Résultats', href: '/grades', icon: ClipboardList, roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'] },
  { label: 'Présences', href: '/attendance', icon: CalendarCheck, roles: ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'] },
  { label: 'Finance', href: '/finance', icon: CreditCard, roles: ['super_admin', 'directeur', 'agent_comptable'] },
  { label: 'Communication', href: '/communication', icon: MessageSquare, roles: ['all'] },
  { label: 'Rapports', href: '/reports', icon: BarChart2, roles: ['super_admin', 'directeur', 'responsable_pedagogique'] },
  { label: 'Paramètres', href: '/settings', icon: Settings, roles: ['super_admin'] },
]

interface SidebarProps {
  profile: UserProfile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = NAV_ITEMS.filter(item =>
    item.roles.includes('all') || item.roles.includes(profile?.role ?? '')
  )

  const initials = profile
    ? `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase()
    : 'U'

  return (
    <aside className={cn(
      "relative flex flex-col bg-black text-white transition-all duration-300 min-h-screen",
      collapsed ? "w-16" : "w-64"
    )}>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 bg-black border border-gray-700 rounded-full p-0.5 text-gray-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center px-4 py-4 border-b border-gray-800",
        collapsed && "px-2"
      )}>
        {!collapsed ? (
          <Image src="/logo.png" alt="UP'TECH" width={140} height={55} className="object-contain" />
        ) : (
          <div className="w-8 h-8 bg-[#CC1F1F] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">U</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-[#CC1F1F] text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profil utilisateur */}
      <div className={cn(
        "border-t border-gray-800 p-3",
        collapsed ? "flex flex-col items-center gap-2" : "space-y-3"
      )}>
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={profile.photo_url ?? ''} />
              <AvatarFallback className="bg-[#CC1F1F] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {profile.prenom} {profile.nom}
              </p>
              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 mt-0.5">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
          </div>
        )}
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "text-gray-400 hover:text-white hover:bg-gray-900 w-full",
              collapsed ? "px-2 justify-center" : "justify-start gap-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">Déconnexion</span>}
          </Button>
        </form>
      </div>
    </aside>
  )
}
