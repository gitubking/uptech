import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Users, BookOpen, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getClasseById, getEtudiantsParFiliere } from '@/app/actions/classes'
import { ClasseActions } from '@/components/classes/classe-actions'
import { AffectationDialog } from '@/components/classes/affectation-dialog'
import { ProgrammeClasseManager } from '@/components/classes/programme-classe-manager'
import { getEnseignementsClasse } from '@/app/actions/enseignement'
import { createClient } from '@/lib/supabase/server'

const STATUT_CONFIG: Record<string, { label: string; class: string }> = {
  en_preparation: { label: 'En préparation', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  en_cours:       { label: 'En cours',       class: 'bg-green-100 text-green-700 border-green-200' },
  terminee:       { label: 'Terminée',       class: 'bg-gray-100 text-gray-600 border-gray-200' },
  annulee:        { label: 'Annulée',        class: 'bg-red-100 text-red-600 border-red-200' },
}

const STATUT_ETUDIANT: Record<string, { label: string; class: string }> = {
  inscrit:    { label: 'Inscrit',    class: 'bg-green-100 text-green-700' },
  preinscrit: { label: 'Préinscrit', class: 'bg-amber-100 text-amber-700' },
  diplome:    { label: 'Diplômé',    class: 'bg-blue-100 text-blue-700' },
  abandonne:  { label: 'Abandonné',  class: 'bg-red-100 text-red-600' },
  suspendu:   { label: 'Suspendu',   class: 'bg-gray-100 text-gray-600' },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClasseDetailPage({ params }: Props) {
  const { id } = await params

  let classe
  try {
    classe = await getClasseById(id)
  } catch {
    notFound()
  }

  if (!classe) notFound()

  const filiere = classe.filiere as { id: string; nom: string; code: string; type_formation?: string } | null
  const annee = classe.annee_academique as { libelle: string } | null
  const etudiants = (classe.etudiants ?? []) as { id: string; matricule: string; nom: string; prenom: string; statut: string }[]

  // Paralléliser les fetches
  const [tousEtudiantsFiliere, enseignements, enseignantsData] = await Promise.all([
    filiere?.id ? getEtudiantsParFiliere(filiere.id) : Promise.resolve([]),
    getEnseignementsClasse(id),
    createClient().then(s => s.from('enseignants').select('id, nom, prenom').eq('actif', true).order('nom')),
  ])
  const enseignants = (enseignantsData.data ?? []) as { id: string; nom: string; prenom: string }[]
  const statut = STATUT_CONFIG[classe.statut] ?? STATUT_CONFIG['en_preparation']
  const rentree = new Date(classe.date_rentree).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const inscrits = etudiants.filter(e => e.statut === 'inscrit').length
  const preinscrits = etudiants.filter(e => e.statut === 'preinscrit').length
  const tauxRemplissage = classe.capacite > 0 ? Math.round((etudiants.length / classe.capacite) * 100) : 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/classes">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800 mt-1">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{classe.nom}</h1>
            <Badge variant="outline" className={`text-xs border ${statut.class}`}>
              {statut.label}
            </Badge>
          </div>
          <p className="text-gray-400 font-mono text-sm mt-1">{classe.code}</p>
        </div>
        <ClasseActions classeId={classe.id} statut={classe.statut} />
      </div>

      {/* Infos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-gray-500">Filière</p>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{filiere?.code}</p>
          <p className="text-xs text-gray-400">{filiere?.nom}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-gray-500">Année académique</p>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{annee?.libelle}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-green-500" />
            <p className="text-xs text-gray-500">Rentrée</p>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{rentree}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-orange-500" />
            <p className="text-xs text-gray-500">Effectif</p>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{etudiants.length} / {classe.capacite}</p>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${tauxRemplissage > 90 ? 'bg-red-500' : tauxRemplissage > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(tauxRemplissage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{tauxRemplissage}% rempli</p>
        </div>
      </div>

      {/* Résumé statuts */}
      <div className="flex gap-3 text-sm">
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">{inscrits} inscrit{inscrits > 1 ? 's' : ''}</span>
        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">{preinscrits} préinscrit{preinscrits > 1 ? 's' : ''}</span>
        {etudiants.length - inscrits - preinscrits > 0 && (
          <span className="bg-gray-50 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">{etudiants.length - inscrits - preinscrits} autre{etudiants.length - inscrits - preinscrits > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Liste étudiants */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Étudiants affectés</h2>
          <AffectationDialog
            classeId={classe.id}
            classeNom={classe.nom}
            filiereId={filiere?.id ?? ''}
            etudiants={tousEtudiantsFiliere}
          />
        </div>
        {etudiants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun étudiant affecté à cette classe</p>
            <p className="text-xs text-gray-300 mt-1">Cliquez sur &quot;Affecter des étudiants&quot; pour commencer.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600 text-xs">Matricule</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600 text-xs">Nom complet</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600 text-xs">Statut</th>
                <th className="text-right py-2.5 px-4 font-medium text-gray-600 text-xs">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {etudiants.map(e => {
                const s = STATUT_ETUDIANT[e.statut] ?? { label: e.statut, class: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{e.matricule}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-900">{e.nom} {e.prenom}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.class}`}>{s.label}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link href={`/students/${e.id}`}>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600">Voir →</Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Programme de la classe */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <ProgrammeClasseManager
          classeId={id}
          enseignements={enseignements as unknown as Parameters<typeof ProgrammeClasseManager>[0]['enseignements']}
          enseignants={enseignants}
        />
      </div>
    </div>
  )
}
