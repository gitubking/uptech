'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Récupérer les matières pour les filtres présences ───────────────────────
export async function getMatieresForAttendance(filiere_id?: string, niveau_id?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('matieres')
    .select(`
      id, code, nom, semestre, coefficient, filiere_id, niveau_id,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom),
      enseignant:enseignants(id, nom, prenom)
    `)
    .order('nom', { ascending: true })

  if (filiere_id) query = query.eq('filiere_id', filiere_id)
  if (niveau_id) query = query.eq('niveau_id', niveau_id)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Récupérer les étudiants avec leurs présences pour une date/matière ──────
export async function getAttendanceForDate(matiere_id: string, date_cours: string) {
  const supabase = await createClient()

  // Get the matiere info
  const { data: matiere, error: mErr } = await supabase
    .from('matieres')
    .select(`
      id, nom, code, semestre, coefficient,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom),
      filiere_id, niveau_id
    `)
    .eq('id', matiere_id)
    .single()

  if (mErr || !matiere) throw mErr ?? new Error('Matière introuvable')

  // Get all students in this filiere+niveau who are inscrit
  const { data: etudiants, error: eErr } = await supabase
    .from('etudiants')
    .select('id, matricule, nom, prenom')
    .eq('filiere_id', matiere.filiere_id)
    .eq('niveau_id', matiere.niveau_id)
    .eq('statut', 'inscrit')
    .order('nom', { ascending: true })

  if (eErr) throw eErr

  if (!etudiants || etudiants.length === 0) {
    return { matiere, rows: [] }
  }

  // Get existing presences for this date+matiere
  const { data: presences, error: pErr } = await supabase
    .from('presences')
    .select('id, etudiant_id, statut, justification')
    .eq('matiere_id', matiere_id)
    .eq('date_cours', date_cours)

  if (pErr) throw pErr

  const presenceMap = new Map(presences?.map((p) => [p.etudiant_id, p]) ?? [])

  const rows = etudiants.map((e) => ({
    etudiant: e,
    presence: presenceMap.get(e.id) ?? null,
  }))

  return { matiere, rows }
}

// ─── Stats de présence d'un étudiant ─────────────────────────────────────────
export async function getStudentAttendanceStats(etudiant_id: string) {
  const supabase = await createClient()

  // Get student's filiere+niveau
  const { data: etudiant, error: eErr } = await supabase
    .from('etudiants')
    .select('id, nom, prenom, matricule, filiere_id, niveau_id')
    .eq('id', etudiant_id)
    .single()

  if (eErr || !etudiant) throw eErr ?? new Error('Étudiant introuvable')

  // Get all matieres for this niveau
  const { data: matieres, error: mErr } = await supabase
    .from('matieres')
    .select('id, nom, code')
    .eq('filiere_id', etudiant.filiere_id)
    .eq('niveau_id', etudiant.niveau_id)

  if (mErr) throw mErr

  if (!matieres || matieres.length === 0) return { etudiant, stats: [] }

  // Get all presences for this student
  const { data: presences, error: pErr } = await supabase
    .from('presences')
    .select('matiere_id, statut')
    .eq('etudiant_id', etudiant_id)

  if (pErr) throw pErr

  // Group by matiere
  const statsMap: Record<string, { total: number; present: number; absent: number; retard: number; excuse: number }> = {}
  for (const p of presences ?? []) {
    if (!statsMap[p.matiere_id]) {
      statsMap[p.matiere_id] = { total: 0, present: 0, absent: 0, retard: 0, excuse: 0 }
    }
    statsMap[p.matiere_id].total++
    if (p.statut === 'present') statsMap[p.matiere_id].present++
    if (p.statut === 'absent') statsMap[p.matiere_id].absent++
    if (p.statut === 'retard') statsMap[p.matiere_id].retard++
    if (p.statut === 'excuse') statsMap[p.matiere_id].excuse++
  }

  const stats = matieres.map((m) => {
    const s = statsMap[m.id] ?? { total: 0, present: 0, absent: 0, retard: 0, excuse: 0 }
    return {
      matiere: m,
      ...s,
      taux: s.total > 0 ? Math.round((s.present / s.total) * 100) : null,
    }
  }).filter((s) => s.total > 0)

  return { etudiant, stats }
}

// ─── Récupérer un résumé des séances récentes ─────────────────────────────────
export async function getRecentSessions(matiere_id?: string, limit = 10) {
  const supabase = await createClient()

  let query = supabase
    .from('presences')
    .select('date_cours, matiere_id, matiere:matieres(id, nom, code, filiere:filieres(nom), niveau:niveaux(nom))')
    .order('date_cours', { ascending: false })

  if (matiere_id) query = query.eq('matiere_id', matiere_id)

  const { data, error } = await query.limit(limit * 10)
  if (error) throw error

  // Deduplicate by date+matiere
  const seen = new Set<string>()
  const sessions: typeof data = []
  for (const row of data ?? []) {
    const key = `${row.date_cours}__${row.matiere_id}`
    if (!seen.has(key)) {
      seen.add(key)
      sessions.push(row)
    }
  }

  return sessions.slice(0, limit)
}
