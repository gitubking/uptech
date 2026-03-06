'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Briefcase, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const NAV = [
  { href: '/enseignant/dashboard', icon: Home,     label: 'Accueil'     },
  { href: '/enseignant/mes-cours', icon: Users,     label: 'Mes Cours'   },
  { href: '/enseignant/paiements', icon: Briefcase, label: 'Paiements'   },
]

export function EnseignantSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col bg-white border-r border-gray-200 w-16 min-h-screen shrink-0">

      {/* Logo */}
      <div className="flex items-center justify-center py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-[#CC1F1F] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm leading-none">U</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-[#CC1F1F] text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <div className="flex flex-col items-center pb-5">
        <form action={logout}>
          <button
            type="submit"
            title="Déconnexion"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </aside>
  )
}
