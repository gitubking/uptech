import Link from 'next/link'
import { getBulletin, getActiveAnnee } from '@/app/actions/grades'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle, User, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DownloadBulletinBtn } from '@/components/grades/download-bulletin-btn'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ annee_id?: string }>
}

const MENTION_COLORS: Record<string, string> = {
  TB: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  AB: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  P: 'bg-amber-100 text-amber-700 border-amber-200',
  F: 'bg-red-100 text-red-700 border-red-200',
}

const MENTION_LABELS: Record<string, string> = {
  TB: 'Très Bien',
  B: 'Bien',
  AB: 'Assez Bien',
  P: 'Passable',
  F: 'Insuffisant',
}

export default async function BulletinPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { annee_id: anneeParam } = await searchParams
  const activeAnnee = await getActiveAnnee()
  const annee_id = anneeParam ?? activeAnnee?.id ?? ''

  if (!annee_id) {
    return (
      <div className="space-y-4">
        <Link href="/grades">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">Aucune année académique active trouvée.</p>
        </div>
      </div>
    )
  }

  const { etudiant, matieres, annee } = await getBulletin(id, annee_id)

  if (!etudiant) {
    return (
      <div className="space-y-4">
        <Link href="/grades">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">Étudiant introuvable.</p>
        </div>
      </div>
    )
  }

  const filiereEtudiant = etudiant.filiere as unknown as { nom: string; code: string } | null
  const niveauEtudiant = etudiant.niveau as unknown as { nom: string } | null

  const matieresAvecNote = matieres.filter((m) => m.note_finale !== null)
  const totalCoeff = matieresAvecNote.reduce((s, m) => s + (m.coefficient ?? 0), 0)
  const sommePoints = matieresAvecNote.reduce(
    (s, m) => s + (m.note_finale ?? 0) * (m.coefficient ?? 0), 0
  )
  const moyenne = totalCoeff > 0 ? sommePoints / totalCoeff : null
  const totalCredits = matieresAvecNote
    .filter((m) => (m.note_finale ?? 0) >= 10)
    .reduce((s, m) => s + (m.credit ?? 0), 0)
  const sem1 = matieres.filter((m) => m.semestre === '1')
  const sem2 = matieres.filter((m) => m.semestre === '2')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/grades">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Année : <span className="font-medium text-gray-600">{annee?.libelle}</span>
          </span>
          <DownloadBulletinBtn
            studentId={id}
            anneeId={annee_id}
            studentName={`${etudiant.prenom} ${etudiant.nom}`}
          />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-50 text-indigo-600 p-3 shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {etudiant.prenom} {etudiant.nom}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              <span className="font-mono bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mr-2">
                {etudiant.matricule}
              </span>
              {filiereEtudiant?.nom} — {niveauEtudiant?.nom}
            </p>
          </div>
          {moyenne !== null && (
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-gray-900">
                {moyenne.toFixed(2)}
                <span className="text-base font-normal text-gray-400">/20</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Moyenne générale</p>
              <p className="text-xs text-gray-400">{totalCredits} crédits validés</p>
            </div>
          )}
        </div>
      </div>
      {[
        { label: 'Semestre 1', data: sem1 },
        { label: 'Semestre 2', data: sem2 },
      ].map(({ label, data }) =>
        data.length > 0 ? (
          <Card key={label} className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Matière</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500 hidden sm:table-cell">Coeff.</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500">Note</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500 hidden md:table-cell">Ratt.</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500">Finale</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500">Mention</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-500 hidden lg:table-cell">Crédits</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500 hidden lg:table-cell">Enseignant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((m) => {
                    const mention = m.mention as string | null
                    const mentionColor = mention
                      ? (MENTION_COLORS[mention] ?? 'bg-gray-100 text-gray-600 border-gray-200')
                      : ''
                    const ens = (m.enseignant as unknown as { nom: string; prenom: string } | null)
                    const enseignant = ens ? `${ens.prenom} ${ens.nom}` : '—'
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{m.nom}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.code}</p>
                        </td>
                        <td className="px-3 py-3 text-center hidden sm:table-cell text-gray-600">
                          {m.coefficient}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700">
                          {m.note_normale !== null ? m.note_normale.toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center hidden md:table-cell text-gray-500">
                          {m.note_rattrapage !== null ? m.note_rattrapage.toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-gray-900">
                          {m.note_finale !== null ? m.note_finale.toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {mention ? (
                            <span
                              className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${mentionColor}`}
                              title={MENTION_LABELS[mention]}
                            >
                              {mention}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center hidden lg:table-cell text-gray-600">
                          {(m.note_finale ?? 0) >= 10 ? (
                            <span className="text-green-600 font-medium">{m.credit}</span>
                          ) : (
                            <span className="text-gray-300">{m.credit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                          {enseignant}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null
      )}
      {matieres.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <GraduationCap className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">Aucune matière trouvée</p>
          <p className="text-sm mt-1">
            Cet étudiant n’a pas de matières enregistrées pour cette année
          </p>
        </div>
      )}
    </div>
  )
}
