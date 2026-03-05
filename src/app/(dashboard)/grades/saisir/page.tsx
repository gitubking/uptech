import Link from 'next/link'
import { getStudentsWithNotes } from '@/app/actions/grades'
import { NotesTable } from '@/components/grades/notes-table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ matiere_id?: string; annee_id?: string }>
}

export default async function SaisirPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { matiere_id, annee_id } = params

  if (!matiere_id || !annee_id) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/grades">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Paramètres manquants</p>
            <p className="text-sm mt-0.5">
              Les paramètres <code className="font-mono">matiere_id</code> et{' '}
              <code className="font-mono">annee_id</code> sont requis pour saisir les notes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { matiere, students } = await getStudentsWithNotes(matiere_id, annee_id)

  if (!matiere) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/grades">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-semibold">Matière introuvable.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/grades">
          <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Retour aux matières
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {matiere.nom}{' '}
          <span className="font-mono text-gray-400 text-xs">({matiere.code})</span>
          {' — '}
          {matiere.filiere?.nom ?? ''}{' '}
          {matiere.niveau?.nom ?? ''}
        </p>
      </div>
      <NotesTable matiere={matiere} students={students} annee_id={annee_id} />
    </div>
  )
}
