'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Récupérer les matières pour les filtres présences ───────────────────────
// Après migration 010 : filiere_id/niveau_id sont sur programme, pas matieres
export async function getMatieresForAttendance(filiere_id?: string, _niveau_id?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('programme')
    .select(`
      id, matiere_id, filiere_id, semestre,
      matiere:matieres(id, nom, code),
      filiere:filieres(id, nom, code)
    `)
    .order('semestre', { ascending: true })

  if (filiere_id) query = query.eq('filiere_id', filiere_id)

  const { data, error } = await query
  if (error) throw error

  // Dédoublonner par matiere_id (une matière peut être dans plusieurs filières)
  // et retourner une forme compatible avec l'interface Matiere du filtre
  const seen = new Set<string>()
  const result: Array<{
    id: string; code: string; nom: string; semestre: string
    filiere_id: string; niveau_id: null
    filiere: { id: string; nom: string; code: string } | null
    niveau: null
  }> = []

  for (const p of data ?? []) {
    const m = p.matiere as unknown as { id: string; nom: string; code: string } | null
    const f = p.filiere as unknown as { id: string; nom: string; code: string } | null
    if (!m) continue
    const key = `${m.id}-${p.filiere_id}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      id: m.id,
      code: m.code,
      nom: m.nom,
      semestre: p.semestre,
      filiere_id: p.filiere_id,
      niveau_id: null,
      filiere: f,
      niveau: null,
    })
  }

  return result
}

// ─── Récupérer les étudiants avec leurs présences pour une date/matière ──────
export async function getAttendanceForDate(matiere_id: string, date_cours: string) {
  const supabase = await createClient()

  // Get the matiere info (catalogue only after migration 010)
  const { data: matiere, error: mErr } = await supabase
    .from('matieres')
    .select('id, nom, code')
    .eq('id', matiere_id)
    .single()

  if (mErr || !matiere) throw mErr ?? new Error('Matière introuvable')

  // Get filiere_id from programme (first active programme for this matiere)
  const { data: prog, error: progErr } = await supabase
    .from('programme')
    .select('filiere_id, semestre, filiere:filieres(id, nom, code)')
    .eq('matiere_id', matiere_id)
    .limit(1)
    .single()

  if (progErr || !prog) throw progErr ?? new Error('Programme introuvable pour cette matière')

  const matiereEnriched = {
    ...matiere,
    semestre: prog.semestre,
    filiere_id: prog.filiere_id,
    filiere: prog.filiere as unknown as { id: string; nom: string; code: string } | null,
    niveau: null,
  }

  // Get all students in this filiere who are inscrit
  const { data: etudiants, error: eErr } = await supabase
    .from('etudiants')
    .select('id, matricule, nom, prenom')
    .eq('filiere_id', prog.filiere_id)
    .eq('statut', 'inscrit')
    .order('nom', { ascending: true })

  if (eErr) throw eErr

  if (!etudiants || etudiants.length === 0) {
    return { matiere: matiereEnriched, rows: [] }
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

  return { matiere: matiereEnriched, rows }
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

  // Get all matieres for this filiere via programme (après migration 010)
  const { data: programmes, error: mErr } = await supabase
    .from('programme')
    .select('matiere_id, matiere:matieres(id, nom, code)')
    .eq('filiere_id', etudiant.filiere_id)

  const matieres = (programmes ?? [])
    .map((p) => p.matiere as unknown as { id: string; nom: string; code: string } | null)
    .filter((m): m is { id: string; nom: string; code: string } => m !== null)

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
// Après migration 010 : matieres n'a plus de FK vers filieres/niveaux
export async function getRecentSessions(matiere_id?: string, limit = 10) {
  const supabase = await createClient()

  let query = supabase
    .from('presences')
    .select('date_cours, matiere_id, matiere:matieres(id, nom, code)')
    .order('date_cours', { ascending: false })

  if (matiere_id) query = query.eq('matiere_id', matiere_id)

  const { data, error } = await query.limit(limit * 10)
  if (error) throw error

  // Dédoublonner par date+matiere
  const seen = new Set<string>()
  const uniqueSessions: typeof data = []
  for (const row of data ?? []) {
    const key = `${row.date_cours}__${row.matiere_id}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueSessions.push(row)
    }
  }

  const sessions = uniqueSessions.slice(0, limit)

  // Enrichir avec filière depuis programme
  const matiereIds = [...new Set(sessions.map((s) => s.matiere_id))]
  const { data: progs } = await supabase
    .from('programme')
    .select('matiere_id, filiere:filieres(nom)')
    .in('matiere_id', matiereIds)

  const filiereByMatiere = new Map<string, { nom: string } | null>()
  for (const p of progs ?? []) {
    if (!filiereByMatiere.has(p.matiere_id)) {
      filiereByMatiere.set(p.matiere_id, p.filiere as unknown as { nom: string } | null)
    }
  }

  return sessions.map((s) => ({
    ...s,
    matiere: s.matiere
      ? { ...(s.matiere as unknown as { id: string; nom: string; code: string }), filiere: filiereByMatiere.get(s.matiere_id) ?? null, niveau: null }
      : null,
  }))
}
