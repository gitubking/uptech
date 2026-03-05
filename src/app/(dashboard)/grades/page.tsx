import Link from 'next/link'
import { getMatieres, getFormationData, getActiveAnnee } from '@/app/actions/grades'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle2, Clock, PenLine, ChevronRight } from 'lucide-react'
import { GradesFilters } from '@/components/grades/grades-filters'

interface PageProps {
  searchParams: Promise<{ filiere_id?: string; niveau_id?: string; semestre?: string }>
}

const SEMESTRE_CONFIG: Record<string, { label: string; color: string }> = {
  '1': { label: 'Semestre 1', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  '2': { label: 'Semestre 2', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

export default async function GradesPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const [annee, formationData] = await Promise.all([getActiveAnnee(), getFormationData()])
  const matieres = await getMatieres({
    filiere_id: filters.filiere_id,
    niveau_id: filters.niveau_id,
    semestre: filters.semestre,
    annee_id: annee?.id,
  })
  const total = matieres.length
  const avecNotes = matieres.filter((m) => m.notes_saisies > 0).length
  const enAttente = matieres.filter((m) => m.notes_saisies < m.total_etudiants).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes &amp; Résultats</h1>
          <p className="text-gray-500 text-sm mt-1">
            {annee ? `Année académique : ${annee.libelle}` : 'Gestion des notes et bulletins'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Total matières" value={total} color="blue" />
        <StatCard icon={CheckCircle2} label="Avec notes" value={avecNotes} color="green" />
        <StatCard icon={Clock} label="En attente" value={enAttente} color="orange" />
      </div>
      <GradesFilters filieres={formationData.filieres} niveaux={formationData.niveaux} />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {matieres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Aucune matière trouvée</p>
            <p className="text-sm mt-1">Modifiez vos filtres pour afficher les matières</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Matière</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Filière / Niveau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Semestre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Coeff.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Enseignant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matieres.map((matiere) => {
                const semestre = SEMESTRE_CONFIG[matiere.semestre] ?? {
                  label: `S${matiere.semestre}`,
                  color: 'bg-gray-100 text-gray-700 border-gray-200',
                }
                const notesProgress = matiere.total_etudiants > 0
                  ? Math.round((matiere.notes_saisies / matiere.total_etudiants) * 100) : 0
                const enseignant = matiere.enseignant
                  ? `${matiere.enseignant.prenom} ${matiere.enseignant.nom}` : '—'
                return (
                  <tr key={matiere.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg p-2 bg-indigo-50 text-indigo-600 shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{matiere.nom}</p>
                          <p className="text-xs text-gray-400 font-mono">{matiere.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p className="font-medium">{matiere.filiere?.code ?? '—'}</p>
                        <p className="text-gray-400">{matiere.niveau?.nom ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${semestre.color}`}>
                        {semestre.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-gray-700">{matiere.coefficient}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-xs">{enseignant}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className="font-semibold text-gray-900">{matiere.notes_saisies}</span>
                          <span className="text-gray-400">/</span>
                          <span>{matiere.total_etudiants}</span>
                        </div>
                        {matiere.total_etudiants > 0 && (
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                notesProgress === 100
                                  ? 'bg-green-500'
                                  : notesProgress > 0
                                  ? 'bg-amber-500'
                                  : 'bg-gray-200'
                              }`}
                              style={{ width: `${notesProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/grades/saisir?matiere_id=${matiere.id}&annee_id=${annee?.id ?? ''}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 gap-1">
                          <PenLine className="h-3.5 w-3.5" />
                          Saisir notes
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {matieres.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {matieres.length} matière{matieres.length > 1 ? 's' : ''} affichée{matieres.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: number; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
