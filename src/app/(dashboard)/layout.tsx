import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { ShieldX } from 'lucide-react'

const ROUTE_ROLES: Record<string, string[]> = {
  '/students':      ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'],
  '/teachers':      ['super_admin', 'directeur', 'responsable_pedagogique', 'secretaire'],
  '/courses':       ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant'],
  '/grades':        ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'],
  '/attendance':    ['super_admin', 'directeur', 'responsable_pedagogique', 'enseignant', 'etudiant'],
  '/finance':       ['super_admin', 'directeur', 'agent_comptable'],
  '/reports':       ['super_admin', 'directeur', 'responsable_pedagogique'],
  '/settings':      ['super_admin'],
  '/communication': ['all'],
  '/dashboard':     ['all'],
}

function hasAccess(pathname: string, role: string): boolean {
  const route = Object.keys(ROUTE_ROLES).find(r => pathname.startsWith(r))
  if (!route) return true
  const allowed = ROUTE_ROLES[route]
  return allowed.includes('all') || allowed.includes(role)
}

export default async function DashboardLayout({
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

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const role = profile?.role ?? ''
  const accessDenied = profile && !hasAccess(pathname, role)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {accessDenied ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
              <div className="bg-red-100 rounded-full p-4">
                <ShieldX className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Accès refusé</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
                </p>
              </div>
            </div>
          ) : children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
