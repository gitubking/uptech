import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Calendar, BookOpen } from 'lucide-react'
import { getClasses, getFilieresEtNiveaux } from '@/app/actions/classes'
import { createClient } from '@/lib/supabase/server'
import { ClasseActions } from '@/components/classes/classe-actions'
import { ClasseCreateDialog } from '@/components/classes/classe-create-dialog'

const STATUT_CONFIG: Record<string, { label: string; class: string }> = {
  en_preparation: { label: 'En préparation', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  en_cours:       { label: 'En cours',       class: 'bg-green-100 text-green-700 border-green-200' },
  terminee:       { label: 'Terminée',       class: 'bg-gray-100 text-gray-600 border-gray-200' },
  annulee:        { label: 'Annulée',        class: 'bg-red-100 text-red-600 border-red-200' },
}

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: anneeActive } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('actif', true)
    .single()

  const [classes, { filieres }, { data: annees }] = await Promise.all([
    getClasses({ annee_academique_id: anneeActive?.id }),
    getFilieresEtNiveaux(),
    supabase.from('annees_academiques').select('id, libelle').order('date_debut', { ascending: false }),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {anneeActive ? `Année ${anneeActive.libelle}` : 'Gestion des classes et cohortes'}
          </p>
        </div>
        <ClasseCreateDialog
          filieres={filieres as Parameters<typeof ClasseCreateDialog>[0]['filieres']}
          annees={(annees ?? []) as Parameters<typeof ClasseCreateDialog>[0]['annees']}
          anneeActive={anneeActive}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['en_preparation', 'en_cours', 'terminee', 'annulee'] as const).map(s => {
          const count = classes.filter(c => c.statut === s).length
          const cfg = STATUT_CONFIG[s]
          return (
            <div key={s} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500">{cfg.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Liste */}
      {classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune classe pour cette année</p>
          <p className="text-sm text-gray-400 mt-1">Créez la première classe en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => {
            const filiere = c.filiere as { nom: string; code: string } | null
            const statut = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG['en_preparation']
            const nbEtudiants = Array.isArray(c.etudiants) ? c.etudiants.length : 0
            const rentree = new Date(c.date_rentree).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{c.nom}</p>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{c.code}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs border shrink-0 ml-2 ${statut.class}`}>
                      {statut.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{filiere?.code} — {filiere?.nom}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Rentrée : {rentree}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{nbEtudiants} / {c.capacite} étudiant{nbEtudiants > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-1 pt-3">
                  <Link href={`/classes/${c.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-7 px-2">
                      Voir détails →
                    </Button>
                  </Link>
                  <ClasseActions classeId={c.id} statut={c.statut} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
