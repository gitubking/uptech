import { getReportData } from '@/app/actions/reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart2, Users, GraduationCap, BookOpen, CreditCard,
  CalendarCheck, TrendingUp, AlertCircle,
} from 'lucide-react'

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

export default async function ReportsPage() {
  let data
  let fetchError: string | null = null
  try {
    data = await getReportData()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur'
  }

  if (fetchError || !data) {
    return (
      <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Erreur de chargement</p>
          <p className="text-sm mt-1">{fetchError}</p>
        </div>
      </div>
    )
  }

  const { overview, etudiantsParFiliere, maxEtudiantsFiliere, mentions, totalNotes, presences, finance } = data

  const mentionConfig: Record<string, { label: string; color: string; bar: string }> = {
    TB: { label: 'Très Bien', color: 'text-green-700', bar: 'bg-green-500' },
    B: { label: 'Bien', color: 'text-blue-700', bar: 'bg-blue-500' },
    AB: { label: 'Assez Bien', color: 'text-indigo-700', bar: 'bg-indigo-500' },
    P: { label: 'Passable', color: 'text-amber-700', bar: 'bg-amber-500' },
    F: { label: 'Échec', color: 'text-red-700', bar: 'bg-red-500' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-xl p-2.5">
          <BarChart2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vue d&apos;ensemble de l&apos;activité académique</p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'Étudiants inscrits', value: overview.totalEtudiants, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Enseignants actifs', value: overview.totalEnseignants, icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Matières', value: overview.totalMatieres, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Filières', value: overview.totalFilieres, icon: BarChart2, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((c) => (
          <Card key={c.title} className="border border-gray-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{c.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
                </div>
                <div className={`${c.bg} rounded-xl p-3`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Étudiants par filière */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Étudiants inscrits par filière
            </CardTitle>
          </CardHeader>
          <CardContent>
            {etudiantsParFiliere.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {etudiantsParFiliere.map(({ filiere, total }) => (
                  <div key={filiere.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{filiere.code}</span>
                      <span className="text-sm font-bold text-gray-900">{total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.round((total / maxEtudiantsFiliere) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution mentions */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Distribution des mentions
              {totalNotes > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">{totalNotes} notes</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalNotes === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune note saisie</p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(mentions) as [string, number][]).map(([key, count]) => {
                  const cfg = mentionConfig[key]
                  const pct = totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label} ({key})</span>
                        <span className="text-sm text-gray-600">{count} — {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 ${cfg.bar} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Présences */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-purple-600" />
              Statistiques de présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presences.total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune séance enregistrée</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{presences.taux ?? '—'}%</p>
                    <p className="text-xs text-green-600 mt-0.5">Taux de présence</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-700">{presences.totalSeances}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Séances enregistrées</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: 'Présents', val: presences.presents, color: 'bg-green-100 text-green-700' },
                    { label: 'Absents', val: presences.absents, color: 'bg-red-100 text-red-700' },
                    { label: 'Retards', val: presences.retards, color: 'bg-amber-100 text-amber-700' },
                    { label: 'Excusés', val: presences.excuses, color: 'bg-blue-100 text-blue-700' },
                  ].map((s) => (
                    <div key={s.label} className={`p-2 rounded-lg ${s.color}`}>
                      <p className="font-bold text-base">{s.val}</p>
                      <p>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finance */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
              Résumé financier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {finance.total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Total perçu</p>
                    <p className="text-lg font-bold text-green-700 mt-0.5">{formatMoney(finance.totalPercu)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 font-medium">En attente</p>
                    <p className="text-lg font-bold text-orange-700 mt-0.5">{formatMoney(finance.totalAttente)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{finance.nbPayes}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Paiements réglés</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{finance.nbAttente}</p>
                    <p className="text-xs text-gray-500 mt-0.5">En attente / Partiel</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
