import { Suspense } from 'react'
import Link from 'next/link'
import { getStudents, getFormData } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StudentsFilters } from '@/components/students/students-filters'
import {
  UserPlus, Users, GraduationCap, UserCheck, UserX,
  Eye, BookOpen
} from 'lucide-react'

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  inscrit:    { label: 'Inscrit',     color: 'bg-green-100 text-green-700 border-green-200' },
  preinscrit: { label: 'Préinscrit',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  diplome:    { label: 'Diplômé',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  abandonne:  { label: 'Abandonné',   color: 'bg-red-100 text-red-700 border-red-200' },
  suspendu:   { label: 'Suspendu',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    type_formation?: string
    filiere_id?: string
    niveau_id?: string
    statut?: string
  }>
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [students, { filieres, niveaux }] = await Promise.all([
    getStudents(params),
    getFormData(),
  ])

  const stats = {
    total: students.length,
    inscrits: students.filter(s => s.statut === 'inscrit').length,
    preinscrit: students.filter(s => s.statut === 'preinscrit').length,
    diplomes: students.filter(s => s.statut === 'diplome').length,
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Étudiants</h1>
          <p className="text-gray-500 text-sm mt-1">{stats.total} étudiant{stats.total > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/students/new">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
            <UserPlus className="h-4 w-4" />
            Nouvel étudiant
          </Button>
        </Link>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Inscrits', value: stats.inscrits, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Préinscrits', value: stats.preinscrit, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Diplômés', value: stats.diplomes, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(stat => (
          <Card key={stat.label} className="border border-gray-100 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${stat.bg} rounded-lg p-2.5`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <StudentsFilters filieres={filieres} niveaux={niveaux} />

      {/* Liste étudiants */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-800">
            Liste des étudiants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UserX className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Aucun étudiant trouvé</p>
              <p className="text-sm mt-1">Modifiez les filtres ou ajoutez un nouvel étudiant</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Étudiant</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Matricule</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide hidden md:table-cell">Filière / Niveau</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Statut</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => {
                    const initials = `${student.prenom[0]}${student.nom[0]}`.toUpperCase()
                    const statut = STATUT_CONFIG[student.statut] ?? { label: student.statut, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {student.prenom} {student.nom}
                              </p>
                              <p className="text-xs text-gray-400">{student.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {student.matricule || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {(student.filiere as { nom: string } | null)?.nom ?? '—'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(student.niveau as { nom: string } | null)?.nom ?? '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-gray-600">{student.telephone || '—'}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${statut.color}`}>
                            {statut.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/students/${student.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              Voir
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
