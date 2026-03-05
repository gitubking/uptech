'use server'

import { createClient } from '@/lib/supabase/server'

export async function getReportData() {
  const supabase = await createClient()

  const [
    { data: etudiants },
    { data: filieres },
    { data: notes },
    { data: presences },
    { data: paiements },
    { data: matieres },
    { data: enseignants },
  ] = await Promise.all([
    supabase.from('etudiants').select('id, filiere_id, niveau_id, statut, filiere:filieres(nom, code), niveau:niveaux(nom)'),
    supabase.from('filieres').select('id, nom, code').eq('actif', true).order('nom'),
    supabase.from('notes').select('id, mention, note_finale, matiere_id, etudiant_id'),
    supabase.from('presences').select('id, statut, matiere_id, date_cours'),
    supabase.from('paiements').select('id, montant, montant_total, statut, type'),
    supabase.from('matieres').select('id, code, nom, filiere_id, niveau_id'),
    supabase.from('enseignants').select('id, actif').eq('actif', true),
  ])

  // ── Étudiants par filière ──────────────────────────────────────────────────
  const etudiantsInscrits = (etudiants ?? []).filter((e) => e.statut === 'inscrit')
  const etudiantsParFiliere = (filieres ?? []).map((f) => ({
    filiere: f,
    total: etudiantsInscrits.filter((e) => e.filiere_id === f.id).length,
  })).filter((x) => x.total > 0)

  const totalEtudiants = etudiantsInscrits.length
  const maxEtudiantsFiliere = Math.max(...etudiantsParFiliere.map((x) => x.total), 1)

  // ── Distribution des mentions ─────────────────────────────────────────────
  const mentionsCount = { TB: 0, B: 0, AB: 0, P: 0, F: 0 }
  for (const n of notes ?? []) {
    if (n.mention && n.mention in mentionsCount) {
      mentionsCount[n.mention as keyof typeof mentionsCount]++
    }
  }
  const totalNotes = Object.values(mentionsCount).reduce((a, b) => a + b, 0)

  // ── Stats présences ────────────────────────────────────────────────────────
  const totalPresences = (presences ?? []).length
  const presentsCount = (presences ?? []).filter((p) => p.statut === 'present').length
  const absentsCount = (presences ?? []).filter((p) => p.statut === 'absent').length
  const retardsCount = (presences ?? []).filter((p) => p.statut === 'retard').length
  const excusesCount = (presences ?? []).filter((p) => p.statut === 'excuse').length
  const tauxPresence = totalPresences > 0 ? Math.round((presentsCount / totalPresences) * 100) : null

  // ── Séances distinctes ─────────────────────────────────────────────────────
  const seancesSet = new Set((presences ?? []).map((p) => `${p.matiere_id}__${p.date_cours}`))
  const totalSeances = seancesSet.size

  // ── Finance ────────────────────────────────────────────────────────────────
  const paiementsData = paiements ?? []
  const totalPercu = paiementsData
    .filter((p) => p.statut === 'paye' || p.statut === 'partiel')
    .reduce((s, p) => s + Number(p.montant), 0)
  const totalAttente = paiementsData
    .filter((p) => p.statut === 'en_attente')
    .reduce((s, p) => s + Number(p.montant_total), 0)
  const nbPayes = paiementsData.filter((p) => p.statut === 'paye').length
  const nbAttente = paiementsData.filter((p) => p.statut === 'en_attente' || p.statut === 'partiel').length

  return {
    overview: {
      totalEtudiants,
      totalEnseignants: enseignants?.length ?? 0,
      totalMatieres: matieres?.length ?? 0,
      totalFilieres: filieres?.length ?? 0,
    },
    etudiantsParFiliere,
    maxEtudiantsFiliere,
    mentions: mentionsCount,
    totalNotes,
    presences: { total: totalPresences, presents: presentsCount, absents: absentsCount, retards: retardsCount, excuses: excusesCount, taux: tauxPresence, totalSeances },
    finance: { totalPercu, totalAttente, nbPayes, nbAttente, total: paiementsData.length },
  }
}
