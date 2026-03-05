'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserProfile } from '@/types'

interface HeaderProps {
  profile: UserProfile | null
  title?: string
}

export function Header({ profile, title }: HeaderProps) {
  const initials = profile
    ? `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase()
    : 'U'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Titre de la page */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title ?? 'Tableau de bord'}</h2>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-56 h-9 bg-gray-50 border-gray-200 text-sm"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        {/* Avatar */}
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarImage src={profile?.photo_url ?? ''} />
          <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
