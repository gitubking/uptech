import { CalendarCheck, Users, TrendingUp, AlertTriangle, PenLine } from 'lucide-react'
import { getMatieresForAttendance, getRecentSessions } from '@/app/actions/attendance'
import { getFormationData } from '@/app/actions/grades'
import { AttendanceFilter } from '@/components/attendance/attendance-filter'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function AttendancePage() {
  const [{ filieres, niveaux }, matieres, recentSessions] = await Promise.all([
    getFormationData(),
    getMatieresForAttendance(),
    getRecentSessions(undefined, 8),
  ])

  const statut_colors: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    retard: 'bg-amber-100 text-amber-700',
    excuse: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des feuilles de présence</p>
        </div>
        <Link
          href="/attendance/emarger"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <PenLine className="h-4 w-4" />
          Émargement enseignants
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-blue-50 rounded-lg p-2.5">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{matieres.length}</p>
            <p className="text-xs text-gray-500">Matières actives</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-green-50 rounded-lg p-2.5">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{recentSessions.length}</p>
            <p className="text-xs text-gray-500">Séances récentes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-orange-50 rounded-lg p-2.5">
            <Users className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{filieres.length}</p>
            <p className="text-xs text-gray-500">Filières</p>
          </div>
        </div>
      </div>

      {/* Filter / access form */}
      <AttendanceFilter
        matieres={matieres as unknown as Parameters<typeof AttendanceFilter>[0]['matieres']}
        filieres={filieres}
        niveaux={niveaux}
      />

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Séances récentes</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600">Matière</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600">Filière</th>
                <th className="text-left py-2.5 px-4 font-medium text-gray-600">Niveau</th>
                <th className="text-right py-2.5 px-4 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSessions.map((s, i) => {
                const m = s.matiere as unknown as { id: string; nom: string; code: string; filiere?: { nom: string } | null; niveau?: { nom: string } | null } | null
                if (!m) return null
                const dateStr = new Date(s.date_cours + 'T00:00:00').toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-4 text-gray-700">{dateStr}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-900">
                      <span className="text-xs font-mono text-gray-400 mr-1">{m.code}</span>
                      {m.nom}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">{m.filiere?.nom}</td>
                    <td className="py-2.5 px-4 text-gray-500">{m.niveau?.nom}</td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/attendance/saisir?matiere_id=${m.id}&date=${s.date_cours}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Modifier →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {recentSessions.length === 0 && matieres.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune matière disponible</p>
          <p className="text-sm text-gray-400 mt-1">Créez des matières dans le module Formations pour commencer.</p>
        </div>
      )}
    </div>
  )
}
