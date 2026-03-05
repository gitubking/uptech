import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getAttendanceForDate } from '@/app/actions/attendance'
import { AttendanceTable } from '@/components/attendance/attendance-table'

interface Props {
  searchParams: Promise<{ matiere_id?: string; date?: string }>
}

export default async function SaisirAttendancePage({ searchParams }: Props) {
  const params = await searchParams
  const { matiere_id, date } = params

  if (!matiere_id || !date) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Paramètres manquants</p>
            <p className="text-sm mt-1">
              Les paramètres <code className="bg-red-100 px-1 rounded text-xs">matiere_id</code> et{' '}
              <code className="bg-red-100 px-1 rounded text-xs">date</code> sont requis.
            </p>
          </div>
        </div>
      </div>
    )
  }

  let result: Awaited<ReturnType<typeof getAttendanceForDate>> | null = null
  let fetchError: string | null = null

  try {
    result = await getAttendanceForDate(matiere_id, date)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur lors du chargement'
  }

  if (fetchError || !result) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
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

  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feuille de présence</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{dateFormatted}</p>
        </div>
      </div>

      <AttendanceTable
        matiere={result.matiere as Parameters<typeof AttendanceTable>[0]['matiere']}
        date_cours={date}
        rows={result.rows as Parameters<typeof AttendanceTable>[0]['rows']}
      />
    </div>
  )
}
