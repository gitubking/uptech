'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcHeures(debut?: string | null, fin?: string | null): number {
  if (!debut || !fin) return 0
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  return Math.max(0, ((fh * 60 + fm) - (dh * 60 + dm)) / 60)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CoursRow = {
  programme_id: string
  matiere_id: string
  cours: string
  classe_code: string
  taux_horaire: number
  nombre_heures: number
  heures_restantes: number
  annee_academique_id: string
  annee_libelle: string
}

export type PaiementEnseignantRow = {
  id: string
  montant: number
  mode_paiement: string
  payeur_nom: string | null
  payeur_role: string | null
  created_at: string
}

// ─── Authentification enseignant ──────────────────────────────────────────────

export async function getEnseignantConnecte() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'enseignant') redirect('/dashboard')

  // Chercher par email (user_id peut ne pas être rempli sur les anciens comptes)
  const { data: enseignant } = await db
    .from('enseignants')
    .select('*')
    .eq('email', user.email ?? '')
    .single()

  return { profile, enseignant }
}

// ─── Cours de l'enseignant ────────────────────────────────────────────────────

export async function getCoursEnseignant(
  enseignant_id: string,
  annee_academique_id?: string
): Promise<CoursRow[]> {
  const supabase = createAdminClient()

  // 1. Programmes affectés à cet enseignant
  let q = supabase
    .from('programme')
    .select(`
      id, volume_horaire, matiere_id, filiere_id, annee_academique_id,
      matiere:matieres(id, nom),
      filiere:filieres(id, code, type_formation_id),
      annee_academique:annees_academiques(id, libelle)
    `)
    .eq('enseignant_id', enseignant_id)

  if (annee_academique_id) q = q.eq('annee_academique_id', annee_academique_id)

  const { data: programmes } = await q
  if (!programmes?.length) return []

  // 2. Classes liées aux filières/années de ces programmes
  const filieresIds = [...new Set(programmes.map(p => p.filiere_id))]
  const anneesIds   = [...new Set(programmes.map(p => p.annee_academique_id))]

  const { data: classes } = await supabase
    .from('classes')
    .select('id, code, filiere_id, annee_academique_id')
    .in('filiere_id', filieresIds)
    .in('annee_academique_id', anneesIds)

  // 3. Heures réalisées par matière (émargements de cet enseignant)
  const { data: emargs } = await supabase
    .from('emargements')
    .select('matiere_id, heure_debut, heure_fin')
    .eq('enseignant_id', enseignant_id)

  const heuresMap: Record<string, number> = {}
  for (const e of emargs ?? []) {
    heuresMap[e.matiere_id] = (heuresMap[e.matiere_id] ?? 0) + calcHeures(e.heure_debut, e.heure_fin)
  }

  // 4. Tarifs horaires par type de formation
  let tarifMap: Record<string, number> = {}
  try {
    const { data: tfs } = await supabase
      .from('type_formations')
      .select('id, tarif_horaire')
    for (const tf of tfs ?? []) tarifMap[tf.id] = Number(tf.tarif_horaire)
  } catch {
    // table type_formations inexistante
  }

  // 5. Construction des lignes (1 ligne = 1 programme × 1 classe)
  const rows: CoursRow[] = []

  for (const prog of programmes) {
    const mat   = prog.matiere as unknown as { id: string; nom: string } | null
    const fil   = prog.filiere as unknown as { id: string; code: string; type_formation_id?: string | null } | null
    const annee = prog.annee_academique as unknown as { id: string; libelle: string } | null
    const tarif = fil?.type_formation_id ? (tarifMap[fil.type_formation_id] ?? 0) : 0
    const heuresFaites = heuresMap[prog.matiere_id] ?? 0

    const classesFil = (classes ?? []).filter(
      c => c.filiere_id === prog.filiere_id && c.annee_academique_id === prog.annee_academique_id
    )

    if (classesFil.length === 0) {
      rows.push({
        programme_id: prog.id,
        matiere_id: prog.matiere_id,
        cours: mat?.nom ?? '—',
        classe_code: '—',
        taux_horaire: tarif,
        nombre_heures: prog.volume_horaire ?? 0,
        heures_restantes: Math.max(0, (prog.volume_horaire ?? 0) - heuresFaites),
        annee_academique_id: prog.annee_academique_id,
        annee_libelle: annee?.libelle ?? '—',
      })
    } else {
      for (const cl of classesFil) {
        rows.push({
          programme_id: prog.id,
          matiere_id: prog.matiere_id,
          cours: mat?.nom ?? '—',
          classe_code: cl.code,
          taux_horaire: tarif,
          nombre_heures: prog.volume_horaire ?? 0,
          heures_restantes: Math.max(0, (prog.volume_horaire ?? 0) - heuresFaites),
          annee_academique_id: prog.annee_academique_id,
          annee_libelle: annee?.libelle ?? '—',
        })
      }
    }
  }

  return rows
}

// ─── Stats dashboard enseignant ───────────────────────────────────────────────

export async function getDashboardStats(enseignant_id: string) {
  const supabase = createAdminClient()

  const [
    { data: programmes },
    { data: emargs },
  ] = await Promise.all([
    supabase
      .from('programme')
      .select('id, volume_horaire, matiere_id, filiere_id, annee_academique_id, filiere:filieres(type_formation_id)')
      .eq('enseignant_id', enseignant_id),
    supabase
      .from('emargements')
      .select('matiere_id, heure_debut, heure_fin')
      .eq('enseignant_id', enseignant_id),
  ])

  // Tarifs
  let tarifMap: Record<string, number> = {}
  try {
    const { data: tfs } = await supabase.from('type_formations').select('id, tarif_horaire')
    for (const tf of tfs ?? []) tarifMap[tf.id] = Number(tf.tarif_horaire)
  } catch {}

  // Nombre de classes distinctes (1 filiere/annee = N classes)
  const filieresIds = [...new Set((programmes ?? []).map(p => p.filiere_id))]
  const anneesIds   = [...new Set((programmes ?? []).map(p => p.annee_academique_id))]
  let nbClasses = 0
  if (filieresIds.length) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .in('filiere_id', filieresIds)
      .in('annee_academique_id', anneesIds)
    nbClasses = classes?.length ?? 0
  }

  // Heures par matière
  const heuresMap: Record<string, number> = {}
  for (const e of emargs ?? []) {
    heuresMap[e.matiere_id] = (heuresMap[e.matiere_id] ?? 0) + calcHeures(e.heure_debut, e.heure_fin)
  }

  const dureeGlobale    = (programmes ?? []).reduce((s, p) => s + (p.volume_horaire ?? 0), 0)
  const totalHFaites    = Object.values(heuresMap).reduce((s, v) => s + v, 0)
  const dureeRestante   = Math.max(0, dureeGlobale - totalHFaites)

  // Revenus calculés = Σ(heures_émargées_par_matière × tarif_filière)
  let revenus = 0
  for (const prog of programmes ?? []) {
    const fil   = prog.filiere as unknown as { type_formation_id?: string | null } | null
    const tarif = fil?.type_formation_id ? (tarifMap[fil.type_formation_id] ?? 0) : 0
    const h     = heuresMap[prog.matiere_id] ?? 0
    revenus    += h * tarif
  }

  // Paiements reçus (table paiements_enseignants)
  let totalPaie = 0
  try {
    const { data: paies } = await supabase
      .from('paiements_enseignants')
      .select('montant')
      .eq('enseignant_id', enseignant_id)
    totalPaie = (paies ?? []).reduce((s, p) => s + Number(p.montant), 0)
  } catch {}

  const avoirs = Math.max(0, revenus - totalPaie)

  return { avoirs, revenus, nbClasses, dureeGlobale, dureeRestante }
}

// ─── Cours du jour (émargements aujourd'hui) ─────────────────────────────────

export async function getCoursAujourdhui(
  enseignant_id: string,
  allCours: CoursRow[]
): Promise<CoursRow[]> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: emargToday } = await supabase
    .from('emargements')
    .select('matiere_id')
    .eq('enseignant_id', enseignant_id)
    .eq('date_cours', today)

  if (!emargToday?.length) return allCours

  const matiereIdsToday = new Set(emargToday.map(e => e.matiere_id))
  const filtered = allCours.filter(c => matiereIdsToday.has(c.matiere_id))
  // déduplique par (programme_id, classe_code)
  return filtered.filter((row, i, arr) =>
    arr.findIndex(x => x.programme_id === row.programme_id && x.classe_code === row.classe_code) === i
  )
}

// ─── Historique paiements de l'enseignant ────────────────────────────────────

export async function getPaiementsEnseignant(
  enseignant_id: string
): Promise<PaiementEnseignantRow[]> {
  const supabase = createAdminClient()
  try {
    const { data, error } = await supabase
      .from('paiements_enseignants')
      .select('id, montant, mode_paiement, payeur_nom, payeur_role, created_at')
      .eq('enseignant_id', enseignant_id)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as PaiementEnseignantRow[]
  } catch {
    return []
  }
}

// ─── Années académiques ───────────────────────────────────────────────────────

export async function getAnneesAcademiques() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('annees_academiques')
    .select('id, libelle, actif')
    .order('date_debut', { ascending: false })
  return data ?? []
}
