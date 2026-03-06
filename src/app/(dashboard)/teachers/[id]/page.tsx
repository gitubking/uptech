import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTeacherById } from '@/app/actions/teachers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TeacherActions } from '@/components/teachers/teacher-actions'
import { createClient } from '@/lib/supabase/server'
import { getClassesEnseignant } from '@/app/actions/enseignement'
import {
  ArrowLeft, Pencil, User, Phone,
  Mail, Calendar, Briefcase, BookOpen, GraduationCap, School
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const CONTRAT_CONFIG: Record<string, { label: string; color: string }> = {
  permanent: { label: 'Permanent',  color: 'bg-green-100 text-green-700 border-green-200' },
  vacataire: { label: 'Vacataire',  color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params
  let teacher: Awaited<ReturnType<typeof getTeacherById>>
  try {
    teacher = await getTeacherById(id)
  } catch {
    notFound()
  }

  const classesEnseignant = await getClassesEnseignant(id)

  const initials = `${teacher.prenom[0]}${teacher.nom[0]}`.toUpperCase()
  const contrat = CONTRAT_CONFIG[teacher.type_contrat] ?? { label: teacher.type_contrat, color: 'bg-gray-100 text-gray-700' }

  const programme = (teacher.programme ?? []) as Array<{
    id: string; semestre: string; coefficient: number; volume_horaire: number
    matiere: { id: string; nom: string; code: string } | null
    filiere: { nom: string; code: string } | null
    annee_academique: { libelle: string } | null
  }>

  return (
    <div className="space-y-6 max-w-5xl">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teachers">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche Enseignant</h1>
            <p className="text-gray-500 text-sm">Détails et informations complètes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/teachers/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
          <TeacherActions teacherId={id} isActif={teacher.actif} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Carte profil */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {teacher.prenom} {teacher.nom}
              </h2>
              {teacher.specialite && (
                <p className="text-gray-500 text-sm mt-0.5">{teacher.specialite}</p>
              )}
            </div>

            <span className={`inline-flex text-sm font-medium px-3 py-1 rounded-full border ${contrat.color}`}>
              {contrat.label}
            </span>

            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${
              teacher.actif
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {teacher.actif ? '● Actif' : '● Inactif'}
            </span>

            {teacher.matricule && (
              <div className="bg-gray-50 rounded-lg px-4 py-2 w-full">
                <p className="text-xs text-gray-400 mb-0.5">Matricule</p>
                <p className="font-mono font-bold text-gray-800">{teacher.matricule}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails */}
        <div className="lg:col-span-2 space-y-4">

          {/* Infos personnelles */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={Mail} label="Email" value={teacher.email} />
              <InfoItem icon={Phone} label="Téléphone" value={teacher.telephone ?? '—'} />
              <InfoItem icon={GraduationCap} label="Spécialité" value={teacher.specialite ?? '—'} />
              <InfoItem
                icon={Calendar}
                label="Membre depuis"
                value={new Date(teacher.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              />
            </CardContent>
          </Card>

          {/* Contrat */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" />
                Informations contractuelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={Briefcase} label="Type de contrat" value={contrat.label} />
              <InfoItem
                icon={Calendar}
                label="Date d'embauche"
                value={teacher.date_embauche
                  ? new Date(teacher.date_embauche).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })
                  : '—'
                }
              />
            </CardContent>
          </Card>

          {/* Classes & Modules */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <School className="h-4 w-4 text-green-600" />
                Classes &amp; Modules
                <span className="text-xs font-normal text-gray-400">
                  ({classesEnseignant.length} intervention{classesEnseignant.length > 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classesEnseignant.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucune classe assignée — affectez cet enseignant depuis la fiche d&apos;une classe
                </p>
              ) : (
                <div className="space-y-2">
                  {classesEnseignant.map((e) => {
                    const cls = e.classe as unknown as { id: string; nom: string; code: string; statut: string; filiere: { nom: string; code: string } | null } | null
                    const prog = e.programme as unknown as { id: string; semestre: string; coefficient: number; matiere: { nom: string; code: string } | null } | null
                    return (
                      <div key={e.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{prog?.matiere?.nom ?? '—'}</p>
                          <p className="text-xs text-gray-400">
                            {cls?.nom ?? '—'} · S{prog?.semestre} · Coeff. {prog?.coefficient}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {e.volume_horaire > 0 && <p>{e.volume_horaire}h</p>}
                          <Link href={`/classes/${cls?.id}`} className="text-blue-500 hover:underline">
                            Voir →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="bg-gray-50 rounded-md p-1.5 mt-0.5 shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-gray-800 text-sm">{value}</p>
      </div>
    </div>
  )
}
