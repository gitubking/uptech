'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Recuperer toutes les matieres avec filtres ──────────────────────────────
export async function getMatieres(filters?: {
  filiere_id?: string
  niveau_id?: string
  semestre?: string
  annee_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('matieres')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom, ordre),
      enseignant:enseignants(id, nom, prenom)
    `)
    .order('created_at', { ascending: false })

  if (filters?.filiere_id) query = query.eq('filiere_id', filters.filiere_id)
  if (filters?.niveau_id) query = query.eq('niveau_id', filters.niveau_id)
  if (filters?.semestre) query = query.eq('semestre', filters.semestre)

  const { data: matieres, error } = await query
  if (error) throw error
  if (!matieres || matieres.length === 0) return []

  const annee_id = filters?.annee_id

  const enriched = await Promise.all(
    matieres.map(async (matiere) => {
      const { count: totalStudents } = await supabase
        .from('etudiants')
        .select('*', { count: 'exact', head: true })
        .eq('filiere_id', matiere.filiere_id)
        .eq('niveau_id', matiere.niveau_id)
        .eq('statut', 'inscrit')

      let notesQuery = supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('matiere_id', matiere.id)

      if (annee_id) notesQuery = notesQuery.eq('annee_academique_id', annee_id)

      const { count: notesCount } = await notesQuery

      return {
        ...matiere,
        total_etudiants: totalStudents ?? 0,
        notes_saisies: notesCount ?? 0,
      }
    })
  )

  return enriched
}

// ─── Recuperer les etudiants d'une matiere avec leurs notes ──────────────────
export async function getStudentsWithNotes(matiere_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: matiere, error: matiereError } = await supabase
    .from('matieres')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom, ordre),
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('id', matiere_id)
    .single()

  if (matiereError) throw matiereError
  if (!matiere) return { matiere: null, students: [] }

  const { data: etudiants, error: studentsError } = await supabase
    .from('etudiants')
    .select('id, matricule, nom, prenom')
    .eq('filiere_id', matiere.filiere_id)
    .eq('niveau_id', matiere.niveau_id)
    .eq('statut', 'inscrit')
    .order('nom', { ascending: true })

  if (studentsError) throw studentsError

  if (!etudiants || etudiants.length === 0) {
    return { matiere, students: [] }
  }

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, etudiant_id, note_normale, note_rattrapage, note_finale, mention')
    .eq('matiere_id', matiere_id)
    .eq('annee_academique_id', annee_id)

  if (notesError) throw notesError

  const notesMap = new Map((notes ?? []).map((n) => [n.etudiant_id, n]))

  const students = etudiants.map((etudiant) => {
    const note = notesMap.get(etudiant.id)
    return {
      ...etudiant,
      note_id: note?.id ?? null,
      note_normale: note?.note_normale ?? null,
      note_rattrapage: note?.note_rattrapage ?? null,
      note_finale: note?.note_finale ?? null,
      mention: note?.mention ?? null,
    }
  })

  return { matiere, students }
}

// ─── Recuperer le bulletin d'un etudiant ─────────────────────────────────────
export async function getBulletin(etudiant_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: etudiant, error: etudiantError } = await supabase
    .from('etudiants')
    .select(`
      *,
      filiere:filieres(id, nom, code),
      niveau:niveaux(id, nom, ordre),
      annee_academique:annees_academiques(id, libelle)
    `)
    .eq('id', etudiant_id)
    .single()

  if (etudiantError) throw etudiantError
  if (!etudiant) return { etudiant: null, matieres: [], annee: null }

  const { data: annee, error: anneeError } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('id', annee_id)
    .single()

  if (anneeError) throw anneeError

  const { data: matieres, error: matieresError } = await supabase
    .from('matieres')
    .select(`
      id, code, nom, coefficient, credit, semestre, volume_horaire,
      enseignant:enseignants(id, nom, prenom)
    `)
    .eq('filiere_id', etudiant.filiere_id)
    .eq('niveau_id', etudiant.niveau_id)
    .order('semestre', { ascending: true })

  if (matieresError) throw matieresError

  if (!matieres || matieres.length === 0) {
    return { etudiant, matieres: [], annee }
  }

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, matiere_id, note_normale, note_rattrapage, note_finale, mention')
    .eq('etudiant_id', etudiant_id)
    .eq('annee_academique_id', annee_id)

  if (notesError) throw notesError

  const notesMap = new Map((notes ?? []).map((n) => [n.matiere_id, n]))

  const matieresWithNotes = matieres.map((matiere) => {
    const note = notesMap.get(matiere.id)
    return {
      ...matiere,
      note_id: note?.id ?? null,
      note_normale: note?.note_normale ?? null,
      note_rattrapage: note?.note_rattrapage ?? null,
      note_finale: note?.note_finale ?? null,
      mention: note?.mention ?? null,
    }
  })

  return { etudiant, matieres: matieresWithNotes, annee }
}

// ─── Recuperer l'annee academique active ─────────────────────────────────────
export async function getActiveAnnee() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('annees_academiques')
    .select('id, libelle')
    .eq('actif', true)
    .single()
  if (error) return null
  return data
}

// ─── Récupérer les étudiants d'une classe avec leur moyenne ──────────────────
export async function getEtudiantsClasse(filiere_id: string, niveau_id: string, annee_id: string) {
  const supabase = await createClient()

  const { data: etudiants, error } = await supabase
    .from('etudiants')
    .select('id, nom, prenom, matricule')
    .eq('filiere_id', filiere_id)
    .eq('niveau_id', niveau_id)
    .order('nom')

  if (error || !etudiants) return []

  // Récupérer les notes de chaque étudiant
  const results = await Promise.all(
    etudiants.map(async (etudiant) => {
      const { data: notes } = await supabase
        .from('notes')
        .select('note_finale, coefficient:matieres(coefficient)')
        .eq('etudiant_id', etudiant.id)
        .eq('annee_academique_id', annee_id)
        .not('note_finale', 'is', null)

      const notesData = (notes ?? []) as { note_finale: number; coefficient: { coefficient: number }[] | null }[]
      const totalCoeff = notesData.reduce((s, n) => {
        const coeff = Array.isArray(n.coefficient) ? (n.coefficient[0]?.coefficient ?? 1) : 1
        return s + coeff
      }, 0)
      const somme = notesData.reduce((s, n) => {
        const coeff = Array.isArray(n.coefficient) ? (n.coefficient[0]?.coefficient ?? 1) : 1
        return s + n.note_finale * coeff
      }, 0)
      const moyenne = totalCoeff > 0 ? somme / totalCoeff : null

      return { ...etudiant, moyenne, nbMatieres: notesData.length }
    })
  )

  return results.sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1))
}

// ─── Recuperer filieres + niveaux pour les filtres ───────────────────────────
export async function getFormationData() {
  const supabase = await createClient()
  const [{ data: filieres }, { data: niveaux }, { data: annees }] = await Promise.all([
    supabase.from('filieres').select('id, nom, code, type_formation, nb_mensualites').order('nom'),
    supabase.from('niveaux').select('id, nom, filiere_id, ordre').order('ordre'),
    supabase
      .from('annees_academiques')
      .select('id, libelle, actif')
      .order('libelle', { ascending: false }),
  ])
  return {
    filieres: filieres ?? [],
    niveaux: niveaux ?? [],
    annees: annees ?? [],
  }
}
