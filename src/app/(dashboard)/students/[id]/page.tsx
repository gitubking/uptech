import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getStudentById } from '@/app/actions/students'
import { getActiveAnnee, getBulletin } from '@/app/actions/grades'
import { getStudentAttendanceStats } from '@/app/actions/attendance'
import { getPaiementsEtudiant, getTarifEtudiant } from '@/app/actions/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StudentActions } from '@/components/students/student-actions'
import {
  ArrowLeft, Pencil, User, Phone, GraduationCap,
  Mail, MapPin, Calendar, Hash, ClipboardList,
  CalendarCheck, CreditCard, ExternalLink,
} from 'lucide-react'

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  inscrit:    { label: 'Inscrit',    color: 'bg-green-100 text-green-700 border-green-200' },
  preinscrit: { label: 'Préinscrit', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  diplome:    { label: 'Diplômé',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
  abandonne:  { label: 'Abandonné',  color: 'bg-red-100 text-red-700 border-red-200' },
  suspendu:   { label: 'Suspendu',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

const MENTION_COLORS: Record<string, string> = {
  TB: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  AB: 'bg-indigo-100 text-indigo-700',
  P: 'bg-amber-100 text-amber-700',
  F: 'bg-red-100 text-red-700',
}

const PAIEMENT_STATUT: Record<string, { label: string; color: string }> = {
  paye:       { label: 'Payé',       color: 'bg-green-100 text-green-700' },
  en_attente: { label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  partiel:    { label: 'Partiel',    color: 'bg-yellow-100 text-yellow-700' },
  exonere:    { label: 'Exonéré',   color: 'bg-blue-100 text-blue-700' },
}

interface PageProps {
  params: Promise<{ id: string }>
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params

  let student
  try {
    student = await getStudentById(id)
  } catch {
    notFound()
  }

  const activeAnnee = await getActiveAnnee()
  const [bulletinResult, attendanceResult, paiementsResult, tarifResult] = await Promise.allSettled([
    activeAnnee ? getBulletin(id, activeAnnee.id) : Promise.resolve(null),
    getStudentAttendanceStats(id),
    getPaiementsEtudiant(id),
    getTarifEtudiant(student.filiere_id, student.annee_academique_id),
  ])

  const bulletin = bulletinResult.status === 'fulfilled' ? bulletinResult.value : null
  const attendanceData = attendanceResult.status === 'fulfilled' ? attendanceResult.value : null
  const paiementsList = paiementsResult.status === 'fulfilled' ? paiementsResult.value : []
  const tarif = tarifResult.status === 'fulfilled' ? tarifResult.value : null

  // Bulletin summary
  const matieresWithNote = bulletin?.matieres?.filter((m) => m.note_finale !== null) ?? []
  const totalCoeff = matieresWithNote.reduce((s, m) => s + (m.coefficient ?? 0), 0)
  const sommePoints = matieresWithNote.reduce((s, m) => s + (m.note_finale ?? 0) * (m.coefficient ?? 0), 0)
  const moyenneGenerale = totalCoeff > 0 ? sommePoints / totalCoeff : null

  // Attendance summary
  const totalPresences = attendanceData?.stats?.reduce((s, st) => s + st.total, 0) ?? 0
  const totalPresent = attendanceData?.stats?.reduce((s, st) => s + st.present, 0) ?? 0
  const tauxGlobal = totalPresences > 0 ? Math.round((totalPresent / totalPresences) * 100) : null

  // Finance summary
  const totalPaye = paiementsList.reduce((s, p) => p.statut === 'paye' || p.statut === 'partiel' ? s + Number(p.montant) : s, 0)
  const totalAttente = paiementsList.reduce((s, p) => p.statut === 'en_attente' ? s + Number(p.montant_total) : s, 0)
  const totalTarif = tarif ? Number(tarif.mensualite) * tarif.nb_mensualites : null
  const soldeDu = totalTarif !== null ? Math.max(0, totalTarif - totalPaye) : totalAttente > 0 ? totalAttente : null

  // Numérotation des mensualités (ordre chronologique)
  const scolariteOrdered = [...paiementsList]
    .filter(p => p.type === 'scolarite')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const mensualiteNum = new Map(scolariteOrdered.map((p, i) => [p.id, i + 1]))
  function mensualiteLabel(n: number) {
    return n === 1 ? '1ère mensualité' : `${n}ème mensualité`
  }
  const TYPE_LABELS_PAY: Record<string, string> = {
    inscription: 'Inscription',
    rattrapage: 'Rattrapage',
    autre: 'Autre',
  }

  const initials = `${student.prenom[0]}${student.nom[0]}`.toUpperCase()
  const statut = STATUT_CONFIG[student.statut] ?? { label: student.statut, color: 'bg-gray-100 text-gray-700' }
  const age = new Date().getFullYear() - new Date(student.date_naissance).getFullYear()

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/students">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche Étudiant</h1>
            <p className="text-gray-500 text-sm">Détails et informations complètes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/students/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
          <StudentActions
            studentId={id}
            statut={student.statut}
            anneeAcademiqueId={student.annee_academique_id}
            tarif={tarif ? { frais_inscription: Number(tarif.frais_inscription), mensualite: Number(tarif.mensualite), nb_mensualites: tarif.nb_mensualites } : null}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-indigo-50 rounded-lg p-2.5 shrink-0">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Moyenne générale</p>
            <p className="text-xl font-bold text-gray-900">
              {moyenneGenerale !== null ? `${moyenneGenerale.toFixed(2)}/20` : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-green-50 rounded-lg p-2.5 shrink-0">
            <CalendarCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Taux de présence</p>
            <p className="text-xl font-bold text-gray-900">
              {tauxGlobal !== null ? `${tauxGlobal}%` : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-orange-50 rounded-lg p-2.5 shrink-0">
            <CreditCard className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Solde dû</p>
            <p className={`text-xl font-bold ${soldeDu !== null && soldeDu > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {soldeDu !== null ? formatMoney(soldeDu) : '—'}
            </p>
            {totalTarif !== null && (
              <p className="text-xs text-gray-400">{formatMoney(totalPaye)} / {formatMoney(totalTarif)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte profil */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{student.prenom} {student.nom}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{age} ans · {student.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
            </div>
            <span className={`inline-flex text-sm font-medium px-3 py-1 rounded-full border ${statut.color}`}>
              {statut.label}
            </span>
            {student.matricule && (
              <div className="bg-gray-50 rounded-lg px-4 py-2 w-full">
                <p className="text-xs text-gray-400 mb-0.5">Matricule</p>
                <p className="font-mono font-bold text-gray-800">{student.matricule}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" /> Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={Calendar} label="Date de naissance"
                value={new Date(student.date_naissance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <InfoItem icon={MapPin} label="Lieu de naissance" value={student.lieu_naissance ?? '—'} />
              <InfoItem icon={Hash} label="Nationalité" value={student.nationalite ?? '—'} />
              <InfoItem icon={MapPin} label="Adresse" value={student.adresse ?? '—'} />
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={Mail} label="Email" value={student.email} />
              <InfoItem icon={Phone} label="Téléphone" value={student.telephone ?? '—'} />
              <InfoItem icon={Phone} label="Tél. parent" value={student.telephone_parent ?? '—'} />
              <InfoItem icon={Mail} label="Email parent" value={student.email_parent ?? '—'} />
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" /> Parcours académique
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem icon={GraduationCap} label="Filière"
                value={(student.filiere as { nom: string } | null)?.nom ?? '—'} />
              <InfoItem icon={GraduationCap} label="Niveau"
                value={(student.niveau as { nom: string } | null)?.nom ?? '—'} />
              <InfoItem icon={Calendar} label="Année académique"
                value={(student.annee_academique as { libelle: string } | null)?.libelle ?? '—'} />
              <InfoItem icon={Calendar} label="Inscrit le"
                value={new Date(student.created_at).toLocaleDateString('fr-FR')} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Academic data row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulletin résumé */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-600" />
                Notes — {activeAnnee?.libelle ?? '—'}
              </CardTitle>
              {activeAnnee && (
                <Link href={`/grades/bulletins/${id}?annee_id=${activeAnnee.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-800">
                    Bulletin complet <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {matieresWithNote.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune note saisie</p>
            ) : (
              <div className="space-y-2">
                {matieresWithNote.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate flex-1 mr-2">{m.nom}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-gray-900">
                        {(m.note_finale as number | null)?.toFixed(2) ?? '—'}/20
                      </span>
                      {m.mention && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${MENTION_COLORS[m.mention as string] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.mention}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {matieresWithNote.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{matieresWithNote.length - 5} autres</p>
                )}
                {moyenneGenerale !== null && (
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Moyenne générale</span>
                    <span className="text-base font-bold text-gray-900">{moyenneGenerale.toFixed(2)}/20</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Présences résumé */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-green-600" />
              Présences par matière
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(attendanceData?.stats?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune séance enregistrée</p>
            ) : (
              <div className="space-y-2.5">
                {attendanceData!.stats!.slice(0, 5).map((s) => (
                  <div key={s.matiere.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700 truncate flex-1">{s.matiere.nom}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${(s.taux ?? 0) >= 75 ? 'bg-green-500' : (s.taux ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${s.taux ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10 text-right">
                        {s.taux !== null ? `${s.taux}%` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
                {tauxGlobal !== null && (
                  <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Taux global</span>
                    <span className={`text-base font-bold ${tauxGlobal >= 75 ? 'text-green-700' : tauxGlobal >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {tauxGlobal}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paiements */}
      {paiementsList.length > 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                Paiements
              </CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600 font-medium">{formatMoney(totalPaye)} payé</span>
                {totalAttente > 0 && <span className="text-orange-600 font-medium">{formatMoney(totalAttente)} dû</span>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-50">
              {paiementsList.slice(0, 5).map((p) => {
                const cfg = PAIEMENT_STATUT[p.statut] ?? { label: p.statut, color: 'bg-gray-100 text-gray-600' }
                const annee = p.annee_academique as { libelle: string } | null
                const pLabel = p.type === 'scolarite'
                  ? mensualiteLabel(mensualiteNum.get(p.id) ?? 1)
                  : (TYPE_LABELS_PAY[p.type] ?? p.type)
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2">
                    <div>
                      <span className="font-medium text-gray-800">{pLabel}</span>
                      {annee && <span className="text-xs text-gray-400 ml-2">{annee.libelle}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{formatMoney(Number(p.montant))}</span>
                      <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
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
