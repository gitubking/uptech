import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getEnseignantConnecte,
  getDashboardStats,
  getCoursEnseignant,
  getCoursAujourdhui,
} from '@/app/actions/enseignant'
import { CoursTable } from '@/components/enseignant/cours-table'
import { Monitor, BookOpen, Clock, Hourglass } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Composant carte stat (bannière rouge) ────────────────────────────────────

function BannerCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="bg-white/20 rounded-xl p-4 flex items-center gap-3">
      <Icon className="h-5 w-5 text-white/80 shrink-0" />
      <div>
        <p className="text-white/80 text-xs">{label}</p>
        <p className="text-white font-semibold text-sm mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EnseignantDashboardPage() {
  const { enseignant } = await getEnseignantConnecte()
  if (!enseignant) redirect('/login')

  const [stats, allCours] = await Promise.all([
    getDashboardStats(enseignant.id),
    getCoursEnseignant(enseignant.id),
  ])

  const coursAujourdhui = await getCoursAujourdhui(enseignant.id, allCours)

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ── Bannière de bienvenue ── */}
      <div className="bg-[#CC1F1F] rounded-2xl p-6">
        <h1 className="text-white font-semibold text-base">Bienvenue à UPTECH,</h1>
        <p className="text-red-100 text-sm mt-0.5">Vous êtes connecté en tant que professeur.</p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <BannerCard
            icon={Monitor}
            label="Mes Revenus"
            value={`${fmt(stats.revenus)} FCFA`}
          />
          <BannerCard
            icon={BookOpen}
            label="Mes Classes"
            value={String(stats.nbClasses)}
          />
          <BannerCard
            icon={Clock}
            label="Durée Globale"
            value={`${stats.dureeGlobale} H`}
          />
          <BannerCard
            icon={Hourglass}
            label="Durée Restante"
            value={`${stats.dureeRestante} H`}
          />
        </div>
      </div>

      {/* ── Cours du jour ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Les cours du jour</h2>
        <CoursTable cours={coursAujourdhui} />
      </div>

    </div>
  )
}
