import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTeacherById } from '@/app/actions/teachers'
import { TeacherEditForm } from '@/components/teachers/teacher-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeacherPage({ params }: PageProps) {
  const { id } = await params

  let teacher: Awaited<ReturnType<typeof getTeacherById>>
  try {
    teacher = await getTeacherById(id)
  } catch {
    notFound()
  }

  const defaultValues: Record<string, string> = {
    nom: teacher.nom,
    prenom: teacher.prenom,
    email: teacher.email,
    telephone: teacher.telephone ?? '',
    specialite: teacher.specialite ?? '',
    type_contrat: teacher.type_contrat,
    date_embauche: teacher.date_embauche ?? '',
    actif: teacher.actif ? 'true' : 'false',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/teachers/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;enseignant</h1>
          <p className="text-gray-500 text-sm mt-1">
            {teacher.prenom} {teacher.nom} · {teacher.matricule}
          </p>
        </div>
      </div>

      <TeacherEditForm teacherId={id} defaultValues={defaultValues} />
    </div>
  )
}
