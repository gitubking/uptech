import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EnseignantSidebar } from '@/components/enseignant/enseignant-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDashboardStats } from '@/app/actions/enseignant'

export default async function EnseignantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'enseignant') redirect('/dashboard')

  const { data: enseignant } = await supabase
    .from('enseignants')
    .select('id, nom, prenom')
    .eq('email', user.email ?? '')
    .single()

  const stats = enseignant ? await getDashboardStats(enseignant.id) : null

  const initials = profile
    ? `${profile.prenom?.[0] ?? ''}${profile.nom?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const displayName = enseignant
    ? `M. ${enseignant.nom}`
    : `${profile?.prenom ?? ''} ${profile?.nom ?? ''}`

  const avoirs = stats?.avoirs ?? 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EnseignantSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gray-300 text-gray-700 text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-gray-900 text-base">{displayName}</span>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Mes avoirs</p>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {avoirs.toLocaleString('fr-FR')} F CFA
            </p>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  )
}
