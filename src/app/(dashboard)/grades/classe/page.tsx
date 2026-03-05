import Link from 'next/link'
import { getFormationData, getActiveAnnee, getEtudiantsClasse } from '@/app/actions/grades'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Download, Users, GraduationCap } from 'lucide-react'
import { DownloadBulletinBtn } from '@/components/grades/download-bulletin-btn'

interface PageProps {
  searchParams: Promise<{ filiere_id?: string; niveau_id?: string }>
}

export default async function BulletinsClassePage({ searchParams }: PageProps) {
  const { filiere_id, niveau_id } = await searchParams
  const [formationData, annee] = await Promise.all([getFormationData(), getActiveAnnee()])
  const { filieres, niveaux } = formationData

  const filteredNiveaux = niveau_id
    ? niveaux
    : filiere_id
    ? niveaux.filter((n) => n.filiere_id === filiere_id)
    : niveaux

  const filiere = filieres.find((f) => f.id === filiere_id)
  const niveau = niveaux.find((n) => n.id === niveau_id)

  const etudiants =
    filiere_id && niveau_id && annee?.id
      ? await getEtudiantsClasse(filiere_id, niveau_id, annee.id)
      : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/grades">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulletins de classe</h1>
          <p className="text-gray-500 text-sm mt-1">
            {annee ? `Année académique : ${annee.libelle}` : 'Sélectionnez une classe'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 min-w-48">
            <label className="text-sm font-medium text-gray-700">Filière</label>
            <select
              name="filiere_id"
              defaultValue={filiere_id ?? ''}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">Toutes les filières</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 min-w-48">
            <label className="text-sm font-medium text-gray-700">Niveau</label>
            <select
              name="niveau_id"
              defaultValue={niveau_id ?? ''}
              className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-red-500"
            >
              <option value="">Tous les niveaux</option>
              {filteredNiveaux.map((n) => (
                <option key={n.id} value={n.id}>{n.nom}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="bg-black hover:bg-gray-900 text-white h-10">
            Afficher
          </Button>
        </form>
      </div>

      {/* Résultats */}
      {filiere_id && niveau_id ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                <span className="font-semibold">{etudiants.length}</span> étudiant{etudiants.length > 1 ? 's' : ''} —{' '}
                {filiere?.nom} / {niveau?.nom}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {etudiants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <GraduationCap className="h-10 w-10 mb-3 opacity-40" />
                <p className="font-medium">Aucun étudiant dans cette classe</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Rang</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Étudiant</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Matricule</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Moyenne</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Matières</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {etudiants.map((etudiant, index) => (
                    <tr key={etudiant.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {etudiant.prenom} {etudiant.nom}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {etudiant.matricule || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {etudiant.moyenne !== null ? (
                          <span className={`font-bold text-base ${
                            etudiant.moyenne >= 14 ? 'text-green-600' :
                            etudiant.moyenne >= 12 ? 'text-blue-600' :
                            etudiant.moyenne >= 10 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {etudiant.moyenne.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">Pas de notes</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-500 text-xs">
                        {etudiant.nbMatieres}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/grades/bulletins/${etudiant.id}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                              <FileText className="h-3.5 w-3.5" />
                              Voir
                            </Button>
                          </Link>
                          <DownloadBulletinBtn
                            studentId={etudiant.id}
                            anneeId={annee?.id}
                            studentName={`${etudiant.prenom} ${etudiant.nom}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <GraduationCap className="h-12 w-12 mb-4 opacity-30" />
          <p className="font-medium text-gray-500">Sélectionnez une filière et un niveau</p>
          <p className="text-sm mt-1">pour afficher les bulletins de la classe</p>
        </div>
      )}
    </div>
  )
}
