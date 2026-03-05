import { TeacherForm } from '@/components/teachers/teacher-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NewTeacherPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/teachers">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel enseignant</h1>
          <p className="text-gray-500 text-sm mt-1">Remplissez le formulaire pour ajouter un enseignant</p>
        </div>
      </div>

      <TeacherForm />
    </div>
  )
}
