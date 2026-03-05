import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  Users, GraduationCap, CreditCard, CalendarCheck,
  TrendingUp, AlertCircle, PenLine, Clock, Banknote, BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcHeures(debut?: string | null, fin?: string | null): number {
  if (!debut || !fin) return 0
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  return Math.max(0, ((fh * 60 + fm) - (dh * 60 + dm)) / 60)
}

function relativeTime(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 2) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Début du mois courant
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // ── Données principales ──
  const [
    { count: totalEtudiants },
    { count: totalEnseignants },
    { count: paiementsEnAttente },
    { count: absencesAujourdhui },
    { data: recentEtudiants },
    { data: recentPaiements },
    { data: recentNotes },
    { data: recentPresences },
    { data: activeAnnee },
  ] = await Promise.all([
    supabase.from('etudiants').select('*', { count: 'exact', head: true }).eq('statut', 'inscrit'),
    supabase.from('enseignants').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('paiements').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    supabase.from('presences').select('*', { count: 'exact', head: true })
      .eq('date_cours', today).eq('statut', 'absent'),
    supabase.from('etudiants')
      .select('id, matricule, nom, prenom, statut, created_at')
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('paiements')
      .select('id, reference, montant, statut, created_at, etudiant:etudiants(nom, prenom)')
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('notes')
      .select('id, created_at, matiere:matieres(nom), etudiant:etudiants(nom, prenom)')
      .order('created_at', { ascending: false }).limit(3),
    supabase.from('presences')
      .select('date_cours, matiere:matieres(nom)')
      .order('date_cours', { ascending: false }).limit(15),
    supabase.from('annees_academiques').select('libelle').eq('actif', true).single(),
  ])

  // ── Émargements ──
  let totalEmargementsMois = 0
  let heuresMois = 0
  let recentEmargements: Array<{
    id: string; date_cours: string; created_at: string
    enseignant: { nom: string; prenom: string } | null
    matiere: { nom: string; code: string } | null
  }> = []

  try {
    const [{ data: emargMois }, { data: emargRecents }] = await Promise.all([
      admin
        .from('emargements')
        .select('heure_debut, heure_fin')
        .gte('date_cours', firstOfMonth),
      admin
        .from('emargements')
        .select(`
          id, date_cours, created_at,
          enseignant:enseignants(nom, prenom),
          matiere:matieres(nom, code)
        `)
        .order('date_cours', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    totalEmargementsMois = emargMois?.length ?? 0
    heuresMois = (emargMois ?? []).reduce((s, e) => s + calcHeures(e.heure_debut, e.heure_fin), 0)
    recentEmargements = (emargRecents ?? []) as unknown as typeof recentEmargements
  } catch {
    // table emargements inexistante
  }

  // ── Fil d'activité unifié ──
  type FeedItem = { text: string; time: string; color: string; href: string; ts: string }
  const activities: FeedItem[] = []

  for (const e of recentEtudiants ?? []) {
    activities.push({
      text: `Inscription — ${e.prenom} ${e.nom}`,
      time: e.created_at, color: 'bg-blue-500',
      href: `/students/${e.id}`, ts: e.created_at,
    })
  }
  for (const p of recentPaiements ?? []) {
    const et = p.etudiant as { nom: string; prenom: string } | null
    activities.push({
      text: `Paiement ${p.statut === 'paye' ? 'reçu' : 'enregistré'} — ${et?.prenom} ${et?.nom}`,
      time: p.created_at, color: 'bg-orange-500',
      href: '/finance', ts: p.created_at,
    })
  }
  for (const n of recentNotes ?? []) {
    const mat = n.matiere as { nom: string } | null
    const et = n.etudiant as { nom: string; prenom: string } | null
    activities.push({
      text: `Notes saisies — ${mat?.nom ?? 'Matière'} (${et?.prenom} ${et?.nom})`,
      time: n.created_at, color: 'bg-green-500',
      href: '/grades', ts: n.created_at,
    })
  }
  // Présences (dédupliquées par matière+date)
  const seenPresence = new Set<string>()
  for (const p of recentPresences ?? []) {
    const matNom = (p.matiere as { nom: string } | null)?.nom ?? ''
    const key = `${p.date_cours}__${matNom}`
    if (!seenPresence.has(key)) {
      seenPresence.add(key)
      activities.push({
        text: `Présences — ${matNom}`,
        time: p.date_cours, color: 'bg-purple-500',
        href: '/attendance', ts: p.date_cours,
      })
      if ([...seenPresence].length >= 2) break
    }
  }
  // Émargements récents
  for (const em of recentEmargements) {
    const ens = em.enseignant as { nom: string; prenom: string } | null
    const mat = em.matiere as { nom: string; code: string } | null
    activities.push({
      text: `Émargement — ${mat?.code ?? ''} ${mat?.nom ?? 'Cours'} (${ens?.prenom} ${ens?.nom})`,
      time: em.date_cours, color: 'bg-indigo-500',
      href: '/attendance/emarger', ts: em.date_cours,
    })
  }

  activities.sort((a, b) => b.ts.localeCompare(a.ts))

  return {
    totalEtudiants, totalEnseignants, paiementsEnAttente, absencesAujourdhui,
    totalEmargementsMois, heuresMois,
    activities: activities.slice(0, 8),
    activeAnnee: activeAnnee?.libelle ?? '—',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData()

  const statsCards = [
    {
      title: 'Étudiants inscrits', value: data.totalEtudiants ?? 0,
      icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
      badge: 'Actifs', badgeColor: 'bg-blue-100 text-blue-700', href: '/students',
    },
    {
      title: 'Enseignants actifs', value: data.totalEnseignants ?? 0,
      icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50',
      badge: 'En service', badgeColor: 'bg-emerald-100 text-emerald-700', href: '/teachers',
    },
    {
      title: 'Paiements en attente', value: data.paiementsEnAttente ?? 0,
      icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50',
      badge: 'Étudiants', badgeColor: 'bg-orange-100 text-orange-700', href: '/finance',
    },
    {
      title: "Absences aujourd'hui", value: data.absencesAujourdhui ?? 0,
      icon: CalendarCheck, color: 'text-red-600', bg: 'bg-red-50',
      badge: 'Ce jour', badgeColor: 'bg-red-100 text-red-700', href: '/attendance',
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-0 font-medium">
          {data.activeAnnee}
        </Badge>
      </div>

      {/* ── Cartes statistiques principales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>
                    <div className={`${card.bg} rounded-xl p-3`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Bande émargements du mois ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Séances ce mois */}
        <Link href="/attendance/emarger">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 text-white cursor-pointer hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-indigo-200 text-sm font-medium">Séances émargées</span>
              <PenLine className="h-5 w-5 text-indigo-300" />
            </div>
            <p className="text-4xl font-bold">{data.totalEmargementsMois}</p>
            <p className="text-indigo-300 text-xs mt-1">Ce mois — cliquer pour émarger</p>
          </div>
        </Link>

        {/* Heures dispensées ce mois */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-teal-200 text-sm font-medium">Heures dispensées</span>
            <Clock className="h-5 w-5 text-teal-300" />
          </div>
          <p className="text-4xl font-bold">{data.heuresMois.toFixed(1)}<span className="text-2xl text-teal-300 ml-1">h</span></p>
          <p className="text-teal-300 text-xs mt-1">Ce mois (basé sur les émargements)</p>
        </div>

        {/* Paiements enseignants */}
        <Link href="/teachers/paiements">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white cursor-pointer hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-200 text-sm font-medium">Paiements enseignants</span>
              <Banknote className="h-5 w-5 text-emerald-300" />
            </div>
            <p className="text-lg font-bold mt-1">Voir le récapitulatif</p>
            <p className="text-emerald-300 text-xs mt-1">Rémunérations basées sur les séances</p>
          </div>
        </Link>
      </div>

      {/* ── Section principale ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Activités récentes ── */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Activités récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune activité récente</p>
            ) : (
              <div className="space-y-1">
                {data.activities.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`h-2 w-2 rounded-full ${item.color} shrink-0`} />
                      <span className="text-sm text-gray-700 flex-1 truncate">{item.text}</span>
                      <span className="text-xs text-gray-400 shrink-0">{relativeTime(item.time)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Alertes + Raccourcis ── */}
        <div className="space-y-4">
          {/* Alertes */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data.paiementsEnAttente ?? 0) > 0 && (
                <Link href="/finance">
                  <div className="text-xs p-3 rounded-lg border bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer">
                    💰 {data.paiementsEnAttente} paiement{(data.paiementsEnAttente ?? 0) > 1 ? 's' : ''} étudiant{(data.paiementsEnAttente ?? 0) > 1 ? 's' : ''} en attente
                  </div>
                </Link>
              )}
              {(data.absencesAujourdhui ?? 0) > 0 && (
                <Link href="/attendance">
                  <div className="text-xs p-3 rounded-lg border bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-colors cursor-pointer">
                    📋 {data.absencesAujourdhui} absence{(data.absencesAujourdhui ?? 0) > 1 ? 's' : ''} enregistrée{(data.absencesAujourdhui ?? 0) > 1 ? 's' : ''} aujourd&apos;hui
                  </div>
                </Link>
              )}
              {(data.paiementsEnAttente ?? 0) === 0 && (data.absencesAujourdhui ?? 0) === 0 && (
                <div className="text-xs p-3 rounded-lg border bg-green-50 border-green-200 text-green-700">
                  ✅ Aucune alerte urgente
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raccourcis rapides */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-500" />
                Accès rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/attendance/emarger">
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer">
                  <PenLine className="h-3.5 w-3.5 shrink-0" />
                  Feuille d&apos;émargement
                </div>
              </Link>
              <Link href="/teachers/paiements">
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer">
                  <Banknote className="h-3.5 w-3.5 shrink-0" />
                  Paiements enseignants
                </div>
              </Link>
              <Link href="/grades">
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  Notes &amp; résultats
                </div>
              </Link>
              <Link href="/courses">
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  Formations &amp; matières
                </div>
              </Link>
              <Link href="/settings">
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Types de formation &amp; tarifs
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
