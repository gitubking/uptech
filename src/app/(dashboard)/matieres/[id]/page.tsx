import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMatiereById } from '@/app/actions/matieres'
import { ProgrammeAjoutDialog } from '@/components/matieres/programme-ajout-dialog'
import { ProgrammeDeleteButton } from '@/components/matieres/programme-delete-button'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

export default async function MatiereDetailPage({ params }: Props) {
  const { id } = await params

  let matiere
  try { matiere = await getMatiereById(id) } catch { notFound() }
  if (!matiere) notFound()

  const supabase = await createClient()
  const [{ data: filieres }, { data: enseignants }, { data: annees }, { data: anneeActive }] = await Promise.all([
    supabase.from('filieres').select('id, nom, code').eq('actif', true).order('nom'),
    supabase.from('enseignants').select('id, nom, prenom').eq('actif', true).order('nom'),
    supabase.from('annees_academiques').select('id, libelle').order('date_debut', { ascending: false }),
    supabase.from('annees_academiques').select('id, libelle').eq('actif', true).single(),
  ])

  const programme = (matiere.programme ?? []) as {
    id: string
    filiere_id: string
    semestre: string
    coefficient: number
    credit: number
    volume_horaire: number
    filiere: { id: string; nom: string; code: string } | null
    enseignant: { id: string; nom: string; prenom: string } | null
    annee_academique: { id: string; libelle: string } | null
  }[]

  // Grouper par année académique
  const byAnnee: Record<string, typeof programme> = {}
  for (const p of programme) {
    const libelle = p.annee_academique?.libelle ?? 'Inconnue'
    if (!byAnnee[libelle]) byAnnee[libelle] = []
    byAnnee[libelle].push(p)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-4">
        <Link href="/matieres">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800 mt-1">
            <ArrowLeft className="h-4 w-4" />
            Catalogue
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{matiere.code}</span>
            <h1 className="text-2xl font-bold text-gray-900">{matiere.nom}</h1>
          </div>
          {matiere.description && <p className="text-sm text-gray-500 mt-1">{matiere.description}</p>}
        </div>
        <ProgrammeAjoutDialog
          matiereId={matiere.id}
          matiereNom={matiere.nom}
          filieres={filieres ?? []}
          enseignants={enseignants ?? []}
          annees={annees ?? []}
          anneeActive={anneeActive ?? null}
        />
      </div>

      {/* Programmes par filière */}
      {programme.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <School className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Cette matière n&apos;est affectée à aucune filière</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur &quot;Affecter à une filière&quot; pour l&apos;ajouter à un programme.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byAnnee).map(([anneeLabel, entries]) => (
            <div key={anneeLabel} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Année {anneeLabel}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Filière</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Semestre</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Coeff</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Crédits</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">V.H (h)</th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Enseignant</th>
                    <th className="py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded mr-1.5">{p.filiere?.code}</span>
                        <span className="text-gray-700 text-xs">{p.filiere?.nom}</span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">S{p.semestre}</td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900 text-xs">{p.coefficient}</td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">{p.credit}</td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">{p.volume_horaire}h</td>
                      <td className="py-2.5 px-4 text-gray-600 text-xs">
                        {p.enseignant ? `${p.enseignant.nom} ${p.enseignant.prenom}` : <span className="italic text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <ProgrammeDeleteButton programmeId={p.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
