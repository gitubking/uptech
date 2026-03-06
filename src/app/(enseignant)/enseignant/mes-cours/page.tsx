import { redirect } from 'next/navigation'
import { getEnseignantConnecte, getCoursEnseignant, getAnneesAcademiques } from '@/app/actions/enseignant'
import { CoursTable } from '@/components/enseignant/cours-table'
import { AnneeScolaireFilter } from '@/components/enseignant/annee-scolaire-filter'

interface PageProps {
  searchParams: Promise<{ annee?: string }>
}

export default async function MesCoursPage({ searchParams }: PageProps) {
  const { enseignant } = await getEnseignantConnecte()
  if (!enseignant) redirect('/login')

  const params  = await searchParams
  const [cours, annees] = await Promise.all([
    getCoursEnseignant(enseignant.id, params.annee),
    getAnneesAcademiques(),
  ])

  const anneeActive = annees.find(a => a.actif)
  const anneeSelectionnee = params.annee ?? anneeActive?.id ?? ''

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Filtre année scolaire */}
      <div className="flex justify-end">
        <AnneeScolaireFilter
          annees={annees}
          selected={anneeSelectionnee}
        />
      </div>

      {/* Tableau des cours */}
      <CoursTable cours={cours} />

    </div>
  )
}
