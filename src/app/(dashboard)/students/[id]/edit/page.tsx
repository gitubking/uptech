import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStudentById, getFormData } from '@/app/actions/students'
import { StudentForm } from '@/components/students/student-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params

  let student
  let formData
  try {
    ;[student, formData] = await Promise.all([getStudentById(id), getFormData()])
  } catch {
    notFound()
  }

  const defaultValues: Record<string, string> = {
    nom: student.nom ?? '',
    prenom: student.prenom ?? '',
    date_naissance: student.date_naissance ?? '',
    lieu_naissance: student.lieu_naissance ?? '',
    sexe: student.sexe ?? '',
    nationalite: student.nationalite ?? '',
    adresse: student.adresse ?? '',
    email: student.email ?? '',
    telephone: student.telephone ?? '',
    telephone_parent: student.telephone_parent ?? '',
    email_parent: student.email_parent ?? '',
    filiere_id: student.filiere_id ?? '',
    niveau_id: student.niveau_id ?? '',
    annee_academique_id: student.annee_academique_id ?? '',
    statut: student.statut ?? 'inscrit',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/students/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;étudiant</h1>
          <p className="text-gray-500 text-sm mt-1">
            {student.prenom} {student.nom} — {student.matricule}
          </p>
        </div>
      </div>

      <StudentForm
        filieres={formData.filieres}
        niveaux={formData.niveaux}
        annees={formData.annees}
        defaultValues={defaultValues}
        studentId={id}
      />
    </div>
  )
}
