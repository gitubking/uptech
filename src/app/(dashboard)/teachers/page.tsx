import Link from 'next/link'
import { getTeachers } from '@/app/actions/teachers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  UserPlus, Users, BookOpen,
  GraduationCap, ChevronRight, Briefcase, Banknote
} from 'lucide-react'
import { TeachersFilters } from '@/components/teachers/teachers-filters'

interface PageProps {
  searchParams: Promise<{ search?: string; type_contrat?: string; actif?: string }>
}

const CONTRAT_CONFIG: Record<string, { label: string; color: string }> = {
  permanent:  { label: 'Permanent',  color: 'bg-green-100 text-green-700 border-green-200' },
  vacataire:  { label: 'Vacataire',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export default async function TeachersPage({ searchParams }: PageProps) {
  const filters = await searchParams
  const teachers = await getTeachers(filters)

  const total = teachers.length
  const permanents = teachers.filter(t => t.type_contrat === 'permanent').length
  const vacataires = teachers.filter(t => t.type_contrat === 'vacataire').length
  const actifs = teachers.filter(t => t.actif).length

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enseignants</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion du corps enseignant</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teachers/paiements">
            <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Banknote className="h-4 w-4" />
              Paiements
            </Button>
          </Link>
          <Link href="/teachers/new">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
              <UserPlus className="h-4 w-4" />
              Ajouter un enseignant
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total" value={total} color="blue" />
        <StatCard icon={Briefcase} label="Permanents" value={permanents} color="green" />
        <StatCard icon={GraduationCap} label="Vacataires" value={vacataires} color="orange" />
        <StatCard icon={BookOpen} label="Actifs" value={actifs} color="purple" />
      </div>

      {/* Filtres */}
      <TeachersFilters />

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">Aucun enseignant trouvé</p>
            <p className="text-sm mt-1">Modifiez vos filtres ou ajoutez un nouvel enseignant</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Enseignant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Matricule</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Spécialité</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contrat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.map((teacher) => {
                const initials = `${teacher.prenom[0]}${teacher.nom[0]}`.toUpperCase()
                const contrat = CONTRAT_CONFIG[teacher.type_contrat] ?? { label: teacher.type_contrat, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{teacher.prenom} {teacher.nom}</p>
                          <p className="text-xs text-gray-400 md:hidden">{teacher.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {teacher.matricule}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {teacher.specialite ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{teacher.email}</p>
                        {teacher.telephone && <p>{teacher.telephone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${contrat.color}`}>
                        {contrat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${
                        teacher.actif
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {teacher.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/teachers/${teacher.id}`}>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 gap-1">
                          Voir <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {teachers.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {teachers.length} enseignant{teachers.length > 1 ? 's' : ''} affiché{teachers.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`rounded-lg p-2.5 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
