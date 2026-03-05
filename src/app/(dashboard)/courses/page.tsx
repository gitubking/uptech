import { getCoursesData } from '@/app/actions/courses'
import { CoursesClient } from '@/components/courses/courses-client'
import { AlertCircle } from 'lucide-react'

export default async function CoursesPage() {
  let data
  let fetchError: string | null = null

  try {
    data = await getCoursesData()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur lors du chargement'
  }

  if (fetchError || !data) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p className="text-sm mt-1">{fetchError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CoursesClient
      filieres={data.filieres as unknown as Parameters<typeof CoursesClient>[0]['filieres']}
      niveaux={data.niveaux as unknown as Parameters<typeof CoursesClient>[0]['niveaux']}
      matieres={data.matieres as unknown as Parameters<typeof CoursesClient>[0]['matieres']}
      enseignants={data.enseignants}
      etudiants={data.etudiants as unknown as Parameters<typeof CoursesClient>[0]['etudiants']}
      typeFormations={data.typeFormations as unknown as Parameters<typeof CoursesClient>[0]['typeFormations']}
    />
  )
}
